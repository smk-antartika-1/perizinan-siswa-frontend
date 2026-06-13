"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { apiDownload, apiRequest, clearAuthSession, setOnUnauthenticated } from "@/lib/api";
import { User, Permission, Notification, UserRole, SchoolClass } from "@/lib/types";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface ImportPreviewRow {
  no: number;
  nama: string;
  identifier: string;
  kelas: string;
  kelasStatus: "matched" | "missing" | "not_required";
  classId: string | null;
  email: string;
}

export interface ImportPreviewResult {
  totalRows: number;
  rows: ImportPreviewRow[];
  unknownClasses: string[];
  summary: { matched: number; missing: number; notRequired: number };
}

export interface AdminUsersListParams {
  role?: UserRole | "all";
  classId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: "name" | "username" | "role" | "created_at";
  order?: "asc" | "desc";
}

export interface AdminUsersListResult {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminUserStats {
  total: number;
  byRole: Partial<Record<UserRole, number>>;
}

interface AppContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isInitializing: boolean;
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
  ) => Promise<{ inserted: number; skipped: number; skippedReasons?: { unknownClass: number } }>;
  previewImportUsers: (
    role: UserRole,
    file: File,
  ) => Promise<ImportPreviewResult>;
  exportUsers: (role?: string) => Promise<void>;
  downloadImportTemplate: (role: UserRole) => Promise<void>;

  classes: SchoolClass[];
  loadClasses: () => Promise<void>;
  createClass: (name: string) => Promise<SchoolClass>;
  updateClass: (id: string, name: string) => Promise<SchoolClass>;
  deleteClass: (id: string) => Promise<void>;

  listAdminUsers: (params: AdminUsersListParams) => Promise<AdminUsersListResult>;
  getAdminUserStats: (params?: { classId?: string }) => Promise<AdminUserStats>;

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
    classId: raw.classId || undefined,
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
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    getStoredUser(),
  );
  const currentUserRef = useRef<User | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const [isInitializing, setIsInitializing] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeStudentNis, setActiveStudentNis] = useState<string | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const authEpochRef = useRef(0);
  const isHandlingUnauthRef = useRef(false);

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "success") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      // Error toasts lebih lama supaya user sempat membaca di mobile
      const duration = type === "error" ? 5000 : 4000;
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        duration,
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
    if (typeof window !== "undefined") {
      document.cookie = "logged_in=true; path=/; max-age=31536000; SameSite=Lax; Secure";
    }
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

  const loadClasses = useCallback(async () => {
    const data = await apiRequest<SchoolClass[]>("/api/v1/classes");
    setClasses(data || []);
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
        ? loadClasses().catch(() => undefined)
        : user.role === UserRole.WALI_KELAS || user.role === UserRole.GURU_PIKET
          ? loadStudentsByClass().catch(() => undefined)
          : Promise.resolve(),
    ]);
  }, [
    loadClasses,
    loadNotifications,
    loadPermissions,
    loadProfile,
    loadStudentsByClass,
  ]);

  // Daftarkan global handler saat session expired (refresh token gagal)
  useEffect(() => {
    setOnUnauthenticated(() => {
      if (isHandlingUnauthRef.current) return;
      isHandlingUnauthRef.current = true;
      // Bersihkan semua state session
      storeUser(null);
      
      const wasAuthenticated = !!currentUserRef.current;
      
      setCurrentUser(null);
      setUsers([]);
      setClasses([]);
      setPermissions([]);
      setNotifications([]);
      setIsInitializing(false);
      
      if (typeof window !== "undefined") {
        document.cookie = "logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }

      // Tampilkan toast hanya jika user sebelumnya memang sudah login
      if (wasAuthenticated) {
        setToasts((prev) => [
          ...prev,
          {
            id: `session-expired-${Date.now()}`,
            message: 'Sesi berakhir. Silakan login kembali.',
            type: 'error' as const,
          },
        ]);
      }
      
      router.push('/login');
      // Reset flag setelah navigasi
      setTimeout(() => { isHandlingUnauthRef.current = false; }, 3000);
    });
  }, [router]);

  // Initial auth check — coba fetch profile untuk memvalidasi session
  useEffect(() => {
    const epoch = authEpochRef.current;
    setIsInitializing(true);
    refreshData()
      .catch(() => {
        if (authEpochRef.current !== epoch) return;
        storeUser(null);
        setCurrentUser(null);
        if (typeof window !== "undefined") {
          document.cookie = "logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      })
      .finally(() => {
        if (authEpochRef.current === epoch) setIsInitializing(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      authEpochRef.current += 1;
      setIsInitializing(false); // login eksplisit, tidak perlu initializing
      try {
        await clearAuthSession();
        const data = await apiRequest<{
          user: User;
          accessToken?: string;
          refreshToken?: string;
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
        if (typeof window !== "undefined") {
          document.cookie = "logged_in=true; path=/; max-age=31536000; SameSite=Lax; Secure";
          if (data.accessToken) localStorage.setItem('access_token', data.accessToken);
          if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken);
        }
        authEpochRef.current += 1;
        await refreshData().catch(() => undefined);
        return true;
      } catch {
        storeUser(null);
        setCurrentUser(null);
        if (typeof window !== "undefined") {
          document.cookie = "logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        return false;
      }
    },
    [loadProfile, refreshData],
  );

  const logout = useCallback(async () => {
    authEpochRef.current += 1;
    await clearAuthSession();
    storeUser(null);
    setCurrentUser(null);
    setUsers([]);
    setClasses([]);
    setPermissions([]);
    setNotifications([]);
    setIsInitializing(false);
    if (typeof window !== "undefined") {
      document.cookie = "logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }, []);

  const addUser = useCallback(async (user: Omit<User, "id">) => {
    const created = await apiRequest<User>("/api/v1/admin/users", {
      method: "POST",
      body: JSON.stringify(user),
    });
    return normalizeUser(created);
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    const updated = await apiRequest<User>(`/api/v1/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return normalizeUser(updated);
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    await apiRequest(`/api/v1/admin/users/${id}`, { method: "DELETE" });
  }, []);

  const importUsers = useCallback(async (role: UserRole, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiRequest<{
      inserted: number;
      skipped: number;
      skippedReasons?: { unknownClass: number };
    }>(`/api/v1/admin/users/import.xlsx?role=${role}`, {
      method: "POST",
      body: form,
    });
  }, []);

  const listAdminUsers = useCallback(async (params: AdminUsersListParams) => {
    const q = new URLSearchParams();
    if (params.role && params.role !== "all") q.set("role", params.role);
    if (params.classId && params.classId !== "all")
      q.set("classId", params.classId);
    if (params.search?.trim()) q.set("search", params.search.trim());
    q.set("page", String(params.page ?? 1));
    q.set("limit", String(params.limit ?? 10));
    if (params.sort) q.set("sort", params.sort);
    if (params.order) q.set("order", params.order);

    const data = await apiRequest<{
      data: User[];
      meta: AdminUsersListResult["meta"];
    }>(`/api/v1/admin/users?${q.toString()}`);
    return {
      data: (data?.data || []).map(normalizeUser),
      meta: data.meta,
    };
  }, []);

  const getAdminUserStats = useCallback(
    async (params: { classId?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.classId && params.classId !== "all")
        q.set("classId", params.classId);
      const suffix = q.toString() ? `?${q.toString()}` : "";
      return apiRequest<AdminUserStats>(`/api/v1/admin/users/stats${suffix}`);
    },
    [],
  );

  const previewImportUsers = useCallback(async (role: UserRole, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiRequest<ImportPreviewResult>(
      `/api/v1/admin/users/import-preview.xlsx?role=${role}`,
      {
        method: "POST",
        body: form,
      },
    );
  }, []);

  const exportUsers = useCallback(async (role = "all") => {
    const res = await apiDownload(
      `/api/v1/admin/users/export.xlsx?role=${role}`,
    );
    await downloadResponse(res, `pengguna_${role}.xlsx`);
  }, []);

  const downloadImportTemplate = useCallback(async (role: UserRole) => {
    const res = await apiDownload(
      `/api/v1/admin/import-template.xlsx?role=${role}`,
    );
    await downloadResponse(res, `template_${role}.xlsx`);
  }, []);

  const createClass = useCallback(async (name: string) => {
    const created = await apiRequest<SchoolClass>("/api/v1/classes", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setClasses((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }, []);

  const updateClass = useCallback(async (id: string, name: string) => {
    const updated = await apiRequest<SchoolClass>(`/api/v1/classes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    setClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c)).sort((a, b) => a.name.localeCompare(b.name)),
    );
    return updated;
  }, []);

  const deleteClass = useCallback(async (id: string) => {
    await apiRequest(`/api/v1/classes/${id}`, { method: "DELETE" });
    setClasses((prev) => prev.filter((c) => c.id !== id));
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
        isInitializing,
        refreshData,
        changePassword,
        updateProfile,
        addUser,
        updateUser,
        deleteUser,
        importUsers,
        previewImportUsers,
        exportUsers,
        downloadImportTemplate,
        classes,
        loadClasses,
        createClass,
        updateClass,
        deleteClass,
        listAdminUsers,
        getAdminUserStats,
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
