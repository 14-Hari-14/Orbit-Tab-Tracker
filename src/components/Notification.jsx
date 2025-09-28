

import { useEffect, useState } from 'react';

export const Notification = ({ message, type = 'error', onClose }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {

    // Start the exit animation shortly before the component is removed
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 1500); // Start exiting after 3.5s

    // Remove the component after the animation is complete
    const closeTimer = setTimeout(onClose, 2000); // Remove after 4s

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [message, onClose]);

  const baseStyle = {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 20px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '500',
    zIndex: 10001,
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    transition: 'top 0.5s ease-in-out, opacity 0.5s ease-in-out',
    opacity: exiting ? 0 : 1,
    top: exiting ? '-50px' : '20px',
  };

  const typeStyles = {
    error: { backgroundColor: '#c53030' }, // Error
    success: { backgroundColor: '#2f855a' }, // Success
    info: { backgroundColor: '#2b6cb0' }, // Info
  };

  const style = { ...baseStyle, ...typeStyles[type] };

  return <div style={style}>{message}</div>;
};