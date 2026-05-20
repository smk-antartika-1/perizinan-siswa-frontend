"use client";

import { apiRequest } from "@/lib/api";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "./useAuth";
import { PermissionStatus, UserRole } from "@/lib/types";

export function usePermissions() {
  const {
    permissions,
    addPermission,
    updatePermission,
    refreshData,
    markReturned,
  } = useAppContext();
  const { currentUser } = useAuth();

  const myPermissions = (() => {
    if (!currentUser) return [];
    switch (currentUser.role) {
      case UserRole.SISWA:
        return permissions.filter((p) => p.studentId === currentUser.id);
      case UserRole.WALI_KELAS:
        return permissions.filter((p) => p.kelas === currentUser.kelas);
      default:
        return permissions;
    }
  })();

  const pendingForMe = (() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.WALI_KELAS) {
      return permissions.filter(
        (p) =>
          p.status === PermissionStatus.PENDING &&
          p.kelas === currentUser.kelas,
      );
    }
    if (
      currentUser.role === UserRole.GURU_PIKET ||
      currentUser.role === UserRole.ADMIN
    ) {
      return permissions.filter(
        (p) => p.status === PermissionStatus.APPROVED_WALI,
      );
    }
    return [];
  })();

  const bypassEligible = (() => {
    if (!currentUser) return [];
    if (
      currentUser.role === UserRole.GURU_PIKET ||
      currentUser.role === UserRole.ADMIN
    ) {
      return permissions.filter((p) => p.status === PermissionStatus.PENDING);
    }
    return [];
  })();

  const approveAsWali = async (id: string, comment?: string) => {
    await apiRequest(`/api/v1/permissions/${id}/wali-approve`, {
      method: "PATCH",
      body: JSON.stringify({ note: comment }),
    });
    await refreshData();
  };

  const approveAsPiket = async (
    id: string,
    comment?: string,
    nomorPolisi?: string,
  ) => {
    await apiRequest(`/api/v1/permissions/${id}/piket-approve`, {
      method: "PATCH",
      body: JSON.stringify({ note: comment, nomorPolisi }),
    });
    await refreshData();
  };

  const approveBypassWali = async (
    id: string,
    urgencyReason: string,
    nomorPolisi?: string,
  ) => {
    await apiRequest(`/api/v1/permissions/${id}/bypass-approve`, {
      method: "PATCH",
      body: JSON.stringify({ reason: urgencyReason, nomorPolisi }),
    });
    await refreshData();
  };

  const reject = async (id: string, reason?: string) => {
    await apiRequest(`/api/v1/permissions/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
    await refreshData();
  };

  const markCompleted = async (id: string) => {
    await markReturned(id);
  };

  const activePermission = permissions.find(
    (p) =>
      p.status === PermissionStatus.APPROVED_PIKET &&
      p.studentId === currentUser?.id,
  );

  return {
    permissions,
    myPermissions,
    pendingForMe,
    bypassEligible,
    addPermission,
    updatePermission,
    approveAsWali,
    approveAsPiket,
    approveBypassWali,
    reject,
    markCompleted,
    activePermission,
  };
}
