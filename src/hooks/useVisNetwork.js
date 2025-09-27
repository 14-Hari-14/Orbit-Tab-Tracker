// File: hooks/useVisNetwork.js (Final corrected version)

import { useRef, useEffect, useState, useCallback } from "react";
import { DataSet, Network } from "vis-network/standalone";
import { getNetworkOptions } from '../components/styles';
import { saveDataToLocalStorage } from '../utils/localStorage';
import { generateNodeTitle } from '../utils/graphUtils';

export const useVisNetwork = (initialData, isDark) => {
    const containerRef = useRef(null);
    const networkRef = useRef(null);
    const collapsedParentIds = useRef(new Set(initialData.collapsed || []));

    const [data] = useState(initialData);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [modalState, setModalState] = useState({
        isOpen: false,
        mode: null,
        nodeData: null,
        parentId: null,
    });


    const handleOpenUrl = useCallback((url) => {
        // Case 1: A URL is passed directly (from fuzzy search).
        if (url && typeof url === 'string') {
            window.open(url, "_blank");
            return;
        }

        // Case 2: No URL passed, use the selected node (from Ctrl+O shortcut).
        if (selectedNodeId) {
            const node = data.nodes.get(selectedNodeId);
            if (node?.url && node.url.trim() !== '') {
                window.open(node.url, "_blank");
            }
        }
    }, [data, selectedNodeId]);

    const handleClearSelection = () => {
        if (networkRef.current) {
            networkRef.current.selectNodes([]);
            setSelectedNodeId(null);
        }
    };

    const handleToggleCollapse = () => {
        if (!selectedNodeId || !networkRef.current) return;
        const network = networkRef.current;

        // Simulate a double-click to reuse the existing collapse/expand logic
        network.emit('doubleClick', { nodes: [selectedNodeId] });
    };


    const autoSave = useCallback(() => {
        saveDataToLocalStorage(data.nodes, data.edges, collapsedParentIds.current);
    }, [data]);

    const getDirectChildren = useCallback((parentId) => {
        return data.edges.get({ filter: edge => edge.from === parentId }).map(edge => edge.to);
    }, [data]);

    const getBottomUpOrder = useCallback((collapsedSet) => {
        const order = [];
        const visited = new Set();
        const visit = (id) => {
            if (visited.has(id)) return;
            visited.add(id);
            const children = getDirectChildren(id).filter(c => collapsedSet.has(c));
            children.forEach(visit);
            order.push(id);
        };
        Array.from(collapsedSet).forEach(visit);
        return order;
    }, [getDirectChildren]);

    const openModal = (mode, nodeId) => {
        const isCluster = String(nodeId).startsWith('cluster-');
        const actualNodeId = isCluster ? parseInt(String(nodeId).replace('cluster-', '')) : nodeId;
        const nodeData = data.nodes.get(actualNodeId);

        setModalState({
            isOpen: true,
            mode: mode,
            nodeData: (mode === 'edit' || mode === 'note') ? nodeData : null,
            parentId: (mode === 'add') ? actualNodeId : null,
        });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, mode: null, nodeData: null, parentId: null });
    };

    const handleAddRootNode = () => {
        setModalState({ isOpen: true, mode: 'addRoot', nodeData: null, parentId: null });
    };

    const handleModalSubmit = (formData) => {
        if (modalState.mode === 'add') {
            const newNode = { id: Date.now(), ...formData, shape: formData.isParent ? 'ellipse' : 'box' };
            newNode.title = generateNodeTitle(newNode);
            data.nodes.add(newNode);
            data.edges.add({ from: modalState.parentId, to: newNode.id });
        } else if (modalState.mode === 'addRoot') {
            const newRootNode = { id: Date.now(), ...formData, isParent: true, shape: 'circle', value: 25 };
            newRootNode.title = generateNodeTitle(newRootNode);
            data.nodes.add(newRootNode);
            setSelectedNodeId(newRootNode.id);
            setTimeout(() => networkRef.current?.focus(newRootNode.id, { scale: 1, animation: true }), 100);
        } else if (modalState.mode === 'edit' || modalState.mode === 'note') {
            const updatedNode = { ...modalState.nodeData, ...formData };
            updatedNode.title = generateNodeTitle(updatedNode);
            data.nodes.update(updatedNode);
        }
        closeModal();
    };

    const handleAddNode = () => openModal('add', selectedNodeId);
    const handleEditNode = () => openModal('edit', selectedNodeId);
    const handleAddEditNote = () => openModal('note', selectedNodeId);

    const handleDeleteNode = () => {
        if (!selectedNodeId || selectedNodeId === 1) return;
        if (!window.confirm("Are you sure you want to delete this node and all its children?")) return;

        const getAllDescendants = (nodeId) => {
            const children = getDirectChildren(nodeId);
            return children.reduce((acc, childId) => [...acc, childId, ...getAllDescendants(childId)], []);
        };

        const nodesToDelete = [selectedNodeId, ...getAllDescendants(selectedNodeId)];
        data.nodes.remove(nodesToDelete);
        setSelectedNodeId(null);
    };

    const recursiveOpenDescendants = useCallback((networkInstance, parentId) => {
        getDirectChildren(parentId).forEach((childId) => {
            if (data.nodes.get(childId)?.isParent && collapsedParentIds.current.has(childId)) {
                networkInstance.openCluster(`cluster-${childId}`);
                collapsedParentIds.current.delete(childId);
            }
            recursiveOpenDescendants(networkInstance, childId);
        });
    }, [data, getDirectChildren]);

    const collapseNode = useCallback((networkInstance, parentId) => {
        console.log("--- COLLAPSE ATTEMPT ---");
        console.log("Attempting to collapse parentId:", parentId);
        console.log("Current state of ALL edges in the graph:", data.edges.get());

        const originalChildren = getDirectChildren(parentId);

        console.log("Children found for this specific parentId:", originalChildren);
        console.log("Number of children found:", originalChildren.length);
        if (collapsedParentIds.current.has(parentId)) {
            return;
        }

        const node = data.nodes.get(parentId);
        if (!node || !node.isParent) {
            return;
        }

        if (originalChildren.length === 0) {
            return;
        }

        const collapseDescendantParents = (nodeId) => {
            const children = getDirectChildren(nodeId);
            children.forEach(childId => {
                const childNode = data.nodes.get(childId);
                if (childNode && childNode.isParent) {
                    if (!collapsedParentIds.current.has(childId)) {
                        collapseNode(networkInstance, childId);
                        collapsedParentIds.current.add(childId);
                    }
                }
                collapseDescendantParents(childId);
            });
        };
        collapseDescendantParents(parentId);
        const childCount = originalChildren.length;
        const childReps = originalChildren.map(childId =>
            collapsedParentIds.current.has(childId) ? `cluster-${childId}` : childId
        );
        const getRandomClusterColor = () => {
            const colors = [
                { bg: '#FF6B6B', border: '#FF5252', text: '#000000' }, { bg: '#4ECDC4', border: '#26A69A', text: '#000000' },
                { bg: '#45B7D1', border: '#2196F3', text: '#000000' }, { bg: '#96CEB4', border: '#66BB6A', text: '#000000' },
                { bg: '#FECA57', border: '#FF9800', text: '#000000' }, { bg: '#FF9FF3', border: '#E91E63', text: '#000000' },
                { bg: '#A8E6CF', border: '#4CAF50', text: '#000000' }, { bg: '#FFB347', border: '#FF5722', text: '#000000' },
                { bg: '#DDA0DD', border: '#9C27B0', text: '#000000' }, { bg: '#87CEEB', border: '#03A9F4', text: '#000000' },
                { bg: '#F0E68C', border: '#CDDC39', text: '#000000' }, { bg: '#FFA07A', border: '#FF7043', text: '#000000' },
            ];
            const index = parentId % colors.length;
            return colors[index];
        };
        const clusterColor = getRandomClusterColor();
        const clusterNodeProperties = {
            id: `cluster-${parentId}`,
            label: `${node.label} (+${childCount})`,
            note: node.note || '',
            shape: 'circle',
            value: childCount,
            color: { background: clusterColor.bg, border: clusterColor.border },
            font: { color: '#000000' }
        };
        clusterNodeProperties.title = generateNodeTitle(clusterNodeProperties);
        networkInstance.cluster({
            joinCondition: (childNode) => childNode.id === parentId || childReps.includes(childNode.id),
            clusterNodeProperties: clusterNodeProperties
        });
        collapsedParentIds.current.add(parentId);
    }, [data, getDirectChildren]);

    useEffect(() => {
        const options = getNetworkOptions(isDark);
        const network = new Network(containerRef.current, data, options);
        networkRef.current = network;

        const onSave = () => autoSave();
        data.nodes.on('*', onSave);
        data.edges.on('*', onSave);

        network.on("selectNode", (params) => setSelectedNodeId(params.nodes[0]));
        network.on("deselectNode", () => setSelectedNodeId(null));

        network.on("doubleClick", (params) => {
            const nodeId = params.nodes[0];
            if (!nodeId) return;

            if (network.isCluster(nodeId) || String(nodeId).startsWith('cluster-')) {
                const parentId = parseInt(String(nodeId).replace('cluster-', ''));
                network.openCluster(nodeId);
                collapsedParentIds.current.delete(parentId);
                recursiveOpenDescendants(network, parentId);
                autoSave();
                return;
            }

            const node = data.nodes.get(nodeId);
            if (!node) return;

            if (node.url && node.url.trim() !== '') {
                window.open(node.url, "_blank");
                return;
            }

            if (node.isParent) {
                collapseNode(network, nodeId);
                autoSave();
            }
        });

        if (collapsedParentIds.current.size > 0) {
            const order = getBottomUpOrder(collapsedParentIds.current);
            order.forEach(parentId => {
                collapseNode(network, parentId);
            });
            autoSave();
        }

        return () => {
            data.nodes.off('*', onSave);
            data.edges.off('*', onSave);
            network.destroy();
        };
    }, [data, isDark, autoSave, collapseNode, recursiveOpenDescendants, getBottomUpOrder]);

    useEffect(() => {
        if (networkRef.current) {
            networkRef.current.setOptions(getNetworkOptions(isDark));
        }
    }, [isDark]);


    const handleSearchSelect = useCallback((nodeId) => {
        const network = networkRef.current;
        if (!network || !data.nodes.get(nodeId)) return;

        // Helper to find all ancestors of a node
        const getAncestors = (id) => {
            const ancestors = [];
            let currentId = id;
            while (true) {
                const edge = data.edges.get({ filter: e => e.to === currentId })[0];
                if (!edge) break;
                ancestors.push(edge.from);
                currentId = edge.from;
            }
            return ancestors;
        };

        const ancestors = getAncestors(nodeId);
        const collapsedAncestor = ancestors.find(id => collapsedParentIds.current.has(id));

        const performFocus = () => {
            // Expand any collapsed parents leading to the node
            ancestors.reverse().forEach(ancestorId => {
                if (collapsedParentIds.current.has(ancestorId)) {
                    network.openCluster(`cluster-${ancestorId}`);
                    collapsedParentIds.current.delete(ancestorId);
                }
            });

            // Focus and select the node
            network.focus(nodeId, { animation: { duration: 1000, easingFunction: 'easeInOutQuad' } });
            network.selectNodes([nodeId]);
            setSelectedNodeId(nodeId);
        };

        if (collapsedAncestor) {
            if (window.confirm("This node is inside a collapsed cluster. Expanding it may rearrange your graph. Do you want to continue?")) {
                performFocus();
            }
        } else {
            performFocus();
        }
    }, [data]);

    return {
        containerRef,
        selectedNodeId,
        selectedNode: selectedNodeId ? data.nodes.get(selectedNodeId) : null,
        modalState,
        closeModal,
        handleModalSubmit,
        handleAddRootNode,
        handleAddNode,
        handleDeleteNode,
        handleEditNode,
        handleAddEditNote,
        handleOpenUrl,
        handleClearSelection,
        handleToggleCollapse,
        handleSearchSelect,
        data,
    };
};