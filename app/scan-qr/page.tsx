'use client';

import { ScanLine, History, CheckCircle } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { QRScanner } from '@/components/qr/QRComponents';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppContext } from '@/context/AppContext';
import { Permission, UserRole } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

export default function ScanQRPage() {
  const { canAccess } = useAuth();
  const { permissions, markCompleted } = usePermissions();
  const { showToast } = useAppContext();

  if (!canAccess([UserRole.SECURITY])) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
          <ScanLine size={40} className="opacity-20" />
          <p className="font-medium">Anda tidak memiliki akses ke halaman ini</p>
        </div>
      </AppShell>
    );
  }

  const handleScanned = (perm: Permission | null) => {
    if (perm) showToast(`QR Valid: ${perm.studentName} (${perm.id})`, 'success');
    else showToast('QR Code tidak valid atau izin tidak aktif', 'error');
  };

  const handleMarkComplete = (id: string) => {
    markCompleted(id);
    showToast('Siswa berhasil dicatat sudah kembali ke sekolah', 'success');
  };

  // Recent completed today
  const recentActivity = permissions
    .filter(p => p.actualReturnTime)
    .slice(0, 5);

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Scan QR Code</h1>
        <p className="page-subtitle">Validasi dokumen perizinan siswa di gerbang sekolah</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Scanner */}
        <div className="card-lg p-6 md:p-8">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ScanLine size={18} className="text-blue-500" />
            Scanner
          </h3>
          <QRScanner
            permissions={permissions}
            onScanned={handleScanned}
            onMarkComplete={handleMarkComplete}
          />
        </div>

        {/* Activity Log */}
        <div className="card-lg overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <History size={16} className="text-slate-400" />
            <h3 className="font-bold text-slate-800">Log Aktivitas</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {recentActivity.length > 0 ? (
              recentActivity.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={18} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{p.studentName}</p>
                    <p className="text-xs text-slate-400">{p.kelas} · Kembali {formatDateTime(p.actualReturnTime!)}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <History size={32} className="opacity-20" />
                <p className="text-sm">Belum ada aktivitas hari ini</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
