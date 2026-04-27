'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ClipboardList, Clock, Bell, ChevronRight, Car } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppContext } from '@/context/AppContext';
import { PermissionStatus, UserRole } from '@/lib/types';

export default function IzinPage() {
  const { currentUser, canAccess } = useAuth();
  const { addPermission } = usePermissions();
  const { showToast } = useAppContext();
  const router = useRouter();

  const [reason, setReason] = useState('');
  const [nomorPolisi, setNomorPolisi] = useState('');
  const [loading, setLoading] = useState(false);

  if (!canAccess([UserRole.SISWA])) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
          <ClipboardList size={40} className="opacity-20" />
          <p className="font-medium">Anda tidak memiliki akses ke halaman ini</p>
        </div>
      </AppShell>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    setTimeout(() => {
      addPermission({
        studentId: currentUser.id,
        studentName: currentUser.name,
        kelas: currentUser.kelas || '',
        reason,
        departureTime: new Date().toISOString(),
        estimatedReturnTime: new Date(Date.now() + 2 * 3600000).toISOString(),
        status: PermissionStatus.PENDING,
        nomorPolisi: nomorPolisi || undefined,
      });
      showToast('Pengajuan izin berhasil dikirim!', 'success');
      setLoading(false);
      router.push('/dashboard');
    }, 800);
  };

  const reasonPresets = [
    'Keperluan Keluarga',
    'Sakit / Periksa Dokter',
    'Urusan Administrasi',
    'Kompetisi / Lomba',
    'Kegiatan Ekstrakurikuler',
  ];

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Ajukan Izin</h1>
        <p className="page-subtitle">Isi formulir pengajuan izin keluar sekolah dengan benar</p>
      </div>

      <div className="max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-lg p-6 md:p-8"
        >
          {/* Student Info */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-6">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {currentUser?.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{currentUser?.name}</p>
              <p className="text-xs text-blue-600 font-medium">{currentUser?.kelas}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Reason */}
            <div>
              <label className="label">Alasan Izin <span className="text-red-400">*</span></label>
              <textarea
                required
                rows={4}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Jelaskan alasan Anda dengan jelas dan singkat..."
                className="input resize-none"
              />
              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 mt-2">
                {reasonPresets.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setReason(p)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-500 transition-colors font-medium"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Time (auto) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Jam Berangkat</label>
                <div className="input bg-slate-50 flex items-center gap-2 cursor-not-allowed text-slate-500">
                  <Clock size={15} />
                  <span>Sekarang</span>
                </div>
              </div>
              <div>
                <label className="label">Estimasi Kembali</label>
                <div className="input bg-slate-50 flex items-center gap-2 cursor-not-allowed text-slate-500">
                  <Clock size={15} />
                  <span>+2 Jam</span>
                </div>
              </div>
            </div>

            {/* Nomor Polisi (optional) */}
            <div>
              <label className="label">
                <Car size={11} className="inline mr-1" />
                No. Polisi Kendaraan <span className="text-slate-300 font-normal normal-case">(opsional)</span>
              </label>
              <input
                type="text"
                value={nomorPolisi}
                onChange={e => setNomorPolisi(e.target.value.toUpperCase())}
                placeholder="Contoh: B 1234 XYZ"
                className="input font-mono"
              />
            </div>

            {/* Info */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
              <Bell size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Pengajuan akan diteruskan ke <strong>Wali Kelas</strong> untuk disetujui, lalu diverifikasi oleh <strong>Guru Piket</strong> sebelum QR Code diterbitkan.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="btn-primary w-full py-3.5 text-base"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  Kirim Pengajuan <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AppShell>
  );
}
