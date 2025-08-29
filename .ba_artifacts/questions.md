# Development Questions for Future Consideration

## Scan Chosen Directory Feature

### Menu and UX Questions
1. **Menu location**: Should this be a new menu item? Where should it appear - under File menu (like "File > Scan Directory...") or as a separate menu?
   - **Decision**: New menu item under File called "Scan…"

2. **Progress indication**: During the scanning process, how should progress be shown to the user? Should there be a progress bar, spinner, or status messages in the UI?
   - **Current approach**: TBD - needs design consideration

3. **Scan completion**: After scanning completes and files are saved, what should happen next? Should the viewer automatically load the newly generated abscan.json file, or just show a success message?
   - **Decision**: For now, don't show completion message. User manually loads files afterward.

4. **Error handling**: What should happen if the scan fails (permissions, invalid directory, CLI errors)? How detailed should error messages be?
   - **Decision**: Report most recent error from stack trace for now

5. **Scan options**: Should users have access to any of the CLI scan options (like excluding node_modules, specific file types, etc.) or keep it simple with default settings?
   - **Decision**: Default settings for now - ignore node_modules, scan everything else

6. **Background operation**: Should scanning run in the background allowing users to continue using the viewer, or should it block the UI until complete?
   - **Decision**: Foreground scanning for now (blocks UI)

### Future Enhancement Considerations
- Progress indicators for long-running scans
- Background scanning with notifications
- Advanced scan configuration options
- Auto-loading of newly generated files
- Better error reporting and recovery
- Scan history and recent projects

## Dev Agent Questions

### Menu Configuration Architecture (from dev agent implementing "Scan chosen directory")
**Question**: I notice there's duplicate logic in the menu.ts file - it has the hardcoded menu configuration and also processes it. Let me check if this file is actually loading from the JSON file or using the hardcoded config. First, let me look at the CLI scanning code to understand how the scanning process works.

**Context**: While implementing the Scan… menu item, the dev agent discovered potential confusion between hardcoded menu config in menu.ts versus expected JSON-based configuration. Need to clarify the intended menu configuration approach before proceeding with implementation.

**Follow-up needed**: 
- Verify whether menu system should use JSON config or hardcoded config
- Understand current CLI scanning process for integration
- Clarify menu configuration architecture for consistent implementation

### CLI Options Discovery (from dev agent implementing "Scan chosen directory")
**Question**: I notice there's duplicate logic in the menu.ts file - it has the hardcoded menu configuration and also processes it. Let me check if this file is actually loading from the JSON file or using the hardcoded config. First, let me look at the CLI scanning code to understand how the scanning process works.

**Available CLI Options Found**:
- `-p, --path <path>` - path to scan (default: '.')
- `-o, --output-dir <path>` - output directory (default: './output') 
- `--type-paths <mode>` - type path display mode: clean, filename, or full (default: 'clean')
- `--include-node-modules` - include node_modules in file system scan (default: false)
- `--include-git` - include .git directory in file system scan (default: false)
- `--files-output <filename>` - custom filename for file structure output (default: 'files.json')
- `--miller-output <filename>` - custom filename for Miller columns output (default: 'miller-columns.json')
- `--icon-config <path>` - path to custom icon mapping configuration file
- `--skip-filesystem` - skip file system scanning (default: false)
- `--skip-miller` - skip Miller columns transformation (default: false)
- `--classes-output <filename>` - custom filename for class analysis output (default: 'classes.json')
- `--class-miller-output <filename>` - custom filename for class Miller columns output (default: 'class-miller-columns.json')
- `--skip-classes` - skip class analysis (default: false)
- `--skip-class-miller` - skip class Miller columns transformation (default: false)

**Implementation Question**: Should the GUI expose any/all of these options in a configuration interface, or stick with defaults as specified in the story?

### Scan Configuration Interface Requirements
**Clarified Requirements for Advanced Scan Dialog**:
- Dialog title: "Scan Application"
- Triggered by: File > Scan... menu item (supersedes current simple logic)
- Options to expose:
  1. Scan path (default: directory Electron app was invoked from) with "Choose..." button
  2. Output path (default: /output subdirectory of selected scan path) with "Choose..." button  
  3. Include node_modules toggle (default: false)
  4. Include git toggle (default: false)
- Action buttons: "Scan" and "Cancel"
- Validation: Verify scan path exists and output path is writable before allowing scan
- Styling: Follow current dark theme styling with Tailwind
- Skip exposing: files output names, miller output names, classes output names, icon config, skip flags