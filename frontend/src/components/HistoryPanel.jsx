import React, { useState } from 'react'

const HistoryIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-4.67"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const TrashSmIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  </svg>
)

const FolderSmIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
)

function formatDate(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function HistoryPanel({ history, onAddFromHistory, onClearHistory, disabled }) {
  const [expanded, setExpanded] = useState(false)

  if (history.length === 0) return null

  const visible = expanded ? history : history.slice(0, 3)

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <HistoryIcon />
          <span style={styles.headerLabel}>Previously Nuked</span>
          <span style={styles.countBadge}>{history.length}</span>
        </div>
        <div style={styles.headerActions}>
          {history.length > 3 && (
            <button style={styles.textBtn} onClick={() => setExpanded(e => !e)}>
              {expanded ? 'show less' : `+${history.length - 3} more`}
            </button>
          )}
          <button style={{ ...styles.textBtn, color: '#404040' }} onClick={onClearHistory} disabled={disabled} title="Clear history">
            <TrashSmIcon />
          </button>
        </div>
      </div>

      {/* History items */}
      <div style={styles.list}>
        {visible.map((entry) => (
          <div key={entry.id} style={styles.item}>
            <FolderSmIcon />
            <div style={styles.itemContent}>
              <span style={styles.itemPath} title={entry.path}>{entry.path}</span>
              <span style={styles.itemMeta}>
                {entry.filesDeleted.toLocaleString()} files · {entry.sizeFreed} · {formatDate(entry.timestamp)}
                {entry.useRecycleBin
                  ? <span style={styles.recycleBadge}>♻ bin</span>
                  : <span style={styles.permBadge}>☠ perm</span>
                }
              </span>
            </div>
            <button
              style={styles.addBtn}
              onClick={() => !disabled && onAddFromHistory(entry.path)}
              disabled={disabled}
              title="Add back to queue"
            >
              <PlusIcon />
              re-add
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    background: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '6px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
    maxHeight: '180px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#404040',
  },
  headerLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    fontWeight: '600',
    color: '#404040',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  countBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '9px',
    color: '#525252',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '3px',
    padding: '1px 5px',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  textBtn: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: '#525252',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    transition: 'color 0.15s',
  },
  list: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    background: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: '4px',
    transition: 'border-color 0.15s',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemPath: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    color: '#525252',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemMeta: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '9px',
    color: '#303030',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  recycleBadge: {
    color: '#22c55e',
    opacity: 0.6,
  },
  permBadge: {
    color: '#ef4444',
    opacity: 0.6,
  },
  addBtn: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: '#404040',
    background: '#1a1a1a',
    border: '1px solid #252525',
    borderRadius: '3px',
    padding: '3px 7px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
}
