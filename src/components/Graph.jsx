// File: src/components/Graph.jsx (Final, Definitive Version)

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Network, DataSet } from "vis-network/standalone";
import { supabase } from './supabaseClient';
import { useGraphStore } from '../store';

// Import all your UI Components
import { GridBg } from './ui/GridBg';
import { NodeModal } from "./NodeModal";
import { ProjectHeader } from './ProjectHeader';
import { ThemeToggle } from './ThemeToggle';
import { FixedToolbar } from './FixedToolbar';
import { ShortcutsModal } from './ShortcutsModal';
import FuzzySearch from './FuzzySearch';
import { Notification } from './Notification';
import { WarningBanner } from './WarningBanner';

// Import Hooks and Utils
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { getNetworkOptions } from "./styles";
import { generateNodeTitle } from "../utils/graphUtils";

export default function Graph({ session }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  
  const [isDark, setIsDark] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, mode: null, nodeData: null, parentId: null });
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });

  const store = useGraphStore();
  const { loading, allNodes, allEdges, collapsedIds, loadInitialData } = store;

  const { visibleNodes, visibleEdges } = useMemo(() => {
    if (loading) return { visibleNodes: new DataSet([]), visibleEdges: new DataSet([]) };
    const getDirectChildren = (parentId) => Array.from(allEdges.values()).filter(e => e.from === parentId);
    const getAllDescendants = (parentId) => {
      const descendants = new Set();
      getDirectChildren(parentId).forEach(edge => {
        descendants.add(edge.to);
        getAllDescendants(edge.to).forEach(d => descendants.add(d));
      });
      return descendants;
    };
    const nodesToDisplay = [];
    const nodesToHide = new Set();
    collapsedIds.forEach(parentId => {
      getAllDescendants(parentId).forEach(descendantId => nodesToHide.add(descendantId));
    });
    allNodes.forEach(node => {
      if (!nodesToHide.has(node.id)) {
        let displayNode = { ...node, shape: node.is_parent ? 'circle' : 'box', value: node.is_parent ? 25 : 20, title: generateNodeTitle(node) };
        if (collapsedIds.has(node.id)) {
          displayNode.label = `${node.label} (+${getDirectChildren(node.id).length})`;
        }
        nodesToDisplay.push(displayNode);
      }
    });
    return {
      visibleNodes: new DataSet(nodesToDisplay),
      visibleEdges: new DataSet(Array.from(allEdges.values()))
    };
  }, [loading, allNodes, allEdges, collapsedIds]);

  useEffect(() => { loadInitialData(session); }, [session, loadInitialData]);

  useEffect(() => {
    if (loading || !containerRef.current) return;
    const network = new Network(containerRef.current, { nodes: visibleNodes, edges: visibleEdges }, getNetworkOptions(isDark));
    networkRef.current = network;
    network.on("selectNode", (params) => setSelectedNodeId(params.nodes[0] || null));
    network.on("deselectNode", () => setSelectedNodeId(null));
    network.on("doubleClick", (params) => {
      if (params.nodes.length > 0) store.toggleCollapse(params.nodes[0]);
    });
    return () => { if (networkRef.current) { networkRef.current.destroy(); networkRef.current = null; } };
  }, [loading, isDark, visibleNodes, visibleEdges, store.toggleCollapse]);

  const selectedNode = selectedNodeId ? allNodes.get(selectedNodeId) : null;
  const showNotification = (message, type = 'error') => setNotification({ message, type, visible: true });
  const closeNotification = useCallback(() => setNotification(prev => ({ ...prev, visible: false })), []);
  const handleLogin = () => supabase.auth.signInWithOAuth({ provider: 'google' });
  const openModal = (mode, node = null) => setModalState({ isOpen: true, mode, nodeData: node, parentId: (mode === 'add' ? node?.id : null) });
  
  const handleModalSubmit = async (formData) => {
    const isParent = modalState.mode === 'addRoot' || formData.isParent;
    let nodeData = { label: formData.label, url: formData.url, note: formData.note, is_parent: isParent };
    if (isParent) { nodeData.shape = 'circle'; nodeData.value = 25; }
    if (modalState.mode === 'add' || modalState.mode === 'addRoot') {
      await store.addNode(nodeData, modalState.parentId, session);
    } else if (modalState.mode === 'edit' || modalState.mode === 'note') {
      await store.updateNode({ ...modalState.nodeData, ...nodeData, is_parent: modalState.nodeData.is_parent }, session);
    }
    setModalState({ isOpen: false, mode: null });
  };
  
  const handleAddChildAction = () => {
    if (selectedNode?.is_parent) {
      openModal('add', selectedNode);
    } else if (selectedNode) {
      showNotification(`Cannot add a child to a non-parent node (${selectedNode.label})`);
    }
  };

  const handleClearSelection = () => networkRef.current?.unselectAll();
  const handleOpenUrl = (url, nodeId) => {
    let targetUrl = url || allNodes.get(nodeId)?.url;
    if (targetUrl) window.open(targetUrl, '_blank');
  };
  const handleSearchSelect = (nodeId) => networkRef.current?.focus(nodeId, { animation: true });

  const shortcutHandlers = {
    onAddRoot: { handler: () => openModal('addRoot'), enabled: true },
    onOpenSearch: { handler: () => setIsSearchOpen(true), enabled: true },
    onClearSelection: { handler: handleClearSelection, enabled: true },
    onAdd: { handler: handleAddChildAction, enabled: !!selectedNode },
    onDelete: { handler: () => store.deleteNode(selectedNodeId, store.getAllDescendants, session), enabled: !!selectedNode },
    onEdit: { handler: () => openModal('edit', selectedNode), enabled: !!selectedNode },
    onNote: { handler: () => openModal('note', selectedNode), enabled: !!selectedNode },
    onOpenUrl: { handler: () => handleOpenUrl(null, selectedNodeId), enabled: !!selectedNode && !!selectedNode.url },
    onToggleCollapse: { handler: () => store.toggleCollapse(selectedNodeId), enabled: !!selectedNode && selectedNode.is_parent },
  };
  const isInputActive = modalState.isOpen || isShortcutsModalOpen || isSearchOpen;
  useKeyboardShortcuts(shortcutHandlers, isInputActive);

  if (loading) {
    return <div style={{ color: isDark ? 'white' : 'black', textAlign: 'center', paddingTop: '40vh' }}>Loading...</div>;
  }

  return (
    <GridBg isDark={isDark}>
      {!session && <WarningBanner onLoginClick={handleLogin} />}
      <ProjectHeader isDark={isDark} />
      <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
      {notification.visible && <Notification message={notification.message} type={notification.type} onClose={closeNotification} />}
      
      <FixedToolbar
        onAddRoot={() => openModal('addRoot')} onAdd={handleAddChildAction} 
        onDelete={() => store.deleteNode(selectedNodeId, store.getAllDescendants, session)}
        onEdit={() => openModal('edit', selectedNode)} onNote={() => openModal('note', selectedNode)}
        onShowShortcuts={() => setIsShortcutsModalOpen(true)} isNodeSelected={!!selectedNode}
        selectedNodeLabel={selectedNode?.label || ''} isSelectedNodeParent={selectedNode?.is_parent || false}
        isDark={isDark}
      />

      <NodeModal isOpen={modalState.isOpen} onClose={() => setModalState({ isOpen: false, mode: null })}
        onSubmit={handleModalSubmit} initialData={modalState.nodeData} mode={modalState.mode} isDark={isDark}
      />
      
      <ShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} isDark={isDark} />

      <FuzzySearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)}
        nodes={Array.from(allNodes.values())} isDark={isDark} onSelectNode={handleSearchSelect} onOpenUrl={handleOpenUrl}
      />

      <div ref={containerRef} className="graph-container" style={{ width: '100%', height: '100%' }} />
    </GridBg>
  );
}