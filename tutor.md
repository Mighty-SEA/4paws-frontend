# 4PAWS - Panduan Setup

## 📁 Struktur Folder

```
4PAWS/
├── 4paws-frontend-deployment  (boleh rename jadi 4paws-frontend)
└── 4paws-backend-deployed     (boleh rename jadi 4paws-backend)
```

## 📥 Link Folder

| Komponen | Link |
|----------|------|
| Frontend | https://github.com/Mighty-SEA/4paws-frontend/archive/refs/heads/deployment.zip |
| Backend | https://github.com/Mighty-SEA/4paws-backend/archive/refs/heads/deployed.zip |

---

## 🚀 Instruksi Setup

### I. Di Folder 4paws-frontend

1. `pnpm install`
2. `pnpm build:fast`

### II. Di Folder 4paws-backend

1. Rename atau copy `.env.example` jadi `.env`

2. Ubah isinya di bagian `DATABASE_URL`:
   ```
   SEBELUM:
   DATABASE_URL="postgresql://minty@localhost:5432/4paws?schema=public"
   
   SESUDAH:
   DATABASE_URL="mysql://root:root@localhost:5432/4paws?schema=public"
   ```
   
   > ⚠️ **Perhatikan:** `root:root` sesuaikan dengan user dan pw database (`user:password`)

3. `pnpm install`

4. `pnpm prisma:migrate` atau bisa juga `pnpm prisma migrate dev`

5. `pnpm build`

### III. Jalankan pnpm start

Jalankan `pnpm start` di masing-masing folder:

1. Di dalam folder **4paws-frontend**:
   ```bash
   pnpm start
   ```

2. Di dalam folder **4paws-backend**:
   ```bash
   pnpm start
   ```

---

## ⚠️ Troubleshooting

### Error: "Operation not permitted symlink"

Jika error ini terjadi di Windows 11 terbaru:

**Solusi:** Aktifkan developer mode di Windows
