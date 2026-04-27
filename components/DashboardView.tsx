'use client';

import { motion } from 'motion/react';
import { 
  ClipboardList, QrCode, Clock, CheckCircle2, XCircle 
} from 'lucide-react';
import { User, UserRole, Permission, PermissionStatus } from '@/lib/types';
import { QRCodeSVG } from 'qrcode.react';
import StatusBadge from './StatusBadge';

interface DashboardViewProps {
  user: User;
  permissions: Permission[];
}

export default function DashboardView({ user, permissions }: DashboardViewProps) {
  const userPermissions = user.role === UserRole.SISWA 
    ? permissions.filter(p => p.studentId === user.id)
    : permissions;

  const stats = [
    { label: 'Total Izin', value: userPermissions.length, icon: ClipboardList, color: 'bg-blue-500' },
    { label: 'Pending', value: userPermissions.filter(p => p.status === PermissionStatus.PENDING).length, icon: Clock, color: 'bg-amber-500' },
    { label: 'Disetujui', value: userPermissions.filter(p => p.status === PermissionStatus.APPROVED_PIKET).length, icon: CheckCircle2, color: 'bg-emerald-500' },
    { label: 'Ditolak', value: userPermissions.filter(p => p.status === PermissionStatus.REJECTED).length, icon: XCircle, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-default group"
          >
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Active QR for Siswa */}
        {user.role === UserRole.SISWA && (
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border-2 border-blue-100 shadow-sm text-center">
              <h3 className="font-bold text-slate-800 mb-4">Izin Aktif</h3>
              {userPermissions.some(p => p.status === PermissionStatus.APPROVED_PIKET) ? (
                <div className="bg-slate-50 p-4 rounded-2xl inline-block mb-4 border border-slate-100">
                  <QRCodeSVG value={`EIzin:${userPermissions.find(p => p.status === PermissionStatus.APPROVED_PIKET)?.id}`} size={160} />
                  <p className="mt-4 font-mono text-[10px] text-slate-500 tracking-tighter">ID: {userPermissions.find(p => p.status === PermissionStatus.APPROVED_PIKET)?.id}</p>
                </div>
              ) : (
                <div className="py-8 px-4 text-slate-400">
                  <QrCode size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm">Belum ada izin aktif.<br/>Silakan ajukan izin untuk keluar sekolah.</p>
                </div>
              )}
              <button className="w-full btn-primary mt-2">
                <QrCode size={18} />
                Tunjukkan ke Security
              </button>
            </div>
            
            <div className="bg-blue-600 p-6 rounded-3xl text-white overflow-hidden relative group">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-lg mb-2 relative z-10">Punya keperluan?</h4>
              <p className="text-blue-100 text-sm mb-6 relative z-10">Ajukan izin keluar sekolah dengan mudah melalui sistem digital.</p>
              <button className="bg-white text-blue-600 font-bold px-6 py-2.5 rounded-xl text-sm relative z-10 hover:bg-blue-50 transition-colors shadow-lg">
                Minta Izin Baru
              </button>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className={user.role === UserRole.SISWA ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-bottom border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Riwayat Perizinan Terbaru</h3>
              <button className="text-blue-600 text-xs font-bold hover:underline">Lihat Semua</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-y border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Siswa</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alasan</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Waktu</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userPermissions.slice(0, 5).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            {p.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{p.studentName}</p>
                            <p className="text-xs text-slate-500">{p.kelas}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 line-clamp-1">{p.reason}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700 font-medium">
                          {new Date(p.departureTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Estimasi Selesai 2 Jam</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                  {userPermissions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <ClipboardList size={32} className="opacity-20" />
                          <p className="text-sm">Belum ada riwayat perizinan</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
