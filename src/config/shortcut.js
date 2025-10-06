// File: src/config/shortcuts.js (New File)

export const shortcuts = [
    // Node Management
    { name: 'ADD_ROOT_NODE', key: 'a', ctrlKey: true, shiftKey: true, handler: 'onAddRoot' },
    { name: 'ADD_CHILD_NODE', key: 'a', ctrlKey: true, handler: 'onAdd' },
    { name: 'ADD_CHILD_NODE_ALT', key: 'Insert', ctrlKey: false, handler: 'onAdd' },
    { name: 'DELETE_NODE', key: 'Delete', ctrlKey: false, handler: 'onDelete' },
    { name: 'DELETE_NODE_ALT', key: 'Backspace', ctrlKey: false, handler: 'onDelete' },
    { name: 'EDIT_NODE', key: 'Enter', ctrlKey: false, handler: 'onEdit' },
    { name: 'EDIT_NODE_ALT', key: 'F2', ctrlKey: false, handler: 'onEdit' },
    { name: 'EDIT_NOTE', key: 'e', ctrlKey: true, handler: 'onNote' },

    // Navigation & Interaction
    { name: 'OPEN_URL', key: 'o', ctrlKey: true, handler: 'onOpenUrl' },
    { name: 'CLEAR_SELECTION', key: 'Escape', ctrlKey: false, handler: 'onClearSelection' },
    { name: 'TOGGLE_COLLAPSE', key: ' ', ctrlKey: false, handler: 'onToggleCollapse' }, // " " is the Space key
    { name: 'OPEN_SEARCH', key: 'k', ctrlKey: true, handler: 'onOpenSearch' },
];