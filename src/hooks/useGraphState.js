import { useRef, useState, useCallback } from 'react';
import { DataSet } from "vis-network/standalone";

export const useGraphState = () => {
    const nodes = useRef(new DataSet([]));
    const edges = useRef(new DataSet([]));
    const allNodesRef = useRef(new Map());
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [lastLocalChange, setLastLocalChange] = useState(0);

    const getDirectChildren = useCallback((parentId) => {
        return edges.current.get({ filter: edge => edge.from === parentId }).map(edge => edge.to);
    }, []);

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

    return {
        nodes,
        edges,
        allNodesRef,
        selectedNodeId,
        setSelectedNodeId,
        lastLocalChange,
        setLastLocalChange,
        getDirectChildren,
        getAllDescendants
    };
};