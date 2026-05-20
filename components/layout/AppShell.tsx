'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import Sidebar from './Sidebar';
import NotificationDropdown from './NotificationDropdown';
import { ToastContainer } from '@/components/ui/Modal';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import StudentDetailModal from '@/components/ui/StudentDetailModal';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/izin': 'Ajukan Izin',
  '/history': 'Riwayat Perizinan',
  '/approval': 'Persetujuan Izin',
  '/students': 'Data Siswa',
  '/scan-qr': 'Scan QR Code',
  '/profile': 'Profil Pengguna',
  '/notifications': 'Notifikasi',
  '/admin': 'Panel Administrasi',
  '/kelola-qr': 'Kelola QR Code',
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts, removeToast } = useAppContext();
  const { isAuthenticated, currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router]);

  if (!isAuthenticated) return null;

  let pageTitle = PAGE_TITLES[pathname] || 'E-Izin Siswa';
  if (pathname.startsWith('/izin/') && pathname !== '/izin') {
    pageTitle = 'Detail Perizinan Siswa';
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 h-full shadow-2xl">
            <Sidebar onClose={() => setMobileOpen(false)} isMobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="font-bold text-slate-800 text-lg leading-tight">{pageTitle}</h2>
              <p className="text-xs text-slate-400">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationDropdown />
            <Link
              href="/profile"
              className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm hover:bg-blue-700 transition-colors"
            >
              {currentUser?.name.charAt(0) || 'U'}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      <StudentDetailModal />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
