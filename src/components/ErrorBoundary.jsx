import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          background: '#080b12',
          color: '#e8ecff',
          fontFamily: "'Jura', -apple-system, sans-serif",
          padding: '2rem',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</span>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: 'rgba(232,236,255,0.5)', fontSize: '0.95rem', maxWidth: '400px', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            CHRONO encountered an unexpected error. Your data is safe — try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.35)',
            }}
          >
            Refresh Page
          </button>
          <details style={{ marginTop: '2rem', color: 'rgba(232,236,255,0.3)', fontSize: '0.75rem', maxWidth: '500px' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Error details</summary>
            <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
