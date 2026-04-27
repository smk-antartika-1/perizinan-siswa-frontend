'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, ShieldCheck, Users, ChevronRight, Sparkles, UserPlus, ArrowLeft, Lock, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppContext } from '@/context/AppContext';
import { ROLE_LABELS, UserRole } from '@/lib/types';

const ROLE_ICONS: Record<UserRole, string> = {
  [UserRole.SISWA]: '🎒',
  [UserRole.WALI_KELAS]: '👩‍🏫',
  [UserRole.GURU_PIKET]: '📋',
  [UserRole.SECURITY]: '🔐',
  [UserRole.ADMIN]: '⚙️',
};

const ROLE_DESC: Record<UserRole, string> = {
  [UserRole.SISWA]: 'Masuk sebagai Mahasiswa/Siswa',
  [UserRole.WALI_KELAS]: 'Masuk sebagai Wali Kelas',
  [UserRole.GURU_PIKET]: 'Masuk sebagai Guru Piket',
  [UserRole.SECURITY]: 'Masuk sebagai Security',
  [UserRole.ADMIN]: 'Masuk sebagai Administrator',
};

const ROLES_TO_SHOW = [UserRole.SISWA, UserRole.GURU_PIKET, UserRole.SECURITY, UserRole.WALI_KELAS, UserRole.ADMIN];

export default function LoginPage() {
  const { login, register, isAuthenticated } = useAuth();
  const { showToast } = useAppContext();
  const router = useRouter();

  const [step, setStep] = useState<'select-role' | 'login-form' | 'register-form'>('select-role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regNis, setRegNis] = useState('');
  const [regKelas, setRegKelas] = useState('');

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated, router]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('login-form');
    setUsername('');
    setPassword('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    const success = login(username, password, selectedRole);
    if (success) {
      router.push('/dashboard');
    } else {
      showToast('Username atau password salah, atau role tidak sesuai!', 'error');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = register({
      name: regName,
      nis: regNis,
      kelas: regKelas,
      password: regNis, // Password is same as NIS based on requirement
    });

    if (success) {
      showToast('Registrasi berhasil! Silakan login dengan NIS Anda.', 'success');
      setStep('login-form');
      setSelectedRole(UserRole.SISWA);
      setUsername(regNis);
      setPassword(regNis);
    } else {
      showToast('NIS sudah terdaftar!', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px]" />
      </div>

      {/* Register Top Right Button */}
      {step !== 'register-form' && (
        <button
          onClick={() => setStep('register-form')}
          className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-full text-white text-sm font-semibold transition-all backdrop-blur-md"
        >
          <UserPlus size={16} className="text-blue-400" />
          <span className="hidden sm:inline">Daftar Mahasiswa</span>
        </button>
      )}

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-2xl shadow-blue-500/40 border border-blue-500/30">
            <QrCode className="text-white" size={38} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">E-Izin Siswa</h1>
          <p className="text-slate-400 text-sm">Sistem Perizinan Digital · Smart Campus</p>
        </motion.div>

        {/* Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl overflow-hidden relative"
        >
          <AnimatePresence mode="wait">
            {step === 'select-role' && (
              <motion.div
                key="select-role"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <Users size={16} className="text-blue-400" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pilih Role Anda</p>
                </div>

                <div className="space-y-2.5">
                  {ROLES_TO_SHOW.map((role, i) => (
                    <motion.button
                      key={role}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      onClick={() => handleRoleSelect(role)}
                      className="w-full p-4 rounded-2xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700/60 hover:border-blue-500/60 transition-all group flex items-center gap-4 text-left"
                    >
                      <span className="text-2xl">{ROLE_ICONS[role]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">{ROLE_LABELS[role]}</p>
                        <p className="text-xs text-slate-400 truncate">{ROLE_DESC[role]}</p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all"
                      />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'login-form' && (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep('select-role')} className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-white leading-tight">Login {selectedRole ? ROLE_LABELS[selectedRole] : ''}</h2>
                    <p className="text-xs text-slate-400">Silakan masukkan kredensial Anda</p>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Username / NIS</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder={selectedRole === UserRole.SISWA ? "Masukkan NIS Anda..." : "Masukkan Username..."}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                    {selectedRole === UserRole.SISWA && (
                      <p className="text-[10px] text-red-400 mt-1.5">* Default password untuk mahasiswa adalah NIS</p>
                    )}
                  </div>

                  <button type="submit" className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
                    Masuk Sekarang
                  </button>

                  {/* Test Credentials Helper */}
                  <div className="mt-6 p-4 rounded-xl bg-slate-800/80 border border-slate-700/50 text-xs text-slate-400">
                    <p className="font-bold text-slate-300 mb-2">Akun Testing {selectedRole ? ROLE_LABELS[selectedRole] : ''}:</p>
                    {selectedRole === UserRole.SISWA && (
                      <ul className="space-y-1.5">
                        <li className="flex justify-between"><span>Budi Santoso</span> <span className="font-mono text-blue-400">NIS: 2024001</span></li>
                        <li className="flex justify-between"><span>Siti Rahayu</span> <span className="font-mono text-blue-400">NIS: 2024002</span></li>
                        <li className="flex justify-between"><span>Ahmad Fauzi</span> <span className="font-mono text-blue-400">NIS: 2024005</span></li>
                      </ul>
                    )}
                    {selectedRole === UserRole.WALI_KELAS && (
                      <ul className="space-y-1.5">
                        <li className="flex justify-between"><span>Ibu Ratna</span> <span className="font-mono text-blue-400">User: walikelas1 | Pass: password</span></li>
                        <li className="flex justify-between"><span>Bapak Hendro</span> <span className="font-mono text-blue-400">User: walikelas2 | Pass: password</span></li>
                      </ul>
                    )}
                    {selectedRole === UserRole.GURU_PIKET && (
                      <ul className="space-y-1.5">
                        <li className="flex justify-between"><span>Pak Andi</span> <span className="font-mono text-blue-400">User: piket | Pass: password</span></li>
                      </ul>
                    )}
                    {selectedRole === UserRole.SECURITY && (
                      <ul className="space-y-1.5">
                        <li className="flex justify-between"><span>Pak Slamet</span> <span className="font-mono text-blue-400">User: security | Pass: password</span></li>
                      </ul>
                    )}
                    {selectedRole === UserRole.ADMIN && (
                      <ul className="space-y-1.5">
                        <li className="flex justify-between"><span>Admin IT</span> <span className="font-mono text-blue-400">User: admin | Pass: password</span></li>
                      </ul>
                    )}
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'register-form' && (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep('select-role')} className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-white leading-tight">Daftar Mahasiswa</h2>
                    <p className="text-xs text-slate-400">Buat akun untuk mengajukan izin</p>
                  </div>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">NIM / NIS</label>
                      <input
                        type="text"
                        required
                        value={regNis}
                        onChange={e => setRegNis(e.target.value)}
                        placeholder="Contoh: 2024001"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kelas / Jurusan</label>
                      <input
                        type="text"
                        required
                        value={regKelas}
                        onChange={e => setRegKelas(e.target.value)}
                        placeholder="TI - Semester 4"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 mt-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-[11px] text-blue-300/80 leading-relaxed">
                      <Sparkles size={12} className="inline mr-1 text-blue-400" />
                      Setelah mendaftar, Anda dapat login sebagai <strong>Mahasiswa</strong> menggunakan NIM Anda sebagai Username dan Password.
                    </p>
                  </div>

                  <button type="submit" className="w-full py-3 mt-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]">
                    Daftar Sekarang
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-600"
        >
          <div className="flex items-center gap-1.5"><ShieldCheck size={12} />Aman & Terenkripsi</div>
          <span>·</span>
          <div className="flex items-center gap-1.5"><QrCode size={12} />QR Code Valid</div>
        </motion.div>
      </div>
    </div>
  );
}
