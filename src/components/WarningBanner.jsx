// File: src/components/WarningBanner.jsx (New File)

export const WarningBanner = ({ onLoginClick }) => {
  const bannerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#ffc107',
    color: '#333',
    textAlign: 'center',
    padding: '10px',
    fontSize: '14px',
    zIndex: 1000,
    borderBottom: '1px solid #e0a800',
  };

  const loginLinkStyle = {
    fontWeight: 'bold',
    textDecoration: 'underline',
    cursor: 'pointer',
    marginLeft: '8px',
  };

  return (
    <div style={bannerStyle}>
      You are not signed in. Your work is being saved to this browser only.
      <span onClick={onLoginClick} style={loginLinkStyle}>
        Sign in to save permanently.
      </span>
    </div>
  );
};