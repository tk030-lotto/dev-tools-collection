import React from 'react';

export const App: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      textAlign: 'center',
      background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)'
    }}>
      <div style={{
        padding: '40px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
        maxWidth: '560px',
        width: '100%'
      }}>
        <div style={{
          fontSize: '3.5rem',
          marginBottom: '16px'
        }}>
          🛠️
        </div>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          background: 'var(--accent-gradient)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px'
        }}>
          DevTools Suite
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          marginBottom: '24px'
        }}>
          開発ツール集 - コア基盤 &amp; プラグインプラットフォーム
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--status-success)',
          fontWeight: 500,
          fontSize: '0.875rem'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--status-success)',
            boxShadow: '0 0 8px var(--status-success)'
          }} />
          Phase 1: コア基盤構築 (Vite + React + TS) 準備完了
        </div>
      </div>
    </div>
  );
};

export default App;
