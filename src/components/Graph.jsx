// File: src/components/Graph.jsx (Corrected and Complete)

import { useState, useMemo, useCallback } from "react"; 
import { DataSet } from "vis-network/standalone";

// UI Components
import { GridBg } from './ui/GridBg';
import { NodeModal } from "./NodeModal";
import { ProjectHeader } from './ProjectHeader';
import { ThemeToggle } from './ThemeToggle';
import { FixedToolbar } from './FixedToolbar';
import { ShortcutsModal } from './ShortcutsModal'; 
import FuzzySearch from './FuzzySearch'; 
import { Notification } from './Notification';
import { WarningBanner } from './WarningBanner';

// Utilities & Hooks
import { loadDataFromLocalStorage } from '../utils/localStorage';
import { createInitialData, generateNodeTitle } from '../utils/graphUtils';
import { useVisNetwork } from '../hooks/useVisNetwork';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Auth
// import HCaptcha from '@hcaptcha/react-hcaptcha';
import { supabase } from './supabaseClient';
import { AuthPage } from './AuthPage'; 

const getInitialData = () => {
  const savedData = loadDataFromLocalStorage();
  if (savedData?.nodes) {
    const nodes = new DataSet(savedData.nodes);
    nodes.forEach(node => {
      nodes.update({ id: node.id, title: generateNodeTitle(node) });
    });
    return { 
        nodes, 
        edges: new DataSet(savedData.edges), 
        collapsed: new Set(savedData.collapsed || []) 
    };
  }
  return { ...createInitialData(), collapsed: new Set() };
};

export default function Graph() {
  const [isDark, setIsDark] = useState(true);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });

  const {
    containerRef, selectedNode, modalState, closeModal, handleModalSubmit,
    handleAddRootNode, handleAddNode, handleDeleteNode, handleEditNode,
    handleAddEditNote, handleOpenUrl, handleClearSelection, handleToggleCollapse,
    handleSearchSelect, data,
  } = useVisNetwork(getInitialData(), isDark);

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type, visible: true });
  };

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, visible: false }));
  }, []);

  const handleOpenSearch = () => setIsSearchOpen(true);

  const handleAddChildAction = () => {
    if (!selectedNode) return;
    if (selectedNode.isParent) {
      handleAddNode();
    } else {
      showNotification(`Cannot add a child to a non-parent node (${selectedNode.label})`);
    }
  };

  const shortcutHandlers = {
    onAddRoot:      { handler: handleAddRootNode, enabled: true },
    onOpenSearch:   { handler: handleOpenSearch, enabled: true },
    onClearSelection: { handler: handleClearSelection, enabled: true },
    onAdd:            { handler: handleAddChildAction, enabled: !!selectedNode },
    onDelete:       { handler: handleDeleteNode, enabled: !!selectedNode && selectedNode.label !== 'Root' },
    onEdit:         { handler: handleEditNode, enabled: !!selectedNode },
    onNote:         { handler: handleAddEditNote, enabled: !!selectedNode },
    onOpenUrl:      { handler: handleOpenUrl, enabled: !!selectedNode && !!selectedNode.url },
    onToggleCollapse: { handler: handleToggleCollapse, enabled: !!selectedNode && selectedNode.isParent },
  };

  const isInputActive = modalState.isOpen || isShortcutsModalOpen || isSearchOpen;
  useKeyboardShortcuts(shortcutHandlers, isInputActive);

  const plainNodes = useMemo(() => {
    return data ? data.nodes.get({ returnType: 'Array' }) : [];
  }, [data]);

  return (
    <GridBg isDark={isDark}>
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
        onAddRoot={handleAddRootNode}
        onAdd={handleAddChildAction} 
        onDelete={handleDeleteNode}
        onEdit={handleEditNode}
        onNote={handleAddEditNote}
        onShowShortcuts={() => setIsShortcutsModalOpen(true)}
        isNodeSelected={!!selectedNode}
        selectedNodeLabel={selectedNode?.label || ''}
        isSelectedNodeParent={selectedNode?.isParent || false}
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