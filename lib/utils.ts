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

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return formatDate(dateStr);
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

/**
 * Generate QR code value as a direct URL to the permission letter image.
 */
export function generateQRValue(permission: Permission): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://e-izin.sekolah.id';
  return `${baseUrl}/api/surat/${permission.id}.png`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
