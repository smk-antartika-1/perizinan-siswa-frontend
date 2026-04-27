'use client';

import { useState } from 'react';
import { History, Filter } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import PermissionTable from '@/components/permissions/PermissionTable';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionStatus, UserRole } from '@/lib/types';

const STATUS_FILTERS = [
  { label: 'Semua', value: 'all' },
  { label: 'Menunggu', value: PermissionStatus.PENDING },
  { label: 'Disetujui Wali', value: PermissionStatus.APPROVED_WALI },
  { label: 'Izin Aktif', value: PermissionStatus.APPROVED_PIKET },
  { label: 'Selesai', value: PermissionStatus.COMPLETED },
  { label: 'Ditolak', value: PermissionStatus.REJECTED },
];

export default function HistoryPage() {
  const { currentUser } = useAuth();
  const { myPermissions } = usePermissions();
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = statusFilter === 'all'
    ? myPermissions
    : myPermissions.filter(p => p.status === statusFilter);

  const isGrouped = currentUser?.role !== UserRole.SISWA;

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Riwayat Perizinan</h1>
        <p className="page-subtitle">
          {currentUser?.role === UserRole.SISWA
            ? 'Semua pengajuan izin Anda'
            : 'Riwayat perizinan berdasarkan kelas'}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter size={14} className="text-slate-400" />
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === f.value
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {f.label}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
              statusFilter === f.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {f.value === 'all'
                ? myPermissions.length
                : myPermissions.filter(p => p.status === f.value).length}
            </span>
          </button>
        ))}
      </div>

      <PermissionTable permissions={filtered} groupByClass={isGrouped} />
    </AppShell>
  );
}
