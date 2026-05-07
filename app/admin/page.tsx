'use client';

import { useState, useRef } from 'react';
import { Settings, Upload, Users, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useAppContext } from '@/context/AppContext';
import { UserRole, ROLE_LABELS } from '@/lib/types';
import { MOCK_USERS, MOCK_EXCEL_DATA } from '@/lib/mockData';

type Tab = 'import' | 'users';

export default function AdminPage() {
  const { canAccess } = useAuth();
  const { showToast } = useAppContext();
  const [tab, setTab] = useState<Tab>('import');
  const [fileName, setFileName] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!canAccess([UserRole.ADMIN])) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
          <Settings size={40} className="opacity-20" />
          <p className="font-medium">Anda tidak memiliki akses ke halaman ini</p>
        </div>
      </AppShell>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showToast('Format file tidak valid. Gunakan file .xlsx', 'error');
        return;
      }
      setFileName(file.name);
      setShowPreview(true);
      showToast('File berhasil dimuat. Periksa preview data di bawah.', 'success');
    }
  };

  const handleImport = () => {
    showToast('Data siswa berhasil diimport ke sistem.', 'success');
    setFileName(null);
    setShowPreview(false);
  };

  const ROLE_BADGE_COLORS: Record<UserRole, string> = {
    [UserRole.SISWA]: 'bg-blue-100 text-blue-700',
    [UserRole.WALI_KELAS]: 'bg-purple-100 text-purple-700',
    [UserRole.GURU_PIKET]: 'bg-amber-100 text-amber-700',
    [UserRole.SECURITY]: 'bg-emerald-100 text-emerald-700',
    [UserRole.ADMIN]: 'bg-red-100 text-red-700',
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Panel Administrasi</h1>
        <p className="page-subtitle">Kelola data siswa dan pengguna sistem</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {([
          { key: 'import' as Tab, label: 'Import Data', icon: FileSpreadsheet },
          { key: 'users' as Tab, label: 'Kelola Pengguna', icon: Users },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'import' && (
        <div className="max-w-4xl space-y-6">
          {/* Upload Area */}
          <div className="card-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Upload size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Import Data Siswa</h3>
                <p className="text-xs text-slate-400">Upload file Excel (.xlsx) berisi data siswa</p>
              </div>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
            >
              <FileSpreadsheet size={40} className="mx-auto mb-3 text-slate-300" />
              {fileName ? (
                <div>
                  <p className="text-sm font-semibold text-slate-700">{fileName}</p>
                  <p className="text-xs text-emerald-600 mt-1 flex items-center justify-center gap-1">
                    <CheckCircle size={12} /> File berhasil dimuat
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-slate-600">Klik untuk memilih file</p>
                  <p className="text-xs text-slate-400 mt-1">Format yang didukung: .xlsx, .xls</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Preview Table */}
          {showPreview && (
            <div className="card-lg overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-500" />
                  <h3 className="font-bold text-slate-800 text-sm">Preview Data ({MOCK_EXCEL_DATA.length} baris)</h3>
                </div>
                <button onClick={handleImport} className="btn-primary text-sm">
                  <Upload size={14} />
                  Import Sekarang
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['No', 'Nama', 'NIS', 'Kelas', 'Email'].map(h => (
                        <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {MOCK_EXCEL_DATA.map(row => (
                      <tr key={row.no} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 text-sm text-slate-500">{row.no}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-slate-800">{row.nama}</td>
                        <td className="px-5 py-3 text-sm font-mono text-blue-600">{row.nis}</td>
                        <td className="px-5 py-3 text-sm text-slate-600">{row.kelas}</td>
                        <td className="px-5 py-3 text-sm text-slate-500">{row.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="card-lg overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Daftar Pengguna Sistem</h3>
            <p className="text-xs text-slate-400 mt-1">{MOCK_USERS.length} pengguna terdaftar</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Nama', 'Username', 'Role', 'Kelas/Unit', 'Email'].map(h => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_USERS.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm">
                          {u.name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-mono text-slate-600">{u.username}</td>
                    <td className="px-5 py-3.5">
                      <span className={`status-badge ${ROLE_BADGE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{u.kelas || u.nip || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
