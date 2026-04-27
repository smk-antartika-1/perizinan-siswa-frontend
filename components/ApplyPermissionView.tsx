'use client';

import React, { useState } from 'react';
import { ClipboardList, Clock, Bell, ChevronRight } from 'lucide-react';
import { User, Permission, PermissionStatus } from '@/lib/types';

interface ApplyPermissionViewProps {
  user: User;
  setPermissions: React.Dispatch<React.SetStateAction<Permission[]>>;
  setActiveTab: (tab: string) => void;
}

export default function ApplyPermissionView({ user, setPermissions, setActiveTab }: ApplyPermissionViewProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const newPermission = {
      studentId: user.id,
      studentName: user.name,
      kelas: user.kelas || '',
      reason,
      departureTime: new Date().toISOString(),
      estimatedReturnTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: PermissionStatus.PENDING,
      createdAt: new Date().toISOString(),
    };

    fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPermission)
    })
      .then(res => res.json())
      .then(data => {
        setPermissions(prev => [data, ...prev]);
        setLoading(false);
        setActiveTab('dashboard');
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl mx-auto flex items-center justify-center mb-4 text-blue-600">
            <ClipboardList size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Ajukan Perizinan</h2>
          <p className="text-slate-500 text-sm">Pastikan alasan perizinan valid dan dapat dipertanggungjawabkan.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Alasan Izin</label>
            <textarea 
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Mengikuti acara keluarga, Sakit tiba-tiba, dsb."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Jam Berangkat</label>
              <div className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 flex items-center gap-2 cursor-not-allowed">
                <Clock size={16} />
                <span className="text-sm">Sekarang</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">Estimasi Kembali</label>
              <div className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 flex items-center gap-2 cursor-not-allowed">
                <Clock size={16} />
                <span className="text-sm">+ 2 Jam</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl flex gap-3 items-start border border-blue-100">
            <Bell size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
              Pengajuan Anda akan diteruskan ke Wali Kelas untuk persetujuan awal, kemudian diverifikasi oleh Guru Piket.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full group btn-primary h-14 text-lg shadow-xl shadow-blue-600/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Validasi...
              </div>
            ) : (
              <>
                Kirim Pengajuan
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
