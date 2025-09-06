# Testing Directory

This directory contains all testing and debugging artifacts for the abscan project.

## Purpose

- **Testing outputs**: Results from test runs and experimental scans
- **Debug artifacts**: Debug files, logs, and diagnostic outputs  
- **Temporary data**: Any temporary files generated during development
- **Experimental builds**: Test builds and configurations

## Structure

Organize testing artifacts in subdirectories by category:

```
testing/
├── debug/          # Debug files (e.g., scroll-debug.html)
├── outputs/        # Test scan outputs  
├── builds/         # Experimental builds
├── logs/           # Debug and error logs
└── temp/           # Temporary files
```

## Guidelines

1. **Always use subdirectories** - Don't put files directly in `/testing`
2. **Clean up regularly** - Remove old artifacts that are no longer needed
3. **Document significant tests** - Add README files for complex test scenarios
4. **Use descriptive names** - Include dates or purpose in directory names

## Note

This directory and its contents are excluded from version control via `.gitignore`.
All artifacts here are temporary and safe to delete.