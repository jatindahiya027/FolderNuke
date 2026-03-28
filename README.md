# 💥 FolderNuke

A blazing-fast desktop app to **nuke the contents of folders** using Go, Wails v2, and React.

Multi-threaded • Dark industrial UI • Native OS dialogs • Real-time progress

---

## Screenshot

Dark terminal-aesthetic UI with:
- Folder list with size badges and per-folder subdirectory toggle
- Worker thread selector (1–32) with visual indicators  
- Red "NUKE CONTENTS" button with confirmation step
- Real-time progress modal with per-folder results

---

## Prerequisites

Install these before building:

```bash
# 1. Go 1.21+
https://go.dev/dl/

# 2. Node.js 18+
https://nodejs.org/

# 3. Wails CLI
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# 4. Platform dependencies (Linux only)
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev
# Or on Arch: sudo pacman -S webkit2gtk
```

---

## Quick Start

```bash
# Clone / copy this project folder, then:
cd folder-nuke

# Install Go dependencies
go mod tidy

# Install frontend dependencies
cd frontend && npm install && cd ..

# Run in development mode (hot reload)
wails dev

# Build production binary
wails build
# → binary is in ./build/bin/folder-nuke
```

---

## Project Structure

```
folder-nuke/
├── main.go                    # Wails entry point (frameless window config)
├── app.go                     # Go backend: SelectFolder, DeleteFolderContents, GetFolderInfo
├── go.mod
├── wails.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx                    # Root: state, event listeners, handlers
        ├── index.css                  # Dark theme vars, global styles
        └── components/
            ├── TitleBar.jsx           # Custom frameless drag region + window controls
            ├── FolderList.jsx         # Scrollable list with empty state
            ├── FolderItem.jsx         # Per-folder row: path, size, subdirs checkbox
            ├── SettingsPanel.jsx      # Thread count: presets + custom input + dots
            ├── ActionBar.jsx          # Add / Clear / NUKE buttons
            └── ProgressModal.jsx      # Fullscreen overlay: progress bar + live results
```

---

## Features

| Feature | Details |
|---|---|
| **Add Folders** | Native OS directory picker via Wails runtime |
| **Folder Metadata** | Shows file count and total size on each row |
| **Include Subdirs** | Per-folder checkbox, enabled by default |
| **Multi-threading** | Go worker pool: goroutines + channels + WaitGroup |
| **Thread Control** | 1–32 threads, preset buttons (1/2/4/8/16) + custom input |
| **Live Progress** | Wails EventsEmit → React state updates in real-time |
| **Results Summary** | Files deleted + bytes freed per folder and overall |
| **Confirmation** | Double-click protection: first click arms, second nukes |
| **Frameless Window** | Custom drag region, minimize/maximize/close controls |

---

## How the Multi-threading Works (Go)

```go
// Worker pool in app.go
jobs := make(chan FolderEntry, len(folders))
resultsCh := make(chan DeleteResult, len(folders))
var wg sync.WaitGroup

// Launch N goroutines
for i := 0; i < threadCount; i++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        for entry := range jobs {
            result := a.deleteContents(entry)
            // Emit real-time progress to frontend
            runtime.EventsEmit(a.ctx, "deletion:progress", ...)
            resultsCh <- result
        }
    }()
}

// Feed all folders as jobs, then wait
for _, f := range folders { jobs <- f }
close(jobs)
wg.Wait()
close(resultsCh)
```

---

## Safety Notes

- ⚠️ **Deletes contents, not the folder itself** — `os.RemoveAll` is called on each child, not the root path
- ⚠️ **Irreversible** — no recycle bin, files are permanently deleted
- Double-confirmation UI prevents accidental nukes
- Paths are validated before any deletion begins

---

## Building for Distribution

```bash
# Windows (cross-compile from Linux/Mac)
GOOS=windows GOARCH=amd64 wails build

# macOS
wails build -platform darwin/universal

# Linux
wails build -platform linux/amd64
```

Output: `./build/bin/folder-nuke` (or `.exe` on Windows)
