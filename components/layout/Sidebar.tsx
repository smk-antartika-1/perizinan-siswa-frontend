'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, History, CheckSquare,
  BarChart3, Users, ScanLine, LogOut, QrCode, X
} from 'lucide-react';
import { UserRole, ROLE_LABELS } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.SISWA, UserRole.WALI_KELAS, UserRole.GURU_PIKET, UserRole.SECURITY, UserRole.ADMIN] },
  { href: '/izin', label: 'Ajukan Izin', icon: ClipboardList, roles: [UserRole.SISWA, UserRole.ADMIN] },
  { href: '/history', label: 'Riwayat', icon: History, roles: [UserRole.SISWA, UserRole.WALI_KELAS, UserRole.GURU_PIKET, UserRole.ADMIN] },
  { href: '/approval', label: 'Persetujuan', icon: CheckSquare, roles: [UserRole.WALI_KELAS, UserRole.GURU_PIKET, UserRole.ADMIN] },
  { href: '/students', label: 'Data Siswa', icon: Users, roles: [UserRole.WALI_KELAS, UserRole.GURU_PIKET, UserRole.ADMIN] },
  { href: '/rekap', label: 'Rekap Data', icon: BarChart3, roles: [UserRole.GURU_PIKET, UserRole.SECURITY, UserRole.ADMIN] },
  { href: '/scan-qr', label: 'Scan QR', icon: ScanLine, roles: [UserRole.SECURITY, UserRole.ADMIN] },
];

interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ onClose, isMobile = false }: SidebarProps) {
  const { currentUser, logout, canAccess } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const visibleItems = NAV_ITEMS.filter(item => canAccess(item.roles));

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className={`flex flex-col h-full ${isMobile ? 'w-full' : 'w-72'} bg-white border-r border-slate-200`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <QrCode className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 leading-tight">E-Izin Siswa</h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Smart School</p>
          </div>
        </div>
        {isMobile && onClose && (
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User Info */}
      {currentUser && (
        <div className="mx-4 mb-4 p-3 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-800 truncate">{currentUser.name}</p>
              <p className="text-xs text-blue-600 font-medium capitalize">
                {ROLE_LABELS[currentUser.role]}
                {currentUser.kelas ? ` · ${currentUser.kelas}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Menu</p>
        {visibleItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium text-sm group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500 transition-colors'} />
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-medium text-sm"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </div>
    </div>
  );
}
