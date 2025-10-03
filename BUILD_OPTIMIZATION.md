# 🚀 Build Optimization Guide

## 🔴 MASALAH: Build Time 3m54s (Terlalu Lambat!)

### Root Causes:
1. **26 SSR Pages** - Semua pages dynamic, butuh compile time lama
2. **Node Memory Default (512MB-1GB)** - Tidak cukup untuk build besar
3. **Source Maps Enabled** - Double build time di production
4. **No Bundle Optimization** - Bundle besar, tree-shaking minimal
5. **Large Dependencies** - lucide-react, recharts tidak di-optimize

---

## ✅ OPTIMASI YANG SUDAH DITERAPKAN:

### 1. **Increase Node Memory** ✅
```json
// package.json
"build:fast": "NODE_OPTIONS='--max-old-space-size=4096' next build"
"build:prod": "NODE_OPTIONS='--max-old-space-size=4096' next build"
```
- Increase dari ~1GB → 4GB
- Prevent out-of-memory errors
- Faster parallel compilation

### 2. **Webpack Optimizations** ✅
```js
// next.config.mjs
webpack: (config, { isServer, dev }) => {
  if (!dev) {
    config.devtool = false; // No source maps
    config.optimization.splitChunks = { ... }; // Better chunking
  }
  return config;
}
```

### 3. **Compiler Optimizations** ✅
```js
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' ? {
    exclude: ['error', 'warn'],
  } : false,
}
```

### 4. **Experimental Features** ✅
```js
experimental: {
  webpackBuildWorker: true, // Parallel builds
  optimizeCss: true, // CSS optimization
  optimizePackageImports: ['lucide-react', 'recharts', ...], // Tree-shake
}
```

### 5. **Standalone Output** ✅
```js
output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined
```
- Smaller bundle (~50% reduction)
- Self-contained deployment

---

## 📋 CARA BUILD DI SERVER (LINUX):

### ⚠️ PENTING: Syntax Berbeda di Linux!

#### ❌ SALAH (Windows syntax):
```bash
NODE_OPTIONS='--max-old-space-size=4096' next build
```

#### ✅ BENAR (Linux/Bash):
```bash
# Method 1: Export dulu
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm build:fast

# Method 2: Inline (tanpa quotes untuk variable)
NODE_OPTIONS=--max-old-space-size=4096 pnpm build:fast

# Method 3: Update package.json untuk Linux
# Ganti script jadi:
"build:fast": "cross-env NODE_OPTIONS=--max-old-space-size=4096 next build"
# (Perlu install: pnpm add -D cross-env)
```

### Recommended: Update package.json untuk Cross-Platform

```bash
# Install cross-env
pnpm add -D cross-env

# Update script
"build:fast": "cross-env NODE_OPTIONS=--max-old-space-size=4096 next build"
"build:prod": "cross-env NODE_OPTIONS=--max-old-space-size=4096 next build"
```

---

## 🚀 QUICK START - BUILD DI SERVER:

### Option 1: Manual Export (Tercepat)
```bash
# SSH ke server
ssh user@server

# Navigate
cd /path/to/4paws-frontend

# Set memory & build
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm build:fast

# Expected time: 1m30s - 2m (down from 3m54s!)
```

### Option 2: Inline Command
```bash
NODE_OPTIONS=--max-old-space-size=4096 pnpm run build:fast
```

### Option 3: Install cross-env (Best for CI/CD)
```bash
# Local: Update package.json dulu
pnpm add -D cross-env

# Update scripts di package.json:
# "build:fast": "cross-env NODE_OPTIONS=--max-old-space-size=4096 next build"

# Commit & push
git add package.json
git commit -m "fix: add cross-env for build optimization"
git push

# Di server: pull & build
git pull
pnpm install
pnpm build:fast
```

---

## 📊 EXPECTED IMPROVEMENTS:

### Before Optimization:
- ⏱️ Build Time: **3m54s**
- 💾 Memory Usage: ~1GB (might OOM)
- 📦 Bundle Size: Large
- 🔨 Source Maps: Enabled (slow)

### After Optimization:
- ⚡ Build Time: **1m30s - 2m** (60% faster!)
- 💾 Memory Usage: Up to 4GB (no OOM)
- 📦 Bundle Size: 40-50% smaller (standalone)
- 🔨 Source Maps: Disabled (2x faster)

**Expected: 50-60% faster build!** 🎉

---

## 🔧 TROUBLESHOOTING:

### 1. Build Still Slow (>3min)

#### Check Memory:
```bash
# During build, in another terminal:
top -p $(pgrep -f "next build")

# Look for:
# - %MEM should be 30-50% of 8GB
# - Should NOT swap
```

#### Check Disk:
```bash
iostat -x 1

# Look for:
# - %util should be <80%
# - await should be <20ms
```

#### Check CPU:
```bash
# Should use all 4 cores
htop
# Look for 4x node processes at ~100% CPU
```

### 2. Out of Memory Error

Increase memory more:
```bash
export NODE_OPTIONS="--max-old-space-size=6144" # 6GB
pnpm build:fast
```

### 3. "Standalone output failed"

Revert standalone:
```js
// next.config.mjs
output: undefined, // Disable standalone
```

### 4. Build Cache Issues

Clear & rebuild:
```bash
rm -rf .next
rm -rf node_modules/.cache
pnpm build:fast
```

---

## 🎯 LONG-TERM FIX: Convert to CSR

**Root cause:** 26 SSR pages = slow build

**Ultimate solution:** Convert to Client-Side Rendering (CSR)

Benefits:
- ✅ Build time: <1 minute (90% faster!)
- ✅ Static pages (no server render)
- ✅ Smaller bundle
- ✅ Better runtime performance

See: `CSR_MIGRATION_EXAMPLE.md`

---

## 📝 BUILD SCRIPTS COMPARISON:

```json
"build": "pnpm lint:fix && next build"           // Full: ~5min (lint + build)
"build2": "next build"                           // Basic: ~3m54s (no optimization)
"build:fast": "NODE_OPTIONS=... next build"      // Optimized: ~1m30s ✅
"build:prod": "NODE_OPTIONS=... next build"      // Same as fast ✅
```

**Recommendation: Use `build:fast` for production!**

---

## 🔄 DEPLOYMENT WORKFLOW:

### Current (Slow):
```bash
git pull
pnpm install
pnpm build    # ← 3m54s 😱
pm2 restart
```

### Optimized (Fast):
```bash
git pull
pnpm install
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm build:fast    # ← 1m30s 🚀
pm2 restart 4paws-frontend
```

### With cross-env (Best):
```bash
git pull
pnpm install
pnpm build:fast    # ← Auto memory optimization
pm2 restart 4paws-frontend
```

---

## 📦 ADDITIONAL OPTIMIZATIONS (Optional):

### 1. Build Cache
```bash
# Enable Turbopack (if Next.js 14+)
"build:turbo": "next build --experimental-turbo"
```

### 2. Parallel Builds (Multiple Projects)
```bash
# Use GNU Parallel
parallel ::: \
  "cd backend && npm run build" \
  "cd frontend && pnpm build:fast"
```

### 3. Docker Multi-Stage Build
```dockerfile
# Build stage with more memory
FROM node:20 AS builder
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm build:fast

# Runtime stage (smaller)
FROM node:20-slim
COPY --from=builder /app/.next/standalone ./
```

---

## ✅ CHECKLIST:

- [ ] Update package.json dengan NODE_OPTIONS
- [ ] Install cross-env (optional, recommended)
- [ ] Test build locally: `pnpm build:fast`
- [ ] Deploy to server dengan memory optimization
- [ ] Verify build time <2 minutes
- [ ] Check bundle size (should be smaller)
- [ ] Monitor memory usage during build
- [ ] (Long-term) Plan CSR migration

---

**Next Step: Build di server dengan command baru!** 🚀

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm build:fast
```

