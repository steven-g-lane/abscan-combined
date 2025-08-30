# Expected Debug Output for Auto-Load Flow

## When you run the GUI and trigger a scan with auto-load enabled, you should see these debug messages in the console:

### 1. **App Startup**
```
=== SETTING UP APP EVENT LISTENERS ===
Scan status listener registered in App.tsx
```

### 2. **When you click "Scan" button**
```
=== HANDLE SCAN CALLED ===
Scan config received: {scanPath: "...", outputPath: "...", autoOpenFiles: true, ...}
Auto-open enabled: true
Stored scan config for auto-load
Starting scan process...
```

### 3. **When scan completes successfully**
```
=== CONFIGURED SCAN COMPLETED SUCCESSFULLY ===
Sending scan-status complete message
```

### 4. **When App.tsx receives the completion**
```
=== RECEIVED SCAN STATUS ===
Status: {status: "complete"}
=== SCAN COMPLETED, HANDLING AUTO-LOAD ===
=== STARTING AUTO-LOAD DELAY ===
Current scan config at completion: {scanPath: "...", outputPath: "...", autoOpenFiles: true, ...}
```

### 5. **After 1.5 second delay**
```
=== AUTO-LOAD DELAY COMPLETED ===
Progress modal closed
Checking auto-open conditions...
currentScanConfig exists: true
autoOpenFiles enabled: true
=== ATTEMPTING AUTO-LOAD ===
Auto-loading scan results from: /path/to/output/abscan.json
Full scan config: {...}
```

### 6. **IPC and file loading**
```
=== AUTO LOAD IPC HANDLER CALLED ===
Received file path: /path/to/output/abscan.json
=== AUTO LOAD FILE CALLED ===
File path: /path/to/output/abscan.json
Auto-loading file: /path/to/output/abscan.json
Auto-load completed successfully
=== AUTO-LOAD API CALL COMPLETED ===
Auto-load result: {success: true}
```

### 7. **Miller Columns receives data**
```
=== MILLER COLUMNS RECEIVED DATA ===
Data type: object
Data keys: ["items"]
Full data: {items: [...]}
```

---

## If any of these messages are missing, it tells us exactly where the auto-load flow is breaking!

**Missing step 2?** → Scan not triggered from GUI properly  
**Missing step 4?** → scan-status event not reaching App.tsx  
**Missing step 5?** → Config not stored or delay issue  
**Missing step 6?** → IPC communication problem  
**Missing step 7?** → File loading or data transmission issue