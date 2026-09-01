import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store';
import { isPhoneDevice } from '../utils/device';
import ScreenGate from './ScreenGate';

export default function AuthGuard({ children }) {
  const user = useStore(s => s.user);
  const authLoading = useStore(s => s.authLoading);

  // Strictly block phone devices (iPhone, Android mobile, screen < 768px)
  if (isPhoneDevice()) {
    return <ScreenGate showBackLink={true} />;
  }

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        color: 'var(--text)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  return children;
}
