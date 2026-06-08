'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ClipboardList, Clock, CheckCircle2, XCircle, TrendingUp,
  AlertCircle, QrCode, Plus, ArrowRight, Eye
} from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_LABELS, UserRole, PermissionStatus } from '@/lib/types';
import { getPermissionStats, formatDateTime } from '@/lib/utils';
import { QRGenerator } from '@/components/qr/QRComponents';
import PermissionCard from '@/components/permissions/PermissionCard';
import { useAppContext } from '@/context/AppContext';
import Modal from '@/components/ui/Modal';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { 
    myPermissions, 
    pendingForMe, 
    activePermission,
    approveAsWali,
    approveAsPiket,
    reject
  } = usePermissions();
  const { showToast } = useAppContext();

  const [rejectingPermId, setRejectingPermId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  if (!currentUser) return null;

  const stats = getPermissionStats(myPermissions);

  const STATS = [
    { label: 'Total Izin', value: stats.total, icon: ClipboardList, color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
    { label: 'Menunggu', value: stats.pending + stats.approvedWali, icon: Clock, color: 'bg-amber-500', shadow: 'shadow-amber-500/20' },
    { label: 'Aktif Sekarang', value: stats.active, icon: CheckCircle2, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
    { label: 'Ditolak', value: stats.rejected, icon: XCircle, color: 'bg-red-500', shadow: 'shadow-red-500/20' },
  ];

  // Inline approval handler for Guru / Staff roles in dashboard
  const handleApprove = (id: string, comment?: string) => {
    const perm = myPermissions.find(p => p.id === id) || pendingForMe.find(p => p.id === id);
    if (!perm) return;
    if (currentUser.role === UserRole.WALI_KELAS) {
      approveAsWali(id, comment);
      showToast('Izin berhasil disetujui dan diteruskan ke Guru Piket', 'success');
    } else if (currentUser.role === UserRole.GURU_PIKET) {
      approveAsPiket(id, comment);
      showToast('Izin disetujui! QR Code sudah aktif untuk siswa', 'success');
    } else if (currentUser.role === UserRole.ADMIN) {
      if (perm.status === PermissionStatus.PENDING) {
        approveAsWali(id, comment);
        showToast('Izin berhasil disetujui sebagai Wali Kelas', 'success');
      } else {
        approveAsPiket(id, comment);
        showToast('Izin berhasil disetujui sebagai Guru Piket', 'success');
      }
    }
  };

  const handleReject = (id: string, reason?: string) => {
    reject(id, reason);
    showToast('Pengajuan izin telah ditolak', 'error');
  };

  const needsMyAction = (p: any) => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.WALI_KELAS) {
      return p.status === PermissionStatus.PENDING && p.kelas === currentUser.kelas;
    }
    if (currentUser.role === UserRole.GURU_PIKET) {
      return p.status === PermissionStatus.APPROVED_WALI;
    }
    if (currentUser.role === UserRole.ADMIN) {
      return p.status === PermissionStatus.PENDING || p.status === PermissionStatus.APPROVED_WALI;
    }
    return false;
  };

  return (
    <AppShell>
      {/* Welcome */}
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">
            Selamat datang, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="page-subtitle">
            {ROLE_LABELS[currentUser.role]}
            {currentUser.kelas ? ` - ${currentUser.kelas}` : ''}
            {currentUser.nip ? ` - ${currentUser.nip}` : ''}
          </p>
        </motion.div>
      </div>

      {/* Alert for pending approvals */}
      {pendingForMe.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3"
        >
          <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              Terdapat {pendingForMe.length} pengajuan izin menunggu persetujuan Anda
            </p>
          </div>
          <Link href="/approval" className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1">
            Proses <ArrowRight size={13} />
          </Link>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card"
          >
            <div className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center text-white shadow-lg ${s.shadow} flex-shrink-0`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Siswa: QR aktif + CTA */}
        {currentUser.role === UserRole.SISWA && (
          <div className="space-y-4">
            {activePermission ? (
              <div>
                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><QrCode size={16} className="text-blue-500" />QR Izin Aktif</h3>
                <QRGenerator permission={activePermission} />
              </div>
            ) : (
              <div className="card-lg p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl mx-auto flex items-center justify-center">
                  <QrCode size={32} className="text-blue-300" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Belum ada izin aktif</p>
                  <p className="text-sm text-slate-400 mt-1">Ajukan izin untuk mendapatkan QR Code</p>
                </div>
                <Link href="/izin" className="btn-primary w-full">
                  <Plus size={16} /> Ajukan Izin Baru
                </Link>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full" />
              <TrendingUp size={24} className="mb-3 relative z-layer-raised" />
              <p className="font-bold relative z-layer-raised">Total {stats.total} perizinan</p>
              <p className="text-blue-100 text-sm mt-1 relative z-layer-raised">Tercatat dalam sistem</p>
            </div>
          </div>
        )}

        {/* Staff view: Pending Approvals Grid */}
        {currentUser.role !== UserRole.SISWA && pendingForMe.length > 0 && (
          <div className="xl:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Clock size={16} className="text-amber-500 animate-pulse" />
                Persetujuan Menunggu Tindakan Anda ({pendingForMe.length})
              </h3>
              <Link href="/approval" className="text-xs font-bold text-blue-600 hover:underline">
                Kelola Semua
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingForMe.slice(0, 3).map(p => (
                <PermissionCard
                  key={p.id}
                  permission={p}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  userRole={currentUser.role}
                  showActions={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Permissions Table */}
        <div className={currentUser.role === UserRole.SISWA ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <div className="card-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Riwayat Terbaru</h3>
              <Link href="/history" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                Lihat semua <ArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              {myPermissions.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {(currentUser.role !== UserRole.SISWA 
                        ? ['Siswa', 'Alasan', 'Waktu', 'Status', 'Tindakan'] 
                        : ['Siswa', 'Alasan', 'Waktu', 'Status']
                      ).map(h => (
                        <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {myPermissions.slice(0, 6).map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                              {p.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{p.studentName}</p>
                              <p className="text-xs text-slate-400">{p.kelas}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 max-w-[180px]">
                          <p className="text-sm text-slate-600 truncate">{p.reason}</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(p.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge permission={p} />
                        </td>
                        {currentUser.role !== UserRole.SISWA && (
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {needsMyAction(p) ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleApprove(p.id)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm border border-emerald-250 select-none cursor-pointer"
                                  title="Setujui Pengajuan"
                                >
                                  <CheckCircle2 size={12} />
                                  Setujui
                                </button>
                                <button
                                  onClick={() => setRejectingPermId(p.id)}
                                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm border border-red-250 select-none cursor-pointer"
                                  title="Tolak Pengajuan"
                                >
                                  <XCircle size={12} />
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <Link
                                href={`/izin/${p.id}`}
                                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-650 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 inline-flex border border-slate-200 select-none hover:text-blue-650"
                              >
                                <Eye size={12} />
                                Detail
                              </Link>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-slate-400">
                  <ClipboardList size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Belum ada perizinan tercatat</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Confirmation Modal for Table Quick Actions */}
      <Modal 
        isOpen={rejectingPermId !== null} 
        onClose={() => {
          setRejectingPermId(null);
          setRejectReason('');
        }} 
        title="Konfirmasi Alasan Penolakan" 
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 text-xs text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            <p>Anda wajib memberikan alasan penolakan agar siswa memahami kendala pengajuan perizinan mereka.</p>
          </div>
          
          <textarea
            rows={3}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Tulis alasan penolakan, contoh: Dokumen/Surat Izin Orang Tua belum dilampirkan atau Alasan tidak mendesak..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/10 outline-none resize-none text-xs"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                setRejectingPermId(null);
                setRejectReason('');
              }} 
              className="py-2.5 rounded-xl border border-slate-200 text-slate-650 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (!rejectReason.trim() || !rejectingPermId) return;
                handleReject(rejectingPermId, rejectReason);
                setRejectingPermId(null);
                setRejectReason('');
              }}
              disabled={!rejectReason.trim()}
              className="py-2.5 rounded-xl bg-red-600 disabled:opacity-50 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-md shadow-red-500/15"
            >
              Kirim & Tolak Izin
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
