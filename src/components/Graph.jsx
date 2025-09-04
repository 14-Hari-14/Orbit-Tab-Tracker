import React, { useRef, useEffect, useState } from "react";
import { DataSet, Network } from "vis-network/standalone";
import { getNetworkOptions, getProjectHeaderStyle, getThemeToggleStyle, getFixedToolbarStyle } from './styles';
import { GridBg } from './ui/GridBg';

// Helper function to generate a proper HTML Element for the tooltip
const generateNodeTitle = (node) => {
  const container = document.createElement('div');
  container.style.padding = '5px';

  const labelEl = document.createElement('b');
  labelEl.innerText = node.label;
  container.appendChild(labelEl);

  if (node.url) {
    container.appendChild(document.createElement('br'));
    const linkEl = document.createElement('a');
    linkEl.href = node.url;
    linkEl.target = '_blank';
    linkEl.style.color = '#55aaff';
    linkEl.innerText = node.url;
    container.appendChild(linkEl);
  }

  if (node.note) {
    container.appendChild(document.createElement('hr'));
    const noteEl = document.createElement('i');
    noteEl.innerText = node.note;
    container.appendChild(noteEl);
  }
  return container;
};

// Initial data with a root node to start with
const createInitialData = () => {
  const initialNodes = new DataSet([
    { id: 1, label: "Root", shape: "ellipse", isParent: true, note: "Start building your knowledge graph from here!" },
  ]);
  initialNodes.forEach(node => {
    initialNodes.update({ ...node, title: generateNodeTitle(node) });
  });
  return {
    nodes: initialNodes,
    edges: new DataSet([])
  };
};

const ThemeToggle = ({ isDark, onToggle }) => (
  <div style={getThemeToggleStyle(isDark)} onClick={onToggle} title="Toggle theme">
    <span style={{ fontSize: '20px' }}>{isDark ? '🌞' : '🌙'}</span>
  </div>
);

const FixedToolbar = ({ onAdd, onDelete, onEdit, onNote, isNodeSelected, selectedNodeId, isDark }) => {
  const buttonStyle = {
    padding: '10px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontSize: '14px', fontWeight: '500', transition: 'all 0.2s ease',
    backgroundColor: '#007acc', color: 'white', display: 'flex', alignItems: 'center', gap: '8px'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: isDark ? '#444' : '#e0e0e0',
    color: isDark ? '#888' : '#999',
    cursor: 'not-allowed'
  };

  const statusStyle = {
    fontSize: '12px', color: isDark ? '#ccc' : '#666', textAlign: 'center', fontStyle: 'italic',
    marginTop: '8px', padding: '8px', backgroundColor: isDark ? 'rgba(0, 122, 204, 0.2)' : 'rgba(0, 122, 204, 0.1)',
    borderRadius: '6px'
  };

  return (
    <div style={getFixedToolbarStyle(isDark)}>
      <button
        onClick={onAdd}
        disabled={!isNodeSelected}
        style={isNodeSelected ? buttonStyle : disabledButtonStyle}
        onMouseOver={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#005999')}
        onMouseOut={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#007acc')}
      >
        <span>➕</span> Add Child
      </button>

      <button
        onClick={onDelete}
        disabled={!isNodeSelected || selectedNodeId === 1}
        style={isNodeSelected && selectedNodeId !== 1 ? { ...buttonStyle, backgroundColor: '#dc3545' } : disabledButtonStyle}
        onMouseOver={(e) => isNodeSelected && selectedNodeId !== 1 && (e.currentTarget.style.backgroundColor = '#c82333')}
        onMouseOut={(e) => isNodeSelected && selectedNodeId !== 1 && (e.currentTarget.style.backgroundColor = '#dc3545')}
      >
        <span>🗑️</span> Delete Node
      </button>

      <button
        onClick={onEdit}
        disabled={!isNodeSelected}
        style={isNodeSelected ? { ...buttonStyle, backgroundColor: '#28a745' } : disabledButtonStyle}
        onMouseOver={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#218838')}
        onMouseOut={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#28a745')}
      >
        <span>✏️</span> Edit Node
      </button>

      <button
        onClick={onNote}
        disabled={!isNodeSelected}
        style={isNodeSelected ? { ...buttonStyle, backgroundColor: '#ffc107', color: '#212529' } : disabledButtonStyle}
        onMouseOver={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#e0a800')}
        onMouseOut={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#ffc107')}
      >
        <span>📝</span> Add/Edit Note
      </button>

      <div style={statusStyle}>
        {isNodeSelected
          ? `Selected: ${selectedNodeId === 1 ? 'Root Node' : `Node ${selectedNodeId}`}`
          : 'Select a node to enable actions'}
      </div>
    </div>
  );
};

const ProjectHeader = ({ isDark }) => {
  const titleStyle = {
    fontSize: '24px', fontWeight: '600', background: 'linear-gradient(135deg, #007acc, #0099ff)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0
  };
  const subtitleStyle = { fontSize: '12px', color: isDark ? '#ccc' : '#666', fontWeight: '400' };

  return (
    <div style={getProjectHeaderStyle(isDark)}>
      <div style={{ fontSize: '20px' }}>🌌</div>
      <div>
        <h1 style={titleStyle}>Orbit</h1>
        <p style={subtitleStyle}>Visual Knowledge Graph</p>
      </div>
    </div>
  );
};

export default function Graph() {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [data] = useState(createInitialData);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isDark, setIsDark] = useState(true);

  const handleAddNode = () => {
    if (!selectedNodeId) return;

    const label = prompt("Enter a label for the new node:", "New Node");
    if (!label) return;

    const url = prompt("Enter a URL for this node (optional):");
    if (url === null) return;

    const isParent = window.confirm("Should this node be a parent (able to group other nodes)?");
    const newNode = {
      id: Date.now(),
      label,
      url: url || '',
      note: '',
      isParent: isParent,
      shape: isParent ? 'ellipse' : 'box',
    };
    newNode.title = generateNodeTitle(newNode);

    data.nodes.add(newNode);
    data.edges.add({ from: selectedNodeId, to: newNode.id });
    networkRef.current.unselectAll();
  };

  const handleEditNode = () => {
    if (!selectedNodeId) return;

    const currentNode = data.nodes.get(selectedNodeId);
    const newLabel = prompt("Edit the label:", currentNode.label);
    if (newLabel === null) return;

    const newUrl = prompt("Edit the URL (optional):", currentNode.url || "");
    if (newUrl === null) return;

    const updatedNode = {
      ...currentNode,
      label: newLabel || currentNode.label,
      url: newUrl || ''
    };
    updatedNode.title = generateNodeTitle(updatedNode);
    data.nodes.update(updatedNode);
  };

  const handleAddEditNote = () => {
    if (!selectedNodeId) return;

    const currentNode = data.nodes.get(selectedNodeId);
    const newNote = prompt("Add or edit the note for this node:", currentNode.note || "");
    if (newNote !== null) {
      const updatedNode = { ...currentNode, note: newNote };
      updatedNode.title = generateNodeTitle(updatedNode);
      data.nodes.update(updatedNode);
    }
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId || selectedNodeId === 1) return;

    if (window.confirm("Are you sure you want to delete this node and all its children?")) {
      const edges = data.edges.get();
      const getAllDescendants = (nodeId) => {
        const children = edges.filter(edge => edge.from === nodeId).map(edge => edge.to);
        let descendants = [...children];
        children.forEach(childId => {
          descendants = [...descendants, ...getAllDescendants(childId)];
        });
        return descendants;
      };
      const nodesToDelete = [selectedNodeId, ...getAllDescendants(selectedNodeId)];
      const edgesToDelete = edges.filter(edge =>
        nodesToDelete.includes(edge.from) || nodesToDelete.includes(edge.to)
      );

      data.edges.remove(edgesToDelete.map(edge => edge.id));
      data.nodes.remove(nodesToDelete);
      setSelectedNodeId(null);
    }
  };

  // Effect 1: Runs ONLY ONCE to initialize the network
  useEffect(() => {
    const options = getNetworkOptions(isDark);
    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    network.on("selectNode", (params) => setSelectedNodeId(params.nodes[0]));
    network.on("deselectNode", () => setSelectedNodeId(null));
    network.on("doubleClick", (params) => {
      const nodeId = params.nodes[0];
      if (!nodeId) return;

      if (network.isCluster(nodeId) || String(nodeId).startsWith('cluster-')) {
        network.openCluster(nodeId);
        return;
      }

      const node = data.nodes.get(nodeId);
      if (node?.url) {
        window.open(node.url, "_blank");
      } else if (node?.isParent) {
        const childNodes = data.edges.get({ filter: edge => edge.from === nodeId }).map(edge => edge.to);
        if (childNodes.length > 0) {
          network.cluster({
            joinCondition: (childNode) => childNodes.includes(childNode.id) || childNode.id === nodeId,
            clusterNodeProperties: {
              id: `cluster-${nodeId}`,
              label: `${node.label} (+${childNodes.length})`,
              shape: 'circle',
              color: { background: '#FFD700', border: '#FFA000' },
              font: { size: 14, color: '#000000' }
            }
          });
        }
      }
    });

    return () => {
      network.destroy();
    };
  }, [data]);

  // Effect 2: Runs ONLY when `isDark` changes to update theme
  useEffect(() => {
    if (networkRef.current) {
      const options = getNetworkOptions(isDark);
      networkRef.current.setOptions(options);
    }
  }, [isDark]);

  return (
    <GridBg isDark={isDark}>
      <ProjectHeader isDark={isDark} />
      <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
      <FixedToolbar
        onAdd={handleAddNode}
        onDelete={handleDeleteNode}
        onEdit={handleEditNode}
        onNote={handleAddEditNote}
        isNodeSelected={!!selectedNodeId}
        selectedNodeId={selectedNodeId}
        isDark={isDark}
      />
      <div
        ref={containerRef}
        className="graph-container"
        style={{ width: '100%', height: '100%' }}
      />
    </GridBg>
  );
}