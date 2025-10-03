#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

console.log('📦 Creating portable build...');

// Create portable-build directory
const portableDir = 'portable-build';
if (fs.existsSync(portableDir)) {
  fs.rmSync(portableDir, { recursive: true, force: true });
}
fs.mkdirSync(portableDir, { recursive: true });

// Copy essential files
const filesToCopy = [
  '.next/server',
  '.next/static', 
  '.next/*.json',
  'package.json',
  'next.config.mjs',
  'public'
];

const filesToExclude = [
  '.next/cache',
  '.next/diagnostics',
  'node_modules'
];

console.log('📋 Copying essential files...');

// Copy .next folder (excluding cache)
function copyDir(src, dest, exclude = []) {
  if (!fs.existsSync(src)) return;
  
  fs.mkdirSync(dest, { recursive: true });
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    // Skip excluded items
    if (exclude.some(excludeItem => item.includes(excludeItem))) {
      console.log(`⏭️  Skipping: ${item}`);
      continue;
    }
    
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy .next folder excluding cache, diagnostics, and standalone
copyDir('.next', path.join(portableDir, '.next'), ['cache', 'diagnostics', 'standalone']);

// Copy other essential files
const otherFiles = ['package.json', 'next.config.mjs'];
for (const file of otherFiles) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(portableDir, file));
    console.log(`✅ Copied: ${file}`);
  }
}

// Copy public folder
if (fs.existsSync('public')) {
  copyDir('public', path.join(portableDir, 'public'));
  console.log('✅ Copied: public/');
}

// Read package.json to detect port
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const startScriptCmd = packageJson.scripts?.start || 'next start';
const portMatch = startScriptCmd.match(/-p\s+(\d+)/);
const defaultPort = portMatch ? portMatch[1] : '3000';

console.log(`✅ Detected port: ${defaultPort}`);

// Create start script for portable build
const startScript = `#!/bin/bash
# Portable Next.js App Starter
echo "🚀 Starting portable Next.js app..."
echo ""

# Smart dependency check
if [ ! -d "node_modules" ]; then
  echo "📦 First run - Installing dependencies with pnpm..."
  echo "⏱️  This takes 2-5 minutes (one time only)"
  pnpm install --production --ignore-scripts
elif [ "package.json" -nt "node_modules" ]; then
  echo "🔄 Dependencies changed - Updating..."
  pnpm install --production --ignore-scripts
else
  echo "✅ Dependencies up to date"
fi
echo ""

# Start the app
echo "========================================"
echo "🎯 Starting Next.js server..."
echo "🌐 Access: http://localhost:${defaultPort}"
echo "⏹️  Press Ctrl+C to stop the server"
echo "========================================"
echo ""
pnpm start
`;

fs.writeFileSync(path.join(portableDir, 'start.sh'), startScript);

// Create Windows start script
const startScriptWin = `@echo off
echo 🚀 Starting portable Next.js app...
echo.

REM Smart dependency check
if not exist "node_modules" (
  echo 📦 First run - Installing dependencies with pnpm...
  echo ⏱️  This takes 2-5 minutes (one time only)
  echo.
  call pnpm install --production --ignore-scripts
  if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
  )
) else (
  echo ✅ Dependencies already installed
  echo 💡 Tip: Delete node_modules if you need fresh install
  echo.
)

REM Start the app
echo ========================================
echo 🎯 Starting Next.js server...
echo 🌐 Access: http://localhost:${defaultPort}
echo ⏹️  Press Ctrl+C to stop the server
echo ========================================
echo.
call pnpm start
`;

fs.writeFileSync(path.join(portableDir, 'start.bat'), startScriptWin);

// Create README for portable build
const readme = `# Portable Next.js App

This is a portable build of your Next.js application.

## How to use:

### On Windows:
1. Copy this entire folder to your target computer
2. Open Command Prompt in this folder
3. Run: \`start.bat\`

### On Linux/Mac:
1. Copy this entire folder to your target computer  
2. Open Terminal in this folder
3. Run: \`chmod +x start.sh && ./start.sh\`

## What's included:
- ✅ Built application (.next/server, .next/static)
- ✅ Configuration files (package.json, next.config.mjs)
- ✅ Public assets
- ❌ Source code (not needed for production)
- ❌ Development dependencies
- ❌ Build cache (saves 600MB+)

## Requirements on target computer:
- Node.js 18+ installed
- pnpm package manager (install with: npm install -g pnpm)

The app will automatically install production dependencies with pnpm and start on port 3000.

## 🔄 Update Workflow:

**For Code-Only Updates (most updates):**
1. Replace portable-build folder with new version
2. Run start.bat/start.sh → Instant start! (dependencies cached)

**For Updates with Dependency Changes:**
1. Delete node_modules folder (or let script auto-detect)
2. Run start.bat/start.sh → Auto-install new dependencies (~2-5 min)

**Tip:** Keep node_modules folder between updates to speed up deployment!
`;

fs.writeFileSync(path.join(portableDir, 'README.md'), readme);

// Calculate sizes
function getDirSize(dirPath) {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;
  
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      size += getDirSize(itemPath);
    } else {
      size += stat.size;
    }
  }
  return size;
}

const portableSize = getDirSize(portableDir);
const portableSizeMB = (portableSize / 1024 / 1024).toFixed(2);

// Create compressed archive
console.log('');
console.log('🗜️  Creating compressed archive...');

// Create releases directory
const releasesDir = 'releases';
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
  console.log(`✅ Created releases directory: ${releasesDir}/`);
}

const archiveName = `4paws-frontend-portable-${new Date().toISOString().split('T')[0]}.zip`;
const archivePath = path.join(releasesDir, archiveName);

// Create zip archive using Node.js archiver
const output = fs.createWriteStream(archivePath);
const archive = archiver('zip', { 
  zlib: { level: 6 } // Balanced compression (faster than level 9, still good compression)
});

output.on('close', () => {
  const archiveSize = fs.statSync(archivePath).size / 1024 / 1024;
  console.log(`✅ Compressed archive created: ${archiveName}`);
  console.log(`📊 Archive size: ${archiveSize.toFixed(2)} MB`);
  console.log(`📊 Compression ratio: ${((1 - archiveSize / parseFloat(portableSizeMB)) * 100).toFixed(1)}%`);
});

archive.on('error', (err) => {
  console.log('⚠️  Error creating archive:', err.message);
});

archive.pipe(output);

// Use directory method (more efficient, handles file limits automatically)
archive.directory(portableDir, false);
archive.finalize();

console.log('');
console.log('✅ Portable build created successfully!');
console.log('');
console.log('📂 Build Output:');
console.log(`   Folder:  ${portableDir}/ (${portableSizeMB} MB)`);
console.log(`   Archive: ${releasesDir}/${archiveName} (check after compression)`);
console.log('');
console.log('🚀 To deploy:');
console.log(`   1. Copy ${releasesDir}/${archiveName} to target computer`);
console.log('   2. Extract the ZIP');
console.log('   3. Run: start.bat (Windows) or ./start.sh (Linux/Mac)');
console.log(`   4. Access: http://localhost:${defaultPort}`);
console.log('');
console.log('💡 First run: Auto-install dependencies (2-5 min one time)');
