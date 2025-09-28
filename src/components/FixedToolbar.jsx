import { getFixedToolbarStyle } from './styles';

// UI of the toolbar with buttons to add, delete, edit nodes and add/edit notes
export const FixedToolbar = ({ onAddRoot, onAdd, onDelete, onEdit, onNote, onShowShortcuts, isNodeSelected, selectedNodeLabel, isSelectedNodeParent, isDark }) => {
  const buttonStyle = { 
    padding: '10px 16px', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '14px', 
    fontWeight: '500', 
    transition: 'all 0.2s ease', 
    backgroundColor: '#007acc', 
    color: 'white', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px' 
  };

  const isAddChildEnabled = isNodeSelected && isSelectedNodeParent;
  
  const disabledButtonStyle = { 
    ...buttonStyle, 
    backgroundColor: isDark ? '#444' : '#e0e0e0', 
    color: isDark ? '#888' : '#999', 
    cursor: 'not-allowed' 
  };
  
  const statusStyle = { 
    fontSize: '12px', 
    color: isDark ? '#ccc' : '#666', 
    textAlign: 'center', 
    fontStyle: 'italic', 
    marginTop: '8px', 
    padding: '8px', 
    backgroundColor: isDark ? 'rgba(0, 122, 204, 0.2)' : 'rgba(0, 122, 204, 0.1)', 
    borderRadius: '6px' 
  };
  
  return ( 
    <div style={getFixedToolbarStyle(isDark)}> 
      
      <button 
        onClick={onAddRoot} 
        style={buttonStyle} 
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#005999')} 
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#007acc')} 
      > 
        <span>🌟</span> Add Root 
      </button> 

     <button 
        onClick={onAdd} 
        disabled={!isAddChildEnabled} 
        style={isAddChildEnabled ? buttonStyle : disabledButtonStyle} 
        onMouseOver={(e) => isAddChildEnabled && (e.currentTarget.style.backgroundColor = '#005999')} 
        onMouseOut={(e) => isAddChildEnabled && (e.currentTarget.style.backgroundColor = '#007acc')} 
      > 
        <span>➕</span> Add Child 
      </button> 
      
      <button 
        onClick={onDelete} 
        disabled={!isNodeSelected}
        style={isNodeSelected ? { ...buttonStyle, backgroundColor: '#dc3545' } : disabledButtonStyle} 
        onMouseOver={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#c82333')} 
        onMouseOut={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#dc3545')} 
      > 
        <span>🗑️</span> Delete Node 
      </button> 
      
      <button 
        onClick={onEdit} 
        disabled={!isNodeSelected} 
        style={isNodeSelected ? { ...buttonStyle, backgroundColor: '#28a745' } : disabledButtonStyle} 
        onMouseOver={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#218838')} 
        onMouseOut={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#28a745')} 
      > 
        <span>✏️</span> Edit Node 
      </button> 
      
      <button 
        onClick={onNote} 
        disabled={!isNodeSelected} 
        style={isNodeSelected ? { ...buttonStyle, backgroundColor: '#ffc107', color: '#212529' } : disabledButtonStyle} 
        onMouseOver={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#e0a800')} 
        onMouseOut={(e) => isNodeSelected && (e.currentTarget.style.backgroundColor = '#ffc107')} 
      > 
        <span>📝</span> Add/Edit Note 
      </button> 

      <button 
        onClick={onShowShortcuts} 
        style={{ ...buttonStyle, backgroundColor: '#6f42c1' }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#5a2d91')} 
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6f42c1')} 
        title="View keyboard shortcuts"
      > 
        <span>⌨️</span> Shortcuts 
      </button>
      
      <div style={statusStyle}> 
        {isNodeSelected ? `Selected: ${selectedNodeLabel}` : 'Select a node to enable actions'} 
      </div> 
    </div> 
  );
};