// styles.js

// Function to generate the main vis-network options based on the theme
export const getNetworkOptions = (isDark) => ({
    nodes: {
        shape: "box",
        font: {
            size: 16,
            color: isDark ? '#ffffff' : '#333333',
            // background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'
        },
        scaling: {
            min: 20,  // The smallest a node can be
            max: 50,  // The largest a node can be
            label: {
                enabled: true, // Allow the label to influence the size
                min: 20,       // Minimum font size
                max: 50,       // Maximum font size
            },
        },
        margin: 10,
        borderWidth: 2,
        color: {
            border: isDark ? '#555555' : '#cccccc',
            background: isDark ? '#2d2d2d' : '#ffffff',
            highlight: {
                border: '#007acc',
                background: isDark ? '#3d3d3d' : '#e6f3ff'
            }
        },
        shadow: {
            enabled: true,
            color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)',
            size: 10, x: 2, y: 2
        },
        chosen: {
            node: function (values, id, selected, hovering) {
                values.borderWidth = 3;
                values.color = '#007acc';
            }
        }
    },
    edges: {
        arrows: "to",
        color: {
            color: isDark ? '#666666' : '#848484',
            highlight: '#007acc'
        },
        width: 2,
        length: 200,
        smooth: {
            enabled: true,
            type: "dynamic",
            roundness: 0.5
        },
        shadow: {
            enabled: true,
            color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
            size: 5, x: 1, y: 1
        },
        chosen: {
            edge: function (values, id, selected, hovering) {
                values.color = '#007acc';
                values.width = 3;
            }
        }
    },
    interaction: {
        hover: true,
        tooltipDelay: 200,
        selectConnectedEdges: false
    },
    physics: {
        enabled: true,
        stabilization: {
            iterations: 200,
            updateInterval: 25,
            onlyDynamicEdges: false,
            fit: true
        },
        barnesHut: {
            gravitationalConstant: -2000,
            centralGravity: 0.3,
            springLength: 120,
            springConstant: 0.04,
            damping: 0.09,
            avoidOverlap: 0.5
        },
        solver: 'barnesHut',
        timestep: 0.5,
        adaptiveTimestep: true,
        minVelocity: 0.75,
        maxVelocity: 30
    },
    layout: {
        improvedLayout: true,
        clusterThreshold: 150,
        hierarchical: {
            enabled: false
        }
    }
});

// Project Header component styles
export const getProjectHeaderStyle = (isDark) => ({
    position: 'fixed',
    top: '20px',
    left: '20px',
    zIndex: 1000,
    backgroundColor: isDark ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
});

// Theme Toggle component styles
export const getThemeToggleStyle = (isDark) => ({
    height: '40px', // Match login button height
    width: '40px', // Make it a square
    zIndex: 1000,
    backgroundColor: isDark ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    borderRadius: '8px', // Match login button
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex', // Center the icon
    alignItems: 'center',
    justifyContent: 'center'
});

// Fixed Toolbar component styles
export const getFixedToolbarStyle = (isDark) => ({
    position: 'fixed',
    top: '90px',
    right: '20px',
    zIndex: 1000,
    backgroundColor: isDark ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '200px'
});