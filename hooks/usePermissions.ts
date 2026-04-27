'use client';

import { useAppContext } from '@/context/AppContext';
import { useAuth } from './useAuth';
import { Permission, PermissionStatus, UserRole } from '@/lib/types';

export function usePermissions() {
  const { permissions, addPermission, updatePermission } = useAppContext();
  const { currentUser } = useAuth();

  // Filter permissions by role
  const myPermissions = (() => {
    if (!currentUser) return [];
    switch (currentUser.role) {
      case UserRole.SISWA:
        return permissions.filter(p => p.studentId === currentUser.id);
      case UserRole.WALI_KELAS:
        return permissions.filter(p => p.kelas === currentUser.kelas);
      default:
        return permissions;
    }
  })();

  // Pending approvals for wali kelas / guru piket
  const pendingForMe = (() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.WALI_KELAS) {
      return permissions.filter(
        p => p.status === PermissionStatus.PENDING && p.kelas === currentUser.kelas
      );
    }
    if (currentUser.role === UserRole.GURU_PIKET || currentUser.role === UserRole.ADMIN) {
      return permissions.filter(p => p.status === PermissionStatus.APPROVED_WALI);
    }
    return [];
  })();

  const approveAsWali = (id: string) => {
    if (!currentUser) return;
    updatePermission(id, {
      status: PermissionStatus.APPROVED_WALI,
      approvedByWaliId: currentUser.id,
      approvedByWaliName: currentUser.name,
    });
  };

  const approveAsPiket = (id: string) => {
    if (!currentUser) return;
    updatePermission(id, {
      status: PermissionStatus.APPROVED_PIKET,
      approvedByPiketId: currentUser.id,
      approvedByPiketName: currentUser.name,
    });
  };

  const reject = (id: string, reason?: string) => {
    updatePermission(id, {
      status: PermissionStatus.REJECTED,
      rejectedReason: reason || 'Tidak memenuhi syarat',
    });
  };

  const markCompleted = (id: string) => {
    updatePermission(id, {
      status: PermissionStatus.COMPLETED,
      actualReturnTime: new Date().toISOString(),
    });
  };

  const activePermission = permissions.find(
    p => p.status === PermissionStatus.APPROVED_PIKET && p.studentId === currentUser?.id
  );

  return {
    permissions,
    myPermissions,
    pendingForMe,
    addPermission,
    updatePermission,
    approveAsWali,
    approveAsPiket,
    reject,
    markCompleted,
    activePermission,
  };
}
