'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Bell, QrCode } from 'lucide-react';
import Sidebar from './Sidebar';
import { ToastContainer } from '@/components/ui/Modal';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts, removeToast } = useAppContext();
  const { isAuthenticated } = useAuth();
  const { pendingForMe } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router]);

  if (!isAuthenticated) return null;

  // Page title mapping
  const PAGE_TITLES: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/izin': 'Ajukan Izin',
    '/history': 'Riwayat Perizinan',
    '/approval': 'Persetujuan Izin',
    '/students': 'Data Siswa',
    '/rekap': 'Rekap Data',
    '/scan-qr': 'Scan QR Code',
  };
  const pageTitle = PAGE_TITLES[pathname] || 'E-Izin Siswa';

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

      {/* Main */}
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
            <div className="relative cursor-pointer group">
              <div className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <Bell size={20} className="text-slate-500" />
              </div>
              {pendingForMe.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingForMe.length}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
