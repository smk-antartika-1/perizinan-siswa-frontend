'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, SlidersHorizontal, ArrowUpDown, ChevronDown, ChevronUp, 
  Eye, EyeOff, Calendar, ChevronLeft, ChevronRight, GraduationCap,
  Clock, ShieldCheck, ArrowRightLeft, SquareCheck, Info
} from 'lucide-react';
import { Permission, PermissionStatus, UserRole, STATUS_CONFIG } from '@/lib/types';
import { formatEstimatedReturn, formatTime, formatDate, getDisplayStatus } from '@/lib/utils';
import { getPaginationInfo, paginateItems } from '@/lib/pagination';
import { useAppContext } from '@/context/AppContext';
import StatusBadge from '@/components/ui/StatusBadge';

interface PermissionTableProps {
  permissions: Permission[];
  groupByClass?: boolean;
}

export default function PermissionTable({ permissions, groupByClass = false }: PermissionTableProps) {
  const router = useRouter();
  const { viewStudent, users, currentUser, updatePermission, showToast } = useAppContext();

  // Search & Filtering States
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting States
  const [sortColumn, setSortColumn] = useState<'studentName' | 'departureTime'>('departureTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Column Visibility States
  const [showFilters, setShowFilters] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    studentName: true,
    category: true,
    reason: true,
    departureTime: true,
    status: true,
    returnAction: true,
    detailsAction: true
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Grouped Class States
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Loading Simulation States
  const [isTableLoading, setIsTableLoading] = useState(false);
  const canManageReturn =
    currentUser?.role === UserRole.GURU_PIKET ||
    currentUser?.role === UserRole.SECURITY ||
    currentUser?.role === UserRole.WALI_KELAS ||
    currentUser?.role === UserRole.ADMIN;

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter, startDate, endDate, pageSize]);

  // Simulate loading on table updates for smooth premium UX
  useEffect(() => {
    setIsTableLoading(true);
    const timer = setTimeout(() => setIsTableLoading(false), 150);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, statusFilter, startDate, endDate, sortColumn, sortDirection, currentPage, pageSize]);

  // Filter permission data
  const filtered = permissions.filter(p => {
    // 1. Search Query
    const matchesSearch = 
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.kelas.toLowerCase().includes(search.toLowerCase()) ||
      p.reason.toLowerCase().includes(search.toLowerCase());

    // 2. Category Filter
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

    // 3. Status Filter
    const matchesStatus = statusFilter === 'all' || getDisplayStatus(p) === statusFilter;

    // 4. Date Range Filters
    const departureDateStr = p.departureTime.split('T')[0];
    const matchesStartDate = !startDate || departureDateStr >= startDate;
    const matchesEndDate = !endDate || departureDateStr <= endDate;

    return matchesSearch && matchesCategory && matchesStatus && matchesStartDate && matchesEndDate;
  });

  // Sort permission data
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortColumn === 'studentName') {
      comparison = a.studentName.localeCompare(b.studentName);
    } else if (sortColumn === 'departureTime') {
      comparison = new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Paginate sorted data
  const pageInfo = getPaginationInfo(sorted.length, pageSize, currentPage);
  const paginated = paginateItems(sorted, pageSize, currentPage);

  // Toggle sort order
  const handleSort = (column: 'studentName' | 'departureTime') => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Group by Kelas logic for grouped layout
  const groupByKelas = (items: Permission[]) => {
    return items.reduce<Record<string, Permission[]>>((groups, item) => {
      const group = item.kelas;
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});
  };

  const toggleGroup = (kelas: string) => {
    setOpenGroups(prev => ({ ...prev, [kelas]: !prev[kelas] }));
  };

  // Handle return checkbox change
  const handleToggleReturn = (p: Permission) => {
    if (!currentUser) {
      showToast('Anda harus masuk terlebih dahulu untuk menindak kepulangan.', 'error');
      return;
    }

    const isCompleted = p.status === PermissionStatus.COMPLETED;
    const nowStr = new Date().toISOString();
    const nextStatus = isCompleted ? PermissionStatus.APPROVED_PIKET : PermissionStatus.COMPLETED;
    const actualReturn = isCompleted ? undefined : nowStr;
    const auditAction = isCompleted ? 'Membatalkan Konfirmasi Kepulangan' : 'Siswa Kembali ke Sekolah';

    const newAudit = [
      ...(p.auditLog || []),
      {
        id: `a-${Math.random().toString(36).substring(2, 9)}`,
        action: auditAction,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        timestamp: nowStr,
        details: isCompleted ? 'Status diubah kembali menjadi Izin Aktif.' : 'Siswa kembali di sekolah dengan selamat.'
      }
    ];

    updatePermission(p.id, {
      status: nextStatus,
      actualReturnTime: actualReturn,
      auditLog: newAudit
    });

    showToast(
      isCompleted 
        ? `Konfirmasi kepulangan untuk ${p.studentName} dibatalkan.`
        : `${p.studentName} telah dicatat kembali ke sekolah.`,
      'success'
    );
  };

  // Trigger global student details modal
  const handleStudentClick = (p: Permission) => {
    const studentUser = users.find(u => u.id === p.studentId || u.name === p.studentName);
    const studentNis = studentUser?.nis || p.studentId || '12345';
    viewStudent(studentNis);
  };

  // Toggle column visibility
  const toggleColumnVisibility = (col: string) => {
    setColumnVisibility(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = search || categoryFilter !== 'all' || statusFilter !== 'all' || startDate || endDate;

  // Category labels config
  const categoryLabels: Record<string, string> = {
    sakit: 'Sakit',
    keperluan: 'Keperluan',
    dispensasi: 'Dispensasi',
    lainnya: 'Lainnya',
  };

  const categoryStyles: Record<string, string> = {
    sakit: 'bg-amber-50 border border-amber-200 text-amber-700',
    dispensasi: 'bg-purple-50 border border-purple-200 text-purple-700',
    keperluan: 'bg-blue-50 border border-blue-200 text-blue-700',
    lainnya: 'bg-slate-50 border border-slate-200 text-slate-500',
  };

  // Render Table Header column with sorting triggers
  const renderSortableHeader = (colId: 'studentName' | 'departureTime', label: string) => {
    const isActive = sortColumn === colId;
    return (
      <button
        onClick={() => handleSort(colId)}
        className="flex items-center gap-1.5 hover:text-slate-700 transition-colors uppercase tracking-widest text-[10px] font-bold text-slate-400 font-mono"
      >
        {label}
        {isActive ? (
          sortDirection === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />
        ) : (
          <ArrowUpDown size={10} className="opacity-40" />
        )}
      </button>
    );
  };

  // Render Single Permission Row
  const renderRow = (p: Permission) => {
    const displayStatus = getDisplayStatus(p);
    const isCompleted = p.status === PermissionStatus.COMPLETED;
    const isApprovedPiket =
      displayStatus === PermissionStatus.APPROVED_PIKET ||
      displayStatus === PermissionStatus.EXPIRED;
    
    // Checked status is true if completed
    const isChecked = isCompleted;

    // Only school staff can confirm or reopen student return status.
    const canToggle = canManageReturn && (isApprovedPiket || isCompleted);

    return (
      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100 group">
        {columnVisibility.studentName && (
          <td className="px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs flex-shrink-0">
                {p.studentName.charAt(0)}
              </div>
              <div>
                <button
                  onClick={() => handleStudentClick(p)}
                  className="text-sm font-bold text-slate-800 hover:text-blue-600 hover:underline text-left block"
                >
                  {p.studentName}
                </button>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{p.kelas}</p>
              </div>
            </div>
          </td>
        )}

        {columnVisibility.category && (
          <td className="px-4 py-3 whitespace-nowrap">
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${categoryStyles[p.category || 'lainnya']}`}>
              {categoryLabels[p.category || 'lainnya'] || 'Lainnya'}
            </span>
          </td>
        )}

        {columnVisibility.reason && (
          <td className="px-4 py-3">
            <p className="text-xs font-medium text-slate-600 max-w-[200px] line-clamp-2 italic" title={p.reason}>
              "{p.reason}"
            </p>
          </td>
        )}

        {columnVisibility.departureTime && (
          <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
            <div className="flex items-center gap-1 font-medium"><Calendar size={11} className="text-slate-400" /> {formatDate(p.departureTime)}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
              <Clock size={11} className="text-slate-350" />
              {formatTime(p.departureTime)} – {formatEstimatedReturn(p)}
            </div>
          </td>
        )}

        {columnVisibility.status && (
          <td className="px-4 py-3">
            <StatusBadge permission={p} />
          </td>
        )}

        {columnVisibility.returnAction && (
          <td className="px-4 py-3 whitespace-nowrap">
            {p.category === 'sakit' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-bold text-[9px] uppercase tracking-wider" title="Sakit dibebaskan dari wajib kepulangan siswa.">
                <Info size={10} className="text-slate-400" /> Sakit (Bebas Absen)
              </span>
            ) : canToggle ? (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleReturn(p)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer transition-all"
                />
                <span className={`text-[11px] font-bold transition-colors ${isCompleted ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {isCompleted ? 'Sudah Kembali' : 'Belum Kembali'}
                </span>
              </label>
            ) : (
              <span className="text-[10px] font-medium text-slate-350 italic">
                {isApprovedPiket || isCompleted
                  ? 'Dicatat oleh petugas'
                  : 'Belum Diizinkan Keluar'}
              </span>
            )}
          </td>
        )}

        {columnVisibility.detailsAction && (
          <td className="px-4 py-3 text-right">
            <button
              onClick={() => router.push(`/izin/${p.id}`)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600 text-xs font-semibold text-slate-500 transition-all inline-flex items-center gap-1"
            >
              Detail <ChevronRight size={12} />
            </button>
          </td>
        )}
      </tr>
    );
  };

  // Render Table Skeleton Loading Rows
  const renderSkeletons = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-slate-100">
          {columnVisibility.studentName && (
            <td className="px-4 py-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-slate-100 rounded w-24" />
                  <div className="h-2 bg-slate-100 rounded w-12" />
                </div>
              </div>
            </td>
          )}
          {columnVisibility.category && <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-16" /></td>}
          {columnVisibility.reason && <td className="px-4 py-4"><div className="h-3 bg-slate-100 rounded w-36" /></td>}
          {columnVisibility.departureTime && (
            <td className="px-4 py-4 space-y-1.5">
              <div className="h-3 bg-slate-100 rounded w-20" />
              <div className="h-2 bg-slate-100 rounded w-16" />
            </td>
          )}
          {columnVisibility.status && <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-16" /></td>}
          {columnVisibility.returnAction && <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>}
          {columnVisibility.detailsAction && <td className="px-4 py-4 text-right"><div className="h-6 bg-slate-100 rounded w-14 ml-auto" /></td>}
        </tr>
      ))}
    </>
  );

  return (
    <div className="space-y-5">
      
      {/* Top Filter Bar Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Keyword Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama siswa, NIS, kelas, alasan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 outline-none text-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          
          {/* Toggle Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              showFilters || hasActiveFilters
                ? 'border-blue-300 bg-blue-50 text-blue-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filter {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 block" />}
          </button>

          {/* Column Visibility Selector Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-blue-200 transition-all"
            >
              <Eye size={14} />
              Kolom
            </button>

            {showVisibilityDropdown && (
              <>
                <div className="fixed inset-0 z-layer-dropdown-backdrop" onClick={() => setShowVisibilityDropdown(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-250 shadow-xl p-3 space-y-2 z-layer-dropdown">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1 border-b border-slate-100">Pilih Kolom Tampil</p>
                  
                  {([
                    { key: 'studentName', label: 'Nama Siswa' },
                    { key: 'category', label: 'Kategori Keperluan' },
                    { key: 'reason', label: 'Alasan' },
                    { key: 'departureTime', label: 'Waktu Perizinan' },
                    { key: 'status', label: 'Status Dokumen' },
                    { key: 'returnAction', label: 'Kehadiran Kembali' },
                    { key: 'detailsAction', label: 'Tombol Aksi' },
                  ]).map(col => (
                    <label key={col.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition-colors">
                      <input
                        type="checkbox"
                        checked={columnVisibility[col.key]}
                        onChange={() => toggleColumnVisibility(col.key)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-350"
                      />
                      <span className="text-xs font-semibold text-slate-600">{col.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters Expandable Drawer */}
      {showFilters && (
        <div className="p-5 bg-gradient-to-r from-slate-50 to-slate-50/50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end animate-fadeIn">
          
          {/* Category Filter */}
          <div>
            <label className="label text-[10px] uppercase font-bold text-slate-500 tracking-wider">Kategori Izin</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-400 transition-all font-semibold text-slate-700"
            >
              <option value="all">Semua Kategori</option>
              <option value="sakit">Izin Sakit</option>
              <option value="keperluan">Keperluan Keluarga</option>
              <option value="dispensasi">Dispensasi Kegiatan</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="label text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status Dokumen</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-400 transition-all font-semibold text-slate-700"
            >
              <option value="all">Semua Status</option>
              <option value={PermissionStatus.PENDING}>Menunggu Wali Kelas</option>
              <option value={PermissionStatus.APPROVED_WALI}>Disetujui Wali Kelas</option>
              <option value={PermissionStatus.APPROVED_PIKET}>Disetujui Piket (Izin Aktif)</option>
              <option value={PermissionStatus.EXPIRED}>Izin Expired</option>
              <option value={PermissionStatus.COMPLETED}>Selesai (Kembali)</option>
              <option value={PermissionStatus.REJECTED}>Ditolak / Batal</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="label text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-400 transition-all font-semibold text-slate-700"
            />
          </div>

          {/* End Date & Reset Action */}
          <div>
            <label className="label text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tanggal Selesai</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-400 transition-all font-semibold text-slate-700 flex-1"
              />
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-red-300 hover:text-red-600 text-xs font-semibold transition-all"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Table Content Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {sorted.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="max-w-md mx-auto flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-350 mb-1">
                <SlidersHorizontal size={24} className="opacity-40" />
              </div>
              {hasActiveFilters ? (
                /* Hasil filter kosong — berbeda dari data benar-benar kosong */
                <>
                  <h4 className="font-bold text-slate-800 text-sm">Tidak Ditemukan</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Tidak ada perizinan yang sesuai filter pencarian. Coba ubah kata kunci, kategori, atau rentang tanggal.
                  </p>
                  <button
                    onClick={resetFilters}
                    className="btn-secondary text-xs px-4 py-2 mt-1 rounded-xl"
                  >
                    Hapus Semua Filter
                  </button>
                </>
              ) : (
                /* Data memang kosong — bukan karena filter */
                <>
                  <h4 className="font-bold text-slate-800 text-sm">Belum Ada Data Perizinan</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Belum ada riwayat perizinan yang tercatat.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : groupByClass ? (
          // Grouped by Kelas layout option
          Object.entries(groupByKelas(paginated)).map(([kelas, items]) => {
            const isOpen = openGroups[kelas] !== false; // default open
            return (
              <div key={kelas} className="border-b border-slate-100 last:border-b-0">
                <button
                  onClick={() => toggleGroup(kelas)}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100/80 transition-colors border-b border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                      <GraduationCap size={12} />
                    </div>
                    <span className="font-bold text-slate-700 text-xs tracking-wide">Kelas {kelas}</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-bold">{items.length} Siswa</span>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>
                
                {isOpen && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {columnVisibility.studentName && <th className="px-4 py-2">Siswa</th>}
                          {columnVisibility.category && <th className="px-4 py-2">Kategori</th>}
                          {columnVisibility.reason && <th className="px-4 py-2">Alasan</th>}
                          {columnVisibility.departureTime && <th className="px-4 py-2">Waktu Berangkat</th>}
                          {columnVisibility.status && <th className="px-4 py-2">Status</th>}
                          {columnVisibility.returnAction && <th className="px-4 py-2">Kehadiran</th>}
                          {columnVisibility.detailsAction && <th className="px-4 py-2 text-right"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {isTableLoading ? renderSkeletons() : items.map(renderRow)}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // Flat list layout option
          <div className="overflow-x-auto scroll-fade-right">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {columnVisibility.studentName && (
                    <th className="px-4 py-3.5">{renderSortableHeader('studentName', 'Siswa')}</th>
                  )}
                  {columnVisibility.category && (
                    <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori</th>
                  )}
                  {columnVisibility.reason && (
                    <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alasan</th>
                  )}
                  {columnVisibility.departureTime && (
                    <th className="px-4 py-3.5">{renderSortableHeader('departureTime', 'Waktu Perizinan')}</th>
                  )}
                  {columnVisibility.status && (
                    <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  )}
                  {columnVisibility.returnAction && (
                    <th className="px-4 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kehadiran Kembali</th>
                  )}
                  {columnVisibility.detailsAction && (
                    <th className="px-4 py-3.5 text-right"></th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isTableLoading ? (
                  renderSkeletons()
                ) : (
                  paginated.map(renderRow)
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginated Footer Area */}
          <div className="p-4 border-t border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Tampilkan baris:</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs outline-none font-semibold text-slate-700 focus:border-blue-400"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs text-slate-400 font-semibold font-mono ml-3">
                Menampilkan {pageInfo.startItem}-{pageInfo.endItem} dari {pageInfo.totalItems} perizinan
              </span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={pageInfo.currentPage === 1 || isTableLoading}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              
              {[...Array(pageInfo.totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                // Render limited pages if total pages is large
                if (pageInfo.totalPages > 5 && Math.abs(pageNum - pageInfo.currentPage) > 2 && pageNum !== 1 && pageNum !== pageInfo.totalPages) {
                  if (pageNum === 2 || pageNum === pageInfo.totalPages - 1) {
                    return <span key={pageNum} className="text-slate-300 text-xs px-1 select-none">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    disabled={isTableLoading}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all ${
                      pageInfo.currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                disabled={pageInfo.currentPage === pageInfo.totalPages || isTableLoading}
                onClick={() => setCurrentPage(prev => Math.min(pageInfo.totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors"
                title="Halaman Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
      </div>
    </div>
  );
}
