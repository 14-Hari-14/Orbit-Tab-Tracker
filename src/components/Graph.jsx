import { useRef, useEffect, useState, useCallback } from "react";
import { DataSet, Network } from "vis-network/standalone";
import { getNetworkOptions, getProjectHeaderStyle, getThemeToggleStyle, getFixedToolbarStyle } from './styles';
import { GridBg } from './ui/GridBg';
import { NodeModal } from "./NodeModal";

const LOCAL_STORAGE_KEY = 'orbit-graph-data-v1';

// Implementing local storage
const saveDataToLocalStorage = (nodes, edges, collapsedIds) => {
  /*The function converts the graph into simple js arrays each array is then converted to JSON string via stringify to store it this process done in reverse to load data from local storage*/ 
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
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY); //uses key to identify and retrieve data from local storage
    if (savedData === null) return null;
    return JSON.parse(savedData); // Parses JSON back into js object
  } catch (error) {
    console.error("Failed to load graph data:", error);
    return null;
  }
};

// --- REACT COMPONENTS ---
const generateNodeTitle = (node) => {
  // Function to create the tooltip when a node is hovered which displays link and note if present
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

// switch between dark and light mode
const ThemeToggle = ({ isDark, onToggle }) => (
  <div style={getThemeToggleStyle(isDark)} onClick={onToggle} title="Toggle theme"><span style={{ fontSize: '20px' }}>{isDark ? '🌞' : '🌙'}</span></div>
);

// UI of the toolbar with buttons to add, delete, edit nodes and add/edit notes
const FixedToolbar = ({ onAddRoot, onAdd, onDelete, onEdit, onNote, isNodeSelected, selectedNodeLabel, isDark }) => {
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
      {/* Add Root button - always enabled, uses modal */}
      <button 
        onClick={onAddRoot} // ✅ New handler
        style={buttonStyle} // ✅ Always enabled
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#005999')} 
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#007acc')} 
      > 
        <span>🌟</span> Add Root 
      </button> 

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

// creating root node on initial load
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

  const [modalState, setModalState] = useState({ 
  isOpen: false, 
  mode: null, // 'add', 'edit', 'note'
  node: null // The node being edited
  });

  const savedData = loadDataFromLocalStorage();
  const [data] = useState(() => {
    if (savedData && savedData.nodes) {
      const nodes = new DataSet(savedData.nodes);
      const edges = new DataSet(savedData.edges);

      // Updating notes for each node to ensure data persistence after reload
      nodes.forEach(node => {
        nodes.update({ id: node.id, title: generateNodeTitle(node) });
      });

      return { nodes, edges };
    }
    return createInitialData();
  });

  // Use ref for immediate updates
  const collapsedParentIds = useRef(new Set(savedData?.collapsed || []));

  // Helper to get direct children
  const getDirectChildren = useCallback((parentId) => {
    return data.edges.get({ filter: edge => edge.from === parentId }).map(edge => edge.to);
  }, [data]);

  // Helper to get bottom-up order for initial collapse
  const getBottomUpOrder = useCallback((collapsedSet) => {
    const order = [];
    const visited = new Set();

    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);

      const children = getDirectChildren(id).filter(c => collapsedSet.has(c));
      children.forEach(visit);

      order.push(id);
    };

    Array.from(collapsedSet).forEach(visit);
    return order;
  }, [getDirectChildren]);

  const openModal = (mode, nodeId) => {
    if (!nodeId) return;

    // Determine the actual node or parent node for context
    const isCluster = String(nodeId).startsWith('cluster-');
    const actualNodeId = isCluster ? parseInt(String(nodeId).replace('cluster-', '')) : nodeId;
    const nodeData = data.nodes.get(actualNodeId);
    
    setModalState({
      isOpen: true,
      mode: mode,
      nodeData: (mode === 'edit' || mode === 'note') ? nodeData : null,
      parentId: (mode === 'add') ? actualNodeId : null,
    });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: null, nodeData: null, parentId: null });
  };

  // Add new handler for root nodes
  const handleAddRootNode = () => {
    setModalState({
      isOpen: true,
      mode: 'addRoot', // ✅ New mode
      nodeData: null,
      parentId: null
    });
  };

  // Update handleModalSubmit to handle the new mode
  const handleModalSubmit = (formData) => {
    if (modalState.mode === 'add') {
      const newNode = {
        id: Date.now(),
        label: formData.label,
        url: formData.url || '',
        note: formData.note || '',
        isParent: formData.isParent,
        shape: formData.isParent ? 'ellipse' : 'box',
      };
      newNode.title = generateNodeTitle(newNode);
      data.nodes.add(newNode);
      data.edges.add({ from: modalState.parentId, to: newNode.id });
    } else if (modalState.mode === 'addRoot') { // ✅ New case
      const newRootNode = {
        id: Date.now(),
        label: formData.label,
        url: formData.url || '',
        note: formData.note || '',
        isParent: true, // Root nodes are always parents
        shape: 'circle',
        value: 25
      };
      newRootNode.title = generateNodeTitle(newRootNode);
      data.nodes.add(newRootNode);
      
      // Auto-select the new root node
      setSelectedNodeId(newRootNode.id);
      
      // Focus on the new node
      setTimeout(() => {
        if (networkRef.current) {
          networkRef.current.selectNodes([newRootNode.id]);
          networkRef.current.focus(newRootNode.id, {
            scale: 1,
            animation: true
          });
        }
      }, 100);
    } else if (modalState.mode === 'edit' || modalState.mode === 'note') {
      const updatedNode = {
        ...modalState.nodeData,
        label: formData.label,
        url: formData.url,
        note: formData.note,
      };
      updatedNode.title = generateNodeTitle(updatedNode);
      data.nodes.update(updatedNode);
    }
    closeModal();
  };

  // --- HANDLER FUNCTIONS ---
  const handleAddNode = () => openModal('add', selectedNodeId);
  const handleEditNode = () => openModal('edit', selectedNodeId);
  const handleAddEditNote = () => openModal('note', selectedNodeId);


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

  // Recursive open descendants
  const recursiveOpenDescendants = useCallback((networkInstance, originalParentId) => {
    const directChildren = getDirectChildren(originalParentId);
    directChildren.forEach((childId) => {
      const childNode = data.nodes.get(childId);
      if (childNode?.isParent && collapsedParentIds.current.has(childId)) {
        const innerClusterId = `cluster-${childId}`;
        // Open the inner cluster (now visible after parent open)
        networkInstance.openCluster(innerClusterId);
        collapsedParentIds.current.delete(childId);
      }
      // Always recurse to handle deeper levels
      recursiveOpenDescendants(networkInstance, childId);
    });
  }, [data, getDirectChildren]);

  //  Reusable helper function to collapse a parent node into a cluster.
  const collapseNode = useCallback((networkInstance, parentId) => {
    if (collapsedParentIds.current.has(parentId)) return; // Already collapsed

    const node = data.nodes.get(parentId);
    if (!node || !node.isParent) return;
    
    const originalChildren = getDirectChildren(parentId);
    if (originalChildren.length === 0) return;
    
    // NEW: Recursively collapse all descendant parent nodes first
    const collapseDescendantParents = (nodeId) => {
      const children = getDirectChildren(nodeId);
      children.forEach(childId => {
        const childNode = data.nodes.get(childId);
        if (childNode && childNode.isParent) {
          // If this child is a parent and not already collapsed, collapse it first
          if (!collapsedParentIds.current.has(childId)) {
            collapseNode(networkInstance, childId);
            collapsedParentIds.current.add(childId);
          }
        }
        // Recursively check grandchildren
        collapseDescendantParents(childId);
      });
    };

    // Collapse all descendant parents before creating this cluster
    collapseDescendantParents(parentId);

    const childCount = originalChildren.length;

    // Get representatives for direct children (original or cluster)
    const childReps = originalChildren.map(childId => 
      collapsedParentIds.current.has(childId) ? `cluster-${childId}` : childId
    );

    // Generate random colors for clustered nodes that work well with both themes
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

    const clusterNodeProperties = {
      id: `cluster-${parentId}`,
      label: `${node.label} (+${childCount})`,
      note: node.note || '',
      shape: 'circle',
      value: childCount,
      color: { 
        background: clusterColor.bg, 
        border: clusterColor.border 
      },
      font: { color: '#000000' }
    };
  
    clusterNodeProperties.title = generateNodeTitle(clusterNodeProperties);

    networkInstance.cluster({
      joinCondition: (childNode) => childNode.id === parentId || childReps.includes(childNode.id),
      clusterNodeProperties: clusterNodeProperties
    });

    // Mark as collapsed
    collapsedParentIds.current.add(parentId);
  }, [data, getDirectChildren, collapsedParentIds]);

  // Auto-save function using ref
  const autoSave = useCallback(() => {
    saveDataToLocalStorage(data.nodes, data.edges, collapsedParentIds.current);
  }, [data]);

  // --- USE EFFECT HOOKS ---
  useEffect(() => {
    const options = getNetworkOptions(isDark);
    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    data.nodes.on('*', autoSave);
    data.edges.on('*', autoSave);

    network.on("selectNode", (params) => setSelectedNodeId(params.nodes[0]));
    network.on("deselectNode", () => setSelectedNodeId(null));

    network.on("doubleClick", (params) => {
      const nodeId = params.nodes[0];
      if (!nodeId) return;

      if (network.isCluster(nodeId) || String(nodeId).startsWith('cluster-')) {
        const clusterId = nodeId;
        const parentId = parseInt(String(clusterId).replace('cluster-', ''));
        network.openCluster(clusterId);
        collapsedParentIds.current.delete(parentId);
        // Recursively open descendants
        recursiveOpenDescendants(network, parentId);
        autoSave();
        return;
      }

      const node = data.nodes.get(nodeId);
      if (node?.url) {
        window.open(node.url, "_blank");
      } else if (node?.isParent) {
        collapseNode(network, nodeId);
        autoSave();
      }
    });

    // Apply initial collapses in bottom-up order
    if (collapsedParentIds.current.size > 0) {
      const order = getBottomUpOrder(collapsedParentIds.current);
      order.forEach(parentId => {
        collapseNode(network, parentId);
      });
      // Save after initial setup
      autoSave();
    }

    return () => {
      data.nodes.off('*', autoSave);
      data.edges.off('*', autoSave);
      network.destroy();
    };
  }, [data, isDark, autoSave, collapseNode, recursiveOpenDescendants, getBottomUpOrder]); // Dependencies for callbacks

  useEffect(() => {
    if (networkRef.current) { const options = getNetworkOptions(isDark); networkRef.current.setOptions(options); }
  }, [isDark]);

  const selectedNode = selectedNodeId ? data.nodes.get(selectedNodeId) : null;
  const isClusterSelected = selectedNodeId && String(selectedNodeId).startsWith('cluster-');

  return (
    <GridBg isDark={isDark}>
      <ProjectHeader isDark={isDark} />
      <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
      <FixedToolbar
        onAddRoot={handleAddRootNode} // ✅ Pass the new handler
        onAdd={handleAddNode}
        onDelete={handleDeleteNode}
        onEdit={handleEditNode}
        onNote={handleAddEditNote}
        isNodeSelected={!!selectedNodeId}
        selectedNodeLabel={selectedNode?.label || ''}
        isDark={isDark}
      />

      <NodeModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        initialData={modalState.nodeData}
        mode={modalState.mode} // ✅ This will now include 'addRoot'
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