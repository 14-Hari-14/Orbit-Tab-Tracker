import React, { useRef, useEffect, useState } from "react";
import { DataSet, Network } from "vis-network/standalone";

const data = {
  nodes: new DataSet([
    { id: 1, label: "Root Cluster", shape: "ellipse", isParent: true },
    { id: 2, label: "Docs", shape: "box", isParent: true },
    { id: 3, label: "Python Docs", shape: "box", url: "https://docs.python.org" },
    { id: 4, label: "YouTube Link", shape: "image", image: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg", url: "https://youtu.be/dQw4w9WgXcQ" },
    { id: 5, label: "React Docs", shape: "box", url: "https://reactjs.org" },
    { id: 6, label: "JavaScript Guide", shape: "box", url: "https://developer.mozilla.org" },
    { id: 7, label: "Node.js Docs", shape: "box", url: "https://nodejs.org" }
  ]),
  edges: new DataSet([
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 2, to: 5 },
    { from: 2, to: 6 },
    { from: 2, to: 7 },
    { from: 1, to: 4 }
  ])
};

export default function Graph() {
  const containerRef = useRef(null);
  const networkRef = useRef(null); // store network instance
  const [collapsedClusters, setCollapsedClusters] = useState({}); // track cluster state

  useEffect(() => {
    const options = {
      nodes: {
        shape: "box",
        font: { size: 16 },
        borderWidth: 2
      },
      edges: {
        arrows: "to"
      },
      interaction: { hover: true },
      physics: { enabled: true }
    };

    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    // Handle node clicks
    network.on("selectNode", (params) => {
      const nodeId = params.nodes[0];
      const node = data.nodes.get(nodeId);

      console.log("Clicked node:", nodeId, node);

      // Check if clicked node is a cluster (collapsed state)
      if (network.isCluster(nodeId)) {
        console.log("Expanding cluster:", nodeId);
        network.openCluster(nodeId);
        // Find the original parent ID from the cluster ID
        const parentId = parseInt(nodeId.replace('cluster-', ''));
        setCollapsedClusters((prev) => {
          const copy = { ...prev };
          delete copy[parentId];
          return copy;
        });
        return;
      }

      // If node has a URL and is not a parent → open in new tab
      if (node?.url && !node?.isParent) {
        window.open(node.url, "_blank");
        return;
      }

      // If node is parent → toggle expand/collapse
      if (node?.isParent) {
        if (collapsedClusters[nodeId]) {
          // This shouldn't happen as collapsed nodes become clusters
          console.log("Node is marked as collapsed but not a cluster");
        } else {
          // Get all child nodes of this parent
          const edges = data.edges.get();
          const childNodes = edges.filter(edge => edge.from === nodeId).map(edge => edge.to);
          
          console.log("Child nodes to collapse:", childNodes);
          
          if (childNodes.length > 0) {
            // Collapse its children into a cluster
            const clusterId = `cluster-${nodeId}`;
            network.cluster({
              joinCondition: (childNode) => {
                // Include both the parent node and its children in the cluster
                return childNodes.includes(childNode.id) || childNode.id === nodeId;
              },
              clusterNodeProperties: {
                id: clusterId,
                label: `${node.label} (+${childNodes.length})`,
                borderWidth: 3,
                shape: "circle",
                color: {
                  background: "#FFD700",
                  border: "#FFA000"
                },
                font: { size: 14 }
              }
            });

            setCollapsedClusters((prev) => ({
              ...prev,
              [nodeId]: clusterId
            }));
          }
        }
      }
    });
  }, []);

  return <div ref={containerRef} style={{ height: "500px", border: "1px solid #ccc" }} />;
}
