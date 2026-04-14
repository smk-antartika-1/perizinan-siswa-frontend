# Sistem Perizinan Siswa SMK Antartika 1

Sistem Perizinan Siswa adalah aplikasi web yang dirancang secara profesional untuk memfasilitasi, mendigitalkan, dan mempermudah proses perizinan siswa di SMK Antartika 1 secara efisien dan transparan.

## 🚀 Detail Teknis

Aplikasi ini dibangun menggunakan arsitektur web modern yang menjamin skalabilitas, performa tinggi, dan antarmuka yang ramah pengguna. Teknologi utama yang digunakan meliputi:

- **Framework:** [Next.js 14+](https://nextjs.org/) (App Router)
- **Bahasa Pemrograman:** [TypeScript](https://www.typescriptlang.org/)
- **Styling UI:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Manajemen & Validasi Form:** [React Hook Form](https://react-hook-form.com/) yang dipadukan dengan [Zod](https://zod.dev/)
- **Autentikasi:** Sistem autentikasi berbasis Cookie yang aman (Secure Cookie-based Authentication)

## ✨ Fitur Utama

- **Role-Based Access Control (RBAC):** Menyediakan fitur akses berbasis peran (Siswa, Wali Kelas, Guru Piket) dengan antar muka yang disesuaikan secara dinamis.
- **Alur Persetujuan 2 Tingkat (2-Level Approval Flow):** Memastikan proses verifikasi perizinan terstruktur dengan alur persetujuan: `Siswa` -> `Wali Kelas` -> `Guru Piket`.
- **Status Real-time:** Siswa dapat melihat progres status pengajuan perizinan mereka kapan saja dengan transparan.
- **Mobile-first & Responsif:** Desain modern dan responsif yang optimal diakses dari berbagai jenis perangkat, termasuk layar smartphone.
- **Validasi Data Berlapis:** Menerapkan validasi ketat dari sisi klien (menggunakan Zod) untuk mencegah kekeliruan input pengguna.

## 🛠️ Panduan Instalasi dan Cara Menjalankan

Ikuti panduan berikut untuk memasang serta menjalankan aplikasi ini di lingkungan lokal Anda (Development).

### Prasyarat Dasar

Sebelum menjalankan proyek ini, pastikan sistem komputer Anda telah terinstal:
- [Node.js](https://nodejs.org/) (versi 18.x ke atas direkomendasikan)
- Package manager seperti `npm`, `yarn`, `pnpm`, atau `bun`

### Langkah Instalasinya

1. **Unduh (Clone) / Akses Folder Proyek:**
   ```bash
   git clone <url-repository-anda>
   cd perizinan-smk1-antartika
   ```

2. **Instal seluruh Dependensi (Library):**
   Gunakan package manager pilihan Anda untuk memuat semuanya.
   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   # atau
   bun install
   ```

3. **Konfigurasi Environment Variable:**
   Buat file baru di root (akar folder) proyek bernama `.env.local`, kemudian konfigurasikan variabel rahasia seperti tautan API atau token secret.
   ```env
   # Contoh isi file .env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   JWT_SECRET=rahasiakita123
   ```

4. **Jalankan Aplikasi:**
   Setelah proses instalasi selesai, jalankan server mode lokal.
   ```bash
   npm run dev
   # atau
   yarn dev
   # atau
   pnpm dev
   # atau
   bun dev
   ```

5. **Lihat di Jendela Browser:**
   Buka peramban (browser) dan akses laman: [http://localhost:3000](http://localhost:3000). Aplikasi siap digunakan!

## 📁 Struktur Folder (Opsional)

Gambaran umum tata letak dan struktur komponen di dalam aplikasi ini:

```text
perizinan-smk1-antartika/
├── app/                  # Titik tumpu Next.js 14 App Router root dan routing halaman
├── components/           # Direktori komponen-komponen UI React yang digunakan di halaman
├── hooks/                # Logika custom hooks berulang (reusable logic)
├── lib/                  # Fungsi utilitas (seperti utils.ts), API clients, atau helper bawaan
├── store/                # Logika global store dan state management dengan Zustand
├── types/                # Deklarasi file untuk TypeScript custom typings & interface
├── public/               # Direktori gambar, font, dan aset statis publik lainnya
├── .env.local            # File local env (jangan di-commit ke repositori Git)
├── tailwind.config.ts    # File dasar konfigurasi framework Tailwind
├── tsconfig.json         # Aturan dan modifikasi compiler untuk TypeScript
└── package.json          # File manifes yang berisi list meta-data npm
```

## 📄 Lisensi

Proyek ini berada di bawah pelindungan lisensi **MIT**.

```text
MIT License

Copyright (c) 2026 Sistem Perizinan Siswa - SMK Antartika 1

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
