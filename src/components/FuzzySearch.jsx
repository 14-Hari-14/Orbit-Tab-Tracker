import { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';

const FuzzySearch = ({ isOpen, onClose, nodes, isDark, onSelectNode, onEditNode, onOpenUrl }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const fuse = new Fuse(nodes, {
    keys: ['label', 'note', 'url'],
    threshold: 0.3,
    includeScore: true,
    includeMatches: true,
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setResults([]);
      setSelectedIndex(0);
      return;
    }
    const searchResults = fuse.search(searchTerm);
    setResults(searchResults.slice(0, 7)); // Limit results
    setSelectedIndex(0);
  }, [searchTerm, nodes]);
  
  // Highlight matching text in search results
  const highlightMatches = (text, matches = []) => {
    const sortedMatches = matches.flatMap(match => match.indices).sort((a, b) => a[0] - b[0]);
    if (sortedMatches.length === 0) return text;

    const result = [];
    let lastIndex = 0;
    sortedMatches.forEach(([start, end]) => {
      if (start > lastIndex) {
        result.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, start)}</span>);
      }
      result.push(
        <mark key={`mark-${start}`} style={{ backgroundColor: '#007acc', color: 'white', fontWeight: 'bold', fontStyle: 'normal' }}>
          {text.slice(start, end + 1)}
        </mark>
      );
      lastIndex = end + 1;
    });
    if (lastIndex < text.length) {
      result.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
    }
    return result;
  };

  const handleKeyDown = (e) => {
    // This is a simplified version of your handler. You can use your more advanced one.
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const result = results[selectedIndex];
      if (result) {
        if (result.item.url) onOpenUrl(result.item.url);
        else onSelectNode(result.item.id);
        onClose();
      }
    }
  };
  
  useEffect(() => {
    if(isOpen) {
        window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    if (resultsRef.current?.children[selectedIndex]) {
      resultsRef.current.children[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);


  if (!isOpen) return null;

  
  const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 10000, paddingTop: '15vh' };
  const modalStyle = { display: 'flex', flexDirection: 'column', width: '90%', maxWidth: '600px', backgroundColor: isDark ? '#1a202c' : '#ffffff', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`, overflow: 'hidden' };
  const inputContainerStyle = { position: 'relative', padding: '16px', borderBottom: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}` };
  const inputStyle = {
    // This prevents the input from overflowing its container
    boxSizing: 'border-box',
    width: '100%',
    padding: '12px 16px 12px 40px',
    fontSize: '16px',
    border: `1px solid ${isDark ? '#4a5568' : '#cbd5e0'}`,
    borderRadius: '8px',
    backgroundColor: isDark ? '#2d3748' : '#f7fafc',
    color: isDark ? '#e2e8f0' : '#2d3748',
    outline: 'none',
  };
  const searchIconStyle = { position: 'absolute', top: '50%', left: '30px', transform: 'translateY(-50%)', color: isDark ? '#a0aec0' : '#718096' };
  const resultsContainerStyle = { maxHeight: '400px', overflowY: 'auto' };
  const resultItemStyle = (isSelected) => ({ padding: '12px 16px', cursor: 'pointer', backgroundColor: isSelected ? (isDark ? '#2d3748' : '#edf2f7') : 'transparent', borderLeft: `3px solid ${isSelected ? '#007acc' : 'transparent'}` });
  const resultLabelStyle = { fontSize: '15px', fontWeight: '500', color: isDark ? '#e2e8f0' : '#1a202c' };
  const resultMetaStyle = { fontSize: '12px', color: isDark ? '#a0aec0' : '#718096', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
  const noResultsStyle = { padding: '40px 24px', textAlign: 'center', color: isDark ? '#a0aec0' : '#718096' };
  const footerStyle = { padding: '8px 16px', fontSize: '12px', color: isDark ? '#a0aec0' : '#718096', backgroundColor: isDark ? '#2d3748' : '#f7fafc', borderTop: `1px solid ${isDark ? '#4a5568' : '#e2e8f0'}`, textAlign: 'right' };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={inputContainerStyle}>
          <div style={searchIconStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by name, note, or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
        </div>
        
        <div style={resultsContainerStyle} ref={resultsRef}>
          {results.length > 0 ? (
            results.map((result, index) => (
              <div
                key={result.item.id}
                style={resultItemStyle(index === selectedIndex)}
                onClick={() => {
                  if (result.item.url) onOpenUrl(result.item.url);
                  else onSelectNode(result.item.id);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div style={resultLabelStyle}>{highlightMatches(result.item.label, result.matches.filter(m => m.key === 'label'))}</div>
                {result.item.note && <div style={resultMetaStyle}>{highlightMatches(result.item.note, result.matches.filter(m => m.key === 'note'))}</div>}
                {result.item.url && <div style={resultMetaStyle}>{highlightMatches(result.item.url, result.matches.filter(m => m.key === 'url'))}</div>}
              </div>
            ))
          ) : searchTerm && (
            <div style={noResultsStyle}>No results found for "{searchTerm}"</div>
          )}
        </div>
        
        <div style={footerStyle}>
          <strong>Enter</strong> to select • <strong>↑↓</strong> to navigate • <strong>Esc</strong> to close
        </div>
      </div>
    </div>
  );
};

export default FuzzySearch;