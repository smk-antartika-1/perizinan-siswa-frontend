'use client';

import { motion } from 'motion/react';
import {
  ClipboardList, Clock, CheckCircle2, XCircle, TrendingUp,
  AlertCircle, QrCode, Plus, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_LABELS, UserRole, PermissionStatus } from '@/lib/types';
import { getPermissionStats, formatDateTime } from '@/lib/utils';
import { QRGenerator } from '@/components/qr/QRComponents';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { myPermissions, pendingForMe, activePermission } = usePermissions();

  if (!currentUser) return null;

  const stats = getPermissionStats(myPermissions);

  const STATS = [
    { label: 'Total Izin', value: stats.total, icon: ClipboardList, color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
    { label: 'Menunggu', value: stats.pending + stats.approvedWali, icon: Clock, color: 'bg-amber-500', shadow: 'shadow-amber-500/20' },
    { label: 'Aktif Sekarang', value: stats.active, icon: CheckCircle2, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
    { label: 'Ditolak', value: stats.rejected, icon: XCircle, color: 'bg-red-500', shadow: 'shadow-red-500/20' },
  ];

  return (
    <AppShell>
      {/* Welcome */}
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="page-title">
            Selamat datang, {currentUser.name.split(' ')[0]}! 👋
          </h1>
          <p className="page-subtitle">
            {ROLE_LABELS[currentUser.role]}
            {currentUser.kelas ? ` · ${currentUser.kelas}` : ''}
            {currentUser.nip ? ` · ${currentUser.nip}` : ''}
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
              Ada {pendingForMe.length} pengajuan izin menunggu persetujuan Anda
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

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-blue-600 to-red-600 rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full" />
              <TrendingUp size={24} className="mb-3 relative z-10" />
              <p className="font-bold relative z-10">Total {stats.total} perizinan</p>
              <p className="text-blue-100 text-sm mt-1 relative z-10">Tercatat dalam sistem</p>
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
                      {['Siswa', 'Alasan', 'Waktu', 'Status'].map(h => (
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
                          <StatusBadge status={p.status} />
                        </td>
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
    </AppShell>
  );
}
