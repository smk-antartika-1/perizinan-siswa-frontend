# E-Izin Siswa - Frontend Application

[![Next.js](https://img.shields.io/badge/next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/react-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-5.8-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind%20css-4.1-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

Aplikasi Frontend untuk **Sistem Informasi Perizinan Siswa (E-Izin Siswa)**. Aplikasi ini dikembangkan menggunakan **Next.js** dan menyediakan antarmuka modern yang responsif untuk mengelola, mengajukan, dan memantau status perizinan siswa, dilengkapi dengan fitur otentikasi serta pembuatan QR Code secara otomatis.

## 🚀 Teknologi yang Digunakan

Proyek ini dibangun menggunakan teknologi terkini di ekosistem web development:

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI/Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animasi**: [Motion](https://motion.dev/)
- **Ikon**: [Lucide React](https://lucide.dev/)
- **Utilitas**:
  - `date-fns` (Format dan manipulasi tanggal)
  - `clsx` & `tailwind-merge` (Class mapping dinamis)
  - `qrcode.react` (Generator QR Code)
- **Bahasa**: TypeScript

## 📦 Prasyarat Sistem

Pastikan perangkat Anda telah terinstal perangkat lunak berikut sebelum menjalankan proyek ini:

- **Node.js** (Disarankan versi 18.x atau terbaru)
- **NPM** / **Yarn** / **pnpm** / **Bun**

## 🛠️ Cara Menjalankan Proyek (Lokal/Development)

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek secara lokal:

1. **Clone repository ini (jika belum)**

   ```bash
   git clone <url-repository-anda>
   cd perizinan-siswa-frontend
   ```

2. **Instal seluruh dependensi**
   Menggunakan NPM:

   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**
   Buat file `.env` atau `.env.local` di root folder dan sesuaikan variabel yang dibutuhkan berdasarkan file `.env.example`:

   ```bash
   cp .env.example .env.local
   ```

   _(Pastikan mengisi API Key atau URL backend sistem Anda)._

4. **Jalankan Development Server**

   ```bash
   npm run dev
   ```

5. **Akses Aplikasi**
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

## 🏗️ Build & Production

Untuk melakukan build aplikasi ke tahap produksi (Production), jalankan perintah berikut:

```bash
npm run build
```

Setelah proses build selesai, jalankan server produksi dengan:

```bash
npm run start
```

## 📂 Struktur Proyek Utama

- `/app` - Berisi arsitektur routing (Next.js App Router) dan struktur halaman utama.
- `/components` - Berisi komponen-komponen antarmuka React yang dapat digunakan berulang (Reusable UI Components).
- `/context` - Berisi React Context untuk state management global.
- `/hooks` - Berisi Custom React Hooks.
- `/lib` - Berisi fungsi utilitas, helper, dan type definitions.
- `/public` - Berisi aset statis aplikasi (gambar, ikon, manifest).
- `/context` - Berisi React Context untuk state management global.

## 📝 Script Tersedia

Di dalam direktori proyek, Anda dapat menjalankan perintah-perintah berikut:

- `npm run dev` - Menjalankan aplikasi dalam mode pengembangan lokal.
- `npm run build` - Membangun aplikasi dan optimasi performa untuk tahap produksi.
- `npm run start` - Menjalankan aplikasi dari hasil build produksi.
- `npm run lint` - Menjalankan Next ESLint untuk memeriksa standar kualitas kode.

## ⚙️ Konfigurasi Environment Variables

Buat file `.env.local` di root folder dengan variabel berikut:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_PATH=/api

# Application
NEXT_PUBLIC_APP_NAME=E-Izin Siswa
NEXT_PUBLIC_APP_VERSION=1.0.0
```

> **Catatan**: File `.env.local` tidak akan di-track oleh Git. Pastikan `.env.example` ada untuk dokumentasi.

## 🤝 Kontribusi

Kontribusi sangat diterima! Untuk berkontribusi:

1. Fork repository ini
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan Anda (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

## 📄 Lisensi

Proyek ini dilisensikan di bawah MIT License. Lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.

## 📞 Dukungan & Feedback

Jika Anda menemukan bug atau memiliki saran, silakan buat issue di repository ini atau hubungi tim development.

---

> **Catatan Penting:** Repository ini merupakan bagian _frontend_ dari ekosistem **E-Izin Siswa**. Pastikan _backend_ sistem Anda telah berjalan dengan baik agar fitur login dan pengajuan izin berfungsi secara normal.
>
> Untuk informasi backend, lihat [Backend Repository](https://github.com/your-org/perizinan-siswa-backend) (segera hadir).
