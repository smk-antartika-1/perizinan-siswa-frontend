import { PermissionStatus } from './types';

interface PermissionData {
  id: string;
  studentId: string;
  studentName: string;
  kelas: string;
  reason: string;
  departureTime: string;
  estimatedReturnTime: string;
  status: string;
  createdAt: string;
  approvedByWaliId?: string;
  approvedByPiketId?: string;
  actualReturnTime?: string;
  qrCode?: string;
}

// Use globalThis to persist data across HMR in dev mode
const globalForStore = globalThis as unknown as {
  permissions: PermissionData[] | undefined;
};

if (!globalForStore.permissions) {
  globalForStore.permissions = [
    {
      id: 'P-001',
      studentId: '1',
      studentName: 'Budi Santoso',
      kelas: 'XII IPA 1',
      reason: 'Keperluan Keluarga',
      departureTime: '2024-05-20T10:00:00Z',
      estimatedReturnTime: '2024-05-20T12:00:00Z',
      status: PermissionStatus.PENDING,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function getPermissions(): PermissionData[] {
  return globalForStore.permissions!;
}

export function addPermission(perm: Omit<PermissionData, 'id'>): PermissionData {
  const newPerm: PermissionData = {
    ...perm,
    id: `P-${Math.floor(Math.random() * 9000) + 1000}`,
  };
  globalForStore.permissions!.push(newPerm);
  return newPerm;
}

export function updatePermission(id: string, updates: Partial<PermissionData>): { success: boolean } {
  globalForStore.permissions = globalForStore.permissions!.map((p) =>
    p.id === id ? { ...p, ...updates } : p
  );
  return { success: true };
}
