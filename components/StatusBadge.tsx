'use client';

import { PermissionStatus } from '@/lib/types';

export default function StatusBadge({ status }: { status: PermissionStatus }) {
  const configs = {
    [PermissionStatus.PENDING]: { color: 'bg-amber-100 text-amber-700', label: 'Menunggu' },
    [PermissionStatus.APPROVED_WALI]: { color: 'bg-blue-100 text-blue-700', label: 'Disetujui Wali' },
    [PermissionStatus.APPROVED_PIKET]: { color: 'bg-emerald-100 text-emerald-700', label: 'Izin Aktif' },
    [PermissionStatus.REJECTED]: { color: 'bg-red-100 text-red-700', label: 'Ditolak' },
    [PermissionStatus.COMPLETED]: { color: 'bg-slate-100 text-slate-700', label: 'Selesai' },
  };

  const config = configs[status];
  return (
    <span className={`status-badge ${config.color}`}>
      {config.label}
    </span>
  );
}
