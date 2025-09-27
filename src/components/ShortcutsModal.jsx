// File: src/components/ShortcutsModal.jsx (New File)

import React from 'react';
import { shortcuts } from '../config/shortcut';

// Helper to format the key display (e.g., Ctrl + Q)
const formatShortcut = (shortcut) => {
  let parts = [];
  if (shortcut.ctrlKey) parts.push('Ctrl');
  
  // You can add shiftKey, altKey etc. here in the future
  // if (shortcut.shiftKey) parts.push('Shift');

  let keyDisplay = shortcut.key;
  if (keyDisplay === ' ') keyDisplay = 'Space';
  
  parts.push(keyDisplay.charAt(0).toUpperCase() + keyDisplay.slice(1));
  return parts.join(' + ');
};

// We group shortcuts manually to match the image layout
const nodeManagementShortcuts = [
  'ADD_ROOT_NODE', 'ADD_CHILD_NODE', 'ADD_CHILD_NODE_ALT', 'DELETE_NODE',
  'DELETE_NODE_ALT', 'EDIT_NODE', 'EDIT_NODE_ALT', 'EDIT_NOTE', 
];
const navigationShortcuts = ['OPEN_URL', 'CLEAR_SELECTION', 'TOGGLE_COLLAPSE', 'OPEN_SEARCH',];

const filterAndGroupShortcuts = (group) => {
  const seen = new Set();
  return shortcuts
    .filter(s => group.includes(s.name))
    .filter(s => {
      // This ensures we only show one entry for shortcuts with alternate keys
      const handler = s.handler;
      if (seen.has(handler)) {
        return false;
      } else {
        seen.add(handler);
        return true;
      }
    });
};


export const ShortcutsModal = ({ isOpen, onClose, isDark }) => {
  if (!isOpen) return null;

  // Combine alternate shortcuts (e.g., Delete / Backspace) into one display
  const getCombinedShortcut = (handlerName) => {
    const relevantShortcuts = shortcuts.filter(s => s.handler === handlerName);
    return relevantShortcuts.map(s => <kbd style={styles.kbd} key={s.name}>{formatShortcut(s)}</kbd>);
  };

  const styles = {
    backdrop: {
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    modal: {
      fontFamily: 'sans-serif',
      backgroundColor: isDark ? '#2D3748' : '#F7FAFC',
      color: isDark ? '#E2E8F0' : '#2D3748',
      padding: '24px', borderRadius: '8px',
      width: '500px', border: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`,
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`,
      paddingBottom: '12px', marginBottom: '20px',
    },
    title: { margin: 0, fontSize: '18px', fontWeight: '500' },
    closeButton: {
      background: 'none', border: 'none', color: isDark ? '#A0AEC0' : '#718096',
      fontSize: '24px', cursor: 'pointer',
    },
    sectionTitle: {
      color: '#4299E1', fontSize: '14px',
      textTransform: 'uppercase', marginBottom: '12px',
    },
    list: { margin: 0, padding: 0, listStyle: 'none' },
    listItem: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: `1px solid ${isDark ? '#4A5568' : '#CBD5E0'}`,
    },
    shortcutKeys: { display: 'flex', gap: '8px' },
    kbd: {
      backgroundColor: isDark ? '#4A5568' : '#E2E8F0',
      padding: '4px 8px', borderRadius: '4px', fontSize: '14px',
      border: `1px solid ${isDark ? '#718096' : '#CBD5E0'}`,
      boxShadow: `inset 0 -2px 0 ${isDark ? '#2D3748' : '#A0AEC0'}`,
    },
    note: {
      marginTop: '20px', padding: '12px', backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
      borderRadius: '6px', fontSize: '13px', color: isDark ? '#A0AEC0' : '#4A5568',
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Keyboard Shortcuts</h2>
          <button style={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        
        <div>
          <h3 style={styles.sectionTitle}>Node Management</h3>
          <ul style={styles.list}>
            {filterAndGroupShortcuts(nodeManagementShortcuts).map(s => (
              <li style={styles.listItem} key={s.name}>
                <span>{s.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace('Node', 'node')}</span>
                <div style={styles.shortcutKeys}>{getCombinedShortcut(s.handler)}</div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: '24px' }}>
          <h3 style={styles.sectionTitle}>Navigation & Interaction</h3>
          <ul style={styles.list}>
            {filterAndGroupShortcuts(navigationShortcuts).map(s => (
               <li style={styles.listItem} key={s.name}>
                <span>{s.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace('Url', 'URL').replace('Node', 'node')}</span>
                <div style={styles.shortcutKeys}>{getCombinedShortcut(s.handler)}</div>
              </li>
            ))}
          </ul>
        </div>
        
        <div style={styles.note}>
          Note: Shortcuts are disabled when typing in input fields or when modals are open.
        </div>
      </div>
    </div>
  );
};