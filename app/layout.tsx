import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'E-Izin Siswa — Sistem Perizinan Digital',
  description: 'Sistem perizinan keluar-masuk siswa pintar berbasis QR Code dan Real-time tracking untuk sekolah modern.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
