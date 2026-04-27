'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { Permission } from '@/lib/types';
import { formatTime, formatDate, groupByKelas } from '@/lib/utils';

interface PermissionTableProps {
  permissions: Permission[];
  groupByClass?: boolean;
}

export default function PermissionTable({ permissions, groupByClass = false }: PermissionTableProps) {
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const filtered = permissions.filter(p =>
    p.studentName.toLowerCase().includes(search.toLowerCase()) ||
    p.kelas.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.reason.toLowerCase().includes(search.toLowerCase())
  );

  const toggleGroup = (kelas: string) => {
    setOpenGroups(prev => ({ ...prev, [kelas]: !prev[kelas] }));
  };

  const renderRow = (p: Permission) => (
    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.id}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs flex-shrink-0">
            {p.studentName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{p.studentName}</p>
            <p className="text-xs text-slate-400">{p.kelas}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-slate-600 max-w-[200px] truncate" title={p.reason}>{p.reason}</p>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
        <div>{formatDate(p.departureTime)}</div>
        <div className="text-xs text-slate-400">{formatTime(p.departureTime)} – {formatTime(p.estimatedReturnTime)}</div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={p.status} />
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Cari siswa, kelas, alasan..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 outline-none text-sm transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {groupByClass ? (
          // Grouped by kelas
          Object.entries(groupByKelas(filtered)).map(([kelas, items]) => {
            const isOpen = openGroups[kelas] !== false; // default open
            return (
              <div key={kelas}>
                <button
                  onClick={() => toggleGroup(kelas)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown size={16} className="text-blue-500" /> : <ChevronRight size={16} className="text-slate-400" />}
                    <span className="font-bold text-slate-700 text-sm">{kelas}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{items.length}</span>
                  </div>
                </button>
                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {['ID', 'Siswa', 'Alasan', 'Waktu', 'Status'].map(h => (
                            <th key={h} className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">{items.map(renderRow)}</tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['ID', 'Siswa', 'Alasan', 'Waktu', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length > 0 ? filtered.map(renderRow) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">Tidak ada data ditemukan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
