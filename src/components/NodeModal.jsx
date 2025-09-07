import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

// Reusable styles for the form elements, adapting to the theme
const inputStyle = (isDark) => ({
  width: 'calc(100% - 20px)', //  Reduce width to add some breathing room
  padding: '12px',
  borderRadius: '8px',
  border: `1px solid ${isDark ? '#555' : '#ccc'}`,
  backgroundColor: isDark ? '#333' : '#fff',
  color: isDark ? '#fff' : '#000',
  fontSize: '14px',
  marginBottom: '16px',
  boxSizing: 'border-box' // Include padding in width calculation
});

const buttonStyle = (isPrimary) => ({
  padding: '10px 20px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
  backgroundColor: isPrimary ? '#007acc' : '#6c757d',
  color: 'white'
});

export function NodeModal({ isOpen, onClose, onSubmit, initialData = null, mode, isDark }) {
  // State to manage the form's data
  const [formData, setFormData] = useState({
    label: '',
    url: '',
    note: '',
    isParent: false
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          label: initialData.label || '',
          url: initialData.url || '',
          note: initialData.note || '',
          isParent: initialData.isParent || false
        });
      } else {
        setFormData({
          label: '',
          url: '',
          note: '',
          isParent: mode === 'addRoot' ? true : false // Root nodes are always parents
        });
      }
    }
  }, [isOpen, initialData, mode]);

  // Update the form state as the user types
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // When the form is submitted, pass the data back to the parent component
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    switch (mode) {
      case 'add': return 'Add New Child Node';
      case 'addRoot': return 'Add New Root Node'; 
      case 'edit': return 'Edit Node';
      case 'note': return 'Edit Note';
      default: return 'Node Editor';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', position: 'fixed', inset: 0, zIndex: 1001 }} />
        <Dialog.Content style={{
          backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          maxWidth: '550px',
          padding: '32px',
          zIndex: 1002,
          color: isDark ? '#fff' : '#000',
        }}>
          <Dialog.Title style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
            {getModalTitle()}
          </Dialog.Title>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(mode === 'add' || mode === 'addRoot' || mode === 'edit') && ( // Include addRoot
              <>
                <label style={{ fontWeight: '500', marginBottom: '4px', fontSize: '14px' }}>Label</label>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  style={inputStyle(isDark)}
                  required
                />

                <label style={{ fontWeight: '500', marginBottom: '4px', fontSize: '14px' }}>URL (Optional)</label>
                <input
                  type="url"
                  name="url"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={handleChange}
                  style={inputStyle(isDark)}
                />
              </>
            )}

            {(mode === 'add' || mode === 'addRoot' || mode === 'edit' || mode === 'note') && ( // Include addRoot
              <>
                <label style={{ fontWeight: '500', marginBottom: '4px', fontSize: '14px' }}>Note</label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  style={{ 
                    ...inputStyle(isDark), 
                    minHeight: '100px', 
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </>
            )}

            {mode === 'add' && ( // Only show for regular add, not addRoot (since roots are always parents)
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                marginTop: '8px',
                padding: '12px',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderRadius: '8px'
              }}>
                <input
                  type="checkbox"
                  id="isParent"
                  name="isParent"
                  checked={formData.isParent}
                  onChange={handleChange}
                  style={{ marginRight: '12px', transform: 'scale(1.2)' }}
                />
                <label htmlFor="isParent" style={{ fontSize: '14px', cursor: 'pointer' }}>
                  Is this a parent node? (can group other nodes)
                </label>
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px', 
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: `1px solid ${isDark ? '#444' : '#eee'}` 
            }}>
              <button type="button" onClick={onClose} style={buttonStyle(false)}>
                Cancel
              </button>
              <button type="submit" style={buttonStyle(true)}>
                {mode === 'addRoot' ? 'Create Root' : 'Save Changes'} {/* Dynamic button text */}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}