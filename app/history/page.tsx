'use client';

import { useState } from 'react';
import { History, Filter, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import PermissionTable from '@/components/permissions/PermissionTable';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppContext } from '@/context/AppContext';
import { PermissionStatus, UserRole } from '@/lib/types';
import { getDisplayStatus } from '@/lib/utils';

const STATUS_FILTERS = [
  { label: 'Semua', value: 'all' },
  { label: 'Menunggu', value: PermissionStatus.PENDING },
  { label: 'Disetujui Wali', value: PermissionStatus.APPROVED_WALI },
  { label: 'Izin Aktif', value: PermissionStatus.APPROVED_PIKET },
  { label: 'Izin Expired', value: PermissionStatus.EXPIRED },
  { label: 'Selesai', value: PermissionStatus.COMPLETED },
  { label: 'Ditolak', value: PermissionStatus.REJECTED },
];

// Skeleton loading untuk filter tab area
function FilterSkeleton() {
  return (
    <div className="flex gap-2 mb-6">
      {[80, 64, 96, 72, 72].map((w, i) => (
        <div key={i} className="skeleton h-8 rounded-lg" style={{ width: w }} />
      ))}
    </div>
  );
}

// Empty state saat user belum punya izin sama sekali
function EmptyHistory({ role }: { role: UserRole }) {
  const isSiswa = role === UserRole.SISWA;
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 animate-fadeIn">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
        <ClipboardList size={36} className="opacity-30" />
      </div>
      <div className="text-center max-w-xs">
        <p className="font-semibold text-slate-600 mb-1">
          {isSiswa ? 'Belum ada riwayat izin' : 'Belum ada riwayat perizinan'}
        </p>
        <p className="text-sm leading-relaxed">
          {isSiswa
            ? 'Anda belum pernah mengajukan izin. Klik tombol di bawah untuk mulai.'
            : 'Belum ada perizinan tercatat dari siswa di bawah pengawasan Anda.'}
        </p>
      </div>
      {isSiswa && (
        <Link
          href="/izin"
          className="btn-primary text-sm px-5 py-2.5"
        >
          Ajukan Izin Pertama
        </Link>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { currentUser } = useAuth();
  const { myPermissions, isLoading } = usePermissions();
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = statusFilter === 'all'
    ? myPermissions
    : myPermissions.filter(p => getDisplayStatus(p) === statusFilter);

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

      {/* Filter Tabs — scrollable on mobile to prevent clipping */}
      {isLoading ? (
        <FilterSkeleton />
      ) : (
        <div className="overflow-x-auto pb-1 -mx-1 px-1 mb-6">
          <div className="flex items-center gap-2 min-w-max">
            <Filter size={14} className="text-slate-400 flex-shrink-0" />
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                aria-pressed={statusFilter === f.value}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === f.value
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {f.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  statusFilter === f.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {f.value === 'all'
                    ? myPermissions.length
                    : myPermissions.filter(p => getDisplayStatus(p) === f.value).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && myPermissions.length === 0 ? (
        <EmptyHistory role={currentUser?.role ?? UserRole.SISWA} />
      ) : (
        <PermissionTable permissions={filtered} groupByClass={isGrouped} />
      )}
    </AppShell>
  );
}
