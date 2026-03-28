import React from 'react'

const presets = [1, 2, 4, 8, 16]

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
  </svg>
)

const SkullIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a9 9 0 0 1 9 9c0 3.18-1.65 5.97-4.14 7.57L16 21H8l-.86-2.43C4.65 16.97 3 14.18 3 11a9 9 0 0 1 9-9z"/>
    <line x1="9" y1="14" x2="9" y2="17"/>
    <line x1="15" y1="14" x2="15" y2="17"/>
    <circle cx="9" cy="11" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="11" r="1.5" fill="currentColor"/>
  </svg>
)

export default function SettingsPanel({ threadCount, onThreadCountChange, useRecycleBin, onRecycleBinChange, disabled }) {
  return (
    <div style={styles.wrapper}>
      {/* Row 1: Delete mode toggle */}
      <div style={styles.panel}>
        <div style={styles.labelGroup}>
          <span style={styles.label}>Delete Mode</span>
          <span style={styles.hint}>How items are removed</span>
        </div>
        <div style={styles.toggleGroup}>
          <button
            style={{ ...styles.modeBtn, ...(useRecycleBin ? styles.modeBtnActiveGreen : {}) }}
            onClick={() => !disabled && onRecycleBinChange(true)}
            disabled={disabled}
            title="Move items to system Recycle Bin / Trash (recoverable)"
          >
            <TrashIcon />
            <span>Recycle Bin</span>
            {useRecycleBin && <span style={styles.defaultTag}>default</span>}
          </button>
          <button
            style={{ ...styles.modeBtn, ...(!useRecycleBin ? styles.modeBtnActiveRed : {}) }}
            onClick={() => !disabled && onRecycleBinChange(false)}
            disabled={disabled}
            title="Permanently delete items — CANNOT be recovered"
          >
            <SkullIcon />
            <span>Permanent</span>
            {!useRecycleBin && <span style={styles.warnTag}>⚠ irreversible</span>}
          </button>
        </div>
      </div>

      {/* Row 2: Thread settings */}
      <div style={styles.panel}>
        <div style={styles.labelGroup}>
          <span style={styles.label}>Worker Threads</span>
          <span style={styles.hint} title="More threads = faster deletion across multiple folders simultaneously">ⓘ Parallel goroutines</span>
        </div>
        <div style={styles.threadDots}>
          {Array.from({ length: Math.min(threadCount, 16) }).map((_, i) => (
            <div key={i} style={{ ...styles.dot, background: i < threadCount ? '#ef4444' : '#1e1e1e', boxShadow: i < threadCount ? '0 0 4px rgba(239,68,68,0.4)' : 'none' }} />
          ))}
          {threadCount > 16 && <span style={styles.dotOverflow}>+{threadCount - 16}</span>}
        </div>
        <div style={styles.presets}>
          {presets.map(p => (
            <button key={p} style={{ ...styles.presetBtn, ...(threadCount === p ? styles.presetActive : {}) }} onClick={() => !disabled && onThreadCountChange(p)} disabled={disabled}>{p}</button>
          ))}
        </div>
        <div style={styles.inputGroup}>
          <input type="number" min={1} max={32} value={threadCount} onChange={e => { const v = parseInt(e.target.value) || 1; onThreadCountChange(Math.max(1, Math.min(32, v))) }} disabled={disabled} style={styles.input} />
          <span style={styles.inputSuffix}>/ 32</span>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 },
  panel: { display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 14px', background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: '6px' },
  labelGroup: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '100px' },
  label: { fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '600', color: '#a3a3a3' },
  hint: { fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#404040', cursor: 'help' },
  toggleGroup: { display: 'flex', gap: '6px', flex: 1 },
  modeBtn: { fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: '500', color: '#525252', background: '#1a1a1a', border: '1px solid #252525', borderRadius: '5px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', transition: 'all 0.15s' },
  modeBtnActiveGreen: { color: '#22c55e', background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)', boxShadow: '0 0 8px rgba(34,197,94,0.08)' },
  modeBtnActiveRed: { color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)', boxShadow: '0 0 8px rgba(239,68,68,0.1)' },
  defaultTag: { fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '3px', padding: '1px 5px' },
  warnTag: { fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '3px', padding: '1px 5px' },
  threadDots: { display: 'flex', gap: '3px', alignItems: 'center', flex: 1, flexWrap: 'wrap' },
  dot: { width: '6px', height: '6px', borderRadius: '1px', transition: 'background 0.15s, box-shadow 0.15s' },
  dotOverflow: { fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#ef4444', marginLeft: '2px' },
  presets: { display: 'flex', gap: '4px' },
  presetBtn: { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: '600', color: '#525252', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', transition: 'all 0.15s' },
  presetActive: { color: '#ef4444', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  inputGroup: { display: 'flex', alignItems: 'center', gap: '4px' },
  input: { fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: '600', color: '#f5f5f5', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '4px 8px', width: '52px', textAlign: 'center', outline: 'none' },
  inputSuffix: { fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#404040' },
}
