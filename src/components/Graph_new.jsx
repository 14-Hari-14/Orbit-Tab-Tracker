import React, { useRef, useEffect, useState } from "react";
import { DataSet, Network } from "vis-network/standalone";
import { getNetworkOptions, getProjectHeaderStyle, getThemeToggleStyle, getFixedToolbarStyle } from './styles';
import { GridBg } from './ui/GridBg';

const LOCAL_STORAGE_KEY = 'orbit-graph-data-v1';

// --- DATA STORAGE FUNCTIONS ---

/**
 * Saves the current graph state, including the list of collapsed clusters, to Local Storage.
 */
const saveDataToLocalStorage = (nodes, edges, collapsedIds) => {
  try {
    const plainNodes = nodes.get({ returnType: 'Array' });
    const plainEdges = edges.get({ returnType: 'Array' });
    
    // [State] Convert the Set of collapsed IDs to an array for JSON compatibility.
    const plainCollapsed = Array.from(collapsedIds);

    const dataToStore = JSON.stringify({
      nodes: plainNodes,
      edges: plainEdges,
      collapsed: plainCollapsed, // [State] Add the collapsed list to our saved data.
    });
    localStorage.setItem(LOCAL_STORAGE_KEY, dataToStore);
  } catch (error) {
    console.error("Failed to save graph data:", error);
  }
};

/**
 * Loads graph data, including the list of collapsed clusters, from Local Storage.
 */
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


// --- REACT COMPONENTS (Unchanged) ---
const generateNodeTitle = (node) => { const container = document.createElement('div'); container.style.padding = '5px'; const labelEl = document.createElement('b'); labelEl.innerText = node.label; container.appendChild(labelEl); if (node.url) { container.appendChild(document.createElement('br')); const linkEl = document.createElement('a'); linkEl.href = node.url; linkEl.target = '_blank'; linkEl.style.color = '#55aaff'; linkEl.innerText = node.url; container.appendChild(linkEl); } if (node.note) { container.appendChild(document.createElement('hr')); const noteEl = document.createElement('i'); noteEl.innerText = node.note; container.appendChild(noteEl); } return container; };
const ThemeToggle = ({ isDark, onToggle }) => ( <div style={getThemeToggleStyle(isDark)} onClick={onToggle} title="Toggle theme"><span style={{ fontSize: '20px' }}>{isDark ? '🌞' : '🌙'}</span></div>);
const FixedToolbar = ({ onAdd, onDelete, onEdit, onNote, isNodeSelected, selectedNodeId, isDark }) => { const buttonStyle = { padding: '10px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s ease', backgroundColor: '#007acc', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }; const disabledButtonStyle = { ...buttonStyle, backgroundColor: isDark ? '#444' : '#e0e0e0', color: isDark ? '#888' : '#999', cursor: 'not-allowed' }; const statusStyle = { fontSize: '12px', color: isDark ? '#ccc' : '#666', textAlign: 'center', fontStyle: 'italic', marginTop: '8px', padding: '8px', backgroundColor: isDark ? 'rgba(0, 122, 204, 0.2)' : 'rgba(0, 122, 204, 0.1)', borderRadius: '6px' }; return ( <div style={getFixedToolbarStyle(isDark)}> <button onClick={onAdd} disabled={!isNodeSelected} style={isNodeSelected ? buttonStyle : disabledButtonStyle} onMouseOver={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#005999')} onMouseOut={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#007acc')} > <span>➕</span> Add Child </button> <button onClick={onDelete} disabled={!isNodeSelected || selectedNodeId === 1} style={isNodeSelected && selectedNodeId !== 1 ? { ...buttonStyle, backgroundColor: '#dc3545' } : disabledButtonStyle} onMouseOver={(e) => isNodeSelected && selectedNodeId !== 1 && (e.currentTarget.style.backgroundColor = '#c82333')} onMouseOut={(e) => isNodeSelected && selectedNodeId !== 1 && (e.currentTarget.style.backgroundColor = '#dc3545')} > <span>🗑️</span> Delete Node </button> <button onClick={onEdit} disabled={!isNodeSelected} style={isNodeSelected ? { ...buttonStyle, backgroundColor: '#28a745' } : disabledButtonStyle} onMouseOver={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#218838')} onMouseOut={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#28a745')} > <span>✏️</span> Edit Node </button> <button onClick={onNote} disabled={!isNodeSelected} style={isNodeSelected ? { ...buttonStyle, backgroundColor: '#ffc107', color: '#212529' } : disabledButtonStyle} onMouseOver={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#e0a800')} onMouseOut={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#ffc107')} > <span>📝</span> Add/Edit Note </button> <div style={statusStyle}> {isNodeSelected ? `Selected: ${selectedNodeId === 1 ? 'Root Node' : `Node ${selectedNodeId}`}` : 'Select a node to enable actions'} </div> </div> ); };
const ProjectHeader = ({ isDark }) => { const titleStyle = { fontSize: '24px', fontWeight: '600', background: 'linear-gradient(135deg, #007acc, #0099ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0 }; const subtitleStyle = { fontSize: '12px', color: isDark ? '#ccc' : '#666', fontWeight: '400' }; return ( <div style={getProjectHeaderStyle(isDark)}> <div style={{ fontSize: '20px' }}>🌌</div> <div> <h1 style={titleStyle}>Orbit</h1> <p style={subtitleStyle}>Visual Knowledge Graph</p> </div> </div> ); };

const createInitialData = () => {
  const initialNodes = new DataSet([{ id: 1, label: "Root", shape: "ellipse", isParent: true, note: "Start building your knowledge graph from here!" },]);
  initialNodes.forEach(node => { initialNodes.update({ ...node, title: generateNodeTitle(node) }); });
  return { nodes: initialNodes, edges: new DataSet([]) };
};

export default function Graph() {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isDark, setIsDark] = useState(true);

  // --- STATE INITIALIZATION WITH LOCAL STORAGE ---
  const [data] = useState(() => {
    const savedData = loadDataFromLocalStorage();
    if (savedData && savedData.nodes) {
      return {
        nodes: new DataSet(savedData.nodes),
        edges: new DataSet(savedData.edges),
      };
    }
    return createInitialData();
  });

  // [State] New state to track the IDs of parent nodes that are collapsed.
  // We use a Set for efficient add/delete operations.
  const [collapsedParentIds, setCollapsedParentIds] = useState(() => {
    const savedData = loadDataFromLocalStorage();
    // [State] Load the saved list of collapsed IDs, or start with an empty set.
    return new Set(savedData?.collapsed || []);
  });

  // --- HANDLER FUNCTIONS (Unchanged) ---
  const handleAddNode = () => { if (!selectedNodeId) return; const label = prompt("Enter a label for the new node:", "New Node"); if (!label) return; const url = prompt("Enter a URL for this node (optional):"); if (url === null) return; const isParent = window.confirm("Should this node be a parent (able to group other nodes)?"); const newNode = { id: Date.now(), label, url: url || '', note: '', isParent: isParent, shape: isParent ? 'ellipse' : 'box', }; newNode.title = generateNodeTitle(newNode); data.nodes.add(newNode); data.edges.add({ from: selectedNodeId, to: newNode.id }); networkRef.current.unselectAll(); };
  const handleEditNode = () => { if (!selectedNodeId) return; const currentNode = data.nodes.get(selectedNodeId); const newLabel = prompt("Edit the label:", currentNode.label); if (newLabel === null) return; const newUrl = prompt("Enter the URL (optional):", currentNode.url || ""); if (newUrl === null) return; const updatedNode = { ...currentNode, label: newLabel || currentNode.label, url: newUrl || '' }; updatedNode.title = generateNodeTitle(updatedNode); data.nodes.update(updatedNode); };
  const handleAddEditNote = () => { if (!selectedNodeId) return; const currentNode = data.nodes.get(selectedNodeId); const newNote = prompt("Add or edit the note for this node:", currentNode.note || ""); if (newNote !== null) { const updatedNode = { ...currentNode, note: newNote }; updatedNode.title = generateNodeTitle(updatedNode); data.nodes.update(updatedNode); } };
  const handleDeleteNode = () => { if (!selectedNodeId || selectedNodeId === 1) return; if (window.confirm("Are you sure you want to delete this node and all its children?")) { const edges = data.edges.get(); const getAllDescendants = (nodeId) => { const children = edges.filter(edge => edge.from === nodeId).map(edge => edge.to); let descendants = [...children]; children.forEach(childId => { descendants = [...descendants, ...getAllDescendants(childId)]; }); return descendants; }; const nodesToDelete = [selectedNodeId, ...getAllDescendants(selectedNodeId)]; const edgesToDelete = edges.filter(edge => nodesToDelete.includes(edge.from) || nodesToDelete.includes(edge.to)); data.edges.remove(edgesToDelete.map(edge => edge.id)); data.nodes.remove(nodesToDelete); setSelectedNodeId(null); } };


  // Effect 1: Initializes the network and sets up event listeners.
  useEffect(() => {
    const options = getNetworkOptions(isDark);
    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    // --- AUTO-SAVING FOR DATA AND VIEW STATE ---
    const autoSave = () => saveDataToLocalStorage(data.nodes, data.edges, collapsedParentIds);
    // [State] We now also save whenever the collapsed state changes.
    autoSave();

    data.nodes.on('*', autoSave);
    data.edges.on('*', autoSave);

    // Event listeners
    network.on("selectNode", (params) => setSelectedNodeId(params.nodes[0]));
    network.on("deselectNode", () => setSelectedNodeId(null));
    network.on("doubleClick", (params) => {
      const nodeId = params.nodes[0];
      if (!nodeId) return;

      // [State] When opening a cluster, we must remove its parent ID from our tracking set.
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
        const childNodes = data.edges.get({ filter: edge => edge.from === nodeId }).map(edge => edge.to);
        if (childNodes.length > 0) {
          network.cluster({
            joinCondition: (childNode) => childNodes.includes(childNode.id) || childNode.id === nodeId,
            clusterNodeProperties: { id: `cluster-${nodeId}`, label: `${node.label} (+${childNodes.length})`, shape: 'circle', color: { background: '#FFD700', border: '#FFA000' }, font: { size: 14, color: '#000000' } }
          });
          // [State] When collapsing a node, we add its ID to our tracking set.
          setCollapsedParentIds(prev => new Set(prev).add(nodeId));
        }
      }
    });

    // [State] AFTER the network is created, we loop through our saved list
    // of collapsed IDs and re-collapse them to restore the view state.
    if (collapsedParentIds.size > 0) {
      collapsedParentIds.forEach(parentId => {
        if (network.body.nodes[parentId]) { // Check if node still exists
          const childNodes = data.edges.get({ filter: edge => edge.from === parentId });
          if (childNodes.length > 0) {
            network.clusterByNode(parentId);
          }
        }
      });
    }

    return () => {
      data.nodes.off('*', autoSave);
      data.edges.off('*', autoSave);
      network.destroy();
    };
  }, [data]); // This effect should still run primarily when the core data object is created.

  // Effect 2: Update theme
  useEffect(() => {
    if (networkRef.current) {
      const options = getNetworkOptions(isDark);
      networkRef.current.setOptions(options);
    }
  }, [isDark]);

  // [State] Effect 3: This new effect specifically watches for changes in the
  // collapsedParentIds set and triggers a save to Local Storage.
  useEffect(() => {
    saveDataToLocalStorage(data.nodes, data.edges, collapsedParentIds);
  }, [collapsedParentIds, data]);

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