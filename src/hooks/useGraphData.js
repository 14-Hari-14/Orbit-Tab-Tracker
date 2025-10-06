import { useState, useEffect, useCallback, useRef } from 'react';
import { DataSet } from 'vis-network/standalone';
import { api } from '../api';
import { loadDataFromLocalStorage, saveDataToLocalStorage } from '../utils/localStorage';
import { createInitialData, generateNodeTitle } from '../utils/graphUtils';

const getCollapsedStorageKey = (userId) => `orbit-collapsed-state-${userId || 'anonymous'}`;

export const useGraphData = (session, networkRef) => {
    // --- STATE AND REFS ---
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        nodes: new DataSet([]),
        edges: new DataSet([]),
    });
    const allNodes = useRef(new Map());
    const allEdges = useRef(new Map());
    const collapsedParentIds = useRef(new Set());

    // --- HELPER FUNCTIONS ---
    const getDirectChildren = useCallback((parentId) => {
        return Array.from(allEdges.current.values()).filter(edge => edge.from === parentId);
    }, []);

    const getAllDescendants = useCallback((parentId) => {
        const descendants = new Set();
        const childrenEdges = getDirectChildren(parentId);
        for (const edge of childrenEdges) {
            descendants.add(edge.to);
            getAllDescendants(edge.to).forEach(descendantId => descendants.add(descendantId));
        }
        return descendants;
    }, [getDirectChildren]);

    // --- DATA LOADING ---
    useEffect(() => {
        console.log("data loading use effect");
        const loadData = async () => {
            setLoading(true);
            const userId = session?.user?.id;

            if (session) {
                const { nodes: dbNodes, edges: dbEdges } = await api.fetchGraphData();
                allNodes.current.clear();
                (dbNodes || []).forEach(n => allNodes.current.set(n.id, n));
                allEdges.current.clear();
                (dbEdges || []).forEach(e => allEdges.current.set(e.id, { ...e, from: e.from_node, to: e.to_node }));
                if (allNodes.current.size === 0) {
                    const rootNodeForDB = { label: "Root", is_parent: true };
                    const newRootFromDB = await api.addNode(rootNodeForDB);
                    allNodes.current.set(newRootFromDB.id, newRootFromDB);
                }
            } else {
                const localData = loadDataFromLocalStorage();
                allNodes.current.clear();
                (localData?.nodes || createInitialData().nodes.get()).forEach(n => allNodes.current.set(n.id, n));
                allEdges.current.clear();
                (localData?.edges || []).forEach(e => allEdges.current.set(e.id, e));
            }

            const collapsedKey = getCollapsedStorageKey(userId);
            collapsedParentIds.current = new Set(JSON.parse(localStorage.getItem(collapsedKey) || '[]'));

            const nodesToDisplay = [];
            const nodesToHide = new Set();

            collapsedParentIds.current.forEach(parentId => {
                getAllDescendants(parentId).forEach(descendantId => nodesToHide.add(descendantId));
            });

            allNodes.current.forEach(node => {
                if (!nodesToHide.has(node.id)) {
                    let displayNode = { ...node, shape: node.is_parent ? 'circle' : 'box', value: node.is_parent ? 25 : 20, title: generateNodeTitle(node) };
                    if (collapsedParentIds.current.has(node.id)) {
                        const directChildrenCount = getDirectChildren(node.id).length;
                        displayNode.label = `${node.label} (+${directChildrenCount})`;
                    }
                    nodesToDisplay.push(displayNode);
                }
            });

            setData({
                nodes: new DataSet(nodesToDisplay),
                edges: new DataSet(Array.from(allEdges.current.values()))
            });
            setLoading(false);
        };
        loadData();
    }, [session]);

    // --- DATA MODIFICATION HANDLERS ---
    const handleAddNode = useCallback(async (nodeData, parentId) => {
        const dataToSave = { label: nodeData.label, url: nodeData.url, note: nodeData.note, is_parent: nodeData.is_parent };
        if (session) {
            const newNodeFromDB = await api.addNode(dataToSave);
            const fullNode = { ...newNodeFromDB, ...nodeData };
            allNodes.current.set(newNodeFromDB.id, fullNode);
            data.nodes.add({ ...fullNode, title: generateNodeTitle(fullNode) });
            if (parentId) {
                const newEdge = await api.addEdge(parentId, newNodeFromDB.id);
                const formattedEdge = { ...newEdge, from: newEdge.from_node, to: newEdge.to_node };
                allEdges.current.set(newEdge.id, formattedEdge);
                data.edges.add(formattedEdge);
            }
        } else {
            const newNode = { id: Date.now(), ...nodeData };
            allNodes.current.set(newNode.id, newNode);
            data.nodes.add({ ...newNode, title: generateNodeTitle(newNode) });
            if (parentId) {
                const newEdge = { id: Date.now() + 1, from: parentId, to: newNode.id };
                allEdges.current.set(newEdge.id, newEdge);
                data.edges.add(newEdge);
            }
            saveDataToLocalStorage(Array.from(allNodes.current.values()), Array.from(allEdges.current.values()), collapsedParentIds.current);
        }
    }, [session, data]);

    const handleDeleteNode = useCallback(async (nodeId) => {
        if (!nodeId) return;
        const nodesToDelete = [nodeId, ...Array.from(getAllDescendants(nodeId))];
        if (session) {
            try {
                await api.deleteNode(nodeId);
            } catch (error) { console.error("Failed to delete node from Supabase:", error); }
        }
        nodesToDelete.forEach(id => allNodes.current.delete(id));
        allEdges.current.forEach(edge => {
            if (nodesToDelete.includes(edge.from) || nodesToDelete.includes(edge.to)) {
                allEdges.current.delete(edge.id);
            }
        });
        data.nodes.remove(nodesToDelete);
        if (!session) {
            saveDataToLocalStorage(Array.from(allNodes.current.values()), Array.from(allEdges.current.values()), collapsedParentIds.current);
        }
    }, [session, data, getAllDescendants]);

    const handleUpdateNode = useCallback(async (nodeData) => {
        const dataToSave = { id: nodeData.id, label: nodeData.label, url: nodeData.url, note: nodeData.note, is_parent: nodeData.is_parent };
        if (session) {
            const updatedNodeFromDB = await api.updateNode(dataToSave);
            const fullNode = { ...allNodes.current.get(updatedNodeFromDB.id), ...updatedNodeFromDB };
            allNodes.current.set(updatedNodeFromDB.id, fullNode);
            data.nodes.update({ ...fullNode, title: generateNodeTitle(fullNode) });
        } else {
            const fullNode = { ...allNodes.current.get(nodeData.id), ...nodeData };
            allNodes.current.set(nodeData.id, fullNode);
            data.nodes.update({ ...fullNode, title: generateNodeTitle(fullNode) });
            saveDataToLocalStorage(Array.from(allNodes.current.values()), Array.from(allEdges.current.values()), collapsedParentIds.current);
        }
    }, [session, data]);

    // --- INTERACTION HANDLERS ---
    const handleToggleCollapse = useCallback((nodeId) => {
        const node = allNodes.current.get(nodeId);
        if (!node || !node.is_parent) return;

        const userId = session?.user?.id;
        const storageKey = getCollapsedStorageKey(userId);
        const isCollapsed = collapsedParentIds.current.has(nodeId);

        if (isCollapsed) {
            collapsedParentIds.current.delete(nodeId);
            const descendants = getAllDescendants(nodeId);
            const nodesToAdd = [];
            descendants.forEach(descendantId => {
                const descendantNode = allNodes.current.get(descendantId);
                if (descendantNode) {
                    nodesToAdd.push({ ...descendantNode, shape: descendantNode.is_parent ? 'circle' : 'box', value: descendantNode.is_parent ? 25 : 20, title: generateNodeTitle(descendantNode) });
                }
            });
            data.nodes.add(nodesToAdd);
            data.nodes.update({ id: nodeId, label: node.label, title: generateNodeTitle(node) });
        } else {
            collapsedParentIds.current.add(nodeId);
            const descendants = getAllDescendants(nodeId);
            const directChildrenCount = getDirectChildren(nodeId).length;
            data.nodes.update({ id: nodeId, label: `${node.label} (+${directChildrenCount})` });
            data.nodes.remove(Array.from(descendants));
        }

        localStorage.setItem(storageKey, JSON.stringify(Array.from(collapsedParentIds.current)));
    }, [session, data.nodes, getAllDescendants, getDirectChildren]);

    const handleClearSelection = useCallback((network) => { network?.unselectAll(); }, []);

    const handleOpenUrl = useCallback((url, nodeId) => {
        let targetUrl = url;
        if (!targetUrl && nodeId) {
            const node = allNodes.current.get(nodeId);
            targetUrl = node?.url;
        }
        if (targetUrl) {
            window.open(targetUrl, '_blank');
        }
    }, []);

    const handleSearchSelect = useCallback((nodeId, network) => {
        if (!data.nodes.get(nodeId)) {
            // A full implementation would find the path and expand ancestors.
            console.log("Node is currently in a collapsed cluster.");
            return;
        }
        network?.focus(nodeId, { animation: true });
        network?.selectNodes([nodeId]);
    }, [data.nodes]);

    // --- RETURN STATEMENT ---
    return {
        loading,
        nodes: data.nodes,
        edges: data.edges,
        collapsedParentIds: collapsedParentIds.current,
        handleAddNode,
        handleDeleteNode,
        handleUpdateNode,
        handleToggleCollapse,
        handleClearSelection,
        handleOpenUrl,
        handleSearchSelect,
    };
};