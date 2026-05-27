"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Settings,
  Upload,
  Users,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  UserPlus,
  Info,
  Check,
  ShieldAlert,
  Filter,
  ChevronDown as ChevDown,
  FileDown,
  Loader2,
  GraduationCap,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import {
  useAppContext,
  type AdminUserStats,
  type ImportPreviewRow,
} from "@/context/AppContext";
import { ApiError } from "@/lib/api";
import { UserRole, ROLE_LABELS, User } from "@/lib/types";

type Tab = "import" | "users" | "classes";
type RoleFilter = "all" | UserRole;

const ROLE_FILTER_OPTIONS: {
  key: RoleFilter;
  label: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    key: "all",
    label: "Semua",
    color: "text-slate-700",
    bg: "bg-slate-600",
    border: "border-slate-600",
  },
  {
    key: UserRole.SISWA,
    label: "Siswa",
    color: "text-blue-700",
    bg: "bg-blue-600",
    border: "border-blue-600",
  },
  {
    key: UserRole.WALI_KELAS,
    label: "Wali Kelas",
    color: "text-purple-700",
    bg: "bg-purple-600",
    border: "border-purple-600",
  },
  {
    key: UserRole.GURU_PIKET,
    label: "Guru Piket",
    color: "text-amber-700",
    bg: "bg-amber-500",
    border: "border-amber-500",
  },
  {
    key: UserRole.SECURITY,
    label: "Security",
    color: "text-emerald-700",
    bg: "bg-emerald-600",
    border: "border-emerald-600",
  },
  {
    key: UserRole.ADMIN,
    label: "Admin",
    color: "text-red-700",
    bg: "bg-red-600",
    border: "border-red-600",
  },
];

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  [UserRole.SISWA]: "bg-blue-50 border border-blue-100 text-blue-700",
  [UserRole.WALI_KELAS]:
    "bg-purple-50 border border-purple-100 text-purple-700",
  [UserRole.GURU_PIKET]: "bg-amber-50 border border-amber-100 text-amber-700",
  [UserRole.SECURITY]:
    "bg-emerald-50 border border-emerald-100 text-emerald-700",
  [UserRole.ADMIN]: "bg-red-50 border border-red-100 text-red-700",
};

export default function AdminPage() {
  const {
    currentUser,
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
    showToast,
  } = useAppContext();

  // Navigation tabs
  const [tab, setTab] = useState<Tab>("import");

  // Search, Filter, Sort & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState<"name" | "username" | "role">(
    "role",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [usersMeta, setUsersMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [userStats, setUserStats] = useState<AdminUserStats>({
    total: 0,
    byRole: {},
  });
  const [usersLoading, setUsersLoading] = useState(false);

  // Export dropdown
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Excel Upload States
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importRole, setImportRole] = useState<UserRole>(UserRole.SISWA);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [previewTotalRows, setPreviewTotalRows] = useState(0);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form States (Add/Edit user)
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>(UserRole.SISWA);
  const [formEmail, setFormEmail] = useState("");
  const [formNis, setFormNis] = useState("");
  const [formNip, setFormNip] = useState("");
  const [formClassId, setFormClassId] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Class management states
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [isDeleteClassModalOpen, setIsDeleteClassModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classFormName, setClassFormName] = useState("");
  const [classFormError, setClassFormError] = useState("");

  // Import preview extras
  const [previewUnknownClasses, setPreviewUnknownClasses] = useState<string[]>([]);

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;

  const refreshAdminUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const classIdParam =
        classFilter !== "all" ? classFilter : undefined;
      const [list, stats] = await Promise.all([
        listAdminUsers({
          role: roleFilter,
          classId: classIdParam,
          search: debouncedSearch,
          page: currentPage,
          limit: pageSize,
          sort: sortColumn,
          order: sortDirection,
        }),
        getAdminUserStats({ classId: classIdParam }),
      ]);
      setAdminUsers(list.data);
      setUsersMeta(list.meta);
      setUserStats(stats);
    } catch {
      showToast("Gagal memuat daftar pengguna.", "error");
    } finally {
      setUsersLoading(false);
    }
  }, [
    classFilter,
    currentPage,
    debouncedSearch,
    getAdminUserStats,
    listAdminUsers,
    pageSize,
    roleFilter,
    showToast,
    sortColumn,
    sortDirection,
  ]);

  const hasAdminAccess = currentUser?.role === UserRole.ADMIN;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (tab !== "users" || !hasAdminAccess) return;
    void refreshAdminUsers();
  }, [tab, refreshAdminUsers, hasAdminAccess]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(e.target as Node)
      ) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, pageSize, roleFilter, classFilter]);

  // ──────────────────────────────────────────────
  // Excel drag & drop
  // ──────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) =>
    processFile(e.target.files?.[0]);

  const loadImportPreview = async (role: UserRole, file: File) => {
    setIsPreviewLoading(true);
    try {
      const preview = await previewImportUsers(role, file);
      setPreviewRows(preview.rows);
      setPreviewTotalRows(preview.totalRows);
      setPreviewUnknownClasses(preview.unknownClasses ?? []);
      showToast("Berkas dimuat. Pratinjau data di bawah ini.", "success");
    } catch {
      setPreviewRows([]);
      setPreviewTotalRows(0);
      setPreviewUnknownClasses([]);
      setShowPreview(false);
      setSelectedImportFile(null);
      setFileName(null);
      setFileSize(null);
      showToast("Gagal membaca preview XLSX. Pastikan format sesuai template.", "error");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const processFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.match(/\.xlsx$/i)) {
      showToast("Format file tidak valid. Gunakan .xlsx", "error");
      return;
    }
    setSelectedImportFile(file);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + " KB");
    setShowPreview(true);
    void loadImportPreview(importRole, file);
  };

  // Download per-role template from backend API
  const downloadTemplate = async (role: UserRole) => {
    setIsDownloadingTemplate(true);
    try {
      await downloadImportTemplate(role);
      showToast(`Template ${ROLE_LABELS[role]} berhasil diunduh!`, "success");
    } catch {
      showToast("Gagal mengunduh template. Coba lagi.", "error");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // ──────────────────────────────────────────────
  // Import Logic — uses selected importRole
  // ──────────────────────────────────────────────
  const handleImport = async () => {
    if (!selectedImportFile) {
      showToast("Pilih file import terlebih dahulu.", "error");
      return;
    }
    try {
      const result = await importUsers(importRole, selectedImportFile);
      const unknownMsg = result.skippedReasons?.unknownClass
        ? ` (${result.skippedReasons.unknownClass} kelas tidak ditemukan)`
        : "";
      showToast(
        `Sukses mengimpor ${result.inserted} pengguna sebagai ${ROLE_LABELS[importRole]}. ${result.skipped} baris dilewati${unknownMsg}.`,
        "success",
      );
      setSelectedImportFile(null);
      setPreviewRows([]);
      setPreviewTotalRows(0);
      setPreviewUnknownClasses([]);
      setFileName(null);
      setFileSize(null);
      setShowPreview(false);
      setRoleFilter(importRole);
      setCurrentPage(1);
      setTab("users");
      await refreshAdminUsers();
    } catch {
      showToast("Import gagal. Pastikan format file sesuai template.", "error");
    }
  };

  // ──────────────────────────────────────────────
  // Export XLSX (scoped by role or all)
  // ──────────────────────────────────────────────
  const handleExportXlsx = async (exportRole: RoleFilter = "all") => {
    try {
      await exportUsers(exportRole);
      const label =
        exportRole === "all"
          ? "Semua Pengguna"
          : ROLE_LABELS[exportRole as UserRole];
      showToast(`XLSX "${label}" berhasil diekspor.`, "success");
    } catch {
      showToast("Gagal mengekspor XLSX.", "error");
    } finally {
      setExportDropdownOpen(false);
    }
  };

  // ──────────────────────────────────────────────
  // Form Validation
  // ──────────────────────────────────────────────
  const validateForm = (isEdit = false) => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = "Nama lengkap wajib diisi";
    if (!formUsername.trim()) errors.username = "Username wajib diisi";
    if (!isEdit && !formPassword.trim())
      errors.password = "Kata sandi wajib diisi";
    if (!formEmail.trim()) {
      errors.email = "Alamat email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(formEmail)) {
      errors.email = "Format email tidak valid";
    }
    if (formRole === UserRole.SISWA) {
      if (!formNis.trim()) errors.nis = "NIS siswa wajib diisi";
      if (!formClassId) errors.kelas = "Kelas wajib dipilih";
    } else if (formRole === UserRole.WALI_KELAS) {
      if (!formNip.trim()) errors.nip = "NIP wajib diisi";
      if (!formClassId) errors.kelas = "Kelas binaan wajib dipilih";
    } else {
      if (!formNip.trim()) errors.nip = "NIP wajib diisi";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CRUD handlers
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    try {
      await addUser({
        name: formName,
        username: formUsername,
        password: formPassword,
        role: formRole,
        email: formEmail,
        ...(formRole === UserRole.SISWA && { nis: formNis, classId: formClassId }),
        ...(formRole === UserRole.WALI_KELAS && {
          nip: formNip,
          classId: formClassId,
        }),
        ...(formRole !== UserRole.SISWA &&
          formRole !== UserRole.WALI_KELAS && { nip: formNip }),
      });
      showToast(`Pengguna baru ${formName} berhasil ditambahkan!`, "success");
      closeAddModal();
      await refreshAdminUsers();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormErrors((prev) => ({
          ...prev,
          username: "Username sudah digunakan",
        }));
        return;
      }
      showToast("Gagal menambahkan pengguna.", "error");
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword("");
    setFormRole(user.role);
    setFormEmail(user.email);
    setFormNis(user.nis || "");
    setFormNip(user.nip || "");
    setFormClassId(user.classId || "");
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !validateForm(true)) return;
    try {
      await updateUser(selectedUser.id, {
        name: formName,
        username: formUsername,
        role: formRole,
        email: formEmail,
        nis: formRole === UserRole.SISWA ? formNis : undefined,
        nip: formRole !== UserRole.SISWA ? formNip : undefined,
        classId:
          formRole === UserRole.SISWA || formRole === UserRole.WALI_KELAS
            ? formClassId || undefined
            : undefined,
        ...(formPassword.trim() && { password: formPassword }),
      });
      showToast(`Profil pengguna ${formName} berhasil diperbarui.`, "success");
      closeEditModal();
      await refreshAdminUsers();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormErrors((prev) => ({
          ...prev,
          username: "Username sudah digunakan",
        }));
        return;
      }
      showToast("Gagal memperbarui pengguna.", "error");
    }
  };

  const openDeleteModal = (user: User) => {
    if (user.id === currentUser?.id) {
      showToast("Tidak dapat menghapus akun Anda sendiri.", "error");
      return;
    }
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };
  const handleDeleteExecute = async () => {
    if (!selectedUser) return;
    if (selectedUser.id === currentUser?.id) {
      showToast("Tidak dapat menghapus akun Anda sendiri.", "error");
      return;
    }
    try {
      await deleteUser(selectedUser.id);
      showToast(`Pengguna ${selectedUser.name} telah dihapus.`, "info");
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      await refreshAdminUsers();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        showToast(err.message || "Tidak dapat menghapus akun Anda sendiri.", "error");
        return;
      }
      showToast("Gagal menghapus pengguna.", "error");
    }
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setFormName("");
    setFormUsername("");
    setFormPassword("");
    setFormRole(UserRole.SISWA);
    setFormEmail("");
    setFormNis("");
    setFormNip("");
    setFormClassId("");
    setFormErrors({});
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleSort = (col: typeof sortColumn) => {
    if (sortColumn === col)
      setSortDirection((p) => (p === "asc" ? "desc" : "asc"));
    else {
      setSortColumn(col);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const selectedClassFilter = classes.find((c) => c.id === classFilter);
  const totalPages = usersMeta.totalPages || 1;

  const SortIcon = ({ col }: { col: typeof sortColumn }) =>
    sortColumn === col ? (
      sortDirection === "asc" ? (
        <ChevronUp size={11} />
      ) : (
        <ChevronDown size={11} />
      )
    ) : null;

  const activeRoleOpt = ROLE_FILTER_OPTIONS.find((o) => o.key === roleFilter)!;

  if (!currentUser) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p className="font-semibold">Memuat panel administrasi...</p>
        </div>
      </AppShell>
    );
  }

  if (!hasAdminAccess) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Settings size={40} className="opacity-20" />
          <p className="font-semibold">
            Anda tidak memiliki hak akses administrator
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Panel Administrasi (E-Izin)</h1>
          <p className="page-subtitle">
            Pusat kelola data pengguna sistem, otorisasi peran, dan import
            berkas Excel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "classes" && (
            <button
              onClick={() => { setClassFormName(""); setClassFormError(""); setIsAddClassModalOpen(true); }}
              className="btn-primary py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/10 text-white font-bold text-xs"
            >
              <Plus size={14} /> Tambah Kelas
            </button>
          )}
          {tab === "users" && (
            <>
              {/* Export with dropdown */}
              <div className="relative" ref={exportDropdownRef}>
                <button
                  onClick={() => setExportDropdownOpen((p) => !p)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600 font-bold text-xs text-slate-600 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} /> Ekspor XLSX{" "}
                  <ChevDown
                    size={12}
                    className={`transition-transform ${exportDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {exportDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden animate-fadeIn">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Ekspor berdasarkan peran
                      </p>
                    </div>
                    <button
                      onClick={() => handleExportXlsx("all")}
                      className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />
                      Semua Pengguna ({userStats.total})
                    </button>
                    {Object.values(UserRole).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleExportXlsx(r)}
                        className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                      >
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            {
                              siswa: "bg-blue-500",
                              wali_kelas: "bg-purple-500",
                              guru_piket: "bg-amber-500",
                              security: "bg-emerald-500",
                              admin: "bg-red-500",
                            }[r]
                          }`}
                        />
                        {ROLE_LABELS[r]} ({userStats.byRole[r] || 0})
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/10 text-white font-bold text-xs"
              >
                <Plus size={14} /> Tambah Pengguna
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 mb-6">
        {[
          {
            key: "import" as Tab,
            label: "Unggah Excel",
            icon: FileSpreadsheet,
          },
          { key: "users" as Tab, label: "Daftar Pengguna", icon: Users },
          { key: "classes" as Tab, label: "Kelola Kelas", icon: GraduationCap },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              if (t.key === "classes" || t.key === "users")
                loadClasses().catch(() => undefined);
            }}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              tab === t.key
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-slate-700"
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Import Excel ── */}
      {tab === "import" && (
        <div className="max-w-4xl space-y-6">
          <div className="card p-8 border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Import Excel Data Pengguna
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Unggah data pengguna dalam format .xlsx untuk diimpor secara
                  massal.
                </p>
              </div>
            </div>

            {/* Role Selector for Import */}
            <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Filter size={10} />
                  Import sebagai peran
                </label>
                {/* Download Template Button */}
                <button
                  onClick={() => downloadTemplate(importRole)}
                  disabled={isDownloadingTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  title={`Unduh template XLSX untuk peran ${ROLE_LABELS[importRole]}`}
                >
                  {isDownloadingTemplate ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />{" "}
                      Mengunduh...
                    </>
                  ) : (
                    <>
                      <FileDown size={12} /> Unduh Template{" "}
                      {ROLE_LABELS[importRole]}
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.values(UserRole).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setImportRole(r);
                      if (selectedImportFile) {
                        void loadImportPreview(r, selectedImportFile);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      importRole === r
                        ? `${ROLE_BADGE_COLORS[r]} border-current shadow-sm scale-105`
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">
                Semua baris data akan diimpor sebagai peran:{" "}
                <strong
                  className={
                    ROLE_FILTER_OPTIONS.find((o) => o.key === importRole)
                      ?.color || ""
                  }
                >
                  {ROLE_LABELS[importRole]}
                </strong>
                <span className="mx-1.5 text-slate-300">·</span>
                Template XLSX berisi kolom yang sesuai dengan peran ini.
              </p>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragging
                  ? "border-blue-500 bg-blue-50/80 scale-[0.98] shadow-inner"
                  : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/50"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-sm">
                <FileSpreadsheet size={24} className="text-blue-500" />
              </div>
              {fileName ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">{fileName}</p>
                  <p className="text-xs text-slate-400 font-semibold font-mono">
                    {fileSize}
                  </p>
                  <p className="text-xs text-emerald-600 mt-2 font-bold flex items-center justify-center gap-1 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full w-fit mx-auto">
                    <CheckCircle size={12} /> Berkas Siap Diimpor
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Tarik & Lepaskan Berkas Excel di sini
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">
                    Atau klik untuk menjelajahi folder komputer Anda
                  </p>
                  <p className="text-[10px] text-slate-350 mt-4 uppercase tracking-widest font-bold">
                    Mendukung: .xlsx
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Preview grid */}
          {showPreview && (
            <div className="card border-slate-200 overflow-hidden">
              {previewUnknownClasses.length > 0 && (
                <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-start gap-3">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">
                      {previewUnknownClasses.length} kelas tidak ditemukan di master data — baris terkait akan di-skip saat import.
                    </p>
                    <p className="text-[10px] text-amber-700 mt-1">
                      Kelas tidak dikenal:{" "}
                      {previewUnknownClasses.map((k, i) => (
                        <span key={i} className="inline-block bg-amber-100 border border-amber-300 text-amber-800 rounded px-1.5 py-0.5 font-mono mr-1 mb-1">{k}</span>
                      ))}
                    </p>
                    <p className="text-[10px] text-amber-600 mt-1 font-semibold">
                      Buat kelas tersebut di tab <strong>Kelola Kelas</strong> terlebih dahulu, lalu upload ulang file ini.
                    </p>
                  </div>
                </div>
              )}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-blue-600" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">
                      Preview Lembar Kerja Excel
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      {previewTotalRows} baris · akan diimpor sebagai{" "}
                      <strong>{ROLE_LABELS[importRole]}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleImport}
                  disabled={isPreviewLoading || previewTotalRows === 0}
                  className="btn-primary py-2 px-4 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/10 text-white font-bold text-xs inline-flex items-center gap-1.5"
                >
                  {isPreviewLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} className="stroke-[3px]" />
                  )}{" "}
                  Import Sekarang
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    <tr>
                      {["No", "Nama", "NIS / ID", "Kelas", "Email"].map((h) => (
                        <th key={h} className="px-5 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isPreviewLoading && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-xs font-semibold text-slate-400"
                        >
                          Membaca isi file XLSX...
                        </td>
                      </tr>
                    )}
                    {!isPreviewLoading && previewRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-xs font-semibold text-slate-400"
                        >
                          Tidak ada data yang dapat dipreview.
                        </td>
                      </tr>
                    )}
                    {!isPreviewLoading && previewRows.map((row) => (
                      <tr
                        key={row.no}
                        className="hover:bg-slate-50/30 transition-colors"
                      >
                        <td className="px-5 py-3 text-xs font-mono font-semibold text-slate-400">
                          {row.no}
                        </td>
                        <td className="px-5 py-3 text-xs font-bold text-slate-800">
                          {row.nama}
                        </td>
                        <td className="px-5 py-3 text-xs font-mono font-bold text-blue-600">
                          {row.identifier}
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <span>{row.kelas || "-"}</span>
                            {row.kelasStatus === "matched" && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                                <Check size={8} className="stroke-[3px]" /> OK
                              </span>
                            )}
                            {row.kelasStatus === "missing" && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 border border-red-200 text-red-600">
                                <AlertCircle size={8} /> Tidak ditemukan
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">
                          {row.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Users CRUD ── */}
      {tab === "users" && (
        <div className="space-y-4">
          {/* Role Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: "Total",
                count: userStats.total,
                color: "from-slate-600 to-slate-700",
              },
              {
                label: "Siswa",
                count: userStats.byRole[UserRole.SISWA] || 0,
                color: "from-blue-500 to-blue-600",
              },
              {
                label: "Wali Kelas",
                count: userStats.byRole[UserRole.WALI_KELAS] || 0,
                color: "from-purple-500 to-purple-600",
              },
              {
                label: "Guru Piket",
                count: userStats.byRole[UserRole.GURU_PIKET] || 0,
                color: "from-amber-500 to-amber-600",
              },
              {
                label: "Security",
                count: userStats.byRole[UserRole.SECURITY] || 0,
                color: "from-emerald-500 to-emerald-600",
              },
              {
                label: "Admin",
                count: userStats.byRole[UserRole.ADMIN] || 0,
                color: "from-red-500 to-red-600",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`bg-gradient-to-br ${stat.color} rounded-2xl p-3 text-white shadow-sm`}
              >
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-black mt-0.5">{stat.count}</p>
              </div>
            ))}
          </div>

          <div className="card border-slate-200 overflow-hidden shadow-sm">
            {/* Role Filter Tabs */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap gap-2">
              {ROLE_FILTER_OPTIONS.map((opt) => {
                const count =
                  opt.key === "all"
                    ? userStats.total
                    : userStats.byRole[opt.key as UserRole] || 0;
                const isActive = roleFilter === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setRoleFilter(opt.key);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isActive
                        ? `${opt.bg} text-white border-transparent shadow-sm`
                        : `bg-white ${opt.color} border-slate-200 hover:border-current/40`
                    }`}
                  >
                    {opt.label}
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search + class filter + row count */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Cari nama, username, email, NIS, NIP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 outline-none font-medium"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={14} className="text-slate-400 flex-shrink-0" />
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="flex-1 sm:min-w-[180px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/5"
                >
                  <option value="all">Semua Kelas</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {classFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setClassFilter("all")}
                    className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors"
                    title="Hapus filter kelas"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 font-semibold font-mono whitespace-nowrap sm:ml-auto">
                {usersMeta.total} pengguna
                {usersLoading ? " · memuat..." : ""}
                {roleFilter !== "all" &&
                  ` · ${ROLE_LABELS[roleFilter as UserRole]}`}
                {classFilter !== "all" && selectedClassFilter &&
                  ` · ${selectedClassFilter.name}`}
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-5 py-3">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-1 hover:text-slate-700"
                      >
                        Nama Lengkap <SortIcon col="name" />
                      </button>
                    </th>
                    <th className="px-5 py-3">
                      <button
                        onClick={() => handleSort("username")}
                        className="flex items-center gap-1 hover:text-slate-700"
                      >
                        Username / ID <SortIcon col="username" />
                      </button>
                    </th>
                    <th className="px-5 py-3">
                      <button
                        onClick={() => handleSort("role")}
                        className="flex items-center gap-1 hover:text-slate-700"
                      >
                        Peran <SortIcon col="role" />
                      </button>
                    </th>
                    <th className="px-5 py-3">Identitas / Kelas</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {usersLoading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-xs font-semibold text-slate-400"
                      >
                        <Loader2
                          size={20}
                          className="animate-spin mx-auto mb-2 text-blue-500"
                        />
                        Memuat data pengguna...
                      </td>
                    </tr>
                  )}
                  {!usersLoading && adminUsers.length > 0 ? (
                    adminUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs">
                              {u.name.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-slate-800">
                              {u.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-mono font-semibold text-slate-500">
                          {u.username}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${ROLE_BADGE_COLORS[u.role]}`}
                          >
                            {ROLE_LABELS[u.role]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-600">
                          {u.role === UserRole.SISWA &&
                            `${u.kelas || "-"} · NIS: ${u.nis || "-"}`}
                          {u.role === UserRole.WALI_KELAS &&
                            `${u.kelas || "-"} · ${u.nip || "-"}`}
                          {u.role !== UserRole.SISWA &&
                            u.role !== UserRole.WALI_KELAS &&
                            (u.nip || "-")}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-medium text-slate-400">
                          {u.email}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600 transition-colors"
                              title="Edit Profil"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(u)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-20"
                              title={
                                u.id === currentUser?.id
                                  ? "Tidak dapat menghapus akun sendiri"
                                  : "Hapus Pengguna"
                              }
                              disabled={u.id === currentUser?.id}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : !usersLoading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <Users size={32} className="opacity-20" />
                          <div>
                            <p className="font-semibold text-slate-500 text-sm">
                              {roleFilter !== "all"
                                ? `Tidak ada ${ROLE_LABELS[roleFilter as UserRole]} yang cocok`
                                : "Tidak ada pengguna ditemukan"}
                            </p>
                            {roleFilter !== "all" && (
                              <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="mt-2 text-xs text-blue-500 hover:underline font-semibold"
                              >
                                + Tambah {ROLE_LABELS[roleFilter as UserRole]}{" "}
                                sekarang →
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {!usersLoading && usersMeta.total > 0 && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">
                    Tampilkan:
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold outline-none"
                  >
                    <option value={5}>5 baris</option>
                    <option value={10}>10 baris</option>
                    <option value={25}>25 baris</option>
                    <option value={50}>50 baris</option>
                  </select>
                  <span className="text-xs text-slate-400 font-semibold font-mono ml-2">
                    {Math.min(
                      usersMeta.total,
                      (currentPage - 1) * pageSize + 1,
                    )}
                    –{Math.min(usersMeta.total, currentPage * pageSize)} dari{" "}
                    {usersMeta.total}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:text-blue-600 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                    const page =
                      totalPages <= 7
                        ? i + 1
                        : i === 0
                          ? 1
                          : i === 6
                            ? totalPages
                            : currentPage - 2 + i;
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold font-mono ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="p-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:text-blue-600 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Kelola Kelas ── */}
      {tab === "classes" && (
        <div className="space-y-4">
          <div className="card border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap size={16} className="text-indigo-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-xs">Master Data Kelas</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{classes.length} kelas terdaftar</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-5 py-3">Nama Kelas</th>
                    <th className="px-5 py-3 text-center">Siswa</th>
                    <th className="px-5 py-3">Wali Kelas</th>
                    <th className="px-5 py-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {classes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <GraduationCap size={32} className="opacity-20" />
                          <p className="font-semibold text-slate-500 text-sm">Belum ada kelas. Tambah kelas terlebih dahulu.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    classes.map((cls) => (
                      <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-800">{cls.name}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-xs font-semibold text-slate-600">{cls.studentCount}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {cls.homeroomTeachers?.length ? (
                            <span className="text-xs font-semibold text-slate-700">
                              {cls.homeroomTeachers.join(", ")}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum ada</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setSelectedClassId(cls.id);
                                setClassFormName(cls.name);
                                setClassFormError("");
                                setIsEditClassModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600 transition-colors"
                              title="Rename Kelas"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClassId(cls.id);
                                setIsDeleteClassModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-red-300 hover:text-red-600 transition-colors"
                              title="Hapus Kelas"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Add Class ── */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddClassModalOpen(false)} />
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm z-10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600">
                <GraduationCap size={18} />
                <h2 className="text-sm font-bold text-slate-800">Tambah Kelas Baru</h2>
              </div>
              <button onClick={() => setIsAddClassModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nama Kelas</label>
                <input
                  type="text"
                  placeholder="Contoh: XII IPA 1"
                  value={classFormName}
                  onChange={(e) => setClassFormName(e.target.value)}
                  className="input text-xs py-2 mt-1"
                  autoFocus
                />
                {classFormError && <p className="text-[10px] text-red-500 font-bold mt-1">{classFormError}</p>}
              </div>
              <div className="flex gap-2.5 pt-2 border-t border-slate-100 justify-end">
                <button onClick={() => setIsAddClassModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50">Batal</button>
                <button
                  onClick={async () => {
                    if (!classFormName.trim()) { setClassFormError("Nama kelas wajib diisi"); return; }
                    try {
                      await createClass(classFormName.trim());
                      showToast(`Kelas "${classFormName.trim()}" berhasil ditambahkan.`, "success");
                      setIsAddClassModalOpen(false);
                    } catch (e: any) {
                      setClassFormError(e?.message || "Gagal menambahkan kelas.");
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md text-white font-bold text-xs"
                >
                  Simpan Kelas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Edit Class ── */}
      {isEditClassModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditClassModalOpen(false)} />
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm z-10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-600">
                <Edit2 size={16} />
                <h2 className="text-sm font-bold text-slate-800">Rename Kelas</h2>
              </div>
              <button onClick={() => setIsEditClassModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nama Kelas Baru</label>
                <input
                  type="text"
                  value={classFormName}
                  onChange={(e) => setClassFormName(e.target.value)}
                  className="input text-xs py-2 mt-1"
                  autoFocus
                />
                {classFormError && <p className="text-[10px] text-red-500 font-bold mt-1">{classFormError}</p>}
              </div>
              <div className="flex gap-2.5 pt-2 border-t border-slate-100 justify-end">
                <button onClick={() => setIsEditClassModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50">Batal</button>
                <button
                  onClick={async () => {
                    if (!classFormName.trim()) { setClassFormError("Nama kelas wajib diisi"); return; }
                    try {
                      await updateClass(selectedClass.id, classFormName.trim());
                      showToast(`Kelas berhasil diubah menjadi "${classFormName.trim()}".`, "success");
                      setIsEditClassModalOpen(false);
                    } catch (e: any) {
                      setClassFormError(e?.message || "Gagal mengubah kelas.");
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md text-white font-bold text-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Delete Class ── */}
      {isDeleteClassModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteClassModalOpen(false)} />
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl w-full max-w-md z-10 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Hapus Kelas?</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Tidak bisa jika masih ada siswa terkait</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Anda akan menghapus kelas <strong>{selectedClass.name}</strong>.{" "}
              {selectedClass.studentCount > 0 && (
                <span className="text-red-500 font-semibold">Kelas ini masih memiliki {selectedClass.studentCount} siswa dan tidak dapat dihapus.</span>
              )}
            </p>
            <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100">
              <button onClick={() => setIsDeleteClassModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50">Batal</button>
              <button
                disabled={selectedClass.studentCount > 0}
                onClick={async () => {
                  try {
                    await deleteClass(selectedClass.id);
                    showToast(`Kelas "${selectedClass.name}" berhasil dihapus.`, "info");
                    setIsDeleteClassModalOpen(false);
                    setSelectedClassId(null);
                  } catch (e: any) {
                    showToast(e?.message || "Gagal menghapus kelas.", "error");
                    setIsDeleteClassModalOpen(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/10 text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Hapus Kelas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Add User ── */}
      {isAddModalOpen && (
        <UserFormModal
          title="Tambah Pengguna Baru"
          icon={<UserPlus size={18} />}
          onClose={closeAddModal}
          onSubmit={handleAddSubmit}
          formName={formName}
          setFormName={setFormName}
          formUsername={formUsername}
          setFormUsername={setFormUsername}
          formPassword={formPassword}
          setFormPassword={setFormPassword}
          formRole={formRole}
          setFormRole={(r) => {
            setFormRole(r);
            setFormClassId("");
            setFormErrors({});
          }}
          formEmail={formEmail}
          setFormEmail={setFormEmail}
          formNis={formNis}
          setFormNis={setFormNis}
          formNip={formNip}
          setFormNip={setFormNip}
          formClassId={formClassId}
          setFormClassId={setFormClassId}
          classes={classes}
          formErrors={formErrors}
          isEdit={false}
          isAdminUser={false}
        />
      )}

      {/* ── MODAL: Edit User ── */}
      {isEditModalOpen && selectedUser && (
        <UserFormModal
          title="Edit Profil Pengguna"
          icon={<Edit2 size={16} />}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
          formName={formName}
          setFormName={setFormName}
          formUsername={formUsername}
          setFormUsername={setFormUsername}
          formPassword={formPassword}
          setFormPassword={setFormPassword}
          formRole={formRole}
          setFormRole={(r) => {
            setFormRole(r);
            setFormClassId("");
            setFormErrors({});
          }}
          formEmail={formEmail}
          setFormEmail={setFormEmail}
          formNis={formNis}
          setFormNis={setFormNis}
          formNip={formNip}
          setFormNip={setFormNip}
          formClassId={formClassId}
          setFormClassId={setFormClassId}
          classes={classes}
          formErrors={formErrors}
          isEdit={true}
          isAdminUser={selectedUser.username === "admin"}
        />
      )}

      {/* ── MODAL: Delete Confirm ── */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl w-full max-w-md z-10 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Hapus Pengguna Permanen?
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  Tindakan ini tidak bisa dibatalkan
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Anda akan menghapus akun <strong>{selectedUser.name}</strong> (
              {ROLE_LABELS[selectedUser.role]}) dengan username{" "}
              <strong>{selectedUser.username}</strong>.
            </p>
            <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteExecute}
                disabled={selectedUser.id === currentUser?.id}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/10 text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────
// Reusable User Form Modal (shared between Add & Edit)
// ────────────────────────────────────────────────────────
function UserFormModal({
  title,
  icon,
  onClose,
  onSubmit,
  formName,
  setFormName,
  formUsername,
  setFormUsername,
  formPassword,
  setFormPassword,
  formRole,
  setFormRole,
  formEmail,
  setFormEmail,
  formNis,
  setFormNis,
  formNip,
  setFormNip,
  formClassId,
  setFormClassId,
  classes,
  formErrors,
  isEdit,
  isAdminUser,
}: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formName: string;
  setFormName: (v: string) => void;
  formUsername: string;
  setFormUsername: (v: string) => void;
  formPassword: string;
  setFormPassword: (v: string) => void;
  formRole: UserRole;
  setFormRole: (v: UserRole) => void;
  formEmail: string;
  setFormEmail: (v: string) => void;
  formNis: string;
  setFormNis: (v: string) => void;
  formNip: string;
  setFormNip: (v: string) => void;
  formClassId: string;
  setFormClassId: (v: string) => void;
  classes: { id: string; name: string }[];
  formErrors: Record<string, string>;
  isEdit: boolean;
  isAdminUser: boolean;
}) {
  const Field = ({
    label,
    error,
    children,
  }: {
    label: string;
    error?: string;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[10px] text-red-500 font-bold mt-1">{error}</p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col animate-slideUp">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600">
            {icon}
            <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="p-5 space-y-4 overflow-y-auto max-h-[75vh]"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Nama Lengkap" error={formErrors.name}>
                <input
                  type="text"
                  placeholder="Contoh: Muhammad Rafli"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input text-xs py-2"
                />
              </Field>
            </div>

            <Field label="Username / ID Login" error={formErrors.username}>
              <input
                type="text"
                placeholder="Contoh: rafli123"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                disabled={isAdminUser}
                className="input text-xs py-2 font-mono"
              />
            </Field>

            <Field
              label={
                isEdit
                  ? "Sandi Baru (Kosongkan jika tidak diubah)"
                  : "Kata Sandi"
              }
              error={formErrors.password}
            >
              <input
                type="password"
                placeholder={isEdit ? "Sandi baru..." : "Masukkan sandi..."}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="input text-xs py-2 font-mono"
              />
            </Field>

            <div className="col-span-2">
              <Field label="Alamat Email" error={formErrors.email}>
                <input
                  type="email"
                  placeholder="Contoh: siswa@sekolah.id"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="input text-xs py-2"
                />
              </Field>
            </div>

            <div className="col-span-2">
              <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Peran Sistem (Role)
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.values(UserRole).map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={isAdminUser}
                    onClick={() => setFormRole(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      formRole === r
                        ? {
                            siswa: "bg-blue-100 border-blue-400 text-blue-700",
                            wali_kelas:
                              "bg-purple-100 border-purple-400 text-purple-700",
                            guru_piket:
                              "bg-amber-100 border-amber-400 text-amber-700",
                            security:
                              "bg-emerald-100 border-emerald-400 text-emerald-700",
                            admin: "bg-red-100 border-red-400 text-red-700",
                          }[r]
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    } disabled:opacity-50`}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>

            {formRole === UserRole.SISWA && (
              <>
                <Field label="Nomor Induk Siswa (NIS)" error={formErrors.nis}>
                  <input
                    type="text"
                    placeholder="Contoh: 26051"
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    className="input text-xs py-2 font-mono"
                  />
                </Field>
                <Field label="Kelas" error={formErrors.kelas}>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="input text-xs py-2"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {classes.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">Belum ada kelas. Tambah kelas di tab Kelola Kelas terlebih dahulu.</p>
                  )}
                </Field>
              </>
            )}

            {formRole === UserRole.WALI_KELAS && (
              <>
                <Field label="NIP" error={formErrors.nip}>
                  <input
                    type="text"
                    placeholder="Contoh: 198205..."
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    className="input text-xs py-2 font-mono"
                  />
                </Field>
                <Field label="Kelas Binaan" error={formErrors.kelas}>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="input text-xs py-2"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {classes.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">Belum ada kelas. Tambah kelas di tab Kelola Kelas terlebih dahulu.</p>
                  )}
                </Field>
              </>
            )}

            {formRole !== UserRole.SISWA &&
              formRole !== UserRole.WALI_KELAS && (
                <div className="col-span-2">
                  <Field label="NIP" error={formErrors.nip}>
                    <input
                      type="text"
                      placeholder="Masukkan NIP Pegawai..."
                      value={formNip}
                      onChange={(e) => setFormNip(e.target.value)}
                      className="input text-xs py-2 font-mono"
                    />
                  </Field>
                </div>
              )}
          </div>

          <div className="flex gap-2.5 pt-4 border-t border-slate-100 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 text-white font-bold text-xs"
            >
              {isEdit ? "Simpan Perubahan" : "Simpan Pengguna"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
