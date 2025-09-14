import { useRef, useEffect, useState, useCallback } from "react";
import { DataSet, Network } from "vis-network/standalone";
import { getNetworkOptions, getProjectHeaderStyle, getThemeToggleStyle, getFixedToolbarStyle } from './styles';
import { GridBg } from './ui/GridBg';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import FuzzySearch from "./FuzzySearch";
import {supabase} from './supabaseClient';
import { fetchGraphData, addNodeToSupabase, addEdgeToSupabase, updateNodeInSupabase, deleteNodeFromSupabase, saveCollapsedStateToSupabase, loadCollapsedStateFromSupabase } from './api'; 

import { NodeModal } from "./NodeModal";
import sunIcon from '../assets/sun.png';
import moonIcon from '../assets/moon.png';

// --- Constants ---
const LOCAL_STORAGE_KEY = 'orbit-graph-data-v1';
const DEFAULT_NODE_VALUE = 20; // New: Default value for node sizing to ensure visibility.

// --- Utility Functions ---
// Saves graph data (nodes, edges) to local storage for persistence.
const saveDataToLocalStorage = (nodes, edges) => {
  try {
    const plainNodes = nodes.get({ returnType: 'Array' });
    const plainEdges = edges.get({ returnType: 'Array' });
    const dataToStore = JSON.stringify({ nodes: plainNodes, edges: plainEdges });
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
      {isLoggedIn && session.user.email ? `✓ Synced as ${userEmail}` : '🔄 Sign in to Sync'}
    </button>
  );
};

// Displays keyboard shortcut feedback messages.
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

// Displays keyboard shortcuts reference modal.
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

// --- Main Graph Component ---
export default function Graph() {
  // Refs for graph data and network instance.
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const captcha = useRef(null);
  const nodes = useRef(new DataSet([]));
  const edges = useRef(new DataSet([]));
  const allNodesRef = useRef(new Map()); // NEW: Reference table for all nodes including hidden ones
  
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
  const [captchaToken, setCaptchaToken] = useState(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [keyboardFeedback, setKeyboardFeedback] = useState(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // overriding browser keyboard shortcuts
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const loaded = loadDataFromLocalStorage();
    if (loaded) {
      nodes.current.clear();
      edges.current.clear();
      
      // If we have collapsed data, we need to reconstruct the graph properly
      // Load all nodes and edges normally - collapsed state is now in database
      nodes.current.add(loaded.nodes);
      edges.current.add(loaded.edges);
    }
  }, []);

  // --- Handler Functions ---
  // Auto-saves graph data to local storage (collapsed state now in database).
  const autoSave = useCallback(() => {
    // Save to localStorage for immediate backup
    saveDataToLocalStorage(nodes.current, edges.current);
    // Note: collapsed state is now stored in database automatically via updateNodeInSupabase
  }, []);

  // Helper function to temporarily enable physics for layout adjustments
  const enablePhysicsTemporarily = useCallback(() => {
    if (networkRef.current) {
      networkRef.current.setOptions({ physics: { enabled: true } });
      setTimeout(() => {
        if (networkRef.current) {
          networkRef.current.setOptions({ physics: false });
        }
      }, 3000); // Allow 3 seconds for physics to settle
    }
  }, []);

  useEffect(() => {
  const handleKeyDown = (event) => {
    // Check for Cmd+K on Mac or Ctrl+K on Windows/Linux
    if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault(); 
      
      // Toggle the search modal's visibility
      setIsSearchOpen(prev => !prev); 
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  // Cleanup the listener when the component unmounts to prevent memory leaks
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // The empty array ensures this effect runs only once

  // Initiates Google OAuth login via Supabase with CAPTCHA protection.
  const handleLoginClick = async () => {
    try {
      // Show CAPTCHA if not verified yet
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
      
      // Reset CAPTCHA after login attempt
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

  // Gets direct children of a parent node.
  const getDirectChildren = useCallback((parentId) => {
    return edges.current.get({ filter: edge => edge.from === parentId }).map(edge => edge.to);
  }, []);

  // 🔄 RECURSIVE COLLAPSE: Collapses a node and all its descendant parent nodes
  const collapseNode = useCallback(async (parentId) => {
    const parentNode = nodes.current.get(parentId);
    if (!parentNode || !parentNode.is_parent || parentNode.is_collapsed) return;
    
    const directChildren = getDirectChildren(parentId);
    if (directChildren.length === 0) return;

    console.log(`🔄 Recursively collapsing node: ${parentNode.label}`);

    // Get ALL descendants (children, grandchildren, etc.)
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
    
    // 🔄 STEP 1: Recursively collapse all descendant parent nodes first
    for (const descendantId of allDescendants) {
      const descendantNode = nodes.current.get(descendantId);
      if (descendantNode?.is_parent && !descendantNode?.is_collapsed) {
        await collapseNode(descendantId); // Recursive call
      }
    }

    // 🔄 STEP 2: Hide all descendants visually
    try {
      console.log(`🔄 Removing ${allDescendants.length} descendants:`, allDescendants);
      nodes.current.remove(allDescendants);
      const descendantEdges = edges.current.get().filter(edge => 
        allDescendants.includes(edge.from) || allDescendants.includes(edge.to) || edge.from === parentId
      );
      console.log(`🔄 Removing ${descendantEdges.length} edges`);
      edges.current.remove(descendantEdges.map(e => e.id));

      // 🔄 STEP 3: Update parent to collapsed cluster appearance
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
        is_collapsed: true // Mark as collapsed
      };
      
      clusteredParent.title = generateNodeTitle(clusteredParent);
      nodes.current.update(clusteredParent);

      // 🔄 STEP 4: Update database to mark as collapsed
      if (session) {
        await updateNodeInSupabase({ 
          id: parentNode.id,
          label: parentNode.label,
          url: parentNode.url,
          note: parentNode.note,
          is_collapsed: true 
        });
      }
      
    } catch (error) {
      console.error('Error collapsing node:', error);
    }
  }, [getDirectChildren, generateNodeTitle, session]);

  // 📖 SHALLOW EXPAND: Expands a node to show direct children in their last known state
  const expandNode = useCallback(async (parentId) => {
    const parentNode = nodes.current.get(parentId);
    if (!parentNode || !parentNode.is_collapsed) {
      console.log(`📖 Expand rejected: parentNode exists: ${!!parentNode}, is_collapsed: ${parentNode?.is_collapsed}`);
      return;
    }

    console.log(`📖 Shallow expanding node: ${parentNode.label}`);

    try {
      // 📖 STEP 1: Get direct children from database (they might not be in current view)
      const { nodes: allNodes, edges: allEdges } = await fetchGraphData();
      console.log(`📖 Fetched ${allNodes.length} nodes and ${allEdges.length} edges from database`);
      
      const directChildren = allEdges
        .filter(edge => edge.from === parentId)
        .map(edge => allNodes.find(node => node.id === edge.to))
        .filter(Boolean);
        
      console.log(`📖 Found direct children edges:`, allEdges.filter(edge => edge.from === parentId));
      console.log(`📖 Direct children nodes:`, directChildren);

      // 📖 STEP 2: Restore original parent appearance  
      const restoredParent = {
        ...parentNode,
        label: parentNode.label.replace(/ \(\+\d+\)$/, ''), // Remove cluster count
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

      // 📖 STEP 3: Add children back to view (in their database state)
      if (directChildren.length > 0) {
        console.log(`📖 Found ${directChildren.length} direct children to expand:`, directChildren.map(c => c.label));
        
        const displayChildren = directChildren.map(child => ({
          id: child.id,
          label: child.label,
          shape: child.shape,
          value: child.value || DEFAULT_NODE_VALUE,
          is_parent: child.is_parent,
          is_collapsed: child.is_collapsed, // Preserve their collapsed state
          url: child.url,
          note: child.note,
          title: generateNodeTitle(child)
        }));

        console.log(`📖 Adding display children:`, displayChildren.map(c => ({ id: c.id, label: c.label })));
        
        // Check if these nodes already exist in the current graph
        const existingNodeIds = nodes.current.getIds();
        const newChildren = displayChildren.filter(child => !existingNodeIds.includes(child.id));
        const existingChildren = displayChildren.filter(child => existingNodeIds.includes(child.id));
        
        console.log(`📖 New children to add:`, newChildren.map(c => c.label));
        console.log(`📖 Existing children to update:`, existingChildren.map(c => c.label));
        
        if (newChildren.length > 0) {
          nodes.current.add(newChildren);
        }
        if (existingChildren.length > 0) {
          nodes.current.update(existingChildren);
        }
        
        // Add edges back
        const childEdgeIds = directChildren.map(child => child.id);
        const childEdges = allEdges
          .filter(edge => edge.from === parentId && childEdgeIds.includes(edge.to))
          .map(edge => ({ id: edge.id, from: edge.from, to: edge.to }));
          
        console.log(`📖 Adding ${childEdges.length} edges back`);
        
        // Check if edges already exist
        const existingEdgeIds = edges.current.getIds();
        const newEdges = childEdges.filter(edge => !existingEdgeIds.includes(edge.id));
        const existingEdges = childEdges.filter(edge => existingEdgeIds.includes(edge.id));
        
        if (newEdges.length > 0) {
          edges.current.add(newEdges);
        }
        if (existingEdges.length > 0) {
          edges.current.update(existingEdges);
        }
      } else {
        console.log(`📖 No direct children found for node ${parentId}`);
      }

      // 📖 STEP 4: Update database to mark as expanded
      if (session) {
        await updateNodeInSupabase({ 
          id: parentNode.id,
          label: parentNode.label.replace(/ \(\+\d+\)$/, ''), // Remove cluster count
          url: parentNode.url,
          note: parentNode.note,
          is_collapsed: false 
        });
      }

      // Enable physics temporarily for layout
      enablePhysicsTemporarily();

    } catch (error) {
      console.error('Error expanding node:', error);
    }
  }, [generateNodeTitle, enablePhysicsTemporarily, session, fetchGraphData]);

  // Helper function to get all descendants from database data
  const getDescendantsFromData = useCallback((parentId, allNodes, allEdges) => {
    const descendants = new Set();
    const queue = [parentId];
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      const childEdges = allEdges.filter(edge => edge.from === currentId);
      
      childEdges.forEach(edge => {
        const childId = edge.to;
        if (!descendants.has(childId)) {
          descendants.add(childId);
          queue.push(childId);
        }
      });
    }
    
    return Array.from(descendants);
  }, []);

  // 🔄 SYNC COLLAPSED STATE: Syncs current graph state with database state
  const syncCollapsedStateFromDatabase = useCallback(async () => {
    if (!session) return;

    try {
      console.log('🔄 Syncing collapsed state from database...');
      const { nodes: dbNodes } = await fetchGraphData();
      
      // Create a map of database collapsed states
      const dbCollapsedState = new Map();
      dbNodes.forEach(node => {
        if (node.is_parent) {
          dbCollapsedState.set(node.id, node.is_collapsed);
        }
      });

      // Compare current visual state with database state and sync
      const currentNodes = nodes.current.get();
      const nodesToCollapse = [];
      const nodesToExpand = [];

      currentNodes.forEach(node => {
        if (node.is_parent && dbCollapsedState.has(node.id)) {
          const dbIsCollapsed = dbCollapsedState.get(node.id);
          const currentIsCollapsed = node.is_collapsed;

          if (dbIsCollapsed && !currentIsCollapsed) {
            // Database says collapsed, but visually expanded - collapse it
            nodesToCollapse.push(node.id);
          } else if (!dbIsCollapsed && currentIsCollapsed) {
            // Database says expanded, but visually collapsed - expand it
            nodesToExpand.push(node.id);
          }
        }
      });

      // Apply the sync operations
      for (const nodeId of nodesToCollapse) {
        console.log(`🔄 Syncing: Collapsing node ${nodeId} to match database`);
        await collapseNode(nodeId);
      }
      
      for (const nodeId of nodesToExpand) {
        console.log(`🔄 Syncing: Expanding node ${nodeId} to match database`);
        await expandNode(nodeId);
      }

      if (nodesToCollapse.length > 0 || nodesToExpand.length > 0) {
        console.log(`🔄 Sync complete: ${nodesToCollapse.length} collapsed, ${nodesToExpand.length} expanded`);
      }

    } catch (error) {
      console.error('Error syncing collapsed state:', error);
    }
  }, [session, fetchGraphData, collapseNode, expandNode]);

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
        
        // NEW: Update reference table
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
        
        // NEW: Update reference table
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
      
      // NEW: Update reference table
      allNodesRef.current.set(updatedNode.id, fullUpdatedNode);
      
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

  // Recursively gets all descendant nodes of a parent node.
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

  // Deletes a node after confirmation, preventing root deletion.
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
        // Delete all descendants first (bottom-up)
        for (const descendantId of descendants.reverse()) {
          await deleteNodeFromSupabase(descendantId);
          nodes.current.remove(descendantId);
          
          // NEW: Remove from reference table
          allNodesRef.current.delete(descendantId);
        }
        
        // Finally delete the selected node
        await deleteNodeFromSupabase(selectedNodeId);
        nodes.current.remove(selectedNodeId);
        
        // NEW: Remove from reference table
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

  // Shows brief feedback message for keyboard actions.
  const showKeyboardFeedback = useCallback((message, isError = false) => {
    setKeyboardFeedback({ message, isError });
    setTimeout(() => setKeyboardFeedback(null), 2000);
  }, []);

  // Smart search handler that can reveal hidden nodes by expanding clusters
  const handleSmartSearch = useCallback(async (nodeId) => {
    const targetNode = allNodesRef.current.get(nodeId);
    if (!targetNode) {
      showKeyboardFeedback("Node not found", true);
      return;
    }

    // Check if node has URL - if so, open it directly
    if (targetNode.url && targetNode.url.trim() !== '') {
      window.open(targetNode.url, '_blank');
      showKeyboardFeedback(`Opened ${targetNode.url}`, false);
      return;
    }

    // Check if node is currently visible in the graph
    const currentNodes = nodes.current.getIds();
    if (currentNodes.includes(nodeId)) {
      // Node is visible, just focus on it
      if (networkRef.current) {
        networkRef.current.focus(nodeId, { scale: 1.2, animation: true });
        networkRef.current.selectNodes([nodeId]);
        setSelectedNodeId(nodeId);
        showKeyboardFeedback(`Found: ${targetNode.label}`, false);
      }
      return;
    }

    // Node is hidden in a cluster - need to find and expand ancestor clusters
    const findPathToNode = (targetNodeId) => {
      const path = [];
      const allEdges = edges.current.get();
      
      // Find parent of target node
      const findParent = (nodeId) => {
        const parentEdge = allEdges.find(edge => edge.to === nodeId);
        return parentEdge ? parentEdge.from : null;
      };

      // Build path from target to root
      let currentId = targetNodeId;
      while (currentId) {
        const parentId = findParent(currentId);
        if (parentId) {
          path.unshift(parentId); // Add parent to beginning of path
        }
        currentId = parentId;
      }
      
      return path;
    };

    const pathToNode = findPathToNode(nodeId);
    const collapsedAncestors = [];

    // Find which ancestors are collapsed
    for (const ancestorId of pathToNode) {
      const ancestorNode = allNodesRef.current.get(ancestorId);
      if (ancestorNode && ancestorNode.is_collapsed) {
        collapsedAncestors.push(ancestorNode);
      }
    }

    if (collapsedAncestors.length > 0) {
      // Ask user if they want to expand clusters to reveal the node
      const clusterNames = collapsedAncestors.map(n => `"${n.label}"`).join(', ');
      const confirmMessage = `"${targetNode.label}" is hidden inside collapsed cluster(s): ${clusterNames}. 

Would you like to expand these clusters to reveal the node?`;

      if (window.confirm(confirmMessage)) {
        try {
          // Expand all collapsed ancestors in order (top-down)
          for (const ancestorNode of collapsedAncestors) {
            if (ancestorNode.is_collapsed) {
              await expandNode(ancestorNode.id);
              showKeyboardFeedback(`Expanded: ${ancestorNode.label}`, false);
              // Small delay to allow graph to update between expansions
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          // After expanding, focus on the target node
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
      // Node should be visible but isn't - this shouldn't happen
      showKeyboardFeedback(`Node "${targetNode.label}" is hidden but no collapsed ancestors found`, true);
    }
  }, [allNodesRef, nodes, edges, networkRef, expandNode, showKeyboardFeedback]);

  // Handles keyboard shortcuts.
  const handleKeyDown = useCallback(async (event) => {
    // Don't handle shortcuts when typing in input fields or modals are open
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.contentEditable === 'true' ||
        modalState.isOpen) {
      return;
    }

    const { key, ctrlKey, shiftKey, altKey, metaKey } = event;
    const selectedNode = selectedNodeId ? nodes.current.get(selectedNodeId) : null;
    const isRootNode = selectedNode?.is_root === true;

    // Prevent default for our custom shortcuts
    const preventDefault = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    // Ctrl+Q: Add root node
    if (ctrlKey && key === 'q') {
      preventDefault();
      handleAddRootNode();
      showKeyboardFeedback("Adding new root node", false);
      return;
    }

    // Ctrl+A: Add child node (when node is selected)
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

    // Insert: Add child node (alternative)
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

    // Delete or Backspace: Delete selected node
    if (key === 'Delete' || key === 'Backspace') {
      preventDefault();
      if (!selectedNodeId) {
        showKeyboardFeedback("No node selected", true);
        return;
      }
      handleDeleteNode();
      return;
    }

    // Enter or F2: Edit selected node
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

    // Ctrl+E: Edit note
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

    // Ctrl+O: Open URL in new tab
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

    // Escape: Clear selection
    if (key === 'Escape') {
      preventDefault();
      if (selectedNodeId) {
        setSelectedNodeId(null);
        networkRef.current?.unselectAll();
        showKeyboardFeedback("Selection cleared", false);
      }
      return;
    }

    // Space: Toggle collapse/expand for parent nodes
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

      // Check if node is currently collapsed
      if (selectedNode.is_collapsed) {
        // Expand the node using our new approach (shallow expand)
        await expandNode(selectedNodeId);
        showKeyboardFeedback(`Expanded ${selectedNode.label}`, false);
      } else {
        // Collapse the node (recursive collapse)
        await collapseNode(selectedNodeId);
        showKeyboardFeedback(`Collapsed ${selectedNode.label}`, false);
      }
      autoSave();
      return;
    }

  }, [selectedNodeId, modalState.isOpen, nodes, handleAddRootNode, handleAddNode, handleDeleteNode, 
      handleEditNode, handleAddEditNote, getAllDescendants, networkRef,
      collapseNode, autoSave, showKeyboardFeedback, getDirectChildren]);

  // --- UseEffect Hooks ---
  // Sets up keyboard event listeners.
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Sets up user session with Supabase - skip anonymous sign-in to avoid CAPTCHA issues
  useEffect(() => {
    const setupUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // If no session, that's fine - we'll work with local storage only for anonymous users
      // No need to force anonymous sign-in since it requires CAPTCHA
      setSession(session);
    };

    setupUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      console.log("Supabase auth state changed:", session);
      
      // Reset CAPTCHA state when user successfully logs in
      if (session?.user?.email) {
        setShowCaptcha(false);
        setCaptchaToken(null);
        if (captcha.current) {
          captcha.current.resetCaptcha();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []); // No dependencies needed - only check initial session

  // Initializes the vis-network graph and handles events like selection and double-click.
  useEffect(() => {
    const options = getNetworkOptions(isDark);
    const network = new Network(
      containerRef.current,
      { nodes: nodes.current, edges: edges.current },
      options
    );
    networkRef.current = network;

    // Add stabilization event handlers to reduce jitter
    network.on("stabilizationProgress", function (params) {
      // Optionally show loading indicator during stabilization
    });

    network.on("stabilizationIterationsDone", function () {
      // Network has stabilized, physics can be turned off to prevent jitter
      network.setOptions({ physics: false });
    });

    // Re-enable physics when nodes are added/moved
    network.on("dragStart", function () {
      network.setOptions({ physics: { enabled: true } });
    });

    network.on("dragEnd", function () {
      // Allow physics to settle then disable again
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
      console.log(`🔄 Double-click detected on node: ${nodeId}`);
      if (!nodeId) return;

      const node = nodes.current.get(nodeId);
      if (!node) {
        console.log(`🔄 Node not found: ${nodeId}`);
        return;
      }

      console.log(`🔄 Node details:`, { 
        id: node.id, 
        label: node.label, 
        is_parent: node.is_parent, 
        is_collapsed: node.is_collapsed,
        url: node.url 
      });

      // Check if it's a URL node first
      if (node.url && node.url.trim() !== '') {
        console.log(`🔄 Opening URL: ${node.url}`);
        window.open(node.url, "_blank");
        return;
      }

      // Check if it's a parent node that can be collapsed/expanded
      if (node.is_parent) {
        if (node.is_collapsed) {
          console.log(`🔄 Expanding collapsed node: ${node.label}`);
          // It's collapsed, so expand it (shallow)
          await expandNode(nodeId);
        } else {
          console.log(`🔄 Collapsing expanded node: ${node.label}`);
          // It's not collapsed, so collapse it (recursive)
          await collapseNode(nodeId);
        }
        autoSave();
      } else {
        console.log(`🔄 Node is not a parent, no action taken`);
      }
    });

    // Add visibility change handler to maintain cluster state
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - disable physics
        network.setOptions({ physics: false });
      } else {
        // Tab is visible again - sync state and briefly re-enable physics
        setTimeout(async () => {
          // Sync collapsed state from database in case another browser changed it
          await syncCollapsedStateFromDatabase();
          
          network.setOptions({ physics: true });
          // Disable physics again after stabilization
          setTimeout(() => {
            network.setOptions({ physics: false });
          }, 2000);
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also handle window focus events for additional safety
    const handleWindowFocus = () => {
      // When window regains focus, sync state and enable physics briefly
      setTimeout(async () => {
        await syncCollapsedStateFromDatabase();
        
        network.setOptions({ physics: true });
        setTimeout(() => {
          network.setOptions({ physics: false });
        }, 2000);
      }, 100);
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      nodes.current.off('*', autoSave);
      edges.current.off('*', autoSave);
      network.destroy();
    };
  }, [isDark, collapseNode, autoSave, syncCollapsedStateFromDatabase]);

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
              
              // NEW: Update reference table
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
            is_collapsed: n.is_collapsed, // Include collapsed state
            url: n.url,
            note: n.note,
            title: generateNodeTitle(n) 
          }));
          nodes.current.clear();
          edges.current.clear();
          nodes.current.add(displayNodes);
          edges.current.add(fetchedEdges);
          
          // NEW: Update reference table with ALL nodes from database
          allNodesRef.current.clear();
          fetchedNodes.forEach(node => {
            allNodesRef.current.set(node.id, {
              ...node,
              value: node.value || DEFAULT_NODE_VALUE,
              title: generateNodeTitle(node)
            });
          });
        }
        
        // Sync collapsed state after loading data
        await syncCollapsedStateFromDatabase();
        
        autoSave(); // Save fetched data to local as backup
      };
      loadAndInitializeGraph();
    }
  }, [session, autoSave, syncCollapsedStateFromDatabase]);

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
        flexDirection: 'column',
        gap: '10px', 
        zIndex: 1001 
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <LoginButton isDark={isDark} session={session} onAuthClick={handleLoginClick} />
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
        </div>
        
        {/* CAPTCHA Component - Show only when login is attempted */}
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
        nodes={Array.from(allNodesRef.current.values())} // NEW: Use reference table instead of visible nodes
        isDark={isDark}
        onSelectNode={handleSmartSearch} // NEW: Use smart search handler
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