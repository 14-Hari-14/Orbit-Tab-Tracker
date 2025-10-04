// Function to create the tooltip when a node is hovered which displays link and note if present

import { DataSet } from "vis-network/standalone"

export const generateNodeTitle = (node) => {
    const container = document.createElement('div');
    container.style.padding = '8px';
    container.style.fontFamily = 'Electrolize, sans-serif';
    container.style.fontSize = '14px';


    const labelEl = document.createElement('b');
    labelEl.innerText = node.label;
    container.appendChild(labelEl);

    if (node.url) {
        container.appendChild(document.createElement('br'));
        const linkEl = document.createElement('a');
        linkEl.href = node.url;
        linkEl.target = '_blank';
        linkEl.style.color = '#55aaff';
        linkEl.innerText = node.url;
        container.appendChild(linkEl);
    }

    if (node.note) {
        container.appendChild(document.createElement('hr'));
        const noteEl = document.createElement('i');
        noteEl.innerText = node.note;
        container.appendChild(noteEl);
    }

    return container;
};

// creating root node on initial load
export const createInitialData = () => {
    const initialNodes = new DataSet([{ id: 1, label: "Root", shape: "circle", value: 25, is_parent: true, note: "Start building your knowledge graph from here!" }]);
    initialNodes.forEach(node => {
        initialNodes.update({ ...node, title: generateNodeTitle(node) });
    });
    return { nodes: initialNodes, edges: new DataSet([]) };
};