// File: src/utils/localStorage.js (Corrected)

const LOCAL_STORAGE_KEY = 'orbit-graph-data-v1';

export const saveDataToLocalStorage = (nodes, edges) => {
    try {
        // Ensure nodes and edges are valid before trying to access them
        if (!nodes || !edges) {
            console.error("Attempted to save null/undefined nodes or edges.");
            return;
        }
        const plainNodes = nodes.get({ returnType: 'Array' });
        const plainEdges = edges.get({ returnType: 'Array' });
        const dataToStore = JSON.stringify({ nodes: plainNodes, edges: plainEdges });
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