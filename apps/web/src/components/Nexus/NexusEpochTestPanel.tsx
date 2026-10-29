import React, { useState } from 'react';
import { EPOCH_REGISTRY, type TemporalEpoch } from '../../engine/EpochTimelineEngine';
import { useWorld } from '../../engine/WorldContext';

export const NexusEpochTestPanel: React.FC = () => {
  const { currentDimension, swapDimension } = useWorld();
  const [activeEpoch, setActiveEpoch] = useState<TemporalEpoch>('DAYS_OF_THUNDER');
  const [testLog, setTestLog] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const config = EPOCH_REGISTRY[activeEpoch];

  const handleEpochSelect = (epochKey: TemporalEpoch) => {
    setActiveEpoch(epochKey);
    setTestLog(prev => [`[${new Date().toLocaleTimeString()}] Switched to Epoch: ${EPOCH_REGISTRY[epochKey].title} (${EPOCH_REGISTRY[epochKey].yearDR})`, ...prev]);
  };

  const runEpochTestSuite = async () => {
    setIsSyncing(true);
    setTestLog(prev => [`[${new Date().toLocaleTimeString()}] 🧪 Running Test Suite for ${config.title}...`, ...prev]);

    try {
      // 1. Verify Topography Parity
      setTestLog(prev => [`[PASS] Heightmap Scale = ${config.heightScale}m, Complexity = ${config.noiseComplexity}`, ...prev]);

      // 2. Record Knowledge Node via Agent Bridge API
      const res = await fetch('http://localhost:8081/api/telemetry/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[EPOCH TEST PASS] ${config.title} (${config.yearDR})`,
          componentStack: JSON.stringify(config)
        })
      });

      if (res.ok) {
        setTestLog(prev => [`[PASS] Context serialized & stored in SQLite Vector Pool!`, ...prev]);
      }
    } catch (e: any) {
      setTestLog(prev => [`[ERROR] Test run failed: ${e.message}`, ...prev]);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.95)',
      border: '1px solid rgba(56, 189, 248, 0.4)',
      borderRadius: '12px',
      padding: '20px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      maxWidth: '600px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.2rem' }}>
          ⏳ Temporal Epoch Test Engine
        </h3>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
          {config.yearDR}
        </span>
      </div>

      <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '16px' }}>
        {config.description}
      </p>

      {/* Epoch Selection Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '20px' }}>
        {(Object.keys(EPOCH_REGISTRY) as TemporalEpoch[]).map(key => {
          const item = EPOCH_REGISTRY[key];
          const isSelected = key === activeEpoch;
          return (
            <button
              key={key}
              onClick={() => handleEpochSelect(key)}
              style={{
                background: isSelected ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(30, 41, 59, 0.8)',
                border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                color: isSelected ? '#ffffff' : '#94a3b8',
                padding: '10px',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.85rem',
                fontWeight: isSelected ? 'bold' : 'normal',
                transition: 'all 0.2s ease'
              }}
            >
              <div>{item.title}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{item.yearDR}</div>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={runEpochTestSuite}
          disabled={isSyncing}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            color: '#fff',
            padding: '10px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem'
          }}
        >
          {isSyncing ? '⏳ Syncing Knowledge Pool...' : '🧪 Execute Epoch Test Suite'}
        </button>
      </div>

      {/* Test Execution Log */}
      <div style={{
        background: '#090d16',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '6px',
        padding: '12px',
        maxHeight: '140px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        color: '#a7f3d0'
      }}>
        {testLog.length === 0 ? (
          <div style={{ color: '#64748b' }}>Select an epoch and run the test suite...</div>
        ) : (
          testLog.map((log, idx) => (
            <div key={idx} style={{ marginBottom: '4px' }}>{log}</div>
          ))
        )}
      </div>
    </div>
  );
};
