import { getThemeToggleStyle } from './styles'

// switch between dark and light mode
export const ThemeToggle = ({ isDark, onToggle }) => (
  <div 
    style={{
      ...getThemeToggleStyle(isDark),
      position: 'fixed',
      top: '20px',
      right: '20px',
    }} 
    onClick={onToggle} 
    title="Toggle theme"
  >
    <div style={{ fontSize: '20px' }}>
      {isDark ? '☀️' : '🌙'}
    </div>
  </div>
);
