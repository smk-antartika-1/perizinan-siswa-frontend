"use client";

import { useState } from "react";
import {
  CheckSquare,
  Inbox,
  Zap,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PermissionCard from "@/components/permissions/PermissionCard";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAppContext } from "@/context/AppContext";
import { UserRole } from "@/lib/types";

export default function ApprovalPage() {
  const { currentUser, canAccess } = useAuth();
  const {
    pendingForMe,
    bypassEligible,
    approveAsWali,
    approveAsPiket,
    approveBypassWali,
    reject,
  } = usePermissions();
  const { showToast } = useAppContext();

  // Track loading state per card to give clear per-action feedback
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const setLoading = (id: string, val: boolean) => {
    setLoadingIds(prev => {
      const next = new Set(prev);
      val ? next.add(id) : next.delete(id);
      return next;
    });
  };

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

  const isGuruPiket =
    currentUser?.role === UserRole.GURU_PIKET ||
    currentUser?.role === UserRole.ADMIN;
  const isWaliKelas = currentUser?.role === UserRole.WALI_KELAS;

  const handleApprove = async (id: string, comment?: string) => {
    setLoading(id, true);
    try {
      if (isWaliKelas) {
        await approveAsWali(id, comment);
        showToast("Izin disetujui dan diteruskan ke Guru Piket", "success");
      } else if (isGuruPiket) {
        await approveAsPiket(id, comment);
        showToast("Izin disetujui! QR Code sudah aktif untuk siswa", "success");
      }
    } catch (err: any) {
      showToast(err?.message || "Gagal menyetujui izin. Coba lagi.", "error");
    } finally {
      setLoading(id, false);
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    setLoading(id, true);
    try {
      await reject(id, reason);
      // Gunakan 'info' bukan 'error' — penolakan berhasil bukan sebuah error
      showToast("Pengajuan izin telah ditolak", "info");
    } catch (err: any) {
      showToast(err?.message || "Gagal menolak pengajuan. Coba lagi.", "error");
    } finally {
      setLoading(id, false);
    }
  };

  const handleBypassApprove = async (id: string, urgencyReason: string) => {
    setLoading(id, true);
    try {
      await approveBypassWali(id, urgencyReason);
      showToast(
        "Bypass darurat berhasil! QR Code langsung aktif untuk siswa.",
        "success",
      );
    } catch (err: any) {
      showToast(err?.message || "Gagal melakukan bypass darurat.", "error");
    } finally {
      setLoading(id, false);
    }
  };

  const stageLabel = isWaliKelas
    ? "Menunggu persetujuan Wali Kelas"
    : "Antrian verifikasi Guru Piket";

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Persetujuan Izin</h1>
        <p className="page-subtitle">{stageLabel}</p>
      </div>

      {/* Summary Bar — responsive untuk mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 mb-6 shadow-sm">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckSquare size={20} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate">
            {pendingForMe.length} Pengajuan Menunggu
          </p>
          <p className="text-xs text-slate-400">
            Segera tindak lanjuti agar siswa dapat keluar sekolah
          </p>
        </div>
        {isGuruPiket && bypassEligible.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl self-start sm:self-auto">
            <Zap size={13} className="text-amber-600 fill-amber-400 flex-shrink-0" />
            <span className="text-xs font-bold text-amber-700 whitespace-nowrap">
              {bypassEligible.length} Bypass Tersedia
            </span>
          </div>
        )}
      </div>

      {/* ── WALI KELAS VIEW ── */}
      {isWaliKelas && (
        <>
          {pendingForMe.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingForMe.map((p) => (
                <PermissionCard
                  key={p.id}
                  permission={p}
                  userRole={currentUser?.role}
                  showActions
                  isActionLoading={loadingIds.has(p.id)}
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
          {/* Section A: Normal Queue */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-slate-800 text-sm">Antrian Normal</h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  Sudah disetujui Wali Kelas — tinggal verifikasi Guru Piket
                </p>
              </div>
              <span className="ml-auto px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full flex-shrink-0">
                {pendingForMe.length}
              </span>
            </div>

            {pendingForMe.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pendingForMe.map((p) => (
                  <PermissionCard
                    key={p.id}
                    permission={p}
                    userRole={currentUser?.role}
                    showActions
                    isActionLoading={loadingIds.has(p.id)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                <Inbox size={20} className="opacity-40 flex-shrink-0" />
                <p className="text-sm font-medium">Tidak ada antrian normal saat ini.</p>
              </div>
            )}
          </section>

          {/* Section B: Bypass Darurat */}
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-amber-600 fill-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-slate-800 text-sm">Bypass Darurat</h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  Belum disetujui Wali Kelas — gunakan hanya jika benar-benar mendesak
                </p>
              </div>
              <span
                className={`ml-auto px-2.5 py-1 text-xs font-bold rounded-full flex-shrink-0 ${
                  bypassEligible.length > 0
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {bypassEligible.length}
              </span>
            </div>

            {bypassEligible.length > 0 && (
              <div className="flex items-start gap-3 p-3.5 mb-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Gunakan fitur bypass dengan bijak.</strong> Setiap persetujuan
                  bypass akan tercatat di audit log beserta alasan urgensi yang Anda
                  masukkan. Wali Kelas akan melihat ini di riwayat izin siswa.
                </p>
              </div>
            )}

            {bypassEligible.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {bypassEligible.map((p) => (
                  <PermissionCard
                    key={p.id}
                    permission={p}
                    userRole={currentUser?.role}
                    showActions
                    isActionLoading={loadingIds.has(p.id)}
                    onReject={handleReject}
                    onBypassApprove={handleBypassApprove}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                <Inbox size={20} className="opacity-40 flex-shrink-0" />
                <p className="text-sm font-medium">
                  Tidak ada pengajuan yang membutuhkan bypass.
                </p>
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
