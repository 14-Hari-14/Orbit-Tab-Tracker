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

export const getBottomUpCollapsedOrder = (collapsedSet, allEdges) => {
    const order = [];
    const visited = new Set();

    const visit = (id) => {
        if (visited.has(id)) return;
        visited.add(id);

        const children = allEdges
            .filter(edge => edge.from === id)
            .map(edge => edge.to)
            .filter(childId => collapsedSet.has(childId));

        children.forEach(visit);
        order.push(id);
    };

    Array.from(collapsedSet).forEach(visit);
    return order;
};