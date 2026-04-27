'use client';

import { STATUS_CONFIG } from '@/lib/types';
import { PermissionStatus } from '@/lib/types';

export default function StatusBadge({ status }: { status: PermissionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
