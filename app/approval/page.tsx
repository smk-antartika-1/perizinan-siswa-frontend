'use client';

import { CheckSquare, Inbox, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import PermissionCard from '@/components/permissions/PermissionCard';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppContext } from '@/context/AppContext';
import { UserRole } from '@/lib/types';

export default function ApprovalPage() {
  const { currentUser, canAccess } = useAuth();
  const { pendingForMe, bypassEligible, approveAsWali, approveAsPiket, approveBypassWali, reject } = usePermissions();
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

  const isGuruPiket = currentUser?.role === UserRole.GURU_PIKET || currentUser?.role === UserRole.ADMIN;
  const isWaliKelas = currentUser?.role === UserRole.WALI_KELAS;

  const handleApprove = (id: string, comment?: string) => {
    if (isWaliKelas) {
      approveAsWali(id, comment);
      showToast('Izin berhasil disetujui dan diteruskan ke Guru Piket', 'success');
    } else if (isGuruPiket) {
      approveAsPiket(id, comment);
      showToast('Izin disetujui! QR Code sudah aktif untuk siswa', 'success');
    }
  };

  const handleReject = (id: string, reason?: string) => {
    reject(id, reason);
    showToast('Pengajuan izin telah ditolak', 'error');
  };

  const handleBypassApprove = (id: string, urgencyReason: string) => {
    approveBypassWali(id, urgencyReason);
    showToast('⚡ Bypass darurat berhasil! QR Code langsung aktif untuk siswa.', 'success');
  };

  const stageLabel = isWaliKelas
    ? 'Menunggu persetujuan Wali Kelas'
    : 'Antrian verifikasi Guru Piket';

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Persetujuan Izin</h1>
        <p className="page-subtitle">{stageLabel}</p>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 mb-6 shadow-sm">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <CheckSquare size={20} className="text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800">{pendingForMe.length} Pengajuan Menunggu</p>
          <p className="text-xs text-slate-400">Segera tindak lanjuti agar siswa dapat keluar sekolah</p>
        </div>
        {isGuruPiket && bypassEligible.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
            <Zap size={13} className="text-amber-600 fill-amber-400" />
            <span className="text-xs font-bold text-amber-700">{bypassEligible.length} Bypass Tersedia</span>
          </div>
        )}
      </div>

      {/* ── WALI KELAS VIEW ── */}
      {isWaliKelas && (
        <>
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
            <EmptyState />
          )}
        </>
      )}

      {/* ── GURU PIKET VIEW ── */}
      {isGuruPiket && (
        <div className="space-y-8">

          {/* Section A: Normal Queue (APPROVED_WALI) */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                <ShieldCheck size={16} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Antrian Normal</h2>
                <p className="text-[11px] text-slate-400 font-medium">Sudah disetujui Wali Kelas — tinggal verifikasi Guru Piket</p>
              </div>
              <span className="ml-auto px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                {pendingForMe.length}
              </span>
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
              <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                <Inbox size={20} className="opacity-40" />
                <p className="text-sm font-medium">Tidak ada antrian normal saat ini.</p>
              </div>
            )}
          </section>

          {/* Section B: Bypass Darurat (PENDING) */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                <Zap size={16} className="text-amber-600 fill-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Bypass Darurat</h2>
                <p className="text-[11px] text-slate-400 font-medium">Belum disetujui Wali Kelas — gunakan hanya jika benar-benar mendesak</p>
              </div>
              <span className={`ml-auto px-2.5 py-1 text-xs font-bold rounded-full ${
                bypassEligible.length > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                {bypassEligible.length}
              </span>
            </div>

            {/* Warning banner */}
            {bypassEligible.length > 0 && (
              <div className="flex items-start gap-3 p-3.5 mb-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Gunakan fitur bypass dengan bijak.</strong> Setiap persetujuan bypass akan tercatat di audit log beserta alasan urgensi yang Anda masukkan. Wali Kelas akan melihat ini di riwayat izin siswa.
                </p>
              </div>
            )}

            {bypassEligible.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {bypassEligible.map(p => (
                  <PermissionCard
                    key={p.id}
                    permission={p}
                    userRole={currentUser?.role}
                    showActions
                    onReject={handleReject}
                    onBypassApprove={handleBypassApprove}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                <Inbox size={20} className="opacity-40" />
                <p className="text-sm font-medium">Tidak ada pengajuan yang membutuhkan bypass.</p>
              </div>
            )}
          </section>

        </div>
      )}
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
        <Inbox size={36} className="opacity-40" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-600">Semua selesai!</p>
        <p className="text-sm mt-1">Tidak ada pengajuan yang perlu diproses saat ini</p>
      </div>
    </div>
  );
}
