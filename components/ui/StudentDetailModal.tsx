'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, GraduationCap, ClipboardList, Clock, HeartPulse, ShieldAlert, Search, Calendar, ArrowUpRight } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { UserRole, PermissionStatus, STATUS_CONFIG } from '@/lib/types';
import { formatDate, formatTime, getPermissionStats } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';

export default function StudentDetailModal() {
  const router = useRouter();
  const { activeStudentNis, viewStudent, permissions, users } = useAppContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (!activeStudentNis) return null;

  // Find student in users list or permissions
  const studentUser = users.find(u => u.nis === activeStudentNis && u.role === UserRole.SISWA);
  const studentName = studentUser?.name || permissions.find(p => p.studentId === activeStudentNis || p.studentName.toLowerCase().includes(activeStudentNis.toLowerCase()))?.studentName || 'Siswa';
  const studentKelas = studentUser?.kelas || permissions.find(p => p.studentName === studentName)?.kelas || '-';
  const studentEmail = studentUser?.email || `${studentName.toLowerCase().replace(/\s+/g, '')}@sekolah.id`;

  // Get all permissions for this student
  const studentPermissions = permissions.filter(
    p => p.studentId === studentUser?.id || p.studentName === studentName
  );

  const stats = getPermissionStats(studentPermissions);
  const sickCount = studentPermissions.filter(p => p.category === 'sakit').length;
  const activeCount = studentPermissions.filter(p => p.status === PermissionStatus.APPROVED_PIKET).length;

  const filteredPermissions = studentPermissions.filter(p => {
    const matchesSearch = p.reason.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleClose = () => {
    viewStudent(null);
  };

  const handleNavigateToPermission = (id: string) => {
    handleClose();
    router.push(`/izin/${id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={handleClose} 
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Detail & Riwayat Siswa</h2>
              <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase font-mono">NIS: {activeStudentNis}</p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Profile Card & Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student Info Card */}
            <div className="md:col-span-1 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4">
                  {studentName.charAt(0)}
                </div>
                <h3 className="text-lg font-bold text-slate-800 leading-snug">{studentName}</h3>
                <p className="text-sm font-semibold text-blue-600 mt-0.5">{studentKelas}</p>
                <p className="text-xs text-slate-400 mt-2 truncate">{studentEmail}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-blue-200/50 flex justify-between items-center text-xs text-slate-500">
                <span>Peran: Siswa Terdaftar</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <ClipboardList size={18} />
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Izin</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Izin Aktif</p>
                  <p className="text-2xl font-bold text-slate-800">{activeCount}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <HeartPulse size={18} />
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Izin Sakit</p>
                  <p className="text-2xl font-bold text-slate-800">{sickCount}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <ShieldAlert size={18} />
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kembali Tepat</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {studentPermissions.filter(p => p.status === PermissionStatus.COMPLETED).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed History Table Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm">Riwayat Aktivitas Perizinan</h4>
              
              {/* Table search & filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Cari alasan atau ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value={PermissionStatus.PENDING}>Menunggu</option>
                  <option value={PermissionStatus.APPROVED_WALI}>Disetujui Wali</option>
                  <option value={PermissionStatus.APPROVED_PIKET}>Izin Aktif</option>
                  <option value={PermissionStatus.COMPLETED}>Selesai</option>
                  <option value={PermissionStatus.REJECTED}>Ditolak</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['ID', 'Kategori', 'Alasan', 'Waktu Berangkat / Estimasi', 'Status', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPermissions.length > 0 ? (
                    filteredPermissions.map(p => (
                      <tr 
                        key={p.id} 
                        onClick={() => handleNavigateToPermission(p.id)}
                        className="hover:bg-slate-50/75 transition-colors cursor-pointer group"
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-600">{p.id}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            p.category === 'sakit' ? 'bg-amber-50 border border-amber-100 text-amber-700' :
                            p.category === 'dispensasi' ? 'bg-purple-50 border border-purple-100 text-purple-700' :
                            p.category === 'keperluan' ? 'bg-blue-50 border border-blue-100 text-blue-700' :
                            'bg-slate-50 border border-slate-100 text-slate-500'
                          }`}>
                            {p.category || 'lainnya'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 max-w-[200px]">
                          <p className="text-xs font-medium text-slate-700 line-clamp-1 italic">"{p.reason}"</p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-1"><Calendar size={11} /> {formatDate(p.createdAt)}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{formatTime(p.departureTime)} – {formatTime(p.estimatedReturnTime)}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button 
                            className="p-1 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
                            title="Buka Detail"
                          >
                            <ArrowUpRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-xs">
                        Tidak ada riwayat perizinan ditemukan
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
