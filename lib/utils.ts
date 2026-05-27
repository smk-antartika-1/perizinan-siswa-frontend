import { Permission, PermissionStatus, UserRole } from "./types";

export function getPermissionExpiry(permission: Permission): Date | null {
  if (permission.expiresAt) {
    const explicit = new Date(permission.expiresAt);
    if (!Number.isNaN(explicit.valueOf())) return explicit;
  }

  const estimated = permission.estimatedReturnTime
    ? new Date(permission.estimatedReturnTime)
    : null;
  if (estimated && !Number.isNaN(estimated.valueOf())) return estimated;

  const departure = permission.departureTime
    ? new Date(permission.departureTime)
    : null;
  if (!departure || Number.isNaN(departure.valueOf())) return null;

  const endOfDay = new Date(departure);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

export function isPermissionExpired(permission: Permission): boolean {
  if (permission.isExpired === true) return true;
  if (permission.status === PermissionStatus.EXPIRED) return true;
  if (permission.status !== PermissionStatus.APPROVED_PIKET) return false;
  const expiresAt = getPermissionExpiry(permission);
  return Boolean(expiresAt && new Date() > expiresAt);
}

export function getDisplayStatus(permission: Permission): PermissionStatus {
  return isPermissionExpired(permission)
    ? PermissionStatus.EXPIRED
    : permission.status;
}

/** True when approval workflow is finished (no further wali/piket actions). */
export function isApprovalFlowComplete(permission: Permission): boolean {
  const displayStatus = getDisplayStatus(permission);
  return (
    displayStatus === PermissionStatus.EXPIRED ||
    displayStatus === PermissionStatus.APPROVED_PIKET ||
    displayStatus === PermissionStatus.COMPLETED ||
    displayStatus === PermissionStatus.REJECTED
  );
}

export function canApprovePermission(
  permission: Permission,
  role: UserRole | undefined,
): boolean {
  if (!role || isApprovalFlowComplete(permission)) return false;

  if (role === UserRole.ADMIN) {
    return (
      permission.status === PermissionStatus.PENDING ||
      permission.status === PermissionStatus.APPROVED_WALI
    );
  }
  if (role === UserRole.WALI_KELAS) {
    return permission.status === PermissionStatus.PENDING;
  }
  if (role === UserRole.GURU_PIKET) {
    return permission.status === PermissionStatus.APPROVED_WALI;
  }
  return false;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isNoReturnPermission(permission: Permission): boolean {
  return (
    permission.willNotReturn === true ||
    permission.type === "pulang_tidak_kembali" ||
    !permission.estimatedReturnTime
  );
}

export function formatEstimatedReturn(permission: Permission): string {
  if (isNoReturnPermission(permission)) return "Tidak Kembali";
  return formatTime(permission.estimatedReturnTime!);
}

export function formatEstimatedReturnDateTime(permission: Permission): string {
  if (isNoReturnPermission(permission)) return "Tidak Kembali";
  return formatDateTime(permission.estimatedReturnTime!);
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return formatDate(dateStr);
}

export function groupByKelas<T extends { kelas: string }>(
  items: T[],
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      if (!acc[item.kelas]) acc[item.kelas] = [];
      acc[item.kelas].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

export function getPermissionStats(permissions: Permission[]) {
  return {
    total: permissions.length,
    pending: permissions.filter((p) => p.status === PermissionStatus.PENDING)
      .length,
    approvedWali: permissions.filter(
      (p) => p.status === PermissionStatus.APPROVED_WALI,
    ).length,
    approvedPiket: permissions.filter(
      (p) => p.status === PermissionStatus.APPROVED_PIKET,
    ).length,
    expired: permissions.filter(
      (p) => getDisplayStatus(p) === PermissionStatus.EXPIRED,
    ).length,
    rejected: permissions.filter((p) => p.status === PermissionStatus.REJECTED)
      .length,
    completed: permissions.filter(
      (p) => p.status === PermissionStatus.COMPLETED,
    ).length,
    active: permissions.filter(
      (p) => getDisplayStatus(p) === PermissionStatus.APPROVED_PIKET,
    ).length,
  };
}

/**
 * Generate QR code value as a direct URL to the permission letter image.
 */
export function generateQRValue(permission: Permission): string {
  if (permission.suratUrl) return permission.suratUrl;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${apiBaseUrl}/api/v1/permissions/${permission.id}/surat`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
