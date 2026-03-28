import React, { useState, useEffect } from 'react'

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
)

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function FolderItem({ folder, onRemove, onToggleSubdirs, disabled }) {
  const [info, setInfo] = useState(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    // Call Wails binding to get folder info
    if (window.go?.main?.App?.GetFolderInfo) {
      window.go.main.App.GetFolderInfo(folder.path)
        .then(data => setInfo(data))
        .catch(() => setInfo(null))
    } else {
      // Dev mode mock
      setInfo({ exists: true, fileCount: 42, sizeFormatted: '1.2 GB' })
    }
  }, [folder.path])

  return (
    <div
      style={{
        ...styles.item,
        ...(hovered ? styles.itemHovered : {}),
        ...(disabled ? styles.itemDisabled : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left accent bar */}
      <div style={{
        ...styles.accentBar,
        background: hovered ? '#ef4444' : '#2a2a2a',
      }} />

      {/* Folder icon */}
      <div style={styles.iconWrap}>
        <FolderIcon />
      </div>

      {/* Path + meta */}
      <div style={styles.content}>
        <div style={styles.path} title={folder.path}>
          {folder.path}
        </div>
        {info && (
          <div style={styles.meta}>
            {info.exists ? (
              <>
                <span style={styles.metaBadge}>{info.fileCount} files</span>
                <span style={styles.metaBadge}>{info.sizeFormatted}</span>
              </>
            ) : (
              <span style={{ ...styles.metaBadge, color: '#ef4444', borderColor: '#7f1d1d' }}>
                ⚠ Not found
              </span>
            )}
          </div>
        )}
      </div>

      {/* Subdirs checkbox */}
      <label style={styles.checkLabel} onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={folder.includeSubdirs}
          onChange={() => !disabled && onToggleSubdirs(folder.id)}
          disabled={disabled}
          style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
        <span style={styles.checkText}>subdirs</span>
      </label>

      {/* Remove button */}
      <button
        style={{
          ...styles.removeBtn,
          color: hovered && !disabled ? '#ef4444' : '#404040',
        }}
        onClick={() => !disabled && onRemove(folder.id)}
        disabled={disabled}
        title="Remove folder"
      >
        <XIcon />
      </button>
    </div>
  )
}

const styles = {
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#111111',
    border: '1px solid #1e1e1e',
    borderRadius: '6px',
    padding: '10px 10px 10px 0',
    transition: 'border-color 0.15s, background 0.15s',
    animation: 'fadeSlideIn 0.2s ease forwards',
    overflow: 'hidden',
    position: 'relative',
  },
  itemHovered: {
    background: '#141414',
    borderColor: '#2a2a2a',
  },
  itemDisabled: {
    opacity: 0.5,
  },
  accentBar: {
    width: '3px',
    alignSelf: 'stretch',
    borderRadius: '0 2px 2px 0',
    transition: 'background 0.15s',
    flexShrink: 0,
  },
  iconWrap: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  path: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    color: '#d4d4d4',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    display: 'flex',
    gap: '6px',
  },
  metaBadge: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: '#737373',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '3px',
    padding: '1px 6px',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  checkText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    color: '#737373',
    whiteSpace: 'nowrap',
  },
  removeBtn: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'color 0.15s, background 0.15s',
    flexShrink: 0,
    cursor: 'pointer',
  },
}
