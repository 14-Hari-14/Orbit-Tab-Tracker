import React, { useRef, useEffect, useState } from "react";
import { DataSet, Network } from "vis-network/standalone";
import { getNetworkOptions, getProjectHeaderStyle, getThemeToggleStyle, getFixedToolbarStyle } from './styles';
import { GridBg } from './ui/GridBg';

const LOCAL_STORAGE_KEY = 'orbit-graph-data-v1';

// --- DATA STORAGE FUNCTIONS (Unchanged) ---
const saveDataToLocalStorage = (nodes, edges, collapsedIds) => {
  try {
    const plainNodes = nodes.get({ returnType: 'Array' });
    const plainEdges = edges.get({ returnType: 'Array' });
    const plainCollapsed = Array.from(collapsedIds);
    const dataToStore = JSON.stringify({ nodes: plainNodes, edges: plainEdges, collapsed: plainCollapsed });
    localStorage.setItem(LOCAL_STORAGE_KEY, dataToStore);
  } catch (error) {
    console.error("Failed to save graph data:", error);
  }
};

const loadDataFromLocalStorage = () => {
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData === null) return null;
    return JSON.parse(savedData);
  } catch (error) {
    console.error("Failed to load graph data:", error);
    return null;
  }
};

// --- REACT COMPONENTS ---
const generateNodeTitle = (node) => {
  const container = document.createElement('div');
  container.style.padding = '8px';
  container.style.fontFamily = 'Electrolize, sans-serif';
  container.style.fontSize = '14px';


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

const ThemeToggle = ({ isDark, onToggle }) => (
  // ... (This component is unchanged)
  <div style={getThemeToggleStyle(isDark)} onClick={onToggle} title="Toggle theme"><span style={{ fontSize: '20px' }}>{isDark ? '🌞' : '🌙'}</span></div>
);

const FixedToolbar = ({ onAdd, onDelete, onEdit, onNote, isNodeSelected, selectedNodeLabel, isDark }) => {
  const buttonStyle = { 
    padding: '10px 16px', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '14px', 
    fontWeight: '500', 
    transition: 'all 0.2s ease', 
    backgroundColor: '#007acc', 
    color: 'white', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px' 
  };
  
  const disabledButtonStyle = { 
    ...buttonStyle, 
    backgroundColor: isDark ? '#444' : '#e0e0e0', 
    color: isDark ? '#888' : '#999', 
    cursor: 'not-allowed' 
  };
  
  const statusStyle = { 
    fontSize: '12px', 
    color: isDark ? '#ccc' : '#666', 
    textAlign: 'center', 
    fontStyle: 'italic', 
    marginTop: '8px', 
    padding: '8px', 
    backgroundColor: isDark ? 'rgba(0, 122, 204, 0.2)' : 'rgba(0, 122, 204, 0.1)', 
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
        disabled={!isNodeSelected || selectedNodeLabel === 'Root'} 
        style={isNodeSelected && selectedNodeLabel !== 'Root' ? { ...buttonStyle, backgroundColor: '#dc3545' } : disabledButtonStyle} 
        onMouseOver={(e) => isNodeSelected && selectedNodeLabel !== 'Root' && (e.currentTarget.style.backgroundColor = '#c82333')} 
        onMouseOut={(e) => isNodeSelected && selectedNodeLabel !== 'Root' && (e.currentTarget.style.backgroundColor = '#dc3545')} 
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
        {isNodeSelected ? `Selected: ${selectedNodeLabel}` : 'Select a node to enable actions'} 
      </div> 
    </div> 
  );
};

const ProjectHeader = ({ isDark }) => (
  <div style={getProjectHeaderStyle(isDark)}>
    <div style={{ fontSize: '20px' }}>🌌</div>
    <div>
      <h1 style={{
        fontSize: '24px',
        fontWeight: '600',
        background: 'linear-gradient(135deg, #007acc, #0099ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        margin: 0
      }}>
        Orbit
      </h1>
      <p style={{
        fontSize: '12px',
        color: isDark ? '#ccc' : '#666',
        fontWeight: '400'
      }}>
        Visual Knowledge Graph
      </p>
    </div>
  </div>
);

const createInitialData = () => {
  const initialNodes = new DataSet([{ id: 1, label: "Root", shape: "circle", value: 25, isParent: true, note: "Start building your knowledge graph from here!" }]);
  initialNodes.forEach(node => {
    initialNodes.update({ ...node, title: generateNodeTitle(node) });
  });
  return { nodes: initialNodes, edges: new DataSet([]) };
};

export default function Graph() {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isDark, setIsDark] = useState(true);

  const [data] = useState(() => {
    const savedData = loadDataFromLocalStorage();
    if (savedData && savedData.nodes) {
      const nodes = new DataSet(savedData.nodes);
      const edges = new DataSet(savedData.edges);

      // [Fix] Regenerate tooltips for all nodes loaded from storage.
      // This ensures that saved notes are always visible on hover after a page reload.
      nodes.forEach(node => {
        nodes.update({ id: node.id, title: generateNodeTitle(node) });
      });

      return { nodes, edges };
    }
    return createInitialData();
  });

  const [collapsedParentIds, setCollapsedParentIds] = useState(() => {
    const savedData = loadDataFromLocalStorage();
    return new Set(savedData?.collapsed || []);
  });

  // --- HANDLER FUNCTIONS ---
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
    
    const newUrl = prompt("Enter the URL (optional):", currentNode.url || "");
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
      // [Fix] This explicitly updates the 'note' property on the node data object.
      // This is the key change that ensures the note is saved correctly.
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

  /**
   * Reusable helper function to collapse a parent node into a cluster.
   */
  const collapseNode = (networkInstance, parentId) => {
    const node = data.nodes.get(parentId);
    if (!node || !node.isParent) return;
    
    const childNodes = data.edges.get({ filter: edge => edge.from === parentId }).map(edge => edge.to);
    if (childNodes.length > 0) {
      const childCount = childNodes.length;

      // Generate random colors that work well with both themes
      const getRandomClusterColor = () => {
        const colors = [
          // Vibrant colors that work on both dark and light backgrounds
          { bg: '#FF6B6B', border: '#FF5252', text: '#000000' }, // Red
          { bg: '#4ECDC4', border: '#26A69A', text: '#000000' }, // Teal
          { bg: '#45B7D1', border: '#2196F3', text: '#000000' }, // Blue
          { bg: '#96CEB4', border: '#66BB6A', text: '#000000' }, // Green
          { bg: '#FECA57', border: '#FF9800', text: '#000000' }, // Orange
          { bg: '#FF9FF3', border: '#E91E63', text: '#000000' }, // Pink
          { bg: '#A8E6CF', border: '#4CAF50', text: '#000000' }, // Light Green
          { bg: '#FFB347', border: '#FF5722', text: '#000000' }, // Peach
          { bg: '#DDA0DD', border: '#9C27B0', text: '#000000' }, // Plum
          { bg: '#87CEEB', border: '#03A9F4', text: '#000000' }, // Sky Blue
          { bg: '#F0E68C', border: '#CDDC39', text: '#000000' }, // Khaki
          { bg: '#FFA07A', border: '#FF7043', text: '#000000' }, // Light Salmon
        ];
        
        // Use the parentId as seed for consistent colors per cluster
        const index = parentId % colors.length;
        return colors[index];
      };

      const clusterColor = getRandomClusterColor();

      // Calculate normalized size based on number of children
      const minSize = 0.6;  // Minimum scaling factor
      const maxSize = 1.4;  // Maximum scaling factor
      const maxChildren = 20; // Assume max reasonable children count for normalization
      
      // Normalize child count between 0 and 1, then scale to our desired range
      const normalizedCount = Math.min(childCount / maxChildren, 1);
      const sizeMultiplier = minSize + (normalizedCount * (maxSize - minSize));
      
      // Calculate final size (base cluster size is around 25, adjust as needed)
      const baseSize = 25;
      const finalSize = Math.round(baseSize * sizeMultiplier);

      const clusterNodeProperties = {
        id: `cluster-${parentId}`,
        label: `${node.label} (+${childCount})`,
        note: node.note || '',
        shape: 'circle',
        size: finalSize, // Dynamic size based on children count
        color: { 
          background: clusterColor.bg, 
          border: clusterColor.border 
        },
        font: { 
          size: Math.max(12, Math.min(18, 12 + (normalizedCount * 6))), // Scale font size too (12-18px)
          color: clusterColor.text 
        }
      };
      
      clusterNodeProperties.title = generateNodeTitle(clusterNodeProperties);

      networkInstance.cluster({
        joinCondition: (childNode) => childNodes.includes(childNode.id) || childNode.id === parentId,
        clusterNodeProperties: clusterNodeProperties
      });
    }
  };

  // --- USE EFFECT HOOKS ---
  useEffect(() => {
    // ... (This hook's logic is unchanged)
    const options = getNetworkOptions(isDark);
    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    const autoSave = () => saveDataToLocalStorage(data.nodes, data.edges, collapsedParentIds);
    data.nodes.on('*', autoSave);
    data.edges.on('*', autoSave);

    network.on("selectNode", (params) => setSelectedNodeId(params.nodes[0]));
    network.on("deselectNode", () => setSelectedNodeId(null));

    network.on("doubleClick", (params) => {
      const nodeId = params.nodes[0];
      if (!nodeId) return;

      if (network.isCluster(nodeId) || String(nodeId).startsWith('cluster-')) {
        network.openCluster(nodeId);
        const parentId = parseInt(String(nodeId).replace('cluster-', ''));
        setCollapsedParentIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(parentId);
          return newSet;
        });
        return;
      }

      const node = data.nodes.get(nodeId);
      if (node?.url) {
        window.open(node.url, "_blank");
      } else if (node?.isParent) {
        collapseNode(network, nodeId);
        setCollapsedParentIds(prev => new Set(prev).add(nodeId));
      }
    });

    if (collapsedParentIds.size > 0) {
      collapsedParentIds.forEach(parentId => {
        collapseNode(network, parentId);
      });
    }

    return () => {
      data.nodes.off('*', autoSave);
      data.edges.off('*', autoSave);
      network.destroy();
    };
  }, [data]);

  useEffect(() => {
    if (networkRef.current) { const options = getNetworkOptions(isDark); networkRef.current.setOptions(options); }
  }, [isDark]);

  useEffect(() => {
    saveDataToLocalStorage(data.nodes, data.edges, collapsedParentIds);
  }, [collapsedParentIds, data]);

  const selectedNode = selectedNodeId ? data.nodes.get(selectedNodeId) : null;

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
        selectedNodeLabel={selectedNode?.label || ''}
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