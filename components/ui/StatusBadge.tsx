'use client';

import { Permission, PermissionStatus, STATUS_CONFIG } from '@/lib/types';
import { getDisplayStatus } from '@/lib/utils';

type StatusBadgeProps =
  | { permission: Permission; status?: never }
  | { status: PermissionStatus; permission?: never };

export default function StatusBadge(props: StatusBadgeProps) {
  const status = 'permission' in props
    ? getDisplayStatus(props.permission)
    : props.status;
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
