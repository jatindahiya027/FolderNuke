import React from 'react'

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
)

const ZapIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

export default function ActionBar({ onStart, onClear, onAddFolder, isDeleting, folderCount }) {
  return (
    <div style={styles.bar}>
      {/* Secondary actions */}
      <div style={styles.secondary}>
        <button
          style={styles.ghostBtn}
          onClick={onAddFolder}
          disabled={isDeleting}
        >
          <PlusIcon />
          Add Folder
        </button>

        <button
          style={styles.ghostBtn}
          onClick={onClear}
          disabled={isDeleting || folderCount === 0}
        >
          <TrashIcon />
          Clear All
        </button>
      </div>

      {/* Primary nuke button */}
      <button
        style={{
          ...styles.nukeBtn,
          animation: !isDeleting && folderCount > 0 ? 'pulse-red 2s infinite' : 'none',
        }}
        onClick={onStart}
        disabled={isDeleting || folderCount === 0}
      >
        {isDeleting ? (
          <>
            <span className="spinner" />
            Nuking...
          </>
        ) : (
          <>
            <ZapIcon />
            NUKE CONTENTS
          </>
        )}
      </button>
    </div>
  )
}

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    flexShrink: 0,
    paddingTop: '4px',
    borderTop: '1px solid #1a1a1a',
  },
  secondary: {
    display: 'flex',
    gap: '6px',
  },
  ghostBtn: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '12px',
    fontWeight: '500',
    color: '#525252',
    background: 'transparent',
    border: '1px solid #1e1e1e',
    borderRadius: '5px',
    padding: '7px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  nukeBtn: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    fontWeight: '700',
    color: 'white',
    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    border: '1px solid #ef4444',
    borderRadius: '6px',
    padding: '9px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    transition: 'all 0.15s',
    boxShadow: '0 2px 12px rgba(239,68,68,0.25)',
  },
}
