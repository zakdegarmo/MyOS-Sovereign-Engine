// Suppress upstream THREE.Clock deprecation warnings from @react-three/fiber
const _origConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  if (typeof args[0] === 'string' && (args[0].includes('Clock: This module has been deprecated') || args[0].includes('THREE.Clock'))) {
    return;
  }
  _origConsoleWarn.apply(console, args);
};
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { OntologicalProvider } from './council/OntologicalContext.tsx'
import { WorldProvider } from './engine/WorldContext.tsx'
import { KitbasherApp } from './components/HUDModules/KitbasherApp.tsx'

const isKitbashMode = window.location.search.includes('kitbash');

class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Global React Error Boundary caught an error:", error, errorInfo);
    try {
      fetch('http://localhost:8081/api/telemetry/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.toString() || 'React Render Error',
          stack: error?.stack || '',
          componentStack: errorInfo?.componentStack || '',
          url: window.location.href
        })
      }).catch(() => {});
    } catch(e){}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: '#0a0d14',
          color: '#ef4444',
          padding: '40px',
          height: '100vh',
          fontFamily: 'monospace',
          overflow: 'auto'
        }}>
          <h1 style={{ fontSize: '24px', color: '#f87171' }}>⚠️ MyOS Engine Boot Error</h1>
          <p style={{ color: '#fbbf24', marginTop: '10px' }}>An initialization error occurred while mounting the application:</p>
          <pre style={{
            backgroundColor: '#18181b',
            padding: '20px',
            borderRadius: '6px',
            marginTop: '20px',
            color: '#38bdf8',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {this.state.error?.toString() || 'Unknown Error'}
            {'\n\nStack:\n' + (this.state.error?.stack || '')}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Engine
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <GlobalErrorBoundary>
    {isKitbashMode ? (
      <KitbasherApp />
    ) : (
      <WorldProvider>
        <OntologicalProvider>
          <App />
        </OntologicalProvider>
      </WorldProvider>
    )}
  </GlobalErrorBoundary>
)
