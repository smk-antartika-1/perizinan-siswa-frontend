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

  const approveAsWali = (id: string, comment?: string) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const targetPerm = permissions.find(p => p.id === id);
    if (!targetPerm) return;

    const newComments = [...(targetPerm.comments || [])];
    if (comment) {
      newComments.push({
        id: `c-${Math.random().toString(36).substring(2, 9)}`,
        userName: currentUser.name,
        userRole: currentUser.role,
        text: comment,
        timestamp: nowStr,
      });
    }

    const newAudit = [
      ...(targetPerm.auditLog || []),
      {
        id: `a-${Math.random().toString(36).substring(2, 9)}`,
        action: 'Disetujui Wali Kelas',
        actorName: currentUser.name,
        actorRole: currentUser.role,
        timestamp: nowStr,
        details: comment ? `Catatan: "${comment}"` : undefined,
      }
    ];

    updatePermission(id, {
      status: PermissionStatus.APPROVED_WALI,
      approvedByWaliId: currentUser.id,
      approvedByWaliName: currentUser.name,
      comments: newComments,
      auditLog: newAudit,
    });
  };

  const approveAsPiket = (id: string, comment?: string, nomorPolisi?: string) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const targetPerm = permissions.find(p => p.id === id);
    if (!targetPerm) return;

    const newComments = [...(targetPerm.comments || [])];
    if (comment) {
      newComments.push({
        id: `c-${Math.random().toString(36).substring(2, 9)}`,
        userName: currentUser.name,
        userRole: currentUser.role,
        text: comment,
        timestamp: nowStr,
      });
    }

    const newAudit = [
      ...(targetPerm.auditLog || []),
      {
        id: `a-${Math.random().toString(36).substring(2, 9)}`,
        action: 'Disetujui Guru Piket (QR Terbit)',
        actorName: currentUser.name,
        actorRole: currentUser.role,
        timestamp: nowStr,
        details: comment ? `Catatan: "${comment}"` : undefined,
      }
    ];

    updatePermission(id, {
      status: PermissionStatus.APPROVED_PIKET,
      approvedByPiketId: currentUser.id,
      approvedByPiketName: currentUser.name,
      qrCode: `QR-CODE-${id}`,
      nomorPolisi: nomorPolisi || targetPerm.nomorPolisi,
      comments: newComments,
      auditLog: newAudit,
    });
  };

  const reject = (id: string, reason?: string) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const targetPerm = permissions.find(p => p.id === id);
    if (!targetPerm) return;

    const newComments = [...(targetPerm.comments || [])];
    if (reason) {
      newComments.push({
        id: `c-${Math.random().toString(36).substring(2, 9)}`,
        userName: currentUser.name,
        userRole: currentUser.role,
        text: `Ditolak: ${reason}`,
        timestamp: nowStr,
      });
    }

    const newAudit = [
      ...(targetPerm.auditLog || []),
      {
        id: `a-${Math.random().toString(36).substring(2, 9)}`,
        action: 'Ditolak',
        actorName: currentUser.name,
        actorRole: currentUser.role,
        timestamp: nowStr,
        details: reason ? `Alasan: "${reason}"` : undefined,
      }
    ];

    updatePermission(id, {
      status: PermissionStatus.REJECTED,
      rejectedReason: reason || 'Tidak memenuhi syarat',
      comments: newComments,
      auditLog: newAudit,
    });
  };

  const markCompleted = (id: string) => {
    if (!currentUser) return;
    const nowStr = new Date().toISOString();
    const targetPerm = permissions.find(p => p.id === id);
    if (!targetPerm) return;

    const newAudit = [
      ...(targetPerm.auditLog || []),
      {
        id: `a-${Math.random().toString(36).substring(2, 9)}`,
        action: 'Siswa Kembali ke Sekolah',
        actorName: currentUser.name,
        actorRole: currentUser.role,
        timestamp: nowStr,
      }
    ];

    updatePermission(id, {
      status: PermissionStatus.COMPLETED,
      actualReturnTime: nowStr,
      auditLog: newAudit,
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
