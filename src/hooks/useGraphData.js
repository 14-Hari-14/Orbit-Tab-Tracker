// File: src/hooks/useGraphData.js (New File)

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

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const nodes = new DataSet([]);
            const edges = new DataSet([]);

            if (session) {
                const { nodes: dbNodes, edges: dbEdges } = await api.fetchGraphData();

                if (dbNodes.length === 0) {
                    // If the user is new and has no data, create a root node for them.
                    const rootNodeData = { label: "Root", is_parent: true };
                    const newRoot = await api.addNode(rootNodeData);
                    nodes.add(newRoot);
                } else {
                    nodes.add(dbNodes);
                    const formattedEdges = dbEdges.map(e => ({ ...e, from: e.from_node, to: e.to_node }));
                    edges.add(formattedEdges);
                }

            } else {
                const localData = loadDataFromLocalStorage();
                if (localData && localData.nodes?.length > 0) {
                    nodes.add(localData.nodes);
                    edges.add(localData.edges);
                } else {
                    // If no local storage, create a default graph.
                    const { nodes: initialNodes, edges: initialEdges } = createInitialData();
                    nodes.add(initialNodes.get());
                    edges.add(initialEdges.get());
                }
            }

            setData({ nodes, edges });
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

    const handleDeleteNode = useCallback(async (nodeId) => {
        // Note: A full implementation would handle deleting descendants.
        if (session) {
            await api.deleteNode(nodeId);
            data.nodes.remove(nodeId);
        } else {
            data.nodes.remove(nodeId);
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