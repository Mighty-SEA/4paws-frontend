# 📦 Panduan Build Portable - 4Paws Frontend

Dokumentasi lengkap untuk membuat portable build aplikasi Next.js yang bisa di-copy ke komputer lain.

## 🎯 Overview

Build portable adalah metode untuk membuat aplikasi Next.js yang:
- ✅ Bisa di-copy ke komputer lain (Windows/Linux/Mac)
- ✅ Tidak perlu rebuild di komputer target
- ✅ Ukuran kecil (~18 MB, exclude cache 654 MB)
- ✅ Otomatis di-compress ke ZIP
- ✅ Menggunakan pnpm di semua platform

## 🚀 Cara Membuat Portable Build

### 1. Build dengan Kompresi (Recommended)

```bash
pnpm build:zip
```

**Hasil:**
- Folder `portable-build/` (~18 MB)
- File `4paws-frontend-portable-YYYY-MM-DD.zip` (compressed)

### 2. Build tanpa Kompresi

```bash
pnpm build:portable
```

**Hasil:**
- Folder `portable-build/` (~18 MB)
- File ZIP juga dibuat otomatis

### 3. Build Biasa (Development)

```bash
pnpm build:fast
```

## 📁 Isi Portable Build

```
portable-build/
├── .next/
│   ├── server/          # Server-side code (10 MB)
│   └── static/          # Static assets (3 MB)
├── public/              # Public assets (5 MB)
├── package.json         # Dependencies info
├── next.config.mjs      # Configuration
├── start.bat            # Windows starter script
├── start.sh             # Linux/Mac starter script
└── README.md            # Cara pakai
```

**Yang TIDAK di-copy:**
- ❌ `.next/cache/` - Build cache (654 MB!)
- ❌ `node_modules/` - Dependencies (akan diinstall otomatis)
- ❌ Source code - Tidak perlu di production
- ❌ `.env.local` - Local environment

## 🖥️ Cara Deploy ke Komputer Lain

### Windows:

1. **Copy ZIP file** ke komputer target
2. **Extract** ZIP file
3. **Double-click** `start.bat` atau jalankan di Command Prompt:
   ```cmd
   start.bat
   ```
4. **Akses** aplikasi di `http://localhost:3000`

### Linux/Mac:

1. **Copy ZIP file** ke komputer target
2. **Extract** ZIP file
3. **Beri permission** dan jalankan:
   ```bash
   chmod +x start.sh
   ./start.sh
   ```
4. **Akses** aplikasi di `http://localhost:3000`

## ⚙️ Requirement di Komputer Target

- **Node.js** 18+ (`node -v`)
- **pnpm** package manager:
  ```bash
  npm install -g pnpm
  ```

## 📊 Perbandingan Ukuran

| Metode | Ukuran | Waktu Upload | Catatan |
|--------|--------|--------------|---------|
| **Build Biasa** | 669 MB | ~10 menit | Include cache |
| **Portable Build** | 18 MB | ~30 detik | Exclude cache ✅ |
| **Compressed ZIP** | ~5-8 MB | ~10 detik | Compressed ✅ |

**Penghematan: 97% ukuran!** 🎉

## 🛠️ Script yang Tersedia

```bash
# Build portable + ZIP (recommended)
pnpm build:zip

# Build portable saja
pnpm build:portable

# Build biasa (development)
pnpm build:fast

# Build clean (hapus cache dulu)
pnpm build:clean

# Clean semua build files
pnpm clean:all

# Clean cache saja
pnpm clean:cache
```

## 📝 File yang Di-Ignore Git

Otomatis tidak di-commit ke GitHub:
- `portable-build/` - Generated folder
- `4paws-frontend-portable-*.zip` - ZIP archives
- `4paws-frontend-portable-*.tar.gz` - TAR archives

## 🔧 Troubleshooting

### Error: "Cannot find module 'archiver'"

**Solusi:**
```bash
pnpm install
```

### Error: "pnpm not found" di komputer target

**Solusi:**
```bash
npm install -g pnpm
```

### Error: Build terlalu besar (>100 MB)

**Solusi:**
```bash
# Clean cache dulu
pnpm clean:cache

# Lalu build ulang
pnpm build:portable
```

### Port 3000 sudah dipakai

**Edit start.bat atau start.sh:**
```bash
# Ubah dari
pnpm start

# Menjadi
pnpm start -p 3100
```

## 🎯 Best Practices

1. **Selalu gunakan `build:zip`** untuk production
2. **Clean cache berkala** (seminggu sekali)
3. **Test di komputer target** sebelum deploy final
4. **Backup environment variables** - `.env` tidak di-copy
5. **Update README di portable-build** jika ada perubahan

## 📚 Script Internals

### create-portable-build.js

Script ini:
1. ✅ Copy `.next/server/` dan `.next/static/`
2. ✅ Skip `.next/cache/` (hemat 654 MB)
3. ✅ Copy `package.json`, `next.config.mjs`, `public/`
4. ✅ Buat `start.bat` dan `start.sh`
5. ✅ Buat `README.md` dengan instruksi
6. ✅ Compress ke ZIP dengan archiver
7. ✅ Show size dan compression ratio

## 🚀 Workflow Deployment

```bash
# 1. Development
pnpm dev

# 2. Test build locally
pnpm build:fast

# 3. Create portable build
pnpm build:zip

# 4. Copy ZIP ke server
scp 4paws-frontend-portable-*.zip user@server:/path/

# 5. Extract dan jalankan di server
ssh user@server
cd /path/
unzip 4paws-frontend-portable-*.zip
cd portable-build
./start.sh
```

## 📞 Support

Jika ada masalah:
1. Check Node.js version: `node -v` (harus 18+)
2. Check pnpm: `pnpm -v`
3. Clean dan rebuild: `pnpm clean:all && pnpm build:zip`
4. Check logs di terminal

---

**Build dengan pnpm ✅ | Portable ✅ | Compressed ✅ | Cross Platform ✅**

