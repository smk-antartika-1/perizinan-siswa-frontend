"use client";

import { useState } from "react";
import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import PermissionTable from "@/components/permissions/PermissionTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAppContext } from "@/context/AppContext";
import { UserRole } from "@/lib/types";
import { getPermissionStats, groupByKelas } from "@/lib/utils";
import { apiDownload } from "@/lib/api";

export default function RekapPage() {
  const { canAccess } = useAuth();
  const { permissions } = usePermissions();
  const { showToast } = useAppContext();
  const [view, setView] = useState<"table" | "summary">("summary");

  if (!canAccess([UserRole.GURU_PIKET, UserRole.SECURITY])) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
          <BarChart3 size={40} className="opacity-20" />
          <p className="font-medium">
            Anda tidak memiliki akses ke halaman ini
          </p>
        </div>
      </AppShell>
    );
  }

  const stats = getPermissionStats(permissions);
  const grouped = groupByKelas(permissions);

  const handleExport = async () => {
    try {
      const res = await apiDownload("/api/v1/reports/entry-exit/export.xlsx");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "rekap-keluar-masuk.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Export laporan berhasil diunduh.", "success");
    } catch {
      showToast("Gagal mengunduh laporan.", "error");
    }
  };

  const SUMMARY_STATS = [
    {
      label: "Total Semua Izin",
      value: stats.total,
      icon: BarChart3,
      color: "bg-blue-500",
    },
    {
      label: "Sedang Keluar",
      value: stats.active,
      icon: TrendingUp,
      color: "bg-emerald-500",
    },
    {
      label: "Menunggu Proses",
      value: stats.pending + stats.approvedWali,
      icon: Clock,
      color: "bg-amber-500",
    },
    {
      label: "Selesai",
      value: stats.completed,
      icon: CheckCircle,
      color: "bg-slate-500",
    },
  ];

  return (
    <AppShell>
      <div className="page-header">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-title">Rekap Data</h1>
            <p className="page-subtitle">
              Rekapitulasi lengkap data perizinan siswa
            </p>
          </div>
          <button onClick={handleExport} className="btn-secondary">
            <Download size={16} /> Export XLSX
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {SUMMARY_STATS.map((s) => (
          <div key={s.label} className="stat-card">
            <div
              className={`w-11 h-11 rounded-xl ${s.color} flex items-center justify-center text-white shadow-lg flex-shrink-0`}
            >
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: "summary" as const, label: "Per Kelas", icon: Users },
          { key: "table" as const, label: "Semua Data", icon: BarChart3 },
        ].map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              view === v.key
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300"
            }`}
          >
            <v.icon size={14} />
            {v.label}
          </button>
        ))}
      </div>

      {view === "summary" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(grouped).map(([kelas, items]) => {
            const s = getPermissionStats(items);
            return (
              <div key={kelas} className="card-lg p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{kelas}</p>
                    <p className="text-xs text-slate-400">
                      {items.length} perizinan tercatat
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Total", val: s.total, c: "text-slate-700" },
                    { label: "Aktif", val: s.active, c: "text-emerald-600" },
                    { label: "Pending", val: s.pending, c: "text-amber-600" },
                    { label: "Selesai", val: s.completed, c: "text-slate-500" },
                  ].map((x) => (
                    <div key={x.label} className="bg-slate-50 rounded-xl p-2.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {x.label}
                      </p>
                      <p className={`text-xl font-bold ${x.c}`}>{x.val}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  {items.slice(0, 2).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <span className="text-slate-600 truncate flex-1 mr-2">
                        {p.studentName}
                      </span>
                      <StatusBadge permission={p} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <PermissionTable permissions={permissions} groupByClass />
      )}
    </AppShell>
  );
}
