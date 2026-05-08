'use client';

import { useState, useRef } from 'react';
import { UserCircle, Camera, Lock, Eye, EyeOff } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useAppContext } from '@/context/AppContext';
import { ROLE_LABELS } from '@/lib/types';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { showToast } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!currentUser) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreview(ev.target?.result as string);
        showToast('Foto profil berhasil diperbarui', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (oldPassword !== currentUser.password) {
      showToast('Password lama tidak sesuai', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password baru minimal 6 karakter', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi password tidak cocok', 'error');
      return;
    }

    showToast('Password berhasil diperbarui', 'success');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
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
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="text-slate-300 w-20 h-20" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center text-white cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{currentUser.name}</h2>
            <p className="text-sm text-blue-600 font-semibold mt-1">{ROLE_LABELS[currentUser.role]}</p>
          </div>

          {/* Info Fields (Readonly) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Nama Lengkap</p>
              <p className="text-sm font-semibold text-slate-700">{currentUser.name}</p>
            </div>
            {currentUser.nis && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">NIS</p>
                <p className="text-sm font-semibold text-slate-700 font-mono">{currentUser.nis}</p>
              </div>
            )}
            {currentUser.nip && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">NIP</p>
                <p className="text-sm font-semibold text-slate-700 font-mono">{currentUser.nip}</p>
              </div>
            )}
            {currentUser.kelas && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Kelas</p>
                <p className="text-sm font-semibold text-slate-700">{currentUser.kelas}</p>
              </div>
            )}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Email</p>
              <p className="text-sm font-semibold text-slate-700">{currentUser.email}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Username</p>
              <p className="text-sm font-semibold text-slate-700 font-mono">{currentUser.username}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Lock size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Ubah Password</h3>
              <p className="text-xs text-slate-400">Perbarui password akun Anda secara berkala</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">Password Lama</label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Password Baru</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Konfirmasi Password Baru</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-danger w-full py-3">
              Simpan Password Baru
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
