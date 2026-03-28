import React from 'react'

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const ErrorIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const NukeAnimIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="3"/>
    <line x1="12" y1="2" x2="12" y2="9"/>
    <line x1="12" y1="15" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="9" y2="12"/>
    <line x1="15" y1="12" x2="22" y2="12"/>
  </svg>
)

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export default function ProgressModal({ progress, onClose, visible, useRecycleBin }) {
  if (!visible) return null

  const percent = progress
    ? Math.round((progress.completed / progress.totalFolders) * 100)
    : 0

  const totalFiles = progress?.results?.reduce((s, r) => s + (r.filesDeleted || 0), 0) || 0
  const totalBytes = progress?.results?.reduce((s, r) => s + (r.bytesFreed || 0), 0) || 0
  const done = progress?.done

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ animation: done ? 'none' : 'spin 2s linear infinite' }}>
            <NukeAnimIcon />
          </div>
          <div>
            <div style={styles.title}>
              {done ? '💥 Nuke Complete' : 'Nuking Contents...'}
            </div>
            <div style={styles.subtitle}>
              {done
                ? `${progress.totalFolders} folder${progress.totalFolders !== 1 ? 's' : ''} processed`
                : `Processing ${progress?.completed || 0} of ${progress?.totalFolders || 0} folders ` + (useRecycleBin ? '· ♻ Recycle Bin' : '· ☠ Permanent')
              }
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${percent}%`,
              background: done ? '#22c55e' : '#ef4444',
              boxShadow: done
                ? '0 0 8px rgba(34,197,94,0.5)'
                : '0 0 8px rgba(239,68,68,0.5)',
            }}
          />
        </div>

        <div style={styles.progressLabel}>
          <span style={styles.percentText}>{percent}%</span>
          {progress?.currentPath && !done && (
            <span style={styles.currentPath} title={progress.currentPath}>
              {progress.currentPath}
            </span>
          )}
        </div>

        {/* Results list */}
        {progress?.results?.length > 0 && (
          <div style={styles.resultsList}>
            {[...progress.results].reverse().map((r, i) => (
              <div key={i} style={styles.resultItem}>
                <div style={styles.resultIcon}>
                  {r.success ? <CheckIcon /> : <ErrorIcon />}
                </div>
                <div style={styles.resultContent}>
                  <div style={styles.resultPath} title={r.path}>{r.path}</div>
                  {r.success ? (
                    <div style={styles.resultMeta}>
                      <span style={styles.metaGreen}>{r.filesDeleted} files</span>
                      <span style={styles.metaDim}>·</span>
                      <span style={styles.metaGreen}>{formatBytes(r.bytesFreed)} freed</span>
                    </div>
                  ) : (
                    <div style={styles.resultError}>{r.error}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {done && (
          <div style={styles.summary}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryValue}>{totalFiles.toLocaleString()}</span>
              <span style={styles.summaryLabel}>files deleted</span>
            </div>
            <div style={styles.summarySep} />
            <div style={styles.summaryItem}>
              <span style={styles.summaryValue}>{formatBytes(totalBytes)}</span>
              <span style={styles.summaryLabel}>space freed</span>
            </div>
            <div style={styles.summarySep} />
            <div style={styles.summaryItem}>
              <span style={styles.summaryValue}>{progress.results?.filter(r => r.success).length}</span>
              <span style={styles.summaryLabel}>succeeded</span>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          style={{
            ...styles.closeBtn,
            opacity: done ? 1 : 0.3,
            cursor: done ? 'pointer' : 'not-allowed',
          }}
          onClick={done ? onClose : undefined}
          disabled={!done}
        >
          {done ? 'Close' : 'Working...'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#111111',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    padding: '24px',
    width: '520px',
    maxWidth: '90vw',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '80vh',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  title: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '16px',
    fontWeight: '700',
    color: '#f5f5f5',
  },
  subtitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '12px',
    color: '#737373',
    marginTop: '2px',
  },
  progressTrack: {
    height: '4px',
    background: '#1e1e1e',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease, background 0.3s, box-shadow 0.3s',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },
  percentText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    fontWeight: '600',
    color: '#ef4444',
    flexShrink: 0,
  },
  currentPath: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: '#404040',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    direction: 'rtl',
    textAlign: 'left',
  },
  resultsList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '200px',
  },
  resultItem: {
    display: 'flex',
    gap: '8px',
    padding: '8px 10px',
    background: '#0d0d0d',
    border: '1px solid #1e1e1e',
    borderRadius: '5px',
    alignItems: 'flex-start',
  },
  resultIcon: {
    marginTop: '2px',
    flexShrink: 0,
  },
  resultContent: {
    flex: 1,
    minWidth: 0,
  },
  resultPath: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: '#a3a3a3',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  resultMeta: {
    display: 'flex',
    gap: '6px',
    marginTop: '3px',
    alignItems: 'center',
  },
  metaGreen: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: '#22c55e',
  },
  metaDim: {
    color: '#2a2a2a',
    fontSize: '10px',
  },
  resultError: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: '#ef4444',
    marginTop: '3px',
  },
  summary: {
    display: 'flex',
    background: '#0d0d0d',
    border: '1px solid #1e1e1e',
    borderRadius: '6px',
    padding: '12px 16px',
    gap: '0',
  },
  summaryItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
  },
  summaryValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '18px',
    fontWeight: '700',
    color: '#22c55e',
  },
  summaryLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '10px',
    color: '#525252',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  summarySep: {
    width: '1px',
    background: '#1e1e1e',
    margin: '4px 0',
  },
  closeBtn: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    fontWeight: '600',
    color: '#f5f5f5',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    padding: '10px',
    width: '100%',
    transition: 'all 0.15s',
    letterSpacing: '0.03em',
  },
}
