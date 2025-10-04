// File: src/store.js (Final, Definitive Version)

import { create } from 'zustand';
import { api } from './api';
import { loadDataFromLocalStorage, saveDataToLocalStorage } from './utils/localStorage';
import { createInitialData } from './utils/graphUtils';

export const useGraphStore = create((set, get) => ({
    // --- STATE ---
    loading: true,
    allNodes: new Map(),
    allEdges: new Map(),
    collapsedIds: new Set(),
    session: null,

    // --- ACTIONS ---

    // Initializes the entire graph state
    loadInitialData: async (session) => {
        set({ loading: true, session });
        const userId = session?.user?.id;
        let nodesMap = new Map();
        let edgesMap = new Map();

        if (session) {
            const { nodes: dbNodes, edges: dbEdges } = await api.fetchGraphData();
            (dbNodes || []).forEach(n => nodesMap.set(n.id, n));
            (dbEdges || []).forEach(e => edgesMap.set(e.id, { ...e, from: e.from_node, to: e.to_node }));
            if (nodesMap.size === 0) {
                const rootNodeForDB = { label: "Root", is_parent: true };
                const newRootFromDB = await api.addNode(rootNodeForDB);
                nodesMap.set(newRootFromDB.id, newRootFromDB);
            }
        } else {
            const localData = loadDataFromLocalStorage();
            const initialData = createInitialData();
            (localData?.nodes?.get ? localData.nodes.get() : localData?.nodes || initialData.nodes.get()).forEach(n => nodesMap.set(n.id, n));
            (localData?.edges?.get ? localData.edges.get() : localData?.edges || []).forEach(e => edgesMap.set(e.id, e));
        }

        // Load collapsed state from local storage
        const collapsedKey = `orbit-collapsed-state-${userId || 'anonymous'}`;
        const savedCollapsed = new Set(JSON.parse(localStorage.getItem(collapsedKey) || '[]'));

        set({ allNodes: nodesMap, allEdges: edgesMap, collapsedIds: savedCollapsed, loading: false });
    },

    // Toggles a node's collapsed state
    toggleCollapse: (nodeId) => {
        const { allNodes, collapsedIds, session } = get();
        const node = allNodes.get(nodeId);
        if (!node || !node.is_parent) return;

        const newCollapsedIds = new Set(collapsedIds);
        if (newCollapsedIds.has(nodeId)) {
            newCollapsedIds.delete(nodeId);
        } else {
            newCollapsedIds.add(nodeId);
        }

        // Persist the collapsed state to local storage
        const userId = session?.user?.id;
        const collapsedKey = `orbit-collapsed-state-${userId || 'anonymous'}`;
        localStorage.setItem(collapsedKey, JSON.stringify(Array.from(newCollapsedIds)));

        set({ collapsedIds: newCollapsedIds });
    },

    // Adds a new node and edge
    addNode: async (nodeData, parentId) => {
        const { allNodes, allEdges, session } = get();
        if (session) {
            const dataToSave = { label: nodeData.label, url: nodeData.url, note: nodeData.note, is_parent: nodeData.is_parent };
            const newNodeFromDB = await api.addNode(dataToSave);
            const fullNode = { ...newNodeFromDB, ...nodeData };
            allNodes.set(newNodeFromDB.id, fullNode);
            if (parentId) {
                const newEdge = await api.addEdge(parentId, newNodeFromDB.id);
                const formattedEdge = { ...newEdge, from: newEdge.from_node, to: newEdge.to_node };
                allEdges.set(newEdge.id, formattedEdge);
            }
        } else {
            const newNode = { id: Date.now(), ...nodeData };
            allNodes.set(newNode.id, newNode);
            if (parentId) {
                const newEdge = { id: Date.now() + 1, from: parentId, to: newNode.id };
                allEdges.set(newEdge.id, newEdge);
            }
            saveDataToLocalStorage(Array.from(allNodes.values()), Array.from(allEdges.values()));
        }
        set({ allNodes: new Map(allNodes), allEdges: new Map(allEdges) });
    },

    // Deletes a node and its descendants
    deleteNode: async (nodeId) => {
        if (!nodeId) return;
        const { allNodes, allEdges, session, getAllDescendants } = get();
        const nodesToDelete = [nodeId, ...Array.from(getAllDescendants(nodeId))];

        if (session) {
            try {
                await api.deleteNode(nodeId); // ON DELETE CASCADE in DB handles edges
            } catch (error) { console.error("Failed to delete node from Supabase:", error); }
        }

        nodesToDelete.forEach(id => allNodes.delete(id));
        allEdges.forEach(edge => {
            if (nodesToDelete.includes(edge.from) || nodesToDelete.includes(edge.to)) {
                allEdges.delete(edge.id);
            }
        });

        if (!session) {
            saveDataToLocalStorage(Array.from(allNodes.values()), Array.from(allEdges.values()));
        }
        set({ allNodes: new Map(allNodes), allEdges: new Map(allEdges) });
    },

    // Updates a node
    updateNode: async (nodeData) => {
        const { allNodes, session } = get();
        if (session) {
            const dataToSave = { id: nodeData.id, label: nodeData.label, url: nodeData.url, note: nodeData.note, is_parent: nodeData.is_parent };
            const updatedNodeFromDB = await api.updateNode(dataToSave);
            const fullNode = { ...allNodes.get(updatedNodeFromDB.id), ...updatedNodeFromDB };
            allNodes.set(updatedNodeFromDB.id, fullNode);
        } else {
            const fullNode = { ...allNodes.get(nodeData.id), ...nodeData };
            allNodes.set(nodeData.id, fullNode);
            saveDataToLocalStorage(Array.from(allNodes.values()), Array.from(allEdges.values()));
        }
        set({ allNodes: new Map(allNodes) });
    },

    // Helper function for recursive lookups
    getAllDescendants: (parentId) => {
        const { allEdges } = get();
        const descendants = new Set();
        const children = Array.from(allEdges.values()).filter(e => e.from === parentId);
        for (const edge of children) {
            descendants.add(edge.to);
            get().getAllDescendants(edge.to).forEach(d => descendants.add(d));
        }
        return descendants;
    },
}));