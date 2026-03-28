import React from 'react'
import FolderItem from './FolderItem.jsx'

const PlusIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#404040" strokeWidth="1.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

export default function FolderList({ folders, onRemove, onToggleSubdirs, onAddFolder, disabled }) {
  return (
    <div style={styles.wrapper}>
      {/* Header row */}
      <div style={styles.header}>
        <span style={styles.headerLabel}>Target Folders</span>
        {folders.length > 0 && (
          <span style={styles.countBadge}>{folders.length} folder{folders.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* List */}
      <div style={styles.list}>
        {folders.length === 0 ? (
          <div style={styles.emptyState} onClick={disabled ? undefined : onAddFolder}>
            <PlusIcon />
            <span style={styles.emptyText}>Add folders to nuke</span>
            <span style={styles.emptyHint}>Click to browse or drag paths here</span>
          </div>
        ) : (
          <div style={styles.items}>
            {folders.map((folder, i) => (
              <div key={folder.id} style={{ animationDelay: `${i * 0.03}s` }}>
                <FolderItem
                  folder={folder}
                  onRemove={onRemove}
                  onToggleSubdirs={onToggleSubdirs}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
    minHeight: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    fontWeight: '600',
    color: '#404040',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  countBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: '#ef4444',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '3px',
    padding: '1px 7px',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    minHeight: 0,
  },
  items: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingRight: '4px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '160px',
    border: '1px dashed #252525',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
  },
  emptyText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    color: '#525252',
    fontWeight: '500',
  },
  emptyHint: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: '#2a2a2a',
  },
}
