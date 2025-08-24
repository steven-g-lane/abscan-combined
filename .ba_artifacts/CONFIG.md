# Configuration Notes

## Initial Project Setup - August 2025

Initialized Electron application with the following tech stack:

### Core Technologies
- **Electron** - Desktop app framework
- **React** with TypeScript - Frontend framework
- **ESBuild** - Fast bundling (not Vite per user preference)
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library built on Radix UI

### Key Configuration Decisions

**TypeScript Configuration (tsconfig.json):**
- Target: ES2022 (updated from initial ES2020)
- Used proven compiler options from previous successful project
- Includes declaration maps and source maps for better debugging
- Base URL set to `./src` for absolute imports

**Build System:**
- npm scripts approach (proven from previous project)
- Separate ESBuild commands for main process, preload script, and renderer
- `copy-static` script handles HTML and asset copying
- `build:css` processes Tailwind CSS with PostCSS
- Development mode with source maps and watch capability
- Uses `cp` commands for file operations (cross-platform compatible)

**Security Setup:**
- Context isolation enabled
- Node integration disabled in renderer
- Preload script for secure API exposure

**Project Structure:**
```
├── main.ts              # Electron main process
├── preload.ts           # Secure preload script
├── src/                 # React application
├── public/              # Static assets
├── build.js             # ESBuild configuration
├── components.json      # shadcn/ui configuration
└── ba_artifacts/        # Project documentation
```

### Build Approach Notes
The project initially used a custom `build.js` file, but the previous successful project used npm scripts exclusively. The npm scripts approach offers several advantages:
- More transparent and standard approach
- Handles file copying with simple `cp` commands
- Separate steps for CSS processing, static file copying, and compilation
- Easy to understand and modify individual build steps
- Proven to work well in production

### Available Scripts
- `npm run dev` - Development build + launch with dev tools
- `npm run start` - Production build + launch
- `npm run build` - Build only
- Individual build steps available: `build:main`, `build:renderer`, `build:preload`, `build:css`, `copy-static`

The setup prioritizes security, performance, and developer experience while maintaining the flexibility to add additional features as needed.