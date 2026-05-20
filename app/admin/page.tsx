'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Settings, Upload, Users, FileSpreadsheet, CheckCircle, 
  AlertCircle, Plus, Edit2, Trash2, Search, Download,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X, UserPlus, Info, Check, ShieldAlert
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useAppContext } from '@/context/AppContext';
import { UserRole, ROLE_LABELS, User } from '@/lib/types';
import { MOCK_EXCEL_DATA } from '@/lib/mockData';

type Tab = 'import' | 'users';

export default function AdminPage() {
  const { canAccess } = useAuth();
  const { 
    users, 
    addUser, 
    updateUser, 
    deleteUser, 
    showToast 
  } = useAppContext();

  // Navigation tabs
  const [tab, setTab] = useState<Tab>('import');

  // Search & Pagination for User List
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortColumn, setSortColumn] = useState<'name' | 'username' | 'role'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Excel Upload States
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Selected user for editing/deletion
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form States (Add/Edit)
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>(UserRole.SISWA);
  const [formEmail, setFormEmail] = useState('');
  const [formNis, setFormNis] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formKelas, setFormKelas] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Auth block
  if (!canAccess([UserRole.ADMIN])) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Settings size={40} className="opacity-20 animate-spin" />
          <p className="font-semibold">Anda tidak memiliki hak akses administrator</p>
        </div>
      </AppShell>
    );
  }

  // Handle excel drag & drop simulation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined) => {
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        showToast('Format file tidak valid. Gunakan format Excel (.xlsx, .xls) atau CSV!', 'error');
        return;
      }
      setFileName(file.name);
      setFileSize((file.size / 1024).toFixed(1) + ' KB');
      setShowPreview(true);
      showToast('Berkas Excel dimuat. Pratinjau data siswa di bawah ini.', 'success');
    }
  };

  // Bulk Excel import logic
  const handleImport = () => {
    // Loop mock data excel and inject into global memory
    MOCK_EXCEL_DATA.forEach(row => {
      // Avoid duplicate username/NIS
      const exists = users.some(u => u.username === row.nis || u.nis === row.nis);
      if (!exists) {
        addUser({
          name: row.nama,
          username: row.nis,
          password: 'password123',
          role: UserRole.SISWA,
          email: row.email,
          nis: row.nis,
          kelas: row.kelas
        });
      }
    });

    showToast(`Sukses menyuntikkan ${MOCK_EXCEL_DATA.length} data siswa dari Excel ke sistem.`, 'success');
    setFileName(null);
    setFileSize(null);
    setShowPreview(false);
    setTab('users'); // Switch tab to see new users
  };

  // CSV Export Trigger
  const handleExportCSV = () => {
    const headers = 'Nama,Username,Peran,NIS/NIP,Kelas/Unit,Email';
    const rows = users.map(u => 
      `"${u.name}","${u.username}","${ROLE_LABELS[u.role]}","${u.nis || u.nip || '-'}","${u.kelas || '-'}","${u.email}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_pengguna_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Data pengguna berhasil diekspor ke file CSV.', 'success');
  };

  // Form Validations
  const validateForm = (isEdit = false) => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Nama lengkap wajib diisi';
    if (!formUsername.trim()) errors.username = 'Username wajib diisi';
    if (!isEdit && !formPassword.trim()) errors.password = 'Kata sandi wajib diisi';
    if (!formEmail.trim()) {
      errors.email = 'Alamat email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formEmail)) {
      errors.email = 'Format email tidak valid';
    }

    if (formRole === UserRole.SISWA) {
      if (!formNis.trim()) errors.nis = 'NIS siswa wajib diisi';
      if (!formKelas.trim()) errors.kelas = 'Kelas wajib diisi';
    } else if (formRole === UserRole.WALI_KELAS) {
      if (!formNip.trim()) errors.nip = 'NIP wajib diisi';
      if (!formKelas.trim()) errors.kelas = 'Kelas binaan wajib diisi';
    } else {
      if (!formNip.trim()) errors.nip = 'NIP wajib diisi';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CRUD: Add User Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    // Check username duplicates
    if (users.some(u => u.username.toLowerCase() === formUsername.toLowerCase())) {
      setFormErrors(prev => ({ ...prev, username: 'Username sudah digunakan' }));
      return;
    }

    const payload: Omit<User, 'id'> = {
      name: formName,
      username: formUsername,
      password: formPassword,
      role: formRole,
      email: formEmail,
      ...(formRole === UserRole.SISWA && { nis: formNis, kelas: formKelas }),
      ...(formRole === UserRole.WALI_KELAS && { nip: formNip, kelas: formKelas }),
      ...(formRole !== UserRole.SISWA && formRole !== UserRole.WALI_KELAS && { nip: formNip }),
    };

    addUser(payload);
    showToast(`Pengguna baru ${formName} berhasil ditambahkan!`, 'success');
    closeAddModal();
  };

  // CRUD: Edit User Open
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword('');
    setFormRole(user.role);
    setFormEmail(user.email);
    setFormNis(user.nis || '');
    setFormNip(user.nip || '');
    setFormKelas(user.kelas || '');
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // CRUD: Edit User Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!validateForm(true)) return;

    // Check duplicate username if changed
    if (formUsername !== selectedUser.username && users.some(u => u.id !== selectedUser.id && u.username.toLowerCase() === formUsername.toLowerCase())) {
      setFormErrors(prev => ({ ...prev, username: 'Username sudah digunakan' }));
      return;
    }

    const updates: Partial<User> = {
      name: formName,
      username: formUsername,
      role: formRole,
      email: formEmail,
      nis: formRole === UserRole.SISWA ? formNis : undefined,
      nip: formRole !== UserRole.SISWA ? formNip : undefined,
      kelas: (formRole === UserRole.SISWA || formRole === UserRole.WALI_KELAS) ? formKelas : undefined,
    };

    if (formPassword.trim()) {
      updates.password = formPassword;
    }

    updateUser(selectedUser.id, updates);
    showToast(`Profil pengguna ${formName} berhasil diperbarui.`, 'success');
    closeEditModal();
  };

  // CRUD: Delete User Open
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // CRUD: Delete User Execute
  const handleDeleteExecute = () => {
    if (!selectedUser) return;
    deleteUser(selectedUser.id);
    showToast(`Pengguna ${selectedUser.name} telah dihapus permanen.`, 'info');
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  // Reset form states
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole(UserRole.SISWA);
    setFormEmail('');
    setFormNis('');
    setFormNip('');
    setFormKelas('');
    setFormErrors({});
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  // User List Sorting Logic
  const handleSort = (column: 'name' | 'username' | 'role') => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort user records
  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.kelas && u.kelas.toLowerCase().includes(query)) ||
      (u.nis && u.nis.toLowerCase().includes(query)) ||
      (u.nip && u.nip.toLowerCase().includes(query))
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;
    if (sortColumn === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortColumn === 'username') {
      comparison = a.username.localeCompare(b.username);
    } else if (sortColumn === 'role') {
      comparison = a.role.localeCompare(b.role);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Paginated user records
  const totalUserPages = Math.ceil(sortedUsers.length / pageSize) || 1;
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Color mapping based on Role
  const ROLE_BADGE_COLORS: Record<UserRole, string> = {
    [UserRole.SISWA]: 'bg-blue-50 border border-blue-100 text-blue-700',
    [UserRole.WALI_KELAS]: 'bg-purple-50 border border-purple-100 text-purple-700',
    [UserRole.GURU_PIKET]: 'bg-amber-50 border border-amber-100 text-amber-700',
    [UserRole.SECURITY]: 'bg-emerald-50 border border-emerald-100 text-emerald-700',
    [UserRole.ADMIN]: 'bg-red-50 border border-red-100 text-red-700',
  };

  return (
    <AppShell>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Panel Administrasi (E-Izin)</h1>
          <p className="page-subtitle">Pusat kelola data pengguna sistem, otorisasi peran, dan import berkas Excel.</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'users' && (
            <>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600 font-bold text-xs text-slate-600 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Download size={14} /> Ekspor CSV
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn-primary py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/10 text-white font-bold text-xs"
              >
                <Plus size={14} /> Tambah Pengguna
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation tabs switcher */}
      <div className="flex items-center gap-2 mb-6">
        {([
          { key: 'import' as Tab, label: 'Unggah excel Siswa', icon: FileSpreadsheet },
          { key: 'users' as Tab, label: 'Daftar & CRUD Pengguna', icon: Users },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              tab === t.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-slate-700'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Bulk import Excel */}
      {tab === 'import' && (
        <div className="max-w-4xl space-y-6">
          {/* Dropzone container with animations */}
          <div className="card p-8 border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Import Excel Data Siswa</h3>
                <p className="text-xs text-slate-400 font-medium">Unggah data siswa dalam format .xlsx / .xls untuk disuntikkan secara massal ke memori sistem.</p>
              </div>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/80 scale-95 shadow-inner'
                  : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <FileSpreadsheet size={24} className="text-blue-500" />
              </div>
              {fileName ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 leading-snug">{fileName}</p>
                  <p className="text-xs text-slate-400 font-semibold font-mono">{fileSize}</p>
                  <p className="text-xs text-emerald-600 mt-2 font-bold flex items-center justify-center gap-1 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full w-fit mx-auto">
                    <CheckCircle size={12} /> Berkas Siap Diimpor
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-700">Tarik & Lepaskan Berkas Excel di sini</p>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Atau klik untuk menjelajahi folder komputer Anda</p>
                  <p className="text-[10px] text-slate-350 mt-4 uppercase tracking-widest font-bold">Mendukung format: .xlsx, .xls, .csv</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Preview grid */}
          {showPreview && (
            <div className="card border-slate-200 overflow-hidden animate-fadeIn">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-blue-600" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">Preview Lembar Kerja Excel</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">Menampilkan pratinjau data ({MOCK_EXCEL_DATA.length} baris) sebelum diintegrasikan.</p>
                  </div>
                </div>
                <button 
                  onClick={handleImport} 
                  className="btn-primary py-2 px-4 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/10 text-white font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <Check size={14} className="stroke-[3px]" /> Import Sekarang
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    <tr>
                      {['No', 'Nama Siswa', 'Nomor Induk Siswa (NIS)', 'Kelas', 'Email Terdaftar'].map(h => (
                        <th key={h} className="px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {MOCK_EXCEL_DATA.map(row => (
                      <tr key={row.no} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-5 py-3 text-xs font-mono font-semibold text-slate-400">{row.no}</td>
                        <td className="px-5 py-3 text-xs font-bold text-slate-800">{row.nama}</td>
                        <td className="px-5 py-3 text-xs font-mono font-bold text-blue-600">{row.nis}</td>
                        <td className="px-5 py-3 text-xs font-semibold text-slate-600">{row.kelas}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">{row.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Users CRUD Dashboard */}
      {tab === 'users' && (
        <div className="card border-slate-200 overflow-hidden shadow-sm space-y-4">
          
          {/* Controls Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Cari nama, username, email, NIP, NIS..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 outline-none font-medium"
              />
            </div>
            
            <p className="text-xs text-slate-400 font-semibold font-mono">
              Total terfilter: {filteredUsers.length} pengguna
            </p>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-3">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-slate-700">
                      Nama Lengkap {sortColumn === 'name' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </button>
                  </th>
                  <th className="px-5 py-3">
                    <button onClick={() => handleSort('username')} className="flex items-center gap-1 hover:text-slate-700">
                      Username / ID {sortColumn === 'username' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </button>
                  </th>
                  <th className="px-5 py-3">
                    <button onClick={() => handleSort('role')} className="flex items-center gap-1 hover:text-slate-700">
                      Peran {sortColumn === 'role' && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </button>
                  </th>
                  <th className="px-5 py-3">Identitas / Kelas</th>
                  <th className="px-5 py-3">Alamat Email</th>
                  <th className="px-5 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs">
                            {u.name.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-slate-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono font-semibold text-slate-500">{u.username}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${ROLE_BADGE_COLORS[u.role]}`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-600">
                        {u.role === UserRole.SISWA && (u.kelas || '-')}
                        {u.role === UserRole.WALI_KELAS && `${u.kelas || '-'} (${u.nip || '-'})`}
                        {u.role !== UserRole.SISWA && u.role !== UserRole.WALI_KELAS && (u.nip || '-')}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium text-slate-400">{u.email}</td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600 transition-colors"
                            title="Edit Profil"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(u)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:border-red-300 hover:text-red-600 transition-colors"
                            title="Hapus Pengguna"
                            disabled={u.username === 'admin'} // Cannot delete master admin
                          >
                            <Trash2 size={12} className={u.username === 'admin' ? 'opacity-20' : ''} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-xs">
                      Tidak ada pengguna ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginated Footer */}
          {sortedUsers.length > 0 && (
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold outline-none"
                >
                  <option value={5}>5 baris</option>
                  <option value={10}>10 baris</option>
                  <option value={20}>20 baris</option>
                </select>
                <span className="text-xs text-slate-400 font-semibold font-mono ml-2">
                  {Math.min(sortedUsers.length, (currentPage - 1) * pageSize + 1)}-{Math.min(sortedUsers.length, currentPage * pageSize)} dari {sortedUsers.length} pengguna
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:text-blue-600 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {[...Array(totalUserPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-6 h-6 rounded-lg text-xs font-bold font-mono ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalUserPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalUserPages, prev + 1))}
                  className="p-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:text-blue-600 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CRUD: Add User Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={closeAddModal} />
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col animate-slideUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-600">
                <UserPlus size={18} />
                <h2 className="text-sm font-bold text-slate-800">Tambah Pengguna Baru</h2>
              </div>
              <button onClick={closeAddModal} className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-4">
                {/* Full name */}
                <div className="col-span-2">
                  <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nama Lengkap</label>
                  <input
                    type="text"
                    placeholder="Contoh: Muhammad Rafli"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="input text-xs py-2"
                  />
                  {formErrors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.name}</p>}
                </div>

                {/* Username */}
                <div>
                  <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Username / ID Login</label>
                  <input
                    type="text"
                    placeholder="Contoh: rafli123"
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    className="input text-xs py-2 font-mono"
                  />
                  {formErrors.username && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.username}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kata Sandi</label>
                  <input
                    type="password"
                    placeholder="Masukkan sandi..."
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    className="input text-xs py-2 font-mono"
                  />
                  {formErrors.password && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.password}</p>}
                </div>

                {/* Email address */}
                <div className="col-span-2">
                  <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Alamat Email</label>
                  <input
                    type="email"
                    placeholder="Contoh: siswa@sekolah.id"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="input text-xs py-2"
                  />
                  {formErrors.email && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.email}</p>}
                </div>

                {/* User Role Selector */}
                <div className="col-span-2">
                  <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Peran Sistem (Role)</label>
                  <select
                    value={formRole}
                    onChange={e => {
                      setFormRole(e.target.value as UserRole);
                      setFormErrors({});
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-blue-400"
                  >
                    <option value={UserRole.SISWA}>Siswa</option>
                    <option value={UserRole.WALI_KELAS}>Wali Kelas</option>
                    <option value={UserRole.GURU_PIKET}>Guru Piket</option>
                    <option value={UserRole.SECURITY}>Security / Penjaga Gerbang</option>
                    <option value={UserRole.ADMIN}>Administrator</option>
                  </select>
                </div>

                {/* SISWA specific fields */}
                {formRole === UserRole.SISWA && (
                  <>
                    <div>
                      <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nomor Induk Siswa (NIS)</label>
                      <input
                        type="text"
                        placeholder="Contoh: 26051"
                        value={formNis}
                        onChange={e => setFormNis(e.target.value)}
                        className="input text-xs py-2 font-mono"
                      />
                      {formErrors.nis && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.nis}</p>}
                    </div>
                    <div>
                      <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kelas</label>
                      <input
                        type="text"
                        placeholder="Contoh: XI RPL 1"
                        value={formKelas}
                        onChange={e => setFormKelas(e.target.value)}
                        className="input text-xs py-2 uppercase"
                      />
                      {formErrors.kelas && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.kelas}</p>}
                    </div>
                  </>
                )}

                {/* WALI KELAS specific fields */}
                {formRole === UserRole.WALI_KELAS && (
                  <>
                    <div>
                      <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nomor Induk Pegawai (NIP)</label>
                      <input
                        type="text"
                        placeholder="Contoh: 198205..."
                        value={formNip}
                        onChange={e => setFormNip(e.target.value)}
                        className="input text-xs py-2 font-mono"
                      />
                      {formErrors.nip && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.nip}</p>}
                    </div>
                    <div>
                      <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kelas Binaan</label>
                      <input
                        type="text"
                        placeholder="Contoh: XI RPL 1"
                        value={formKelas}
                        onChange={e => setFormKelas(e.target.value)}
                        className="input text-xs py-2 uppercase"
                      />
                      {formErrors.kelas && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.kelas}</p>}
                    </div>
                  </>
                )}

                {/* GURU PIKET / OTHER STAFF specific fields */}
                {formRole !== UserRole.SISWA && formRole !== UserRole.WALI_KELAS && (
                  <div className="col-span-2">
                    <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nomor Induk Pegawai (NIP)</label>
                    <input
                      type="text"
                      placeholder="Masukkan NIP Pegawai..."
                      value={formNip}
                      onChange={e => setFormNip(e.target.value)}
                      className="input text-xs py-2 font-mono"
                    />
                    {formErrors.nip && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.nip}</p>}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 text-white font-bold text-xs"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD: Edit User Modal Dialog */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeEditModal} />
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-600">
                <Edit2 size={16} />
                <h2 className="text-sm font-bold text-slate-800">Edit Profil Pengguna</h2>
              </div>
              <button onClick={closeEditModal} className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-2 gap-4">
                {/* Full name */}
                <div className="col-span-2">
                  <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="input text-xs py-2"
                  />
                  {formErrors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.name}</p>}
                </div>

                {/* Username */}
                <div>
                  <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Username / ID Login</label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    className="input text-xs py-2 font-mono"
                    disabled={selectedUser.username === 'admin'} // Cannot rename super admin
                  />
                  {formErrors.username && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.username}</p>}
                </div>

                {/* Password (Optional for updates) */}
                <div>
                  <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sandi Baru (Kosongkan jika tidak diubah)</label>
                  <input
                    type="password"
                    placeholder="Sandi baru..."
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    className="input text-xs py-2 font-mono"
                  />
                </div>

                {/* Email address */}
                <div className="col-span-2">
                  <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Alamat Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="input text-xs py-2"
                  />
                  {formErrors.email && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.email}</p>}
                </div>

                {/* User Role Selector */}
                <div className="col-span-2">
                  <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Peran Sistem (Role)</label>
                  <select
                    value={formRole}
                    onChange={e => {
                      setFormRole(e.target.value as UserRole);
                      setFormErrors({});
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white outline-none focus:border-blue-400"
                    disabled={selectedUser.username === 'admin'} // Cannot change super admin role
                  >
                    <option value={UserRole.SISWA}>Siswa</option>
                    <option value={UserRole.WALI_KELAS}>Wali Kelas</option>
                    <option value={UserRole.GURU_PIKET}>Guru Piket</option>
                    <option value={UserRole.SECURITY}>Security / Penjaga Gerbang</option>
                    <option value={UserRole.ADMIN}>Administrator</option>
                  </select>
                </div>

                {/* SISWA specific fields */}
                {formRole === UserRole.SISWA && (
                  <>
                    <div>
                      <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nomor Induk Siswa (NIS)</label>
                      <input
                        type="text"
                        value={formNis}
                        onChange={e => setFormNis(e.target.value)}
                        className="input text-xs py-2 font-mono"
                      />
                      {formErrors.nis && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.nis}</p>}
                    </div>
                    <div>
                      <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kelas</label>
                      <input
                        type="text"
                        value={formKelas}
                        onChange={e => setFormKelas(e.target.value)}
                        className="input text-xs py-2 uppercase"
                      />
                      {formErrors.kelas && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.kelas}</p>}
                    </div>
                  </>
                )}

                {/* WALI KELAS specific fields */}
                {formRole === UserRole.WALI_KELAS && (
                  <>
                    <div>
                      <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nomor Induk Pegawai (NIP)</label>
                      <input
                        type="text"
                        value={formNip}
                        onChange={e => setFormNip(e.target.value)}
                        className="input text-xs py-2 font-mono"
                      />
                      {formErrors.nip && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.nip}</p>}
                    </div>
                    <div>
                      <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kelas Binaan</label>
                      <input
                        type="text"
                        value={formKelas}
                        onChange={e => setFormKelas(e.target.value)}
                        className="input text-xs py-2 uppercase"
                      />
                      {formErrors.kelas && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.kelas}</p>}
                    </div>
                  </>
                )}

                {/* GURU PIKET / OTHER STAFF specific fields */}
                {formRole !== UserRole.SISWA && formRole !== UserRole.WALI_KELAS && (
                  <div className="col-span-2">
                    <label className="label text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nomor Induk Pegawai (NIP)</label>
                    <input
                      type="text"
                      value={formNip}
                      onChange={e => setFormNip(e.target.value)}
                      className="input text-xs py-2 font-mono"
                    />
                    {formErrors.nip && <p className="text-[10px] text-red-500 font-bold mt-1">{formErrors.nip}</p>}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 text-white font-bold text-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD: Delete Confirmation Dialog */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl w-full max-w-md z-10 overflow-hidden flex flex-col p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100 flex-shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Hapus Pengguna Permanen?</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Tindakan ini tidak bisa dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Anda akan menghapus akun pengguna bernama <strong>{selectedUser.name}</strong> dengan username/NIS <strong>{selectedUser.username}</strong> ({ROLE_LABELS[selectedUser.role]}). Seluruh informasi login terkait pengguna ini akan hilang dari memori sistem.
            </p>

            <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteExecute}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/10 text-white font-bold text-xs"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
