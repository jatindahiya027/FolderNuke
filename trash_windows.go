//go:build windows

package main

import (
	"fmt"
	"syscall"
	"unsafe"
)

var (
	shell32          = syscall.NewLazyDLL("shell32.dll")
	shFileOperationW = shell32.NewProc("SHFileOperationW")
)

// shFileOpStruct matches SHFILEOPSTRUCTW exactly (32/64-bit safe via uintptr).
type shFileOpStruct struct {
	hwnd                  uintptr
	wFunc                 uint32
	pFrom                 uintptr
	pTo                   uintptr
	fFlags                uint16
	fAnyOperationsAborted int32
	hNameMappings         uintptr
	lpszProgressTitle     uintptr
}

const (
	foDelete          = 0x0003
	fofAllowUndo      = 0x0040 // recycle bin (undoable)
	fofNoConfirmation = 0x0010 // no "Are you sure?" dialog
	fofNoErrorUI      = 0x0400 // suppress error popups
	fofSilent         = 0x0004 // no progress dialog shown by shell
)

// trashPath moves a single file or directory to the Windows Recycle Bin.
//
// Uses SHFileOperationW directly — same API Windows Explorer uses.
// Safe to call from multiple goroutines concurrently; each call gets its own
// stack-allocated SHFILEOPSTRUCTW and double-null-terminated path buffer so
// there is no shared mutable state between concurrent invocations.
func trashPath(path string) error {
	// SHFileOperationW requires a double-null-terminated UTF-16 string.
	// syscall.StringToUTF16 appends one null; we append a second.
	utf16 := syscall.StringToUTF16(path)
	buf := make([]uint16, len(utf16)+1) // +1 for the second null terminator
	copy(buf, utf16)
	// buf[len(utf16)] is already 0 (Go zero-initialises slices)

	op := shFileOpStruct{
		wFunc:  foDelete,
		pFrom:  uintptr(unsafe.Pointer(&buf[0])),
		fFlags: fofAllowUndo | fofNoConfirmation | fofNoErrorUI | fofSilent,
	}

	ret, _, _ := shFileOperationW.Call(uintptr(unsafe.Pointer(&op)))
	if ret != 0 {
		return fmt.Errorf("SHFileOperationW returned %d for path: %s", ret, path)
	}
	return nil
}
