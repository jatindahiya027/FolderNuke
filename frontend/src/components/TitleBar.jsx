import React from 'react'

// Window control icons
const MinimizeIcon = () => (
  <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
    <rect width="10" height="1"/>
  </svg>
)

const MaximizeIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="0.6" y="0.6" width="8.8" height="8.8"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4">
    <line x1="1" y1="1" x2="9" y2="9"/>
    <line x1="9" y1="1" x2="1" y2="9"/>
  </svg>
)

const NukeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="3"/>
    <line x1="12" y1="2" x2="12" y2="9"/>
    <line x1="12" y1="15" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="9" y2="12"/>
    <line x1="15" y1="12" x2="22" y2="12"/>
  </svg>
)

export default function TitleBar() {
  const handleMinimize = () => {
    if (window.runtime?.WindowMinimise) window.runtime.WindowMinimise()
  }
  const handleMaximize = () => {
    if (window.runtime?.WindowToggleMaximise) window.runtime.WindowToggleMaximise()
  }
  const handleClose = () => {
    if (window.runtime?.Quit) window.runtime.Quit()
  }

  return (
    <div style={styles.bar}>
      {/* Drag region */}
      <div style={styles.dragRegion} />

      {/* Left: branding */}
      <div style={styles.branding}>
        <NukeIcon />
        <span style={styles.title}>FolderNuke</span>
        <span style={styles.badge}>v1.0</span>
      </div>

      {/* Right: window controls */}
      <div style={styles.controls}>
        <button style={styles.winBtn} onClick={handleMinimize} title="Minimize">
          <MinimizeIcon />
        </button>
        <button style={styles.winBtn} onClick={handleMaximize} title="Maximize">
          <MaximizeIcon />
        </button>
        <button style={{ ...styles.winBtn, ...styles.closeBtn }} onClick={handleClose} title="Close">
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}

const styles = {
  bar: {
    height: '40px',
    background: '#0d0d0d',
    borderBottom: '1px solid #1e1e1e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 0 0 14px',
    position: 'relative',
    flexShrink: 0,
  },
  dragRegion: {
    position: 'absolute',
    inset: 0,
    // Wails drag region style
    '--wails-draggable': 'drag',
    WebkitAppRegion: 'drag',
    zIndex: 0,
  },
  branding: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 1,
    pointerEvents: 'none',
  },
  title: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: '700',
    fontSize: '13px',
    color: '#f5f5f5',
    letterSpacing: '0.05em',
  },
  badge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: '#404040',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '3px',
    padding: '1px 5px',
  },
  controls: {
    display: 'flex',
    zIndex: 1,
  },
  winBtn: {
    width: '46px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#737373',
    transition: 'background 0.15s, color 0.15s',
    cursor: 'pointer',
    WebkitAppRegion: 'no-drag',
  },
  closeBtn: {
    // hover handled by event
  },
}
