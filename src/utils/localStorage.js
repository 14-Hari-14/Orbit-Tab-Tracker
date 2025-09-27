// File: utils/localStorage.js (New File)
// This file contains functions for interacting with the browser's local storage.

import { generateNodeTitle } from './graphUtils'; // We'll need this for the data loader

const LOCAL_STORAGE_KEY = 'orbit-graph-data-v1';

export const saveDataToLocalStorage = (nodes, edges, collapsedIds) => {
    try {
        const plainNodes = nodes.get({ returnType: 'Array' });
        const plainEdges = edges.get({ returnType: 'Array' });
        const plainCollapsed = Array.from(collapsedIds);
        const dataToStore = JSON.stringify({ nodes: plainNodes, edges: plainEdges, collapsed: plainCollapsed });
        localStorage.setItem(LOCAL_STORAGE_KEY, dataToStore);
    } catch (error) {
        console.error("Failed to save graph data:", error);
    }
};

export const loadDataFromLocalStorage = () => {
    try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData === null) return null;
        return JSON.parse(savedData);
    } catch (error) {
        console.error("Failed to load graph data:", error);
        return null;
    }
};