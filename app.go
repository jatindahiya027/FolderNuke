package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"time"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// FolderEntry represents a folder to be nuked
type FolderEntry struct {
	ID             string `json:"id"`
	Path           string `json:"path"`
	IncludeSubdirs bool   `json:"includeSubdirs"`
	UseRecycleBin  bool   `json:"useRecycleBin"`
}

// DeleteResult holds the result of deleting a single folder's contents
type DeleteResult struct {
	Path         string `json:"path"`
	Success      bool   `json:"success"`
	Error        string `json:"error"`
	FilesDeleted int    `json:"filesDeleted"`
	BytesFreed   int64  `json:"bytesFreed"`
}

// DeletionProgress is emitted as a Wails event during deletion
type DeletionProgress struct {
	TotalFolders int            `json:"totalFolders"`
	Completed    int            `json:"completed"`
	CurrentPath  string         `json:"currentPath"`
	Results      []DeleteResult `json:"results"`
	Done         bool           `json:"done"`
}

// HistoryEntry is a previously nuked folder saved to disk
type HistoryEntry struct {
	ID            string `json:"id"`
	Path          string `json:"path"`
	FilesDeleted  int    `json:"filesDeleted"`
	SizeFreed     string `json:"sizeFreed"`
	UseRecycleBin bool   `json:"useRecycleBin"`
	Timestamp     int64  `json:"timestamp"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// SelectFolder opens a native OS folder picker dialog
func (a *App) SelectFolder() string {
	path, err := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Select Folder to Nuke",
	})
	if err != nil {
		return ""
	}
	return path
}

// GetFolderInfo returns metadata about a folder: size, file count, existence
func (a *App) GetFolderInfo(path string) map[string]interface{} {
	result := map[string]interface{}{
		"exists":        false,
		"fileCount":     0,
		"totalSize":     int64(0),
		"sizeFormatted": "0 B",
	}

	info, err := os.Stat(path)
	if err != nil || !info.IsDir() {
		return result
	}
	result["exists"] = true

	var totalSize int64
	var fileCount int
	filepath.WalkDir(path, func(p string, d os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if !d.IsDir() {
			fileCount++
			if fi, err := d.Info(); err == nil {
				totalSize += fi.Size()
			}
		}
		return nil
	})

	result["fileCount"] = fileCount
	result["totalSize"] = totalSize
	result["sizeFormatted"] = formatBytes(totalSize)
	return result
}

// DeleteFolderContents deletes contents of all folders.
// threadCount controls both the number of parallel folders AND the per-folder
// internal parallelism, so the full thread budget is always utilised.
func (a *App) DeleteFolderContents(folders []FolderEntry, threadCount int) []DeleteResult {
	if threadCount < 1 {
		threadCount = 1
	}
	if threadCount > 32 {
		threadCount = 32
	}

	// ── Tier-1: folder-level worker pool ────────────────────────────────────
	// We split the thread budget between folder-level and item-level workers.
	// With 1 folder → all threads go to item-level.
	// With many folders → at least 1 folder thread, remainder for items.
	folderWorkers := threadCount / 2
	if folderWorkers < 1 {
		folderWorkers = 1
	}
	// Each folder gets itemWorkers goroutines for its own children.
	itemWorkers := threadCount / folderWorkers
	if itemWorkers < 1 {
		itemWorkers = 1
	}

	jobs := make(chan FolderEntry, len(folders))
	resultsCh := make(chan DeleteResult, len(folders))

	var mu sync.Mutex
	var completedResults []DeleteResult
	var completedCount int32
	var wg sync.WaitGroup

	for i := 0; i < folderWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for entry := range jobs {
				result := a.deleteContentsParallel(entry, itemWorkers)

				cur := int(atomic.AddInt32(&completedCount, 1))

				mu.Lock()
				completedResults = append(completedResults, result)
				resultsCopy := make([]DeleteResult, len(completedResults))
				copy(resultsCopy, completedResults)
				mu.Unlock()

				wailsRuntime.EventsEmit(a.ctx, "deletion:progress", DeletionProgress{
					TotalFolders: len(folders),
					Completed:    cur,
					CurrentPath:  entry.Path,
					Results:      resultsCopy,
					Done:         cur == len(folders),
				})

				resultsCh <- result
			}
		}()
	}

	for _, folder := range folders {
		jobs <- folder
	}
	close(jobs)

	go func() {
		wg.Wait()
		close(resultsCh)
	}()

	var allResults []DeleteResult
	for r := range resultsCh {
		allResults = append(allResults, r)
	}

	a.appendHistory(allResults, len(folders) > 0 && folders[0].UseRecycleBin)
	return allResults
}

// deleteContentsParallel deletes the direct children of a folder using
// itemWorkers goroutines so individual files/subdirs are nuked in parallel.
func (a *App) deleteContentsParallel(entry FolderEntry, itemWorkers int) DeleteResult {
	result := DeleteResult{Path: entry.Path, Success: false}

	info, err := os.Stat(entry.Path)
	if err != nil {
		result.Error = fmt.Sprintf("path not found: %v", err)
		return result
	}
	if !info.IsDir() {
		result.Error = "path is not a directory"
		return result
	}

	children, err := os.ReadDir(entry.Path)
	if err != nil {
		result.Error = fmt.Sprintf("failed to read directory: %v", err)
		return result
	}

	// Filter children according to settings
	type childItem struct {
		path    string
		isDir   bool
		dirEnt  os.DirEntry
	}
	var items []childItem
	for _, child := range children {
		if !entry.IncludeSubdirs && child.IsDir() {
			continue
		}
		items = append(items, childItem{
			path:   filepath.Join(entry.Path, child.Name()),
			isDir:  child.IsDir(),
			dirEnt: child,
		})
	}

	if len(items) == 0 {
		result.Success = true
		return result
	}

	// ── Tier-2: item-level worker pool ───────────────────────────────────────
	type itemResult struct {
		filesDeleted int
		bytesFreed   int64
		err          string
	}

	itemJobs := make(chan childItem, len(items))
	itemResults := make(chan itemResult, len(items))

	workers := itemWorkers
	if workers > len(items) {
		workers = len(items)
	}

	var itemWg sync.WaitGroup
	for w := 0; w < workers; w++ {
		itemWg.Add(1)
		go func() {
			defer itemWg.Done()
			for item := range itemJobs {
				var res itemResult

				// Measure size before deletion
				if item.isDir {
					size, count := getDirSizeAndCount(item.path)
					res.bytesFreed = size
					res.filesDeleted = count
				} else {
					if fi, err2 := item.dirEnt.Info(); err2 == nil {
						res.bytesFreed = fi.Size()
					}
					res.filesDeleted = 1
				}

				// Delete
				var delErr error
				if entry.UseRecycleBin {
					delErr = trashPath(item.path)
				} else {
					delErr = os.RemoveAll(item.path)
				}
				if delErr != nil {
					res.err = fmt.Sprintf("error deleting %s: %v", item.path, delErr)
				}

				itemResults <- res
			}
		}()
	}

	for _, item := range items {
		itemJobs <- item
	}
	close(itemJobs)

	go func() {
		itemWg.Wait()
		close(itemResults)
	}()

	// Aggregate
	var firstErr string
	var totalFiles int
	var totalBytes int64
	for ir := range itemResults {
		totalFiles += ir.filesDeleted
		totalBytes += ir.bytesFreed
		if ir.err != "" && firstErr == "" {
			firstErr = ir.err
		}
	}

	result.Success = true
	result.FilesDeleted = totalFiles
	result.BytesFreed = totalBytes
	result.Error = firstErr
	return result
}

// ─── History persistence ──────────────────────────────────────────────────────

func historyFilePath() string {
	var dir string
	appData := os.Getenv("APPDATA")
	if appData != "" {
		dir = appData
	} else {
		home, _ := os.UserHomeDir()
		macPath := filepath.Join(home, "Library", "Application Support")
		if _, err := os.Stat(macPath); err == nil {
			dir = macPath
		} else {
			dir = filepath.Join(home, ".config")
		}
	}
	return filepath.Join(dir, "FolderNuke", "history.json")
}

// LoadHistory returns persisted deletion history
func (a *App) LoadHistory() []HistoryEntry {
	data, err := os.ReadFile(historyFilePath())
	if err != nil {
		return []HistoryEntry{}
	}
	var entries []HistoryEntry
	if err := json.Unmarshal(data, &entries); err != nil {
		return []HistoryEntry{}
	}
	return entries
}

// SaveHistory persists history to disk
func (a *App) SaveHistory(entries []HistoryEntry) bool {
	path := historyFilePath()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return false
	}
	data, err := json.MarshalIndent(entries, "", "  ")
	if err != nil {
		return false
	}
	return os.WriteFile(path, data, 0644) == nil
}

// ClearHistory deletes the history file
func (a *App) ClearHistory() bool {
	err := os.Remove(historyFilePath())
	return err == nil || os.IsNotExist(err)
}

// appendHistory saves newly deleted results to persistent history
func (a *App) appendHistory(results []DeleteResult, recycleBin bool) {
	existing := a.LoadHistory()
	var newEntries []HistoryEntry
	for _, r := range results {
		if !r.Success {
			continue
		}
		newEntries = append(newEntries, HistoryEntry{
			ID:            fmt.Sprintf("h-%d", time.Now().UnixNano()),
			Path:          r.Path,
			FilesDeleted:  r.FilesDeleted,
			SizeFreed:     formatBytes(r.BytesFreed),
			UseRecycleBin: recycleBin,
			Timestamp:     time.Now().UnixMilli(),
		})
	}
	pathSeen := map[string]bool{}
	for _, e := range newEntries {
		pathSeen[e.Path] = true
	}
	var merged []HistoryEntry
	merged = append(merged, newEntries...)
	for _, e := range existing {
		if !pathSeen[e.Path] {
			merged = append(merged, e)
		}
	}
	if len(merged) > 50 {
		merged = merged[:50]
	}
	a.SaveHistory(merged)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func getDirSizeAndCount(path string) (int64, int) {
	var size int64
	var count int
	filepath.WalkDir(path, func(p string, d os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if !d.IsDir() {
			count++
			if fi, err := d.Info(); err == nil {
				size += fi.Size()
			}
		}
		return nil
	})
	return size, count
}

func formatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}
