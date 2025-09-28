// File: src/hooks/useGraphData.js (Updated)

import { useState, useEffect, useCallback } from 'react';
import { DataSet } from 'vis-network/standalone';
import { api } from '../api';
import { loadDataFromLocalStorage, saveDataToLocalStorage } from '../utils/localStorage';
import { createInitialData } from '../utils/graphUtils';

export const useGraphData = (session) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        nodes: new DataSet([]),
        edges: new DataSet([]),
    });

    // This effect now ONLY depends on the session, preventing re-runs.
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const nodesDataSet = new DataSet([]);
            const edgesDataSet = new DataSet([]);

            if (session) {
                const { nodes: dbNodes, edges: dbEdges } = await api.fetchGraphData();

                if (dbNodes.length === 0) {
                    const rootNodeData = { label: "Root", is_parent: true, shape: 'circle'};
                    const newRoot = await api.addNode(rootNodeData);
                    nodesDataSet.add(newRoot);
                } else {
                    nodesDataSet.add(dbNodes);
                    const formattedEdges = dbEdges.map(e => ({ ...e, from: e.from_node, to: e.to_node }));
                    edgesDataSet.add(formattedEdges);
                }

            } else {
                const localData = loadDataFromLocalStorage();
                if (localData && localData.nodes?.length > 0) {
                    nodesDataSet.add(localData.nodes);
                    edgesDataSet.add(localData.edges);
                } else {
                    const { nodes: initialNodes, edges: initialEdges } = createInitialData();
                    nodesDataSet.add(initialNodes.get());
                    edgesDataSet.add(initialEdges.get());
                }
            }

            setData({ nodes: nodesDataSet, edges: edgesDataSet });
            setLoading(false);
        };

        loadData();
    }, [session]);

    const handleAddNode = useCallback(async (nodeData, parentId) => {
        if (session) {
            const newNode = await api.addNode(nodeData);
            data.nodes.add(newNode);
            if (parentId) {
                const newEdge = await api.addEdge(parentId, newNode.id);
                data.edges.add({ ...newEdge, from: newEdge.from_node, to: newEdge.to_node });
            }
        } else {
            const newNode = { id: Date.now(), ...nodeData };
            data.nodes.add(newNode);
            if (parentId) {
                data.edges.add({ from: parentId, to: newNode.id });
            }
            saveDataToLocalStorage(data.nodes, data.edges);
        }
    }, [session, data]);

    // --- NEW: Fully implemented handleDeleteNode ---
    const handleDeleteNode = useCallback(async (nodeId) => {
        if (!nodeId) return;

        // Helper to get all descendants of a node
        const getAllDescendants = (id) => {
            let children = data.edges.get({ filter: edge => edge.from === id }).map(edge => edge.to);
            let descendants = [...children];
            children.forEach(childId => {
                descendants = [...descendants, ...getAllDescendants(childId)];
            });
            return descendants;
        };

        const nodesToDelete = [nodeId, ...getAllDescendants(nodeId)];

        if (session) {
            // In Supabase, we only need to delete the parent nodes.
            // The `ON DELETE CASCADE` in our database schema will handle deleting all children.
            // For safety, we can delete all explicitly, starting from the children.
            try {
                for (const id of nodesToDelete.reverse()) {
                    await api.deleteNode(id);
                }
                data.nodes.remove(nodesToDelete);
            } catch (error) {
                console.error("Failed to delete nodes from Supabase:", error);
            }
        } else {
            // For local storage, we just remove them from the DataSet
            data.nodes.remove(nodesToDelete);
            saveDataToLocalStorage(data.nodes, data.edges);
        }
    }, [session, data]);

    const handleUpdateNode = useCallback(async (nodeData) => {
        if (session) {
            const updatedNode = await api.updateNode(nodeData);
            data.nodes.update(updatedNode);
        } else {
            data.nodes.update(nodeData);
            saveDataToLocalStorage(data.nodes, data.edges);
        }
    }, [session, data]);

    return {
        loading,
        nodes: data.nodes,
        edges: data.edges,
        handleAddNode,
        handleDeleteNode,
        handleUpdateNode,
    };
};