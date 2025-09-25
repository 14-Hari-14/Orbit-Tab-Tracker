import { useCallback, useEffect } from 'react';

export const useKeyboardShortcuts = ({
    selectedNodeId,
    modalState,
    nodes,
    onAddRootNode,
    onAddNode,
    onDeleteNode,
    onEditNode,
    onAddEditNote,
    onToggleCollapse,
    showKeyboardFeedback
}) => {
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

        // Handle all keyboard shortcuts here...
        // This makes it much easier to manage and test

    }, [selectedNodeId, modalState.isOpen, /* other dependencies */]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return null; // This hook only manages side effects
};