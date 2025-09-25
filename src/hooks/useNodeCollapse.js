import { useCallback } from 'react';
import { updateNodeInSupabase } from '../components/api';
import { generateNodeTitle } from '../utils/nodeUtils';

export const useNodeCollapse = ({
    nodes,
    allNodesRef,
    getDirectChildren,
    session,
    setLastLocalChange,
    isDark
}) => {
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

        // Recursively collapse descendant parents
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
    }, [getDirectChildren, session, setLastLocalChange]);

    const expandNode = useCallback(async (parentId) => {
        // ... expandNode implementation
    }, [isDark, getDirectChildren, session, setLastLocalChange]);

    return { collapseNode, expandNode };
};