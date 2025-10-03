# 🚀 Quick Reference - Portable Build

## 📦 Build Commands

```bash
# RECOMMENDED: Build portable + compress
pnpm build:zip

# Build portable (no compress)
pnpm build:portable

# Build biasa
pnpm build:fast

# Clean build
pnpm build:clean
```

## 🧹 Clean Commands

```bash
pnpm clean:cache    # Clean cache saja (654 MB)
pnpm clean          # Clean .next folder
pnpm clean:all      # Clean semua
```

## 📤 Deploy ke Server

### Windows Target:
```cmd
1. Copy: 4paws-frontend-portable-*.zip
2. Extract ZIP
3. Run: start.bat
```

### Linux/Mac Target:
```bash
1. Copy: 4paws-frontend-portable-*.zip
2. Extract ZIP
3. chmod +x start.sh && ./start.sh
```

## 📊 Size Comparison

| Type | Size | Notes |
|------|------|-------|
| Build biasa | 669 MB | ❌ Include cache |
| Portable | 18 MB | ✅ Exclude cache |
| ZIP | 5-8 MB | ✅ Compressed |

## 🔧 Requirements

**Di komputer target:**
- Node.js 18+
- pnpm: `npm install -g pnpm`

## 📁 Output Location

```
.
├── portable-build/                    # Folder (~18 MB)
└── 4paws-frontend-portable-*.zip      # ZIP (~5-8 MB)
```

## ⚡ Quick Troubleshooting

**Build terlalu besar?**
```bash
pnpm clean:cache
pnpm build:zip
```

**pnpm not found?**
```bash
npm install -g pnpm
```

**Port sudah dipakai?**
```bash
# Edit start.bat/start.sh
pnpm start -p 3100
```

## 📚 More Info

- **PORTABLE_BUILD_GUIDE.md** - Panduan lengkap
- **OPTIMIZATION_SUMMARY.md** - Technical details

---
*Build: 669 MB → 18 MB (97% ↓) | Upload: 10 min → 30 sec (95% ↓)*

