"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { QrCode, ShieldCheck, Lock, User, Loader2, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAppContext } from "@/context/AppContext";
import { APP_NAME, APP_TAGLINE, COPYRIGHT_TEXT } from "@/lib/appConfig";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { showToast, isInitializing } = useAppContext();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Redirect ke dashboard jika sudah login
  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isInitializing, router]);

  // Selama session sedang dicek, tampilkan layar loading
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40 border border-blue-500/30">
            <QrCode className="text-white" size={30} />
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 size={16} className="animate-spin text-blue-400" />
            <span className="text-sm font-medium">Memuat sesi...</span>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const success = await login(username.trim(), password);
      if (success) {
        router.replace("/dashboard");
      } else {
        setErrorMsg("Username atau password salah. Silakan coba lagi.");
        showToast("Username atau password salah.", "error");
      }
    } catch {
      // Kemungkinan network error
      const isOffline = !navigator.onLine;
      const msg = isOffline
        ? "Tidak ada koneksi internet. Periksa jaringan Anda."
        : "Gagal terhubung ke server. Coba beberapa saat lagi.";
      setErrorMsg(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-[80px]" />
      </div>

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
          <h1 className="text-3xl font-bold text-white mb-2">{APP_NAME}</h1>
          <p className="text-slate-400 text-sm">{APP_TAGLINE}</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <Lock size={16} className="text-blue-400" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Masuk ke Sistem
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5"
              >
                Username / NIS
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
                <input
                  id="login-username"
                  type="text"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="text"
                  enterKeyHint="next"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="Masukkan username atau NIS"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-600"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  enterKeyHint="done"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-600"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error message */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300"
              >
                {errorMsg.includes("koneksi") || errorMsg.includes("internet") ? (
                  <WifiOff size={16} className="flex-shrink-0 mt-0.5" />
                ) : (
                  <Lock size={16} className="flex-shrink-0 mt-0.5" />
                )}
                <span className="text-xs font-medium leading-relaxed">{errorMsg}</span>
              </motion.div>
            )}

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading || !username.trim() || !password.trim()}
              className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-xs text-slate-600"
        >
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} />
              Aman dan Terenkripsi
            </div>
            <span>|</span>
            <div className="flex items-center gap-1.5">
              <QrCode size={12} />
              Validasi QR Code
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-500">{COPYRIGHT_TEXT}</p>
        </motion.div>
      </div>
    </div>
  );
}
