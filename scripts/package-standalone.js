#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('📦 Packaging standalone build...');

// Check if standalone build exists
const standalonePath = '.next/standalone';
if (!fs.existsSync(standalonePath)) {
  console.error('❌ Error: .next/standalone not found!');
  console.error('   Please run: pnpm build:standalone first');
  process.exit(1);
}

// Create package directory
const packageDir = 'standalone-package';
if (fs.existsSync(packageDir)) {
  fs.rmSync(packageDir, { recursive: true, force: true });
}
fs.mkdirSync(packageDir, { recursive: true });

console.log('📋 Copying standalone files...');

// Copy standalone folder
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  
  fs.mkdirSync(dest, { recursive: true });
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy .next/standalone to package
copyDir(standalonePath, packageDir);

// Copy .next/static to package/.next/static (needed for production)
if (fs.existsSync('.next/static')) {
  console.log('✅ Copying static files...');
  copyDir('.next/static', path.join(packageDir, '.next/static'));
}

// Copy public folder to package/public (if not already there)
if (fs.existsSync('public') && !fs.existsSync(path.join(packageDir, 'public'))) {
  console.log('✅ Copying public assets...');
  copyDir('public', path.join(packageDir, 'public'));
}

// Create run.bat for Windows
const runBat = `@echo off
echo ========================================
echo 🚀 4Paws Frontend - Standalone Server
echo ========================================
echo.
echo Starting Next.js standalone server...
echo Server will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Start the server
node server.js

pause
`;

fs.writeFileSync(path.join(packageDir, 'run.bat'), runBat);
console.log('✅ Created: run.bat');

// Create run.sh for Linux/Mac
const runSh = `#!/bin/bash

echo "========================================"
echo "🚀 4Paws Frontend - Standalone Server"
echo "========================================"
echo ""
echo "Starting Next.js standalone server..."
echo "Server will run on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed!"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

# Start the server
node server.js
`;

fs.writeFileSync(path.join(packageDir, 'run.sh'), runSh);
fs.chmodSync(path.join(packageDir, 'run.sh'), '755');
console.log('✅ Created: run.sh');

// Create README
const readme = `# 4Paws Frontend - Standalone Build

This is a self-contained Next.js application that can run on any computer with Node.js installed.

## 📋 Requirements

- Node.js 18+ ([Download](https://nodejs.org/))

## 🚀 How to Run

### Windows:
1. Double-click \`run.bat\`
   OR
   Open Command Prompt in this folder and run:
   \`\`\`cmd
   run.bat
   \`\`\`

### Linux/Mac:
1. Open Terminal in this folder and run:
   \`\`\`bash
   chmod +x run.sh
   ./run.sh
   \`\`\`
   OR
   \`\`\`bash
   node server.js
   \`\`\`

## 🌐 Access the Application

After starting the server, open your browser and go to:
- **http://localhost:3000**

## 🛑 Stop the Server

Press \`Ctrl+C\` in the terminal/command prompt.

## 📝 Notes

- This is a **standalone build** with all dependencies included
- **No npm/pnpm install needed** - ready to run!
- Server runs on port 3000 by default
- To change port: \`PORT=3100 node server.js\` (Linux/Mac) or set \`PORT=3100\` then \`node server.js\` (Windows)

## 📊 What's Included

- ✅ Next.js server (\`server.js\`)
- ✅ Application code (\`.next/\`)
- ✅ Production dependencies (\`node_modules/\`)
- ✅ Static assets (\`public/\`)
- ✅ Run scripts (\`run.bat\`, \`run.sh\`)

## 🆘 Troubleshooting

**Server won't start?**
- Make sure Node.js 18+ is installed: \`node -v\`
- Check if port 3000 is already in use
- Check \`server.js\` exists in this folder

**Application not loading?**
- Wait a few seconds after starting
- Check terminal for error messages
- Ensure \`.next/\` folder exists

---

**Build Date:** ${new Date().toISOString().split('T')[0]}
**Built with:** Next.js 15 + pnpm
`;

fs.writeFileSync(path.join(packageDir, 'README.md'), readme);
console.log('✅ Created: README.md');

// Calculate size
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

const packageSize = getDirSize(packageDir);
const packageSizeMB = (packageSize / 1024 / 1024).toFixed(2);

console.log('');
console.log('🗜️  Creating compressed archive...');

// Create releases directory
const releasesDir = 'releases';
if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
  console.log(`✅ Created releases directory: ${releasesDir}/`);
}

const archiveName = `4paws-standalone-${new Date().toISOString().split('T')[0]}.zip`;
const archivePath = path.join(releasesDir, archiveName);

// Create zip archive
const output = fs.createWriteStream(archivePath);
const archive = archiver('zip', { 
  zlib: { level: 6 } // Balanced compression (faster than level 9, still good compression)
});

output.on('close', () => {
  const archiveSize = fs.statSync(archivePath).size / 1024 / 1024;
  console.log(`✅ Compressed archive created: ${archiveName}`);
  console.log(`📊 Archive size: ${archiveSize.toFixed(2)} MB`);
  console.log(`📊 Compression ratio: ${((1 - archiveSize / parseFloat(packageSizeMB)) * 100).toFixed(1)}%`);
  console.log('');
  console.log('✅ Standalone package ready!');
  console.log('');
  console.log('📂 Build Output:');
  console.log(`   Folder:  ${packageDir}/ (${packageSizeMB} MB)`);
  console.log(`   Archive: ${releasesDir}/${archiveName} (${archiveSize.toFixed(2)} MB)`);
  console.log('');
  console.log('🚀 To deploy:');
  console.log(`   1. Copy ${releasesDir}/${archiveName} to target computer`);
  console.log('   2. Extract the ZIP');
  console.log('   3. Run: run.bat (Windows) or ./run.sh (Linux/Mac)');
  console.log('   4. Access: http://localhost:3000');
  console.log('');
  console.log('💡 No installation needed - just extract and run!');
});

archive.on('error', (err) => {
  console.log('⚠️  Error creating archive:', err.message);
});

archive.pipe(output);

// Use directory method (more efficient, handles file limits automatically)
archive.directory(packageDir, false);
archive.finalize();

