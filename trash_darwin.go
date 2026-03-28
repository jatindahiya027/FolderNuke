//go:build darwin

package main

import (
	"fmt"
	"os/exec"
	"strings"
)

func trashPath(path string) error {
	// Use AppleScript to move to Trash (preserves undo in Finder)
	safePath := strings.ReplaceAll(path, `"`, `\"`)
	script := fmt.Sprintf(`tell application "Finder" to delete POSIX file "%s"`, safePath)
	cmd := exec.Command("osascript", "-e", script)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("recycle bin failed: %w", err)
	}
	return nil
}
