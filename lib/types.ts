// ============================================================
// ENUMS
// ============================================================
export enum UserRole {
  SISWA = 'siswa',
  WALI_KELAS = 'wali_kelas',
  GURU_PIKET = 'guru_piket',
  SECURITY = 'security',
  ADMIN = 'admin',
}

export enum PermissionStatus {
  PENDING = 'pending',
  APPROVED_WALI = 'approved_wali',
  APPROVED_PIKET = 'approved_piket',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

// ============================================================
// INTERFACES
// ============================================================
export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  username: string;
  password: string;
  nis?: string;
  kelas?: string;
  nip?: string;
  photoUrl?: string;
}

export interface Permission {
  id: string;
  studentId: string;
  studentName: string;
  kelas: string;
  reason: string;
  departureTime: string;
  estimatedReturnTime: string;
  actualReturnTime?: string;
  status: PermissionStatus;
  createdAt: string;
  approvedByWaliId?: string;
  approvedByWaliName?: string;
  approvedByPiketId?: string;
  approvedByPiketName?: string;
  rejectedReason?: string;
  nomorPolisi?: string;
  qrCode?: string;
  suratUrl?: string;
}

export interface Student {
  id: string;
  name: string;
  kelas: string;
  email: string;
  nis: string;
  waliKelasId: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

// ============================================================
// CONSTANTS
// ============================================================
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SISWA]: 'Siswa',
  [UserRole.WALI_KELAS]: 'Wali Kelas',
  [UserRole.GURU_PIKET]: 'Guru Piket',
  [UserRole.SECURITY]: 'Security',
  [UserRole.ADMIN]: 'Administrator',
};

export const STATUS_CONFIG: Record<PermissionStatus, { label: string; color: string; bg: string }> = {
  [PermissionStatus.PENDING]: { label: 'Menunggu', color: 'text-amber-700', bg: 'bg-amber-100' },
  [PermissionStatus.APPROVED_WALI]: { label: 'Disetujui Wali', color: 'text-blue-700', bg: 'bg-blue-100' },
  [PermissionStatus.APPROVED_PIKET]: { label: 'Izin Aktif', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  [PermissionStatus.REJECTED]: { label: 'Ditolak', color: 'text-red-700', bg: 'bg-red-100' },
  [PermissionStatus.COMPLETED]: { label: 'Selesai', color: 'text-slate-600', bg: 'bg-slate-100' },
};
