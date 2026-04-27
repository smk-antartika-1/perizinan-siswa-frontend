import { Permission, PermissionStatus } from './types';

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function groupByKelas<T extends { kelas: string }>(items: T[]): Record<string, T[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.kelas]) acc[item.kelas] = [];
    acc[item.kelas].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function getPermissionStats(permissions: Permission[]) {
  return {
    total: permissions.length,
    pending: permissions.filter(p => p.status === PermissionStatus.PENDING).length,
    approvedWali: permissions.filter(p => p.status === PermissionStatus.APPROVED_WALI).length,
    approvedPiket: permissions.filter(p => p.status === PermissionStatus.APPROVED_PIKET).length,
    rejected: permissions.filter(p => p.status === PermissionStatus.REJECTED).length,
    completed: permissions.filter(p => p.status === PermissionStatus.COMPLETED).length,
    active: permissions.filter(p => p.status === PermissionStatus.APPROVED_PIKET).length,
  };
}

export function generateQRValue(permission: Permission): string {
  return JSON.stringify({
    id: permission.id,
    student: permission.studentName,
    kelas: permission.kelas,
    status: permission.status,
    validUntil: permission.estimatedReturnTime,
  });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
