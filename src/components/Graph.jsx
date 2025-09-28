// File: src/components/Graph.jsx (Final, Corrected, and Complete)

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Network } from "vis-network/standalone";
import { supabase } from '../supabaseClient';

// UI Components
import { GridBg } from '../ui/GridBg';
import { NodeModal } from "./NodeModal";
import { ProjectHeader } from './ProjectHeader';
import { ThemeToggle } from './ThemeToggle';
import { FixedToolbar } from './FixedToolbar';
import { ShortcutsModal } from './ShortcutsModal';
import FuzzySearch from './FuzzySearch';
import { Notification } from './Notification';
import { WarningBanner } from './WarningBanner';

// Hooks and Utils
import { useGraphData } from '../hooks/useGraphData';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getNetworkOptions } from "../styles";

export default function Graph({ session }) {
  // --- Refs ---
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  
  // --- UI State Management ---
  const [isDark, setIsDark] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, mode: null, nodeData: null, parentId: null });
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });

  // --- Data Logic Management (from our custom hook) ---
  const { 
    loading, nodes, edges, handleAddNode, handleDeleteNode, handleUpdateNode, 
    handleSearchSelect, handleOpenUrl, handleClearSelection, handleToggleCollapse 
  } = useGraphData(session, networkRef);
  
  const selectedNode = selectedNodeId ? nodes.get(selectedNodeId) : null;

  // --- Vis Network Instance Setup ---
  useEffect(() => {
    if (loading || !containerRef.current) return;
    
    const network = new Network(containerRef.current, { nodes, edges }, getNetworkOptions(isDark));
    networkRef.current = network;

    network.on("selectNode", (params) => setSelectedNodeId(params.nodes[0]));
    network.on("deselectNode", () => setSelectedNodeId(null));
    network.on("doubleClick", (params) => {
      if (params.nodes.length > 0) {
        handleToggleCollapse(params.nodes[0]);
      }
    });

    return () => network.destroy();
  }, [loading, nodes, edges, isDark, handleToggleCollapse]);


  // --- UI Handler Functions ---
  const showNotification = (message, type = 'error') => {
    setNotification({ message, type, visible: true });
  };

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, visible: false }));
  }, []);
  
  const handleLogin = () => {
    supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const openModal = (mode, node = null) => {
    setModalState({
      isOpen: true,
      mode: mode,
      nodeData: (mode === 'edit' || mode === 'note') ? node : null,
      parentId: (mode === 'add') ? node?.id : null
    });
  };
  
  const handleModalSubmit = async (formData) => {
    const parentId = modalState.parentId;
    const isParent = modalState.mode === 'addRoot' || formData.isParent;
    const nodeData = { label: formData.label, url: formData.url, note: formData.note, is_parent: isParent };

    if (modalState.mode === 'add' || modalState.mode === 'addRoot') {
      await handleAddNode(nodeData, parentId);
    } else if (modalState.mode === 'edit' || modalState.mode === 'note') {
      await handleUpdateNode({ id: modalState.nodeData.id, ...nodeData });
    }
    setModalState({ isOpen: false, mode: null });
  };

  const handleOpenSearch = () => setIsSearchOpen(false); // Corrected to close, search opens via shortcut
  
  const handleAddChildAction = () => {
    if (!selectedNode) return;
    if (selectedNode.is_parent) {
      openModal('add', selectedNode);
    } else {
      showNotification(`Cannot add a child to a non-parent node (${selectedNode.label})`);
    }
  };

  // --- Keyboard Shortcuts Setup (Now Complete) ---
  const shortcutHandlers = {
    onAddRoot:      { handler: () => openModal('addRoot'), enabled: true },
    onOpenSearch:   { handler: () => setIsSearchOpen(true), enabled: true },
    onClearSelection: { handler: handleClearSelection, enabled: true },
    onAdd:          { handler: handleAddChildAction, enabled: !!selectedNode },
    onDelete:       { handler: () => handleDeleteNode(selectedNodeId), enabled: !!selectedNode && selectedNode.label !== 'Root' },
    onEdit:         { handler: () => openModal('edit', selectedNode), enabled: !!selectedNode },
    onNote:         { handler: () => openModal('note', selectedNode), enabled: !!selectedNode },
    onOpenUrl:      { handler: () => handleOpenUrl(null, selectedNodeId), enabled: !!selectedNode && !!selectedNode.url },
    onToggleCollapse: { handler: () => handleToggleCollapse(selectedNodeId), enabled: !!selectedNode && selectedNode.is_parent },
  };
  const isInputActive = modalState.isOpen || isShortcutsModalOpen || isSearchOpen;
  useKeyboardShortcuts(shortcutHandlers, isInputActive);

  // --- Data for Child Components ---
  const plainNodes = useMemo(() => {
    return nodes ? nodes.get({ returnType: 'Array' }) : [];
  }, [nodes]);

  if (loading) {
    return <div style={{ color: isDark ? 'white' : 'black', textAlign: 'center', paddingTop: '40vh' }}>Loading your graph...</div>;
  }

  return (
    <GridBg isDark={isDark}>
      {!session && <WarningBanner onLoginClick={handleLogin} />}

      <ProjectHeader isDark={isDark} />
      <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
      
      {notification.visible && (
        <Notification
            message={notification.message}
            type={notification.type}
            onClose={closeNotification} 
        />
      )}
      
      <FixedToolbar
        onAddRoot={() => openModal('addRoot')}
        onAdd={handleAddChildAction} 
        onDelete={() => handleDeleteNode(selectedNodeId)}
        onEdit={() => openModal('edit', selectedNode)}
        onNote={() => openModal('note', selectedNode)}
        onShowShortcuts={() => setIsShortcutsModalOpen(true)}
        isNodeSelected={!!selectedNode}
        selectedNodeLabel={selectedNode?.label || ''}
        isSelectedNodeParent={selectedNode?.is_parent || false}
        isDark={isDark}
      />

      <NodeModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: null })}
        onSubmit={handleModalSubmit}
        initialData={modalState.nodeData}
        mode={modalState.mode} 
        isDark={isDark}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        isDark={isDark}
      />

      <FuzzySearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        nodes={plainNodes}
        isDark={isDark}
        onSelectNode={handleSearchSelect}
        onOpenUrl={handleOpenUrl}
      />

      <div
        ref={containerRef}
        className="graph-container"
        style={{ width: '100%', height: '100%' }}
      />
    </GridBg>
  );
}