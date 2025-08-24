# Development guidelines for Electron apps
## Theming and styling
- Theming and styling should be done with latest version of Tailwind
- UI components will draw on the shadcn/ui library
- Custom theming and styling beyond stanrdard Tailwind (like custom colors) should use Tailwindf @theme directive
- Tailwind's directives (@tailwind base, @tailwind components, @tailwind utilities) need to be processed by PostCSS/Tailwind first. So you need to add CSS processing to the build pipeline, like `"build:css": "postcss src/styles.css -o dist/styles.css"`. This in turn requires `npm install --save-dev @tailwindcss/postcss` for Tailwind v4 and changes to postcss.config.js

## Building
- Use ESBuild for building and packaging
- Build targets should be expressed in the "scripts" section of package.json. Consider this as a baseline:

```
"scripts": {
    "postinstall": "electron-rebuild",
    "start": "electron .",
    "build": "npm run build:css && npm run copy-static && npm run build:main && npm run build:renderer && npm run build:preload",
    "build:main": "esbuild main.ts --bundle --platform=node --format=esm --outfile=dist/main.js --sourcemap --external:electron --external:dotenv --external:pino --external:@anthropic-ai/sdk --external:better-sqlite3 --external:drizzle-orm",
    "build:renderer": "esbuild src/index.tsx --bundle --format=esm --outfile=dist/index.js --sourcemap --jsx=automatic",
    "build:preload": "cp src/preload/preload.js dist/preload.js",
    "build:css": "postcss src/styles.css -o dist/styles.css",
    "copy-static": "cp src/index.html dist/ && mkdir -p dist/assets/images && cp -r src/assets/images/* dist/assets/images/ 2>/dev/null || true",
    "build:watch": "npm run copy-static && npm run build:main && npm run build:renderer -- --watch",
    "test": "NODE_OPTIONS=\"--experimental-vm-modules\" jest",
    "test:integration": "NODE_OPTIONS=\"--experimental-vm-modules\" jest tests/integration.test.ts",
    "test:watch": "NODE_OPTIONS=\"--experimental-vm-modules\" jest --watch",
    "dev": "npm run build:watch"
  }
  ```

  - build for the latest version of ES and include source maps, as in:

  ```
"compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "baseUrl": "./src",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
  ```

  - package.json should show `"type": "module",`

# Purpose of this app
This app is intended to visualize the structure and abstractions of a Node app. The app is called abscan-viewer. Abscan is short for "abstraction scan." abscn-viewr reads a custom JSON file produced by the abscan app that scnas a Node app and extracts information about classes, types, methods, other obastractions, and their relationships. Abscan-viwer provides a GUI for navigating those hierarchies and dependencies

# User stories
User stories are defined by collaboration between a human and a BA agent. They can be found in .ba_artifacts/stories.json. So when a human user asks you to "read the XYZ story and propose a plan for implementing it," that's where you can find the story.