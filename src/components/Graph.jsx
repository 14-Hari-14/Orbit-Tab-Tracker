import { useRef, useEffect, useState, useCallback } from "react";
import { DataSet, Network } from "vis-network/standalone";
import { getNetworkOptions, getProjectHeaderStyle, getThemeToggleStyle, getFixedToolbarStyle } from './styles';
import { GridBg } from './ui/GridBg';

import {supabase} from './supabaseClient';
import { fetchGraphData, addNodeToSupabase, addEdgeToSupabase, updateNodeInSupabase, deleteNodeFromSupabase } from './api'; 

import { NodeModal } from "./NodeModal";
import sunIcon from '../assets/sun.png';
import moonIcon from '../assets/moon.png';

// --- Constants ---
const LOCAL_STORAGE_KEY = 'orbit-graph-data-v1';
const DEFAULT_NODE_VALUE = 20; // New: Default value for node sizing to ensure visibility.

// --- Utility Functions ---
// Saves graph data (nodes, edges, collapsed IDs) to local storage for persistence.
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

// Loads graph data from local storage if available.
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

// Generates a tooltip element for node hover, displaying label, URL, and note.
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

// Creates initial graph data with a root node (not currently used, as data is fetched from Supabase).
const createInitialData = () => {
  const initialNodes = new DataSet([{ 
    id: 1, 
    label: "Root", 
    shape: "circle", 
    value: 25, 
    is_parent: true, 
    note: "Start building your knowledge graph from here!" 
  }]);
  initialNodes.forEach(node => {
    initialNodes.update({ ...node, title: generateNodeTitle(node) });
  });
  return { nodes: initialNodes, edges: new DataSet([]) };
};

// --- Sub-Components ---
// Toggles between dark and light themes.
const ThemeToggle = ({ isDark, onToggle }) => (
  <div style={getThemeToggleStyle(isDark)} onClick={onToggle} title="Toggle theme">
    <img 
      src={isDark ? sunIcon : moonIcon} 
      alt="Toggle theme" 
      style={{ width: '24px', height: '24px' }} 
    />
  </div>
);

// Displays the project header with title and description.
const ProjectHeader = ({ isDark }) => (
  <div
    style={{
      ...getProjectHeaderStyle(isDark),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div style={{ fontSize: '20px' }}>🌌</div>
      <div>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #007acc, #0099ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
          }}
        >
          Orbit
        </h1>
        <p
          style={{
            fontSize: '12px',
            color: isDark ? '#ccc' : '#666',
            fontWeight: '400',
            margin: 0,
          }}
        >
          Visual Knowledge Graph
        </p>
      </div>
    </div>
  </div>
);

// Toolbar for graph actions like adding, editing, or deleting nodes.
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
      <button 
        onClick={onAddRoot} 
        style={buttonStyle}
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

// Button for handling login/logout with dynamic styling based on session.
const LoginButton = ({ isDark, session, onAuthClick }) => {
  const isLoggedIn = !!session;
  const userEmail = session?.user?.email?.split('@')[0] || 'Anonymous';

  const buttonStyle = {
    padding: '0 16px',
    height: '40px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    backgroundColor: isLoggedIn && session.user.email ? '#28a745' : '#007acc',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: isDark 
      ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
  };

  return (
    <button
      onClick={onAuthClick}
      style={buttonStyle}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = isLoggedIn && session.user.email ? '#218838' : '#005999';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = isLoggedIn && session.user.email ? '#28a745' : '#007acc';
      }}
    >
      {isLoggedIn && session.user.email ? `Logged in as ${userEmail}` : 'Login to Sync'}
    </button>
  );
};

// --- Main Graph Component ---
export default function Graph() {
  // Refs for graph data and network instance.
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const nodes = useRef(new DataSet([]));
  const edges = useRef(new DataSet([]));
  const collapsedParentIds = useRef(new Set());

  // State management for selection, theme, modal, and user session.
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [modalState, setModalState] = useState({ 
    isOpen: false, 
    mode: null,
    nodeData: null,
    parentId: null
  });
  const [session, setSession] = useState(null);

  useEffect(() => {
    const loaded = loadDataFromLocalStorage();
    if (loaded) {
      nodes.current.clear();
      nodes.current.add(loaded.nodes);
      edges.current.clear();
      edges.current.add(loaded.edges);
      collapsedParentIds.current = new Set(loaded.collapsed);
    }
  }, []);

  // --- Handler Functions ---
  // Auto-saves graph data to local storage.
  const autoSave = useCallback(() => {
    saveDataToLocalStorage(nodes.current, edges.current, collapsedParentIds.current);
  }, []);

  // Initiates Google OAuth login via Supabase.
  const handleLoginClick = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) console.error("Error logging in:", error);
  };

  // Gets direct children of a parent node.
  const getDirectChildren = useCallback((parentId) => {
    return edges.current.get({ filter: edge => edge.from === parentId }).map(edge => edge.to);
  }, []);

  // Gets bottom-up order of collapsed nodes for initial setup.
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

  // Collapses a parent node into a cluster, handling descendants recursively.
  const collapseNode = useCallback((networkInstance, parentId) => {
    if (collapsedParentIds.current.has(parentId)) return;

    const node = nodes.current.get(parentId);
    if (!node || !node.is_parent) return;
    
    const originalChildren = getDirectChildren(parentId);
    if (originalChildren.length === 0) return;
    
    // Recursively collapse descendant parents.
    const collapseDescendantParents = (nodeId) => {
      const children = getDirectChildren(nodeId);
      children.forEach(childId => {
        const childNode = nodes.current.get(childId);
        if (childNode && childNode.is_parent) {
          if (!collapsedParentIds.current.has(childId)) {
            collapseNode(networkInstance, childId);
            collapsedParentIds.current.add(childId);
          }
        }
        collapseDescendantParents(childId);
      });
    };

    collapseDescendantParents(parentId);

    const childCount = originalChildren.length;
    const childReps = originalChildren.map(childId => 
      collapsedParentIds.current.has(childId) ? `cluster-${childId}` : childId
    );

    // Generates consistent random color for clusters.
    const getRandomClusterColor = () => {
      const colors = [
        { bg: '#FF6B6B', border: '#FF5252', text: '#000000' },
        { bg: '#4ECDC4', border: '#26A69A', text: '#000000' },
        { bg: '#45B7D1', border: '#2196F3', text: '#000000' },
        { bg: '#96CEB4', border: '#66BB6A', text: '#000000' },
        { bg: '#FECA57', border: '#FF9800', text: '#000000' },
        { bg: '#FF9FF3', border: '#E91E63', text: '#000000' },
        { bg: '#A8E6CF', border: '#4CAF50', text: '#000000' },
        { bg: '#FFB347', border: '#FF5722', text: '#000000' },
        { bg: '#DDA0DD', border: '#9C27B0', text: '#000000' },
        { bg: '#87CEEB', border: '#03A9F4', text: '#000000' },
        { bg: '#F0E68C', border: '#CDDC39', text: '#000000' },
        { bg: '#FFA07A', border: '#FF7043', text: '#000000' },
      ];
      
      // Handle string parentId with a simple hash
      let hash = 0;
      const strId = String(parentId);
      for (let i = 0; i < strId.length; i++) {
        hash = ((hash << 5) - hash + strId.charCodeAt(i)) | 0; // Simple hash function
      }
      const index = Math.abs(hash) % colors.length;
      return colors[index];
    };

    const clusterColor = getRandomClusterColor();

    const clusterNodeProperties = {
      id: `cluster-${parentId}`,
      label: `${node.label} (+${childCount})`,
      note: node.note || '',
      shape: 'circle',
      value: childCount, // Already sets a value here for clusters.
      color: { 
        background: clusterColor.bg, 
        border: clusterColor.border 
      },
      font: { color: '#000000' }
    };
  
    clusterNodeProperties.title = generateNodeTitle(clusterNodeProperties);

    networkInstance.cluster({
      joinCondition: (childNode) => {
        // Include the parent node itself
        if (childNode.id === parentId) return true;
        
        // Include all direct children (both regular nodes and cluster representatives)
        return originalChildren.includes(childNode.id) || childReps.includes(childNode.id);
      },
      clusterNodeProperties: clusterNodeProperties
    });

    collapsedParentIds.current.add(parentId);
  }, [getDirectChildren]);

  // Recursively opens descendant clusters.
  const recursiveOpenDescendants = useCallback((networkInstance, originalParentId) => {
    const directChildren = getDirectChildren(originalParentId);
    directChildren.forEach((childId) => {
      const childNode = nodes.current.get(childId); 
      if (childNode?.is_parent && collapsedParentIds.current.has(childId)) {
        const innerClusterId = `cluster-${childId}`;
        
        // Check if cluster exists before trying to open it
        try {
          if (networkInstance.isCluster(innerClusterId)) {
            networkInstance.openCluster(innerClusterId);
            collapsedParentIds.current.delete(childId);
          }
        } catch (error) {
          console.warn(`Cluster ${innerClusterId} does not exist or cannot be opened:`, error);
          // Remove from collapsed set if cluster doesn't exist
          collapsedParentIds.current.delete(childId);
        }
      }
      recursiveOpenDescendants(networkInstance, childId);
    });
  }, [getDirectChildren]);

  // Collapses all children of a root node
  const collapseAllChildren = useCallback((networkInstance, parentId) => {
    const directChildren = getDirectChildren(parentId);
    
    // First collapse all parent children individually
    directChildren.forEach(childId => {
      const childNode = nodes.current.get(childId);
      if (childNode?.is_parent) {
        collapseNode(networkInstance, childId);
      }
    });
    
    // Then collapse the parent itself if it has children
    if (directChildren.length > 0) {
      collapseNode(networkInstance, parentId);
    }
  }, [getDirectChildren, collapseNode]);

  // Opens the modal for adding/editing nodes or notes.
  const openModal = (mode, nodeId) => {
    if (!nodeId) return;

    const isCluster = String(nodeId).startsWith('cluster-');
    const actualNodeId = isCluster ? String(nodeId).replace('cluster-', '') : nodeId;
    const nodeData = nodes.current.get(actualNodeId);
    
    setModalState({
      isOpen: true,
      mode: mode,
      nodeData: (mode === 'edit' || mode === 'note') ? nodeData : null,
      parentId: (mode === 'add') ? actualNodeId : null,
    });
  };

  // Closes the modal.
  const closeModal = () => {
    setModalState({ isOpen: false, mode: null, nodeData: null, parentId: null });
  };

  // Handles adding a new root node via modal.
  const handleAddRootNode = () => {
    setModalState({
      isOpen: true,
      mode: 'addRoot',
      nodeData: null,
      parentId: null
    });
  };

  // Submits modal form data to Supabase and updates graph.
  const handleModalSubmit = async (formData) => {
    if (modalState.mode === 'add') {
      const newNodeData = { 
        id: Date.now(), 
        label: formData.label, 
        url: formData.url, 
        note: formData.note, 
        is_parent: formData.isParent, 
        shape: formData.isParent ? 'ellipse' : 'box',
        value: DEFAULT_NODE_VALUE
      };
      const savedNode = await addNodeToSupabase(newNodeData);
      if (savedNode) {
        const displayNode = { 
          id: savedNode.id, 
          label: savedNode.label, 
          shape: savedNode.shape, 
          value: savedNode.value || DEFAULT_NODE_VALUE,
          is_parent: savedNode.is_parent,
          url: savedNode.url,
          note: savedNode.note,
          title: generateNodeTitle(savedNode) 
        };
        nodes.current.add(displayNode);
        
        const savedEdge = await addEdgeToSupabase(modalState.parentId, savedNode.id);
        if (savedEdge) {
          edges.current.add({ id: savedEdge.id, from: savedEdge.from_node, to: savedEdge.to_node });
        }
        autoSave();
      }
    } else if (modalState.mode === 'addRoot') {
      const newRootNode = { 
        id: Date.now(), 
        label: formData.label, 
        url: formData.url, 
        note: formData.note, 
        is_parent: true, 
        is_root: true, 
        shape: 'circle', 
        value: 25
      };
      const savedNode = await addNodeToSupabase(newRootNode);
      if (savedNode) {
        const displayNode = { 
          id: savedNode.id, 
          label: savedNode.label, 
          shape: savedNode.shape, 
          value: savedNode.value || 25,
          is_parent: savedNode.is_parent,
          is_root: savedNode.is_root,
          url: savedNode.url,
          note: savedNode.note,
          title: generateNodeTitle(savedNode) 
        };
        nodes.current.add(displayNode);
        setSelectedNodeId(savedNode.id);
        autoSave();
      }
    } else if (modalState.mode === 'edit' || modalState.mode === 'note') {
      const updatedNode = { ...modalState.nodeData, ...formData };
      if (updatedNode.value === null || updatedNode.value === undefined) {
        updatedNode.value = DEFAULT_NODE_VALUE;
      }
      await updateNodeInSupabase(updatedNode);
      
      // Ensure the updated node maintains all necessary properties
      const fullUpdatedNode = {
        ...updatedNode,
        title: generateNodeTitle(updatedNode)
      };
      nodes.current.update(fullUpdatedNode);
      autoSave();
    }
    closeModal();
  };

  // Adds a child node.
  const handleAddNode = () => openModal('add', selectedNodeId);

  // Edits a node.
  const handleEditNode = () => openModal('edit', selectedNodeId);

  // Adds or edits a note.
  const handleAddEditNote = () => openModal('note', selectedNodeId);

  // Deletes a node after confirmation, preventing root deletion.
  const handleDeleteNode = async () => {
    if (!selectedNodeId) return;

    const rootNode = nodes.current.get({ filter: item => item.is_root === true })[0];
    if (selectedNodeId === rootNode?.id) {
        alert("The root node cannot be deleted.");
        return;
    }
    
    if (window.confirm("Are you sure you want to delete this node?")) {
      await deleteNodeFromSupabase(selectedNodeId);
      nodes.current.remove(selectedNodeId); 
      setSelectedNodeId(null);
      autoSave();
    }
  };

  // --- UseEffect Hooks ---
  // Sets up user session with Supabase, handling anonymous sign-in.
  useEffect(() => {
    const setupUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
      }
    };

    setupUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      console.log("Supabase auth state changed:", session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initializes the vis-network graph and handles events like selection and double-click.
  useEffect(() => {
    const options = getNetworkOptions(isDark);
    const network = new Network(
      containerRef.current,
      { nodes: nodes.current, edges: edges.current },
      options
    );
    networkRef.current = network;

    nodes.current.on('*', autoSave);
    edges.current.on('*', autoSave);

    network.on("selectNode", (params) => setSelectedNodeId(params.nodes[0]));
    network.on("deselectNode", () => setSelectedNodeId(null));

    network.on("doubleClick", (params) => {
      const nodeId = params.nodes[0];
      if (!nodeId) return;

      const isClusterNode = network.isCluster(nodeId) || String(nodeId).startsWith('cluster-');
      if (isClusterNode) {
        const clusterId = nodeId;
        const parentId = String(clusterId).replace('cluster-', ''); // Fixed: No parseInt, keep as string for UUIDs
        network.openCluster(clusterId);
        collapsedParentIds.current.delete(parentId);
        recursiveOpenDescendants(network, parentId);
        autoSave();
        return;
      }

      const node = nodes.current.get(nodeId);
      if (node?.url && node.url.trim() !== '') { // Fixed: Check for non-empty URL to open links
        window.open(node.url, "_blank");
      } else if (node?.is_parent) {
        // Check if this is a root node - if so, collapse all children
        const rootNode = nodes.current.get({ filter: item => item.is_root === true })[0];
        if (nodeId === rootNode?.id) {
          collapseAllChildren(network, nodeId);
        } else {
          collapseNode(network, nodeId);
        }
        autoSave();
      }
    });

    // Apply initial collapses in bottom-up order if any.
    if (collapsedParentIds.current.size > 0) {
      const order = getBottomUpOrder(collapsedParentIds.current);
      order.forEach(parentId => {
        collapseNode(network, parentId);
      });
    }

    return () => {
      nodes.current.off('*', autoSave);
      edges.current.off('*', autoSave);
      network.destroy();
    };
  }, [isDark, collapseNode, recursiveOpenDescendants, getBottomUpOrder, autoSave, collapseAllChildren]);

  // Loads graph data from Supabase when session changes, initializing root if empty.
  useEffect(() => {
    if (session) {
      const loadAndInitializeGraph = async () => {
        const { nodes: fetchedNodes, edges: fetchedEdges } = await fetchGraphData();

        if (fetchedNodes.length === 0) {
          const rootNode = { 
            id: Date.now(), 
            label: "Root", 
            is_parent: true, 
            is_root: true, 
            shape: "circle", 
            value: 25, 
            note: "Start here!" 
          };
          const savedRoot = await addNodeToSupabase(rootNode);
          if (savedRoot) {
              const displayNode = { 
                id: savedRoot.id, 
                label: savedRoot.label, 
                shape: savedRoot.shape, 
                value: savedRoot.value || 25,
                is_parent: savedRoot.is_parent,
                is_root: savedRoot.is_root,
                url: savedRoot.url,
                note: savedRoot.note,
                title: generateNodeTitle(savedRoot) 
              };
              nodes.current.clear();
              edges.current.clear();
              nodes.current.add(displayNode);
          }
        } else {
          const displayNodes = fetchedNodes.map(n => ({ 
            id: n.id, 
            label: n.label, 
            shape: n.shape, 
            value: n.value || DEFAULT_NODE_VALUE,
            is_parent: n.is_parent,
            url: n.url,
            note: n.note,
            title: generateNodeTitle(n) 
          }));
          nodes.current.clear();
          edges.current.clear();
          nodes.current.add(displayNodes);
          edges.current.add(fetchedEdges);
        }
        autoSave(); // Save fetched data to local as backup
      };
      loadAndInitializeGraph();
    }
  }, [session, autoSave]);

  // Updates network options when theme changes.
  useEffect(() => {
    if (networkRef.current) { 
      const options = getNetworkOptions(isDark); 
      networkRef.current.setOptions(options); 
    }
  }, [isDark]);

  // --- Render ---
  const selectedNode = selectedNodeId ? nodes.current.get(selectedNodeId) : null;

  return (
    <GridBg isDark={isDark}>
      <ProjectHeader isDark={isDark} />
      <div style={{ 
        position: 'fixed', 
        top: '110px', 
        left: '20px', 
        display: 'flex', 
        gap: '10px', 
        zIndex: 1001 
      }}>
        <LoginButton isDark={isDark} session={session} onAuthClick={handleLoginClick} />
        <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
      </div>
      <FixedToolbar
        onAddRoot={handleAddRootNode} 
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
        mode={modalState.mode} 
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