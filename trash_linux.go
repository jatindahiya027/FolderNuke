//go:build linux

package main

import (
	"os"
	"os/exec"
)

func trashPath(path string) error {
	// Try trash-put (trash-cli package) first
	if exec.Command("trash-put", path).Run() == nil {
		return nil
	}
	// Try gio trash (GNOME)
	if exec.Command("gio", "trash", path).Run() == nil {
		return nil
	}
	// Try kioclient5 (KDE Plasma 5)
	if exec.Command("kioclient5", "move", path, "trash:/").Run() == nil {
		return nil
	}
	// Fallback: permanent delete
	return os.RemoveAll(path)
}
