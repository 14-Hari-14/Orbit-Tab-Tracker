// File: src/hooks/useKeyboardShortcuts.js (Updated)

import { useEffect, useCallback } from 'react';
import { shortcuts } from '../config/shortcut';

// The handlers object now expects a structure like: { onAdd: { handler: func, enabled: bool } }
export const useKeyboardShortcuts = (handlers, isInputActive) => {
    const handleKeyDown = useCallback((event) => {
        if (isInputActive) {
            return;
        }

        const shortcut = shortcuts.find(s =>
            s.key.toLowerCase() === event.key.toLowerCase() &&
            !!s.ctrlKey === event.ctrlKey && // Ensure boolean comparison
            !!s.shiftKey === event.shiftKey // Add shift key support
        );

        if (shortcut) {
            const handlerObject = handlers[shortcut.handler];
            // Check if the handlerObject exists AND if it's currently enabled.
            if (handlerObject && handlerObject.enabled) {
                event.preventDefault();
                handlerObject.handler();
            }
        }
    }, [handlers, isInputActive]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
};