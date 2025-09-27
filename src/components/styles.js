// styles.js

// Function to generate the main vis-network options based on the theme

// export const getNetworkOptions = (isDark) => ({
//     nodes: {
//         shape: "box",
//         font: {
//             size: 16,
//             color: isDark ? '#ffffff' : '#333333',
//             // background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'
//         },
//         scaling: {
//             min: 20,  // The smallest a node can be
//             max: 50,  // The largest a node can be
//             label: {
//                 enabled: true, // Allow the label to influence the size
//                 min: 20,       // Minimum font size
//                 max: 50,       // Maximum font size
//             },
//         },

//         borderWidth: 2,
//         color: {
//             border: isDark ? '#555555' : '#cccccc',
//             background: isDark ? '#2d2d2d' : '#ffffff',
//             highlight: {
//                 border: '#007acc',
//                 background: isDark ? '#3d3d3d' : '#e6f3ff'
//             }
//         },
//         shadow: {
//             enabled: true,
//             color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)',
//             size: 10, x: 2, y: 2
//         }
//     },
//     edges: {
//         arrows: "to",
//         color: {
//             color: isDark ? '#666666' : '#848484',
//             highlight: '#007acc'
//         },
//         width: 2,
//         length: 300,
//         shadow: {
//             enabled: true,
//             color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)',
//             size: 5, x: 1, y: 1
//         }
//     },
//     interaction: {
//         hover: true,
//         tooltipDelay: 200,
//         selectConnectedEdges: false
//     },
//     physics: {
//         enabled: true,
//         stabilization: { iterations: 100 }
//     }
// });

export const getNetworkOptions = (isDark) => {
    return {
        autoResize: true,
        nodes: {
            shape: 'box',
            borderWidth: 2,
            font: {
                color: isDark ? '#e2e8f0' : '#2d3748',
                face: 'Electrolize, sans-serif',
            },
            color: {
                border: isDark ? '#4a5568' : '#cbd5e0',
                background: isDark ? '#2d3748' : '#ffffff',
                highlight: {
                    border: '#007acc',
                    background: isDark ? '#1a202c' : '#edf2f7',
                },
            },
        },
        edges: {
            color: {
                color: isDark ? '#4a5568' : '#cbd5e0',
                highlight: '#007acc',
            },
            arrows: {
                to: { enabled: true, scaleFactor: 0.7 }
            },
            smooth: {
                enabled: true,
                type: 'dynamic',
                roundness: 0.5
            }
        },
        interaction: {
            hover: true,
            tooltipDelay: 200,
        },
        // --- THIS IS THE NEW/UPDATED SECTION ---
        physics: {
            enabled: true,
            barnesHut: {
                gravitationalConstant: -8000,
                centralGravity: 0.3,
                springLength: 120,
                springConstant: 0.04,
                damping: 0.09,
                avoidOverlap: 0.5
            },
            solver: 'barnesHut',
            stabilization: {
                iterations: 1000,
            },
        },
    };
};

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
    position: 'fixed',
    top: '20px',
    right: '240px',
    zIndex: 1000,
    backgroundColor: isDark ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
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