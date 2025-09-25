import { useRef, useEffect } from 'react';
import { Network } from "vis-network/standalone";
import { getNetworkOptions } from '../components/styles';

export const useNetworkGraph = ({
    containerRef,
    nodes,
    edges,
    isDark,
    onSelectNode,
    onDeselectNode,
    onDoubleClick,
    autoSave
}) => {
    const networkRef = useRef(null);

    useEffect(() => {
        const options = getNetworkOptions(isDark);
        const network = new Network(
            containerRef.current,
            { nodes: nodes.current, edges: edges.current },
            options
        );
        networkRef.current = network;

        // All network event handlers...
        network.on("selectNode", (params) => onSelectNode(params.nodes[0]));
        network.on("deselectNode", onDeselectNode);
        network.on("doubleClick", onDoubleClick);

        // Physics and stabilization handlers...

        nodes.current.on('*', autoSave);
        edges.current.on('*', autoSave);

        return () => {
            nodes.current.off('*', autoSave);
            edges.current.off('*', autoSave);
            network.destroy();
        };
    }, [isDark, /* other dependencies */]);

    return networkRef;
};