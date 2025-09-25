import { useRef, useEffect, useState, useCallback } from "react";
import { DataSet, Network } from "vis-network/standalone";
import { getNetworkOptions, getProjectHeaderStyle, getThemeToggleStyle, getFixedToolbarStyle } from './styles';
import { GridBg } from './ui/GridBg';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import FuzzySearch from "./FuzzySearch";
import {supabase} from './supabaseClient';
import { fetchGraphData, addNodeToSupabase, addEdgeToSupabase, updateNodeInSupabase, deleteNodeFromSupabase } from './api'; 

import { NodeModal } from "./NodeModal";
import sunIcon from '../assets/sun.png';
import moonIcon from '../assets/moon.png';

const LOCAL_STORAGE_KEY = 'orbit-graph-data-v1';
const DEFAULT_NODE_VALUE = 20;

const saveDataToLocalStorage = (nodes, edges, allNodesRef) => {
  try {
    const plainNodes = nodes.get({ returnType: 'Array' });
    const plainEdges = edges.get({ returnType: 'Array' });
    const allNodesArray = Array.from(allNodesRef.values());
    const dataToStore = JSON.stringify({ nodes: plainNodes, edges: plainEdges, all_nodes: allNodesArray });
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

// Function to generate the board which shows content of node on hover
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

// Function to toggle theme
const ThemeToggle = ({ isDark, onToggle }) => (
  <div style={getThemeToggleStyle(isDark)} onClick={onToggle} title="Toggle theme">
    <img 
      src={isDark ? sunIcon : moonIcon} 
      alt="Toggle theme" 
      style={{ width: '24px', height: '24px' }} 
    />
  </div>
);

// Function that displays the top left part of the website which shows project name
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

// Function to show all the different buttons to make changes to graph
const FixedToolbar = ({ onAddRoot, onAdd, onDelete, onEdit, onNote, onShowShortcuts, isNodeSelected, selectedNodeLabel, isDark }) => {
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
        disabled={!isNodeSelected} 
        style={isNodeSelected ? { ...buttonStyle, backgroundColor: '#dc3545' } : disabledButtonStyle} 
        onMouseOver={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#c82333')} 
        onMouseOut={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#dc3545')} 
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
      
      <button 
        onClick={onShowShortcuts} 
        style={{ ...buttonStyle, backgroundColor: '#6f42c1' }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#5a2d91')} 
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6f42c1')} 
        title="View keyboard shortcuts"
      > 
        <span>⌨️</span> Shortcuts 
      </button>
      
      <div style={statusStyle}> 
        {isNodeSelected ? `Selected: ${selectedNodeLabel}` : 'Select a node to enable actions'} 
      </div> 
    </div> 
  );
};

// Button to sign in using supabase
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
      {isLoggedIn && session.user.email ? `✓ Synced as ${userEmail}` : ' Sign in to Sync'}
    </button>
  );
};



const KeyboardFeedback = ({ feedback, isDark }) => {
  if (!feedback) return null;

  const feedbackStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: 9999,
    boxShadow: isDark 
      ? '0 4px 12px rgba(0, 0, 0, 0.5)' 
      : '0 4px 12px rgba(0, 0, 0, 0.15)',
    backgroundColor: feedback.isError 
      ? (isDark ? '#dc3545' : '#f8d7da')
      : (isDark ? '#28a745' : '#d4edda'),
    color: feedback.isError
      ? (isDark ? 'white' : '#721c24')
      : (isDark ? 'white' : '#155724'),
    border: feedback.isError
      ? (isDark ? '1px solid #dc3545' : '1px solid #f5c6cb')
      : (isDark ? '1px solid #28a745' : '1px solid #c3e6cb'),
    animation: 'slideInRight 0.3s ease-out',
  };

  return (
    <>
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div style={feedbackStyle}>
        {feedback.message}
      </div>
    </>
  );
};

const KeyboardShortcutsModal = ({ isOpen, onClose, isDark }) => {
  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  };

  const modalStyle = {
    backgroundColor: isDark ? '#2d3748' : '#ffffff',
    color: isDark ? '#e2e8f0' : '#2d3748',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: isDark 
      ? '0 20px 25px -5px rgba(0, 0, 0, 0.8)' 
      : '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    border: isDark ? '1px solid #4a5568' : '1px solid #e2e8f0',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: isDark ? '1px solid #4a5568' : '1px solid #e2e8f0',
    paddingBottom: '12px',
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: isDark ? '#a0aec0' : '#718096',
    padding: '4px',
    borderRadius: '4px',
    transition: 'color 0.2s ease',
  };

  const sectionStyle = {
    marginBottom: '20px',
  };

  const sectionTitleStyle = {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: isDark ? '#63b3ed' : '#3182ce',
  };

  const shortcutRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: isDark ? '1px solid #4a5568' : '1px solid #f7fafc',
  };

  const keyStyle = {
    backgroundColor: isDark ? '#4a5568' : '#f7fafc',
    color: isDark ? '#e2e8f0' : '#2d3748',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: 'monospace',
    border: isDark ? '1px solid #718096' : '1px solid #e2e8f0',
  };

  const shortcuts = [
    {
      category: 'Node Management',
      items: [
        { key: 'Ctrl+Q', description: 'Add new root node' },
        { key: 'Ctrl+A', description: 'Add child node to selected parent' },
        { key: 'Insert', description: 'Add child node (alternative)' },
        { key: 'Delete / Backspace', description: 'Delete selected node' },
        { key: 'Enter / F2', description: 'Edit selected node' },
        { key: 'Ctrl+E', description: 'Edit note for selected node' },
      ]
    },
    {
      category: 'Navigation & Interaction',
      items: [
        { key: 'Ctrl+O', description: 'Open URL of selected node in new tab' },
        { key: 'Escape', description: 'Clear node selection' },
        { key: 'Space', description: 'Toggle collapse/expand for selected parent node' },
      ]
    }
  ];

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>⌨️ Keyboard Shortcuts</h2>
          <button 
            style={closeButtonStyle} 
            onClick={onClose}
            onMouseOver={(e) => e.target.style.color = isDark ? '#e2e8f0' : '#2d3748'}
            onMouseOut={(e) => e.target.style.color = isDark ? '#a0aec0' : '#718096'}
          >
            ×
          </button>
        </div>
        
        {shortcuts.map((section, index) => (
          <div key={index} style={sectionStyle}>
            <h3 style={sectionTitleStyle}>{section.category}</h3>
            {section.items.map((shortcut, itemIndex) => (
              <div key={itemIndex} style={shortcutRowStyle}>
                <span>{shortcut.description}</span>
                <kbd style={keyStyle}>{shortcut.key}</kbd>
              </div>
            ))}
          </div>
        ))}
        
        <div style={{ 
          marginTop: '20px', 
          padding: '12px', 
          backgroundColor: isDark ? '#4a5568' : '#f7fafc',
          borderRadius: '6px',
          fontSize: '12px',
          color: isDark ? '#a0aec0' : '#718096'
        }}>
          <strong>Note:</strong> Shortcuts are disabled when typing in input fields or when modals are open.
        </div>
      </div>
    </div>
  );
};

export default function Graph() {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const captcha = useRef(null);
  const nodes = useRef(new DataSet([]));
  const edges = useRef(new DataSet([]));
  const allNodesRef = useRef(new Map());
  
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [modalState, setModalState] = useState({ 
    isOpen: false, 
    mode: null,
    nodeData: null,
    parentId: null
  });
  const [session, setSession] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [keyboardFeedback, setKeyboardFeedback] = useState(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [lastLocalChange, setLastLocalChange] = useState(0);

  const reapplyCollapsedStateRef = useRef();
  const syncCollapsedStateFromDatabaseRef = useRef();

  useEffect(() => {
    const loadData = async () => {
      const loaded = loadDataFromLocalStorage();
      if (loaded) {
        nodes.current.clear();
        edges.current.clear();
        
        nodes.current.add(loaded.nodes);
        edges.current.add(loaded.edges);
        
        allNodesRef.current.clear();
        if (loaded.all_nodes) {
          loaded.all_nodes.forEach(node => {
            allNodesRef.current.set(node.id, node);
          });
        }

        const collapsedParents = new Set(
          loaded.all_nodes
            .filter(n => n.is_parent && n.is_collapsed)
            .map(n => n.id)
        );
        
        if (collapsedParents.size > 0) {
          const order = getBottomUpCollapsedOrder(collapsedParents, loaded.edges);
          for (const parentId of order) {
            await collapseNode(parentId);
          }
        }
      }
    };
    
    loadData();
  }, []);

  const autoSave = useCallback(() => {
    saveDataToLocalStorage(nodes.current, edges.current, allNodesRef.current);
  }, []);

  const enablePhysicsTemporarily = useCallback(() => {
    if (networkRef.current) {
      networkRef.current.setOptions({ physics: { enabled: true } });
      setTimeout(() => {
        if (networkRef.current) {
          networkRef.current.setOptions({ physics: false });
        }
      }, 3000);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault(); 
        setIsSearchOpen(prev => !prev); 
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoginClick = async () => {
    try {
      if (!captchaToken) {
        setShowCaptcha(true);
        showKeyboardFeedback("Please complete CAPTCHA verification first", true);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: { captchaToken }
      });
      
      if (error) {
        console.error("Error logging in:", error);
        showKeyboardFeedback("Login failed. Please try again.", true);
      } else {
        showKeyboardFeedback("Redirecting to Google...", false);
      }
      
      if (captcha.current) {
        captcha.current.resetCaptcha();
        setCaptchaToken(null);
        setShowCaptcha(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      showKeyboardFeedback("Login failed. Please try again.", true);
    }
  };

  const getDirectChildren = useCallback((parentId) => {
    return edges.current.get({ filter: edge => edge.from === parentId }).map(edge => edge.to);
  }, []);

  const getBottomUpCollapsedOrder = (collapsedSet, allEdges) => {
    const order = [];
    const visited = new Set();

    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);

      const children = allEdges
        .filter(edge => edge.from === id)
        .map(edge => edge.to)
        .filter(childId => collapsedSet.has(childId));

      children.forEach(visit);

      order.push(id);
    };

    Array.from(collapsedSet).forEach(visit);
    return order;
  };

  const collapseNode = useCallback(async (parentId) => {
    const parentNode = nodes.current.get(parentId);
    if (!parentNode || !parentNode.is_parent || parentNode.is_collapsed) return;
    
    const directChildren = getDirectChildren(parentId);
    if (directChildren.length === 0) return;

    const getAllDescendants = (nodeId) => {
      const result = new Set();
      const queue = [nodeId];
      
      while (queue.length > 0) {
        const currentId = queue.shift();
        const children = getDirectChildren(currentId);
        
        children.forEach(childId => {
          if (!result.has(childId)) {
            result.add(childId);
            queue.push(childId);
          }
        });
      }
      
      return Array.from(result);
    };

    const allDescendants = getAllDescendants(parentId);
    
    for (const descendantId of allDescendants) {
      const descendantNode = nodes.current.get(descendantId);
      if (descendantNode?.is_parent && !descendantNode?.is_collapsed) {
        await collapseNode(descendantId);
      }
    }

    try {
      nodes.current.remove(allDescendants);

      const clusterColors = [
        { bg: '#FF6B6B', border: '#FF5252' },
        { bg: '#4ECDC4', border: '#26A69A' },
        { bg: '#45B7D1', border: '#2196F3' },
        { bg: '#96CEB4', border: '#66BB6A' },
        { bg: '#FECA57', border: '#FF9800' },
        { bg: '#FF9FF3', border: '#E91E63' }
      ];
      
      let hash = 0;
      String(parentId).split('').forEach(char => {
        hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
      });
      const color = clusterColors[Math.abs(hash) % clusterColors.length];

      const clusteredParent = {
        ...parentNode,
        label: `${parentNode.label} (+${directChildren.length})`,
        shape: 'circle',
        color: { background: color.bg, border: color.border },
        font: { color: '#000000' },
        value: Math.max(parentNode.value || 25, directChildren.length * 5),
        is_collapsed: true
      };
      
      clusteredParent.title = generateNodeTitle(clusteredParent);
      nodes.current.update(clusteredParent);
      allNodesRef.current.set(parentId, clusteredParent);

      if (session) {
        await updateNodeInSupabase({ 
          id: parentNode.id,
          label: parentNode.label,
          url: parentNode.url,
          note: parentNode.note,
          is_collapsed: true 
        });
        setLastLocalChange(Date.now());
      }
      
    } catch (error) {
      console.error('Error collapsing node:', error);
    }
  }, [getDirectChildren, session]);

  const expandNode = useCallback(async (parentId) => {
    const parentNode = nodes.current.get(parentId);
    if (!parentNode || !parentNode.is_collapsed) return;

    try {
      const directChildrenIds = getDirectChildren(parentId);
      const directChildren = directChildrenIds
        .map(childId => allNodesRef.current.get(childId))
        .filter(Boolean);

      const restoredParent = {
        ...parentNode,
        label: parentNode.label.replace(/ \(\+\d+\)$/, ''),
        shape: parentNode.shape || 'ellipse',
        value: parentNode.value || 25,
        is_collapsed: false,
        color: {
          border: isDark ? '#888' : '#cccccc',
          background: isDark ? '#2a2a2a' : '#ffffff'
        },
        font: {
          size: 14,
          color: isDark ? '#ffffff' : '#000000'
        }
      };
      
      restoredParent.title = generateNodeTitle(restoredParent);
      nodes.current.update(restoredParent);
      allNodesRef.current.set(parentId, restoredParent);

      if (directChildren.length > 0) {
        const displayChildren = directChildren.map(child => ({
          id: child.id,
          label: child.label,
          shape: child.shape,
          value: child.value || DEFAULT_NODE_VALUE,
          is_parent: child.is_parent,
          is_collapsed: child.is_collapsed,
          url: child.url,
          note: child.note,
          title: generateNodeTitle(child)
        }));

        const existingNodeIds = nodes.current.getIds();
        const newChildren = displayChildren.filter(child => !existingNodeIds.includes(child.id));
        const existingChildren = displayChildren.filter(child => existingNodeIds.includes(child.id));
        
        if (newChildren.length > 0) {
          nodes.current.add(newChildren);
        }
        if (existingChildren.length > 0) {
          nodes.current.update(existingChildren);
        }
      }

      if (session) {
        await updateNodeInSupabase({ 
          id: parentNode.id,
          label: parentNode.label.replace(/ \(\+\d+\)$/, ''),
          url: parentNode.url,
          note: parentNode.note,
          is_collapsed: false 
        });
        setLastLocalChange(Date.now());
      }

      enablePhysicsTemporarily();

    } catch (error) {
      console.error('Error expanding node:', error);
    }
  }, [isDark, getDirectChildren, session, enablePhysicsTemporarily]);

  const syncCollapsedStateFromDatabase = useCallback(async () => {
    if (!session) return;

    if (Date.now() - lastLocalChange < 3000) {
      return;
    }

    try {
      const { nodes: dbNodes, edges: dbEdges } = await fetchGraphData();
      if (!dbNodes || dbNodes.length === 0) return;

      const dbStateMap = new Map(dbNodes.map(n => [n.id, n]));
      const visibleNodeIds = new Set(nodes.current.getIds());

      const getParentId = (childId) => {
        const edge = dbEdges.find(e => e.to === childId);
        return edge ? edge.from : null;
      };

      for (const dbNode of dbNodes) {
        if (!dbNode.is_parent) continue;

        const localNode = allNodesRef.current.get(dbNode.id);
        if (!localNode) continue;

        const dbIsCollapsed = dbNode.is_collapsed;
        const localIsCollapsed = localNode.is_collapsed;

        if (dbIsCollapsed !== localIsCollapsed) {
          const parentId = getParentId(dbNode.id);
          const isParentVisible = !parentId || visibleNodeIds.has(parentId);

          if (isParentVisible) {
            if (dbIsCollapsed && !localIsCollapsed) {
              await collapseNode(dbNode.id);
            } else if (!dbIsCollapsed && localIsCollapsed) {
              await expandNode(dbNode.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error syncing collapsed state:', error);
    }
  }, [session, lastLocalChange, collapseNode, expandNode]);

  const reapplyCollapsedState = useCallback(async () => {
    const allNodes = Array.from(allNodesRef.current.values());
    const collapsedParents = new Set(
      allNodes
        .filter(n => n.is_parent && n.is_collapsed)
        .map(n => n.id)
    );

    if (collapsedParents.size > 0) {
      const allEdges = edges.current.get({ returnType: 'Array' });
      const order = getBottomUpCollapsedOrder(collapsedParents, allEdges);
      for (const parentId of order) {
        await collapseNode(parentId);
      }
    }
  }, [collapseNode]);

  useEffect(() => {
    reapplyCollapsedStateRef.current = reapplyCollapsedState;
    syncCollapsedStateFromDatabaseRef.current = syncCollapsedStateFromDatabase;
  }, [reapplyCollapsedState, syncCollapsedStateFromDatabase]);

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

  const closeModal = () => {
    setModalState({ isOpen: false, mode: null, nodeData: null, parentId: null });
  };

  const handleAddRootNode = () => {
    setModalState({
      isOpen: true,
      mode: 'addRoot',
      nodeData: null,
      parentId: null
    });
  };

  const handleModalSubmit = async (formData) => {
    if (modalState.mode === 'add') {
      const newNodeData = { 
        id: Date.now(), 
        label: formData.label, 
        url: formData.url, 
        note: formData.note, 
        is_parent: formData.isParent, 
        is_collapsed: false,
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
        
        allNodesRef.current.set(savedNode.id, {
          ...savedNode,
          value: savedNode.value || DEFAULT_NODE_VALUE,
          title: generateNodeTitle(savedNode)
        });
        
        const savedEdge = await addEdgeToSupabase(modalState.parentId, savedNode.id);
        if (savedEdge) {
          edges.current.add({ id: savedEdge.id, from: savedEdge.from, to: savedEdge.to });
        }
        
        enablePhysicsTemporarily();
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
        is_collapsed: false,
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
        
        allNodesRef.current.set(savedNode.id, {
          ...savedNode,
          value: savedNode.value || 25,
          title: generateNodeTitle(savedNode)
        });
        
        enablePhysicsTemporarily();
        autoSave();
      }
    } else if (modalState.mode === 'edit' || modalState.mode === 'note') {
      const updatedNode = { ...modalState.nodeData, ...formData };
      if (updatedNode.value === null || updatedNode.value === undefined) {
        updatedNode.value = DEFAULT_NODE_VALUE;
      }
      await updateNodeInSupabase(updatedNode);
      
      const fullUpdatedNode = {
        ...updatedNode,
        title: generateNodeTitle(updatedNode)
      };
      nodes.current.update(fullUpdatedNode);
      
      allNodesRef.current.set(updatedNode.id, fullUpdatedNode);
      
      autoSave();
    }
    closeModal();
  };

  const handleAddNode = () => openModal('add', selectedNodeId);

  const handleEditNode = () => openModal('edit', selectedNodeId);

  const handleAddEditNote = () => openModal('note', selectedNodeId);

  const getAllDescendants = useCallback((nodeId) => {
    const descendants = [];
    const visited = new Set();

    const collectDescendants = (currentNodeId) => {
      if (visited.has(currentNodeId)) return;
      visited.add(currentNodeId);

      const children = getDirectChildren(currentNodeId);
      children.forEach(childId => {
        descendants.push(childId);
        collectDescendants(childId);
      });
    };

    collectDescendants(nodeId);
    return descendants;
  }, [getDirectChildren]);

  const handleDeleteNode = async () => {
    if (!selectedNodeId) return;

    const selectedNode = nodes.current.get(selectedNodeId);
    const descendants = getAllDescendants(selectedNodeId);
    const totalNodesToDelete = descendants.length + 1;
    const isRootNode = selectedNode?.is_root === true;

    let confirmMessage;
    if (isRootNode && descendants.length > 0) {
      confirmMessage = `Are you sure you want to delete the root node "${selectedNode.label}" and all its ${descendants.length} descendant node(s)? This will delete ${totalNodesToDelete} nodes total and cannot be undone. You can create a new root node later if needed.`;
    } else if (isRootNode) {
      confirmMessage = `Are you sure you want to delete the root node "${selectedNode.label}"? This cannot be undone. You can create a new root node later if needed.`;
    } else if (descendants.length > 0) {
      confirmMessage = `Are you sure you want to delete "${selectedNode.label}" and all its ${descendants.length} descendant node(s)? This will delete ${totalNodesToDelete} nodes total and cannot be undone.`;
    } else {
      confirmMessage = `Are you sure you want to delete "${selectedNode.label}"? This cannot be undone.`;
    }
    
    if (window.confirm(confirmMessage)) {
      try {
        for (const descendantId of descendants.reverse()) {
          await deleteNodeFromSupabase(descendantId);
          nodes.current.remove(descendantId);
          allNodesRef.current.delete(descendantId);
        }
        
        await deleteNodeFromSupabase(selectedNodeId);
        nodes.current.remove(selectedNodeId);
        allNodesRef.current.delete(selectedNodeId);
        
        setSelectedNodeId(null);
        autoSave();

        showKeyboardFeedback(`Deleted ${totalNodesToDelete} node(s)`, false);
      } catch (error) {
        console.error("Error deleting nodes:", error);
        showKeyboardFeedback("Error deleting nodes", true);
      }
    }
  };

  const showKeyboardFeedback = useCallback((message, isError = false) => {
    setKeyboardFeedback({ message, isError });
    setTimeout(() => setKeyboardFeedback(null), 2000);
  }, []);

  const handleSmartSearch = useCallback(async (nodeId) => {
    const targetNode = allNodesRef.current.get(nodeId);
    if (!targetNode) {
      showKeyboardFeedback("Node not found", true);
      return;
    }

    if (targetNode.url && targetNode.url.trim() !== '') {
      window.open(targetNode.url, '_blank');
      showKeyboardFeedback(`Opened ${targetNode.url}`, false);
      return;
    }

    const currentNodes = nodes.current.getIds();
    if (currentNodes.includes(nodeId)) {
      if (networkRef.current) {
        networkRef.current.focus(nodeId, { scale: 1.2, animation: true });
        networkRef.current.selectNodes([nodeId]);
        setSelectedNodeId(nodeId);
        showKeyboardFeedback(`Found: ${targetNode.label}`, false);
      }
      return;
    }

    const findPathToNode = (targetNodeId) => {
      const path = [];
      const allEdges = edges.current.get();
      
      const findParent = (nodeId) => {
        const parentEdge = allEdges.find(edge => edge.to === nodeId);
        return parentEdge ? parentEdge.from : null;
      };

      let currentId = targetNodeId;
      while (currentId) {
        const parentId = findParent(currentId);
        if (parentId) {
          path.unshift(parentId);
        }
        currentId = parentId;
      }
      
      return path;
    };

    const pathToNode = findPathToNode(nodeId);
    const collapsedAncestors = [];

    for (const ancestorId of pathToNode) {
      const ancestorNode = allNodesRef.current.get(ancestorId);
      if (ancestorNode && ancestorNode.is_collapsed) {
        collapsedAncestors.push(ancestorNode);
      }
    }

    if (collapsedAncestors.length > 0) {
      const clusterNames = collapsedAncestors.map(n => `"${n.label}"`).join(', ');
      const confirmMessage = `"${targetNode.label}" is hidden inside collapsed cluster(s): ${clusterNames}. 

Would you like to expand these clusters to reveal the node?`;

      if (window.confirm(confirmMessage)) {
        try {
          for (const ancestorNode of collapsedAncestors) {
            if (ancestorNode.is_collapsed) {
              await expandNode(ancestorNode.id);
              showKeyboardFeedback(`Expanded: ${ancestorNode.label}`, false);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          setTimeout(() => {
            if (networkRef.current) {
              networkRef.current.focus(nodeId, { scale: 1.2, animation: true });
              networkRef.current.selectNodes([nodeId]);
              setSelectedNodeId(nodeId);
              showKeyboardFeedback(`Revealed: ${targetNode.label}`, false);
            }
          }, 1000);

        } catch (error) {
          console.error('Error expanding clusters:', error);
          showKeyboardFeedback("Error expanding clusters", true);
        }
      } else {
        showKeyboardFeedback("Search cancelled", false);
      }
    } else {
      showKeyboardFeedback(`Node "${targetNode.label}" is hidden but no collapsed ancestors found`, true);
    }
  }, [expandNode, showKeyboardFeedback]);

  const handleKeyDown = useCallback(async (event) => {
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.contentEditable === 'true' ||
        modalState.isOpen) {
      return;
    }

    const { key, ctrlKey } = event;
    const selectedNode = selectedNodeId ? nodes.current.get(selectedNodeId) : null;

    const preventDefault = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    if (ctrlKey && key === 'q') {
      preventDefault();
      handleAddRootNode();
      showKeyboardFeedback("Adding new root node", false);
      return;
    }

    if (ctrlKey && key === 'a') {
      preventDefault();
      if (!selectedNodeId) {
        showKeyboardFeedback("Select a node first", true);
        return;
      }
      if (!selectedNode?.is_parent) {
        showKeyboardFeedback("Selected node cannot have children", true);
        return;
      }
      handleAddNode();
      showKeyboardFeedback(`Adding child to ${selectedNode.label}`, false);
      return;
    }

    if (key === 'Insert') {
      preventDefault();
      if (!selectedNodeId) {
        showKeyboardFeedback("Select a node first", true);
        return;
      }
      if (!selectedNode?.is_parent) {
        showKeyboardFeedback("Selected node cannot have children", true);
        return;
      }
      handleAddNode();
      showKeyboardFeedback(`Adding child to ${selectedNode.label}`, false);
      return;
    }

    if (key === 'Delete' || key === 'Backspace') {
      preventDefault();
      if (!selectedNodeId) {
        showKeyboardFeedback("No node selected", true);
        return;
      }
      handleDeleteNode();
      return;
    }

    if (key === 'Enter' || key === 'F2') {
      preventDefault();
      if (!selectedNodeId) {
        showKeyboardFeedback("Select a node to edit", true);
        return;
      }
      handleEditNode();
      showKeyboardFeedback(`Editing ${selectedNode.label}`, false);
      return;
    }

    if (ctrlKey && key === 'e') {
      preventDefault();
      if (!selectedNodeId) {
        showKeyboardFeedback("Select a node to edit note", true);
        return;
      }
      handleAddEditNote();
      showKeyboardFeedback(`Editing note for ${selectedNode.label}`, false);
      return;
    }

    if (ctrlKey && key === 'o') {
      preventDefault();
      if (!selectedNodeId) {
        showKeyboardFeedback("Select a node to open URL", true);
        return;
      }
      if (!selectedNode?.url || selectedNode.url.trim() === '') {
        showKeyboardFeedback("Selected node has no URL", true);
        return;
      }
      window.open(selectedNode.url, "_blank");
      showKeyboardFeedback(`Opened ${selectedNode.url}`, false);
      return;
    }

    if (key === 'Escape') {
      preventDefault();
      if (selectedNodeId) {
        setSelectedNodeId(null);
        networkRef.current?.unselectAll();
        showKeyboardFeedback("Selection cleared", false);
      }
      return;
    }

    if (key === ' ') {
      preventDefault();
      if (!selectedNodeId) {
        showKeyboardFeedback("Select a parent node to toggle", true);
        return;
      }
      if (!selectedNode?.is_parent) {
        showKeyboardFeedback("Selected node is not a parent", true);
        return;
      }
      
      const network = networkRef.current;
      if (!network) return;

      if (selectedNode.is_collapsed) {
        await expandNode(selectedNodeId);
        showKeyboardFeedback(`Expanded ${selectedNode.label}`, false);
      } else {
        await collapseNode(selectedNodeId);
        showKeyboardFeedback(`Collapsed ${selectedNode.label}`, false);
      }
      autoSave();
      return;
    }

  }, [selectedNodeId, modalState.isOpen, handleAddRootNode, handleAddNode, handleDeleteNode, 
      handleEditNode, handleAddEditNote, getAllDescendants, networkRef, expandNode, 
      collapseNode, autoSave, showKeyboardFeedback]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const setupUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    setupUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      if (session?.user?.email) {
        setShowCaptcha(false);
        setCaptchaToken(null);
        if (captcha.current) {
          captcha.current.resetCaptcha();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const options = getNetworkOptions(isDark);
    const network = new Network(
      containerRef.current,
      { nodes: nodes.current, edges: edges.current },
      options
    );
    networkRef.current = network;

    network.on("stabilizationIterationsDone", function () {
      network.setOptions({ physics: false });
    });

    network.on("dragStart", function () {
      network.setOptions({ physics: { enabled: true } });
    });

    network.on("dragEnd", function () {
      setTimeout(() => {
        network.setOptions({ physics: false });
      }, 2000);
    });

    nodes.current.on('*', autoSave);
    edges.current.on('*', autoSave);

    network.on("selectNode", (params) => setSelectedNodeId(params.nodes[0]));
    network.on("deselectNode", () => setSelectedNodeId(null));

    network.on("doubleClick", async (params) => {
      const nodeId = params.nodes[0];
      if (!nodeId) return;

      const node = nodes.current.get(nodeId);
      if (!node) return;

      if (node.url && node.url.trim() !== '') {
        window.open(node.url, "_blank");
        return;
      }

      if (node.is_parent) {
        if (node.is_collapsed) {
          await expandNode(nodeId);
        } else {
          await collapseNode(nodeId);
        }
        autoSave();
      }
    });

    return () => {
      nodes.current.off('*', autoSave);
      edges.current.off('*', autoSave);
      network.destroy();
    };
  }, [isDark, autoSave, collapseNode, expandNode]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await reapplyCollapsedStateRef.current();
        syncCollapsedStateFromDatabaseRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
            is_collapsed: false,
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
              
              allNodesRef.current.clear();
              allNodesRef.current.set(savedRoot.id, savedRoot);
          }
        } else {
          const displayNodes = fetchedNodes.map(n => ({ 
            id: n.id, 
            label: n.label, 
            shape: n.shape, 
            value: n.value || DEFAULT_NODE_VALUE,
            is_parent: n.is_parent,
            is_collapsed: n.is_collapsed,
            url: n.url,
            note: n.note,
            title: generateNodeTitle(n) 
          }));
          nodes.current.clear();
          edges.current.clear();
          nodes.current.add(displayNodes);
          edges.current.add(fetchedEdges);
          
          allNodesRef.current.clear();
          fetchedNodes.forEach(node => {
            allNodesRef.current.set(node.id, {
              ...node,
              value: node.value || DEFAULT_NODE_VALUE,
              title: generateNodeTitle(node)
            });
          });

          const collapsedParents = new Set(
            fetchedNodes
              .filter(n => n.is_parent && n.is_collapsed)
              .map(n => n.id)
          );
          
          if (collapsedParents.size > 0) {
            const order = getBottomUpCollapsedOrder(collapsedParents, fetchedEdges);
            for (const parentId of order) {
              await collapseNode(parentId);
            }
          }
        }
        
        autoSave();
      };
      loadAndInitializeGraph();
    }
  }, [session, autoSave]);

  useEffect(() => {
    if (networkRef.current) { 
      const options = getNetworkOptions(isDark); 
      networkRef.current.setOptions(options); 
    }
  }, [isDark]);

  const selectedNode = selectedNodeId ? nodes.current.get(selectedNodeId) : null;

  return (
    <GridBg isDark={isDark}>
      <ProjectHeader isDark={isDark} />
      <div style={{ 
        position: 'fixed', 
        top: '110px', 
        left: '20px', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '10px', 
        zIndex: 1001 
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <LoginButton isDark={isDark} session={session} onAuthClick={handleLoginClick} />
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
        </div>
        
        {showCaptcha && (!session || !session.user?.email) && (
          <div style={{
            backgroundColor: isDark ? 'rgba(45, 55, 72, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            padding: '12px',
            borderRadius: '8px',
            border: isDark ? '1px solid #4a5568' : '1px solid #e2e8f0',
            boxShadow: isDark 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}>
            <p style={{ 
              margin: '0 0 8px 0', 
              fontSize: '12px', 
              color: isDark ? '#a0aec0' : '#718096',
              textAlign: 'center'
            }}>
              Complete CAPTCHA to protect against abuse
            </p>
            <HCaptcha  
              ref={captcha}
              sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001"}
              onVerify={(token) => {    
                setCaptchaToken(token);
                setShowCaptcha(false);
                showKeyboardFeedback("CAPTCHA verified! Click login again to continue.", false);
              }}
              onExpire={() => {
                setCaptchaToken(null);
                showKeyboardFeedback("CAPTCHA expired. Please verify again.", true);
              }}
              onError={(err) => {
                console.error("CAPTCHA error:", err);
                setCaptchaToken(null);
                showKeyboardFeedback("CAPTCHA error. Please try again.", true);
              }}
              theme={isDark ? "dark" : "light"}
            />
          </div>
        )}
      </div>
      <FixedToolbar
        onAddRoot={handleAddRootNode} 
        onAdd={handleAddNode}
        onDelete={handleDeleteNode}
        onEdit={handleEditNode}
        onNote={handleAddEditNote}
        onShowShortcuts={() => setShowKeyboardShortcuts(true)}
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

      <KeyboardShortcutsModal 
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        isDark={isDark}
      />

      <KeyboardFeedback feedback={keyboardFeedback} isDark={isDark} />

      <FuzzySearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        nodes={Array.from(allNodesRef.current.values())}
        isDark={isDark}
        onSelectNode={handleSmartSearch}
        onEditNode={(nodeId) => {
          openModal('edit', nodeId);
        }}
        onOpenUrl={(url) => {
          window.open(url, '_blank');
        }}
      />

      <div
        ref={containerRef}
        className="graph-container"
        style={{ width: '100%', height: '100%' }}
      />
    </GridBg>
  );
}