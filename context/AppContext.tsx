"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { apiDownload, apiRequest } from "@/lib/api";
import { User, Permission, Notification, UserRole } from "@/lib/types";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshData: () => Promise<void>;
  changePassword: (
    oldPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => Promise<void>;
  updateProfile: (payload: { avatar?: File; nopol?: string }) => Promise<void>;

  addUser: (user: Omit<User, "id">) => Promise<User | void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<User | void>;
  deleteUser: (id: string) => Promise<void>;
  importUsers: (
    role: UserRole,
    file: File,
  ) => Promise<{ inserted: number; skipped: number }>;
  exportUsers: (role?: string) => Promise<void>;
  downloadImportTemplate: (role: UserRole) => Promise<void>;

  activeStudentNis: string | null;
  viewStudent: (nis: string | null) => void;

  permissions: Permission[];
  addPermission: (
    perm: Omit<Permission, "id" | "createdAt">,
  ) => Promise<Permission | void>;
  updatePermission: (id: string, updates: Partial<Permission>) => Promise<void>;
  addPermissionComment: (id: string, text: string) => Promise<void>;
  markReturned: (id: string) => Promise<void>;
  markNoReturn: (id: string) => Promise<void>;
  generateQr: (
    id: string,
  ) => Promise<{ qrUrl: string; expiresAt: string; suratUrl?: string }>;

  notifications: Notification[];
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  unreadCount: number;

  toasts: Toast[];
  showToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function getStoredUser(): User | null {
  return null;
}

function storeUser(user: User | null) {
  if (typeof window === "undefined") return;
  localStorage.removeItem("currentUser");
}

function normalizeUser(raw: any): User {
  return {
    id: raw.id,
    name: raw.name,
    role: raw.role,
    email: raw.email || "",
    username: raw.username,
    password: "",
    nis: raw.nis || undefined,
    nip: raw.nip || undefined,
    kelas: raw.kelas || raw.className || raw.class_name || undefined,
    photoUrl: raw.avatarUrl || raw.avatar_url || undefined,
  };
}

async function downloadResponse(res: Response, fallback: string) {
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match?.[1] ?? fallback;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    getStoredUser(),
  );
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeStudentNis, setActiveStudentNis] = useState<string | null>(null);

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "success") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        3500,
      );
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadProfile = useCallback(async () => {
    const profile = await apiRequest<any>("/api/v1/profile");
    const user = normalizeUser(profile);
    setCurrentUser(user);
    storeUser(user);
    return user;
  }, []);

  const loadPermissions = useCallback(async () => {
    const data = await apiRequest<Permission[]>("/api/v1/permissions");
    setPermissions(data || []);
  }, []);

  const loadNotifications = useCallback(async () => {
    const data = await apiRequest<{
      data: Notification[];
      unreadCount: number;
    }>("/api/v1/notifications");
    setNotifications(data?.data || []);
  }, []);

  const loadAdminUsers = useCallback(async () => {
    const data = await apiRequest<{ data: User[] }>(
      "/api/v1/admin/users?limit=100",
    );
    setUsers((data?.data || []).map(normalizeUser));
  }, []);

  const loadStudentsByClass = useCallback(async () => {
    const grouped = await apiRequest<
      Record<string, Array<{ id: string; name: string; nis: string }>>
    >("/api/v1/classes/students");
    const studentUsers = Object.entries(grouped || {}).flatMap(
      ([kelas, students]) =>
        students.map((student) =>
          normalizeUser({
            ...student,
            role: UserRole.SISWA,
            username: student.nis,
            kelas,
            email: "",
          }),
        ),
    );
    setUsers(studentUsers);
  }, []);

  const refreshData = useCallback(async () => {
    const user = await loadProfile();
    await Promise.all([
      loadPermissions().catch(() => undefined),
      loadNotifications().catch(() => undefined),
      user.role === UserRole.ADMIN
        ? loadAdminUsers().catch(() => undefined)
        : user.role === UserRole.WALI_KELAS || user.role === UserRole.GURU_PIKET
          ? loadStudentsByClass().catch(() => undefined)
          : Promise.resolve(),
    ]);
  }, [
    loadAdminUsers,
    loadNotifications,
    loadPermissions,
    loadProfile,
    loadStudentsByClass,
  ]);

  useEffect(() => {
    refreshData().catch(() => {
      storeUser(null);
      setCurrentUser(null);
    });
  }, [refreshData]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const data = await apiRequest<{
          user: User;
        }>("/api/v1/auth/login", {
          method: "POST",
          skipAuth: true,
          body: JSON.stringify({ username, password }),
        });
        const profile = await loadProfile().catch(() =>
          normalizeUser(data.user),
        );
        setCurrentUser(profile);
        storeUser(profile);
        await refreshData().catch(() => undefined);
        return true;
      } catch {
        storeUser(null);
        setCurrentUser(null);
        return false;
      }
    },
    [loadProfile, refreshData],
  );

  const logout = useCallback(async () => {
    await apiRequest("/api/v1/auth/logout", {
      method: "POST",
      skipAuth: true,
    }).catch(() => undefined);
    storeUser(null);
    setCurrentUser(null);
    setUsers([]);
    setPermissions([]);
    setNotifications([]);
  }, []);

  const addUser = useCallback(async (user: Omit<User, "id">) => {
    const created = await apiRequest<User>("/api/v1/admin/users", {
      method: "POST",
      body: JSON.stringify(user),
    });
    const normalized = normalizeUser(created);
    setUsers((prev) => [normalized, ...prev]);
    return normalized;
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    const updated = await apiRequest<User>(`/api/v1/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    const normalized = normalizeUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === id ? normalized : u)));
    return normalized;
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    await apiRequest(`/api/v1/admin/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const importUsers = useCallback(
    async (role: UserRole, file: File) => {
      const form = new FormData();
      form.append("file", file);
      const result = await apiRequest<{ inserted: number; skipped: number }>(
        `/api/v1/admin/users/import.xlsx?role=${role}`,
        {
          method: "POST",
          body: form,
        },
      );
      await loadAdminUsers().catch(() => undefined);
      return result;
    },
    [loadAdminUsers],
  );

  const exportUsers = useCallback(async (role = "all") => {
    const res = await apiDownload(
      `/api/v1/admin/users/export.csv?role=${role}`,
    );
    await downloadResponse(res, `pengguna_${role}.csv`);
  }, []);

  const downloadImportTemplate = useCallback(async (role: UserRole) => {
    const res = await apiDownload(
      `/api/v1/admin/import-template.csv?role=${role}`,
    );
    await downloadResponse(res, `template_${role}.csv`);
  }, []);

  const viewStudent = useCallback((nis: string | null) => {
    setActiveStudentNis(nis);
  }, []);

  const addPermission = useCallback(
    async (perm: Omit<Permission, "id" | "createdAt">) => {
      const created = await apiRequest<Permission>("/api/v1/permissions", {
        method: "POST",
        body: JSON.stringify({
          reason: perm.reason,
          departureTime: perm.departureTime,
          estimatedReturnTime: perm.estimatedReturnTime,
          type: perm.willNotReturn ? "pulang_tidak_kembali" : "keluar_masuk",
          category: perm.category || "keperluan",
          nomorPolisi: perm.nomorPolisi || null,
        }),
      });
      setPermissions((prev) => [created, ...prev]);
      await loadNotifications().catch(() => undefined);
      return created;
    },
    [loadNotifications],
  );

  const updatePermission = useCallback(
    async (id: string, updates: Partial<Permission>) => {
      if (updates.status === "completed") {
        await apiRequest(`/api/v1/security/permissions/${id}/return`, {
          method: "PATCH",
        });
      } else if (updates.status === "approved_piket") {
        await apiRequest(`/api/v1/security/permissions/${id}/reopen`, {
          method: "PATCH",
        });
      } else if (updates.rejectedReason || updates.status === "rejected") {
        await apiRequest(`/api/v1/permissions/${id}/reject`, {
          method: "PATCH",
          body: JSON.stringify({ reason: updates.rejectedReason }),
        });
      } else {
        setPermissions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        );
        return;
      }
      await loadPermissions();
      await loadNotifications().catch(() => undefined);
    },
    [loadNotifications, loadPermissions],
  );

  const addPermissionComment = useCallback(
    async (id: string, text: string) => {
      await apiRequest(`/api/v1/permissions/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      await loadPermissions();
    },
    [loadPermissions],
  );

  const markReturned = useCallback(
    async (id: string) => {
      await apiRequest(`/api/v1/security/permissions/${id}/return`, {
        method: "PATCH",
      });
      await loadPermissions();
      await loadNotifications().catch(() => undefined);
    },
    [loadNotifications, loadPermissions],
  );

  const markNoReturn = useCallback(
    async (id: string) => {
      await apiRequest(`/api/v1/security/permissions/${id}/no-return`, {
        method: "PATCH",
      });
      await loadPermissions();
      await loadNotifications().catch(() => undefined);
    },
    [loadNotifications, loadPermissions],
  );

  const generateQr = useCallback(async (id: string) => {
    return apiRequest<{ qrUrl: string; expiresAt: string; suratUrl?: string }>(
      `/api/v1/permissions/${id}/qr`,
      { method: "POST" },
    );
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    await apiRequest(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    await apiRequest("/api/v1/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const changePassword = useCallback(
    async (
      oldPassword: string,
      newPassword: string,
      confirmPassword: string,
    ) => {
      await apiRequest("/api/v1/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });
    },
    [],
  );

  const updateProfile = useCallback(
    async (payload: { avatar?: File; nopol?: string }) => {
      const form = new FormData();
      if (payload.avatar) form.append("avatar", payload.avatar);
      if (payload.nopol !== undefined) form.append("nopol", payload.nopol);
      await apiRequest("/api/v1/profile", { method: "PATCH", body: form });
      await loadProfile();
    },
    [loadProfile],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        isAuthenticated: !!currentUser,
        refreshData,
        changePassword,
        updateProfile,
        addUser,
        updateUser,
        deleteUser,
        importUsers,
        exportUsers,
        downloadImportTemplate,
        activeStudentNis,
        viewStudent,
        permissions,
        addPermission,
        updatePermission,
        addPermissionComment,
        markReturned,
        markNoReturn,
        generateQr,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        unreadCount,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
