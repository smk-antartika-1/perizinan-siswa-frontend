"use client";

import { useState, useRef } from "react";
import { UserCircle, Camera, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useAppContext } from "@/context/AppContext";
import { useAppContext as useCtx } from "@/context/AppContext";
import { ROLE_LABELS } from "@/lib/types";

// Skeleton untuk saat user belum load
function ProfileSkeleton() {
  return (
    <AppShell>
      <div className="page-header">
        <div className="skeleton h-7 w-48 mb-2" />
        <div className="skeleton h-4 w-64" />
      </div>
      <div className="max-w-2xl space-y-6">
        <div className="card-lg p-8">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="skeleton w-28 h-28 rounded-full" />
            <div className="skeleton h-6 w-40" />
            <div className="skeleton h-4 w-24" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { showToast, changePassword, updateProfile, isInitializing } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Real-time mismatch check
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const passwordTooShort = newPassword.length > 0 && newPassword.length < 6;

  if (isInitializing) return <ProfileSkeleton />;
  if (!currentUser) return <ProfileSkeleton />;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview segera
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setAvatarLoading(true);
    try {
      await updateProfile({ avatar: file });
      showToast("Foto profil berhasil diperbarui", "success");
    } catch (err: any) {
      setAvatarPreview(null); // Rollback preview jika gagal
      showToast(err?.message || "Gagal memperbarui foto profil", "error");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("Password baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password tidak cocok.");
      return;
    }
    if (!oldPassword) {
      setPasswordError("Password lama wajib diisi.");
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(oldPassword, newPassword, confirmPassword);
      setPasswordSuccess(true);
      showToast("Password berhasil diperbarui", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err?.message || "Password lama tidak sesuai atau gagal diperbarui.";
      setPasswordError(msg);
      showToast(msg, "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Profil Pengguna</h1>
        <p className="page-subtitle">Kelola informasi akun dan keamanan Anda</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile Card */}
        <div className="card-lg p-8">
          <div className="flex flex-col items-center text-center mb-8">
            {/* Avatar */}
            <div className="relative group mb-4">
              <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                {avatarLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <Loader2 size={28} className="animate-spin text-blue-500" />
                  </div>
                ) : avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Foto profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircle className="text-slate-300 w-20 h-20" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                aria-label="Ubah foto profil"
                className="absolute bottom-0 right-0 w-9 h-9 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center text-white cursor-pointer hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label="Upload foto profil"
              />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{currentUser.name}</h2>
            <p className="text-sm text-blue-600 font-semibold mt-1">
              {ROLE_LABELS[currentUser.role]}
            </p>
          </div>

          {/* Info Fields (Readonly) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                Nama Lengkap
              </p>
              <p className="text-sm font-semibold text-slate-700">{currentUser.name}</p>
            </div>
            {currentUser.nis && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  NIS
                </p>
                <p className="text-sm font-semibold text-slate-700 font-mono">{currentUser.nis}</p>
              </div>
            )}
            {currentUser.nip && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  NIP
                </p>
                <p className="text-sm font-semibold text-slate-700 font-mono">{currentUser.nip}</p>
              </div>
            )}
            {currentUser.kelas && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  Kelas
                </p>
                <p className="text-sm font-semibold text-slate-700">{currentUser.kelas}</p>
              </div>
            )}
            {currentUser.email && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                  Email
                </p>
                <p className="text-sm font-semibold text-slate-700 break-all">{currentUser.email}</p>
              </div>
            )}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                Username
              </p>
              <p className="text-sm font-semibold text-slate-700 font-mono">{currentUser.username}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Ubah Password</h3>
              <p className="text-xs text-slate-400">Perbarui password akun Anda secara berkala</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4" noValidate>
            {/* Password Lama */}
            <div>
              <label htmlFor="profile-old-pw" className="label">Password Lama</label>
              <div className="relative">
                <input
                  id="profile-old-pw"
                  type={showOld ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(e) => { setOldPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false); }}
                  placeholder="Masukkan password lama"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  aria-label={showOld ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div>
              <label htmlFor="profile-new-pw" className="label">Password Baru</label>
              <div className="relative">
                <input
                  id="profile-new-pw"
                  type={showNew ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false); }}
                  placeholder="Minimal 6 karakter"
                  className={`input pr-10 ${passwordTooShort ? "input-error" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  aria-label={showNew ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordTooShort && (
                <p className="field-error mt-1.5">
                  <AlertCircle size={12} />
                  Password minimal 6 karakter.
                </p>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label htmlFor="profile-confirm-pw" className="label">Konfirmasi Password Baru</label>
              <div className="relative">
                <input
                  id="profile-confirm-pw"
                  type={showConfirm ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); setPasswordSuccess(false); }}
                  placeholder="Ulangi password baru"
                  className={`input pr-10 ${passwordMismatch ? "input-error" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Real-time mismatch indicator */}
              {passwordMismatch && (
                <p className="field-error mt-1.5">
                  <AlertCircle size={12} />
                  Password tidak cocok.
                </p>
              )}
              {!passwordMismatch && confirmPassword.length >= 6 && newPassword === confirmPassword && (
                <p className="mt-1.5 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Password cocok.
                </p>
              )}
            </div>

            {/* Inline error */}
            {passwordError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 animate-fadeIn">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{passwordError}</p>
              </div>
            )}

            {/* Success feedback */}
            {passwordSuccess && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 animate-fadeIn">
                <CheckCircle2 size={15} className="flex-shrink-0" />
                <p className="text-xs font-medium">Password berhasil diperbarui!</p>
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading || passwordMismatch || passwordTooShort}
              className="btn-danger w-full py-3"
            >
              {passwordLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Password Baru"
              )}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
