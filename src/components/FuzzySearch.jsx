import { useState, useEffect, useRef, useCallback } from 'react';
import Fuse from 'fuse.js';

const FuzzySearch = ({ isOpen, onClose, nodes, onSelectNode, onEditNode, onOpenUrl, isDark }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fuse, setFuse] = useState(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Initialize Fuse.js with search options
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    const searchableNodes = nodes.map(node => ({
      id: node.id,
      label: node.label || '',
      url: node.url || '',
      note: node.note || '',
      is_parent: node.is_parent,
      is_root: node.is_root,
      searchText: `${node.label || ''} ${node.url || ''} ${node.note || ''}`.toLowerCase()
    }));

    const fuseOptions = {
      keys: [
        { name: 'label', weight: 0.6 },
        { name: 'url', weight: 0.3 },
        { name: 'note', weight: 0.1 }
      ],
      threshold: 0.4, // Lower = more strict matching
      distance: 100,
      includeMatches: true,
      includeScore: true,
      minMatchCharLength: 1,
      ignoreLocation: true
    };

    setFuse(new Fuse(searchableNodes, fuseOptions));
  }, [nodes]);

  // Perform search when search term changes
  useEffect(() => {
    if (!fuse || !searchTerm.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchResults = fuse.search(searchTerm).slice(0, 10); // Limit to 10 results
    setResults(searchResults);
    setSelectedIndex(0);
  }, [searchTerm, fuse]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchTerm('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
    const handleKeyDown = useCallback((event) => {
    if (!isOpen) return;

    switch (event.key) {
        case 'Escape':
        event.preventDefault();
        onClose();
        break;

        case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;

        case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;

        case 'Enter':
        event.preventDefault();
        if (results.length > 0 && results[selectedIndex]) {
            const selectedResult = results[selectedIndex];
            // If the node has a URL, open it. Otherwise, navigate to the node.
            if (selectedResult.item.url) {
            handleSelectResult(selectedResult, 'openUrl');
            } else {
            handleSelectResult(selectedResult, 'navigate');
            }
        }
        break;

        case 'Tab':
        event.preventDefault();
        if (results.length > 0 && results[selectedIndex]) {
            handleSelectResult(results[selectedIndex], 'edit');
        }
        break;
    }
    }, [isOpen, results, selectedIndex, onClose]);

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  // Handle result selection with different actions
  const handleSelectResult = (result, action = 'navigate') => {
    const node = result.item;
    
    switch (action) {
      case 'navigate':
        onSelectNode(node.id);
        onClose();
        break;
      case 'edit':
        onEditNode(node.id);
        onClose();
        break;
      case 'openUrl':
        if (node.url && node.url.trim()) {
            onOpenUrl(node.url);
            onClose(); // Also close the modal
        }
        break;
    }
  };

  // Highlight matching text in search results
  const highlightMatches = (text, matches) => {
  if (!matches || matches.length === 0) return text;

  const sortedMatches = matches.flatMap(match => match.indices).sort((a, b) => a[0] - b[0]);
  if (sortedMatches.length === 0) return text;

  const result = [];
  let lastIndex = 0;

  sortedMatches.forEach(([start, end]) => {
    // Add the text before the match
    if (start > lastIndex) {
      result.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, start)}</span>);
    }
    // Add the highlighted match
    result.push(
      <mark
        key={`mark-${start}`}
        style={{ backgroundColor: isDark ? '#ffd700' : '#ffeb3b', color: '#000', padding: '0 2px', borderRadius: '2px' }}
      >
        {text.slice(start, end + 1)}
      </mark>
    );
    lastIndex = end + 1;
  });

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    result.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return result;
};

  // Get highlighted text for a specific field
  const getHighlightedField = (result, fieldName) => {
    const matches = result.matches?.filter(match => match.key === fieldName) || [];
    const text = result.item[fieldName] || '';
    return highlightMatches(text, matches);
  };

  // IMPORTANT: Set up keyboard event listeners - this must be called regardless of isOpen
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Early return AFTER all hooks have been called
  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 10000,
    paddingTop: '10vh'
  };

  const modalStyle = {
    backgroundColor: isDark ? '#2d3748' : '#ffffff',
    color: isDark ? '#e2e8f0' : '#2d3748',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '70vh',
    overflow: 'hidden',
    boxShadow: isDark 
      ? '0 20px 25px -5px rgba(0, 0, 0, 0.8)' 
      : '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    border: isDark ? '1px solid #4a5568' : '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle = {
    padding: '20px 20px 0 20px',
    borderBottom: 'none'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: isDark ? '2px solid #4a5568' : '2px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: isDark ? '#1a202c' : '#f7fafc',
    color: isDark ? '#e2e8f0' : '#2d3748',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };

  const inputFocusStyle = {
    borderColor: '#007acc'
  };

  const resultsContainerStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 0',
    maxHeight: '400px'
  };

  const resultItemStyle = (isSelected) => ({
    padding: '12px 20px',
    cursor: 'pointer',
    borderLeft: isSelected ? '4px solid #007acc' : '4px solid transparent',
    backgroundColor: isSelected 
      ? (isDark ? '#4a5568' : '#f7fafc')
      : 'transparent',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: isDark ? '#4a5568' : '#f7fafc'
    }
  });

  const resultTitleStyle = {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px',
    color: isDark ? '#e2e8f0' : '#2d3748'
  };

  const resultSubtitleStyle = {
    fontSize: '12px',
    color: isDark ? '#a0aec0' : '#718096',
    marginBottom: '2px'
  };

  const resultUrlStyle = {
    fontSize: '12px',
    color: '#007acc',
    textDecoration: 'none',
    marginBottom: '2px'
  };

  const resultNoteStyle = {
    fontSize: '12px',
    color: isDark ? '#cbd5e0' : '#4a5568',
    fontStyle: 'italic',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  };

  const actionsStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '8px'
  };

  const actionButtonStyle = (color) => ({
    padding: '4px 8px',
    fontSize: '11px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: color,
    color: 'white',
    transition: 'opacity 0.2s ease'
  });

  const helpTextStyle = {
    padding: '10px 20px',
    fontSize: '12px',
    color: isDark ? '#a0aec0' : '#718096',
    backgroundColor: isDark ? '#1a202c' : '#f7fafc',
    borderTop: isDark ? '1px solid #4a5568' : '1px solid #e2e8f0'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search nodes by name, URL, or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...inputStyle,
              ...(inputRef.current === document.activeElement ? inputFocusStyle : {})
            }}
            onFocus={(e) => e.target.style.borderColor = '#007acc'}
            onBlur={(e) => e.target.style.borderColor = isDark ? '#4a5568' : '#e2e8f0'}
          />
        </div>

        <div style={resultsContainerStyle} ref={resultsRef}>
          {searchTerm.trim() && results.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: isDark ? '#a0aec0' : '#718096' }}>
              No results found for "{searchTerm}"
            </div>
          )}
          
          {results.map((result, index) => {
            const node = result.item;
            const isSelected = index === selectedIndex;
            
            return (
              <div
                key={node.id}
                style={resultItemStyle(isSelected)}
                onClick={() => handleSelectResult(result, 'navigate')}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div style={resultTitleStyle}>
                    {getHighlightedField(result, 'label') || 'Untitled Node'}
                </div>
                
                <div style={resultSubtitleStyle}>
                  {node.is_root ? '🌟 Root Node' : node.is_parent ? '📁 Parent Node' : '📄 Child Node'}
                  {result.score && ` • ${Math.round((1 - result.score) * 100)}% match`}
                </div>
                
                {node.url && (
                  <div style={resultUrlStyle}>
                    {getHighlightedField(result, 'url')}
                  </div>
                )}
                
                {node.note && (
                  <div style={resultNoteStyle}>
                    {getHighlightedField(result, 'note')}
                  </div>
                )}
                
                {isSelected && (
                  <div style={actionsStyle}>
                    <button
                      style={actionButtonStyle('#007acc')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectResult(result, 'navigate');
                      }}
                    >
                      Go to Node
                    </button>
                    <button
                      style={actionButtonStyle('#28a745')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectResult(result, 'edit');
                      }}
                    >
                      Edit
                    </button>
                    {node.url && (
                      <button
                        style={actionButtonStyle('#6f42c1')}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectResult(result, 'openUrl');
                        }}
                      >
                        Open URL
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={helpTextStyle}>
          <strong>Navigation:</strong> ↑↓ to navigate • Enter to go to node • Tab to edit • Esc to close
        </div>
      </div>
    </div>
  );
};

export default FuzzySearch;