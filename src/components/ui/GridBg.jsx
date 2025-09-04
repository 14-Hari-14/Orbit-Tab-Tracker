import React from "react";

export function GridBg({ isDark, children }) {
  const gridStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: isDark ? '#1a1a1a' : '#fafbfc',
    backgroundImage: isDark 
      ? `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
         linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`
      : `linear-gradient(rgba(0, 122, 204, 0.03) 1px, transparent 1px),
         linear-gradient(90deg, rgba(0, 122, 204, 0.03) 1px, transparent 1px)`,
    backgroundSize: '20px 20px',
    overflow: 'hidden'
  };

  return (
    <div style={gridStyle}>
      {children}
    </div>
  );
}