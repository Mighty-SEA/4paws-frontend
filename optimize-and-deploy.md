# 🚀 Quick Guide: Optimasi & Deploy

## Step 1: Optimasi Gambar (15 menit)

### A. Kompres Gambar Online
1. Buka: https://squoosh.app/
2. Drag & drop gambar dari `public/`:
   - `4PAWS.png` (390KB) → Compress ke <50KB
   - `4-PAWS-Petcare.png` (207KB) → Compress atau gunakan .webp
   - `android-chrome-512x512.png` (207KB) → Compress ke <80KB
   - `logowithname2.png` (160KB) → Compress ke <30KB

3. Settings di Squoosh:
   - Format: WebP
   - Quality: 80-85
   - Download hasil kompres

4. Replace file di folder `public/`

### B. (Opsional) Buat Logo Kecil untuk Sidebar
1. Resize gambar logo ke 24x24px
2. Save as `logo-small.webp` (<3KB)
3. Taruh di `public/`

## Step 2: Rebuild & Test (5 menit)

```bash
# Di terminal:
cd C:\Users\Habiburrahman\Documents\4paws\4paws-frontend

# Install dependencies (jika belum)
pnpm install

# Build production
pnpm build

# Test lokal
pnpm start

# Buka browser: http://localhost:3100
```

## Step 3: Check Performance

### Di Browser (Chrome):
1. Buka DevTools (F12)
2. Tab **Network**
3. Refresh halaman (Ctrl+R)
4. Lihat di bagian bawah:
   - **Total size** harus <500KB (ideal: <300KB)
   - **Load time** harus <2 detik

### Lighthouse Audit:
1. DevTools → Tab **Lighthouse**
2. Klik "Analyze page load"
3. Target score: **>90 Performance**

## Step 4: Deploy

```bash
# Build production final
pnpm build

# Upload/deploy sesuai metode Anda:
# - PM2: pm2 restart ecosystem.config.js
# - Vercel: vercel --prod
# - Manual: copy .next folder ke server
```

## ✅ Checklist Sebelum Deploy

- [ ] Gambar sudah dikompres (<100KB per file)
- [ ] `pnpm build` berhasil tanpa error
- [ ] Test di browser, load time <2 detik
- [ ] Lighthouse score >85
- [ ] Test di mobile/3G network

## 🎯 Target Performa

### Before:
- First Load: ~1.5MB
- Load Time: 3-5 detik
- Lighthouse: 40-60

### After:
- First Load: <400KB ✅
- Load Time: <1 detik ✅
- Lighthouse: >85 ✅

---

**Estimasi waktu total: 20 menit**
**Peningkatan kecepatan: 60-70%** 🚀

