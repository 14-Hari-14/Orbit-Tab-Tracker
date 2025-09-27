import { getProjectHeaderStyle } from './styles'
export const ProjectHeader = ({ isDark }) => (
  <div style={getProjectHeaderStyle(isDark)}>
    <div style={{ fontSize: '20px' }}>🌌</div>
    <div>
      <h1
        style={{
          fontSize: '24px',
          fontWeight: '600',
          background: 'linear-gradient(135deg, #007acc, #0099ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
        }}
      >
        Orbit
      </h1>
      <p
        style={{
          fontSize: '12px',
          color: isDark ? '#ccc' : '#666',
          fontWeight: '400',
          margin: 0,
        }}
      >
        Visual Knowledge Graph
      </p>
    </div>
  </div>
);