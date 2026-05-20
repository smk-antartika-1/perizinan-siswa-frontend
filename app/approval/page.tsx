'use client';

import { CheckSquare, Inbox } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import PermissionCard from '@/components/permissions/PermissionCard';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppContext } from '@/context/AppContext';
import { UserRole } from '@/lib/types';

export default function ApprovalPage() {
  const { currentUser, canAccess } = useAuth();
  const { pendingForMe, approveAsWali, approveAsPiket, reject } = usePermissions();
  const { showToast } = useAppContext();

  if (!canAccess([UserRole.WALI_KELAS, UserRole.GURU_PIKET])) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
          <CheckSquare size={40} className="opacity-20" />
          <p className="font-medium">Anda tidak memiliki akses ke halaman ini</p>
        </div>
      </AppShell>
    );
  }

  const handleApprove = (id: string, comment?: string) => {
    if (currentUser?.role === UserRole.WALI_KELAS) {
      approveAsWali(id, comment);
      showToast('Izin berhasil disetujui dan diteruskan ke Guru Piket', 'success');
    } else if (currentUser?.role === UserRole.GURU_PIKET || currentUser?.role === UserRole.ADMIN) {
      approveAsPiket(id, comment);
      showToast('Izin disetujui! QR Code sudah aktif untuk siswa', 'success');
    }
  };

  const handleReject = (id: string, reason?: string) => {
    reject(id, reason);
    showToast('Pengajuan izin telah ditolak', 'error');
  };

  const stageLabel =
    currentUser?.role === UserRole.WALI_KELAS
      ? 'Menunggu persetujuan Wali Kelas'
      : 'Menunggu verifikasi Guru Piket';

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Persetujuan Izin</h1>
        <p className="page-subtitle">{stageLabel}</p>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 mb-6">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <CheckSquare size={20} className="text-amber-600" />
        </div>
        <div>
          <p className="font-bold text-slate-800">{pendingForMe.length} Pengajuan Menunggu</p>
          <p className="text-xs text-slate-400">Segera tindak lanjuti agar siswa dapat keluar sekolah</p>
        </div>
      </div>

      {pendingForMe.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pendingForMe.map(p => (
            <PermissionCard
              key={p.id}
              permission={p}
              userRole={currentUser?.role}
              showActions
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
            <Inbox size={36} className="opacity-40" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-600">Semua selesai!</p>
            <p className="text-sm mt-1">Tidak ada pengajuan yang perlu diproses saat ini</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
