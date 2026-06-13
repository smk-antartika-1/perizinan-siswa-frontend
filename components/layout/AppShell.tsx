'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Sidebar from './Sidebar';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '@/hooks/useAuth';
import { useAppContext } from '@/context/AppContext';
import StudentDetailModal from '@/components/ui/StudentDetailModal';
import { APP_NAME } from '@/lib/appConfig';

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

// Layar loading penuh — ditampilkan saat auth sedang divalidasi
function AuthLoadingScreen() {
  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center gap-4 z-50">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40 border border-blue-500/30">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-none stroke-current stroke-2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h2v2h-2zM18 14h3v2h-3zM14 18h3v2h-3zM18 18h3v3h-3z" />
        </svg>
      </div>
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 size={16} className="animate-spin text-blue-400" />
        <span className="text-sm font-medium">Memuat sesi...</span>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, currentUser } = useAuth();
  const { isInitializing } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Hanya redirect setelah initial auth check selesai
    if (!isInitializing && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router, isInitializing]);

  // Selama session sedang divalidasi, tampilkan loading screen
  if (isInitializing) return <AuthLoadingScreen />;

  // Jika tidak terautentikasi setelah check selesai, jangan render apapun
  // (redirect sudah ditangani oleh useEffect + middleware)
  if (!isAuthenticated) return null;

  let pageTitle = PAGE_TITLES[pathname] || APP_NAME;
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
        <div className="fixed inset-0 z-layer-drawer lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 h-full shadow-2xl">
            <Sidebar onClose={() => setMobileOpen(false)} isMobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex-shrink-0 bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between z-layer-sticky">
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
    </div>
  );
}

