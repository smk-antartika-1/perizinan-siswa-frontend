'use client';

import { motion } from 'motion/react';
import { QrCode, UserCircle, ChevronRight } from 'lucide-react';
import { UserRole } from '@/lib/types';

interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[128px]" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 rounded-3xl relative z-10 text-center"
      >
        <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <QrCode className="text-white w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">E-Izin Siswa</h1>
        <p className="text-slate-400 mb-8 font-light">Sistem Perizinan Keluar Masuk Siswa</p>
        
        <div className="grid grid-cols-1 gap-3 text-left">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 pl-1">Masuk sebagai:</p>
          {Object.values(UserRole).map((role) => (
            <button 
              key={role}
              onClick={() => onLogin(role as UserRole)}
              className="w-full p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-blue-500 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <UserCircle className="text-slate-300 group-hover:text-white" size={20} />
                </div>
                <span className="text-slate-200 capitalize font-medium">{role.replace('_', ' ')}</span>
              </div>
              <ChevronRight className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" size={18} />
            </button>
          ))}
        </div>
        
        <p className="mt-8 text-xs text-slate-600">Terintegrasi dengan Keamanan Sekolah &amp; Wali Kelas</p>
      </motion.div>
    </div>
  );
}
