'use client';

import { UserCircle, Plus } from 'lucide-react';
import { User } from '@/lib/types';

interface ProfileViewProps {
  user: User;
}

export default function ProfileView({ user }: ProfileViewProps) {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-center p-10">
        <div className="w-32 h-32 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-slate-50 shadow-inner relative group">
          <UserCircle className="text-slate-300 w-24 h-24 group-hover:text-blue-500 transition-colors" />
          <div className="absolute bottom-1 right-1 w-8 h-8 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform">
             <Plus size={14} />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-slate-800">{user.name}</h2>
        <p className="text-blue-600 font-semibold tracking-widest uppercase text-xs mt-2 mb-8">{user.role.replace('_', ' ')}</p>
        
        <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Email</p>
            <p className="text-sm font-semibold truncate">{user.email}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">ID Anggota</p>
            <p className="text-sm font-semibold truncate">SCHOOL-{user.id.padStart(4, '0')}</p>
          </div>
          {user.kelas && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Kelas / Unit</p>
              <p className="text-sm font-semibold">{user.kelas}</p>
            </div>
          )}
        </div>
        
        <button className="mt-10 btn-secondary mx-auto">
          Edit Profil
        </button>
      </div>
    </div>
  );
}
