import React, { useState, useEffect, useCallback } from 'react'
import TitleBar from './components/TitleBar.jsx'
import FolderList from './components/FolderList.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import ActionBar from './components/ActionBar.jsx'
import ProgressModal from './components/ProgressModal.jsx'
import HistoryPanel from './components/HistoryPanel.jsx'

// ─── Wails bindings ───────────────────────────────────────────────────────────
const isWails = typeof window !== 'undefined' && !!window.go?.main?.App

const WailsApp = {
  SelectFolder: () => isWails
    ? window.go.main.App.SelectFolder()
    : Promise.resolve('/mock/path/folder-' + Math.random().toString(36).slice(2, 6)),
  DeleteFolderContents: (folders, threadCount) => isWails
    ? window.go.main.App.DeleteFolderContents(folders, threadCount)
    : Promise.resolve([]),
  GetFolderInfo: (path) => isWails
    ? window.go.main.App.GetFolderInfo(path)
    : Promise.resolve({ exists: true, fileCount: Math.floor(Math.random() * 500 + 1), sizeFormatted: `${(Math.random() * 2).toFixed(1)} GB` }),
}

const EventsOn = (event, callback) => {
  if (isWails && window.runtime?.EventsOn) return window.runtime.EventsOn(event, callback)
  return () => {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
let idCounter = 0
const genId = () => `folder-${++idCounter}-${Date.now()}`

const HISTORY_KEY = 'foldernuke_history'
const MAX_HISTORY = 50

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(history) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)) } catch {}
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [folders, setFolders] = useState([])
  const [threadCount, setThreadCount] = useState(4)
  const [useRecycleBin, setUseRecycleBin] = useState(true)   // ① default: recycle bin
  const [isDeleting, setIsDeleting] = useState(false)
  const [progress, setProgress] = useState(null)
  const [showProgress, setShowProgress] = useState(false)
  const [confirmNuke, setConfirmNuke] = useState(false)
  const [history, setHistory] = useState(loadHistory)         // ③ history

  // Load history from Go backend on startup (Wails only)
  useEffect(() => {
    if (isWails && window.go?.main?.App?.LoadHistory) {
      window.go.main.App.LoadHistory().then(entries => {
        if (entries && entries.length > 0) setHistory(entries)
      }).catch(() => {})
    }
  }, [])

  // Persist history to localStorage whenever it changes
  useEffect(() => { saveHistory(history) }, [history])

  // Helper: append completed results to history
  const appendToHistory = useCallback((results, recycleBin) => {
    const newEntries = results
      .filter(r => r.success)
      .map(r => ({
        id: genId(),
        path: r.path,
        filesDeleted: r.filesDeleted,
        sizeFreed: formatBytes(r.bytesFreed),
        useRecycleBin: recycleBin,
        timestamp: Date.now(),
      }))
    if (newEntries.length === 0) return
    setHistory(prev => {
      // Deduplicate by path (keep newest), prepend new entries, cap at MAX_HISTORY
      const withoutDupes = prev.filter(h => !newEntries.find(e => e.path === h.path))
      return [...newEntries, ...withoutDupes].slice(0, MAX_HISTORY)
    })
  }, [])

  // Listen for deletion progress events from Go backend
  useEffect(() => {
    const cleanup = EventsOn('deletion:progress', (data) => {
      setProgress(data)
      if (data.done) {
        setIsDeleting(false)
        setFolders([])                              // ② clear list after done
        appendToHistory(data.results, useRecycleBin)
      }
    })
    return cleanup
  }, [useRecycleBin, appendToHistory])

  const handleAddFolder = useCallback(async () => {
    try {
      const path = await WailsApp.SelectFolder()
      if (!path) return
      // Don't add duplicates
      setFolders(prev => {
        if (prev.find(f => f.path === path)) return prev
        return [...prev, { id: genId(), path, includeSubdirs: true }]
      })
    } catch (e) { console.error('SelectFolder error:', e) }
  }, [])

  // ③ Re-add a path from history
  const handleAddFromHistory = useCallback((path) => {
    setFolders(prev => {
      if (prev.find(f => f.path === path)) return prev
      return [...prev, { id: genId(), path, includeSubdirs: true }]
    })
  }, [])

  const handleRemoveFolder = useCallback((id) => {
    setFolders(prev => prev.filter(f => f.id !== id))
  }, [])

  const handleToggleSubdirs = useCallback((id) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, includeSubdirs: !f.includeSubdirs } : f))
  }, [])

  const handleStartDeletion = useCallback(async () => {
    if (folders.length === 0) return
    if (!confirmNuke) { setConfirmNuke(true); return }
    setConfirmNuke(false)

    const foldersToProcess = folders.map(f => ({ ...f, useRecycleBin }))
    setProgress({ totalFolders: foldersToProcess.length, completed: 0, currentPath: '', results: [], done: false })
    setShowProgress(true)
    setIsDeleting(true)

    try {
      if (!isWails) {
        // Dev mode: simulate progress
        await simulateProgress(foldersToProcess, setProgress, (done, results) => {
          if (done) {
            setIsDeleting(false)
            setFolders([])                          // ② clear list
            appendToHistory(results, useRecycleBin) // ③ save history
          }
        })
      } else {
        await WailsApp.DeleteFolderContents(foldersToProcess, threadCount)
        // ② + ③ handled in EventsOn handler above
      }
    } catch (e) {
      console.error('DeleteFolderContents error:', e)
      setIsDeleting(false)
    }
  }, [folders, threadCount, confirmNuke, useRecycleBin, appendToHistory])

  const handleClearAll = useCallback(() => {
    setFolders([])
    setConfirmNuke(false)
  }, [])

  const handleCloseProgress = useCallback(() => {
    setShowProgress(false)
    setProgress(null)
  }, [])

  const handleClearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return (
    <div style={styles.root}>
      <TitleBar />
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.appHeader}>
          <div>
            <div style={styles.appTitle}>Content Destroyer</div>
            <div style={styles.appDesc}>Select folders, configure threads, obliterate contents.</div>
          </div>
          {confirmNuke && !isDeleting && (
            <div style={styles.confirmBanner}>
              <span>⚠ {useRecycleBin ? 'Moves to Recycle Bin.' : 'PERMANENT delete — cannot be undone.'} Confirm?</span>
              <button style={styles.cancelConfirm} onClick={() => setConfirmNuke(false)}>Cancel</button>
            </div>
          )}
        </div>

        {/* ① History panel — shown above folder list */}
        <HistoryPanel
          history={history}
          onAddFromHistory={handleAddFromHistory}
          onClearHistory={handleClearHistory}
          disabled={isDeleting}
        />

        {/* Folder list */}
        <FolderList
          folders={folders}
          onRemove={handleRemoveFolder}
          onToggleSubdirs={handleToggleSubdirs}
          onAddFolder={handleAddFolder}
          disabled={isDeleting}
        />

        {/* Settings: delete mode + threads */}
        <SettingsPanel
          threadCount={threadCount}
          onThreadCountChange={setThreadCount}
          useRecycleBin={useRecycleBin}
          onRecycleBinChange={setUseRecycleBin}
          disabled={isDeleting}
        />

        {/* Action bar */}
        <ActionBar
          onStart={handleStartDeletion}
          onClear={handleClearAll}
          onAddFolder={handleAddFolder}
          isDeleting={isDeleting}
          folderCount={folders.length}
          useRecycleBin={useRecycleBin}
        />
      </div>

      <ProgressModal
        progress={progress}
        onClose={handleCloseProgress}
        visible={showProgress}
        useRecycleBin={useRecycleBin}
      />
    </div>
  )
}

// ─── Dev-mode simulation ──────────────────────────────────────────────────────
async function simulateProgress(folders, setProgress, onDone) {
  const results = []
  for (let i = 0; i < folders.length; i++) {
    await new Promise(r => setTimeout(r, 350 + Math.random() * 500))
    const result = {
      path: folders[i].path,
      success: true,
      filesDeleted: Math.floor(Math.random() * 300 + 5),
      bytesFreed: Math.floor(Math.random() * 2e9),
      error: '',
    }
    results.push(result)
    const done = i === folders.length - 1
    setProgress({ totalFolders: folders.length, completed: i + 1, currentPath: folders[i].path, results: [...results], done })
    if (done) onDone(true, results)
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' },
  content: { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 16px 16px', overflow: 'hidden', minHeight: 0 },
  appHeader: { flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' },
  appTitle: { fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: '700', color: '#404040', letterSpacing: '0.12em', textTransform: 'uppercase' },
  appDesc: { fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#2a2a2a', marginTop: '2px' },
  confirmBanner: { display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '5px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#ef4444', flex: 1 },
  cancelConfirm: { fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#737373', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '3px', padding: '3px 8px', cursor: 'pointer', flexShrink: 0 },
}
