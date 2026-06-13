'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ScanLine, History, CheckCircle, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { QRScanner } from '@/components/qr/QRComponents';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useAppContext } from '@/context/AppContext';
import { apiRequest } from '@/lib/api';
import { Permission, PermissionStatus, UserRole } from '@/lib/types';
import { formatDateTime, formatEstimatedReturn, getDisplayStatus } from '@/lib/utils';

type ScannedPermission = Permission & {
  scannedAt?: string;
};

type ReturnFilter = 'all' | 'not_returned' | 'returned';
type ReturnState = 'returned' | 'not_returned';

const RETURN_FILTERS: Array<{ value: ReturnFilter; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'not_returned', label: 'Belum Kembali' },
  { value: 'returned', label: 'Sudah Kembali' },
];

const CATEGORY_LABELS: Record<string, string> = {
  sakit: 'Sakit',
  keperluan: 'Keperluan',
  dispensasi: 'Dispensasi',
  lainnya: 'Lainnya',
};

function getReturnState(permission: Permission): ReturnState {
  return permission.status === PermissionStatus.COMPLETED &&
    permission.rawStatus !== 'closed_no_return'
    ? 'returned'
    : 'not_returned';
}

function getScanApiPath(qrValue: string) {
  const marker = '/api/v1/security/scan/';
  if (qrValue.startsWith(marker)) return qrValue;

  try {
    const url = new URL(qrValue);
    const index = url.pathname.indexOf(marker);
    if (index >= 0) return `${url.pathname.slice(index)}${url.search}`;
  } catch {
    const index = qrValue.indexOf(marker);
    if (index >= 0) return qrValue.slice(index);
  }

  return null;
}

export default function ScanQRPage() {
  const { canAccess, currentUser } = useAuth();
  const { permissions, markCompleted, updatePermission } = usePermissions();
  const { showToast } = useAppContext();
  const [scannedPermissions, setScannedPermissions] = useState<ScannedPermission[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [scanError, setScanError] = useState('');
  const [search, setSearch] = useState('');
  const [returnFilter, setReturnFilter] = useState<ReturnFilter>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadScannedPermissions = useCallback(async (showLoading = true) => {
    if (showLoading) setLoadingScans(true);
    setScanError('');
    try {
      const data = await apiRequest<{ data: ScannedPermission[] }>(
        '/api/v1/security/scanned-permissions',
      );
      setScannedPermissions(data?.data || []);
    } catch (err: any) {
      setScanError(err?.message || 'Gagal memuat data scan security.');
    } finally {
      if (showLoading) setLoadingScans(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess([UserRole.SECURITY])) {
      loadScannedPermissions();
    }
  }, [currentUser?.role, loadScannedPermissions]);

  if (!canAccess([UserRole.SECURITY])) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
          <ScanLine size={40} className="opacity-20" />
          <p className="font-medium">Anda tidak memiliki akses ke halaman ini</p>
        </div>
      </AppShell>
    );
  }

  const handleScanned = useCallback(async (qrValue: string) => {
    const scanPath = getScanApiPath(qrValue);
    if (!scanPath) {
      showToast('QR Code tidak valid atau tidak dikenali sistem.', 'error');
      return null;
    }

    try {
      const data = await apiRequest<{ permission: ScannedPermission }>(scanPath);
      showToast(`QR Valid: ${data.permission.studentName}`, 'success');
      await loadScannedPermissions(false);
      return data.permission;
    } catch (err: any) {
      showToast(err?.message || 'QR Code tidak valid atau sudah kedaluwarsa.', 'error');
      return null;
    }
  }, [showToast, loadScannedPermissions]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      handleScanned(`/api/v1/security/scan/${token}`);
    }
  }, [handleScanned]);

  const handleMarkComplete = async (id: string) => {
    setUpdatingId(id);
    try {
      await markCompleted(id);
      showToast('Siswa berhasil dicatat sudah kembali ke sekolah', 'success');
      await loadScannedPermissions(false);
    } catch (err: any) {
      showToast(err?.message || 'Gagal mencatat siswa sudah kembali', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkNotReturned = async (id: string) => {
    setUpdatingId(id);
    try {
      await updatePermission(id, { status: PermissionStatus.APPROVED_PIKET });
      showToast('Status siswa dikembalikan menjadi Belum Kembali', 'info');
      await loadScannedPermissions(false);
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengubah status kembali siswa', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredScans = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return scannedPermissions
      .filter((permission) => {
        const returnState = getReturnState(permission);
        const matchesReturn =
          returnFilter === 'all' || returnFilter === returnState;
        const matchesSearch =
          !keyword ||
          permission.studentName.toLowerCase().includes(keyword) ||
          permission.kelas.toLowerCase().includes(keyword) ||
          permission.reason.toLowerCase().includes(keyword);
        return matchesReturn && matchesSearch;
      })
      .sort((a, b) => {
        const aReturnState = getReturnState(a);
        const bReturnState = getReturnState(b);
        if (aReturnState !== bReturnState) {
          return aReturnState === 'not_returned' ? -1 : 1;
        }
        return (
          new Date(b.scannedAt || b.createdAt).getTime() -
          new Date(a.scannedAt || a.createdAt).getTime()
        );
      });
  }, [returnFilter, scannedPermissions, search]);

  const returnedCount = scannedPermissions.filter(
    (permission) => getReturnState(permission) === 'returned',
  ).length;
  const notReturnedCount = scannedPermissions.length - returnedCount;
  const notReturnedScans = useMemo(
    () =>
      scannedPermissions
        .filter((permission) => getReturnState(permission) === 'not_returned')
        .sort(
          (a, b) =>
            new Date(b.scannedAt || b.createdAt).getTime() -
            new Date(a.scannedAt || a.createdAt).getTime(),
        ),
    [scannedPermissions],
  );
  const recentActivity = scannedPermissions
    .filter((permission) => getReturnState(permission) === 'returned')
    .slice(0, 5);

  const renderReturnBadge = (permission: Permission) => {
    const isReturned = getReturnState(permission) === 'returned';
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
        isReturned
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          : 'bg-amber-50 text-amber-700 border border-amber-100'
      }`}>
        {isReturned ? 'Sudah Kembali' : 'Belum Kembali'}
      </span>
    );
  };

  const renderReturnAction = (permission: ScannedPermission, layout: 'table' | 'card' = 'table') => {
    const isReturned = getReturnState(permission) === 'returned';
    const displayStatus = getDisplayStatus(permission);
    const isUpdating = updatingId === permission.id;
    const canMarkReturned = !isReturned && displayStatus === PermissionStatus.APPROVED_PIKET;

    if (isReturned) {
      return (
        <div className={layout === 'card' ? 'flex flex-col gap-2' : 'flex items-center gap-2'}>
          <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
            <CheckCircle size={14} />
            Sudah Kembali
          </span>
          <button
            onClick={() => handleMarkNotReturned(permission.id)}
            disabled={isUpdating}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-amber-300 hover:text-amber-700 text-xs font-bold text-slate-500 transition-colors disabled:opacity-50"
          >
            {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
            Ubah ke Belum Kembali
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => handleMarkComplete(permission.id)}
        disabled={isUpdating || !canMarkReturned}
        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          layout === 'card' ? 'w-full' : 'min-w-[170px]'
        } bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20`}
      >
        {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
        {isUpdating ? 'Menyimpan...' : 'Tandai Sudah Kembali'}
      </button>
    );
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Scan QR Code</h1>
        <p className="page-subtitle">Validasi dokumen perizinan siswa di gerbang sekolah</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Scanner */}
        <div className="card-lg p-6 md:p-8">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ScanLine size={18} className="text-blue-500" />
            Scanner
          </h3>
          <QRScanner
            permissions={permissions}
            onScanned={handleScanned}
            onMarkComplete={handleMarkComplete}
          />
        </div>

        {/* Activity Log */}
        <div className="card-lg overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <History size={16} className="text-slate-400" />
            <h3 className="font-bold text-slate-800">Log Aktivitas</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {recentActivity.length > 0 ? (
              recentActivity.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={18} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{p.studentName}</p>
                    <p className="text-xs text-slate-400">{p.kelas} · Kembali {formatDateTime(p.actualReturnTime!)}</p>
                  </div>
                  <StatusBadge permission={p} />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <History size={32} className="opacity-20" />
                <p className="text-sm">Belum ada aktivitas hari ini</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {!loadingScans && notReturnedScans.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500" />
                Siswa Belum Kembali
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Klik kartu siswa untuk mencatat kepulangan langsung.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold">
              {notReturnedScans.length} perlu dicek
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {notReturnedScans.map((permission) => {
              const isUpdating = updatingId === permission.id;
              const displayStatus = getDisplayStatus(permission);
              const canMarkReturned = displayStatus === PermissionStatus.APPROVED_PIKET;

              return (
                <button
                  key={permission.id}
                  type="button"
                  onClick={() => handleMarkComplete(permission.id)}
                  disabled={isUpdating || !canMarkReturned}
                  className="group text-left rounded-2xl border border-amber-200 bg-amber-50/70 hover:bg-white hover:border-emerald-300 hover:shadow-md p-4 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  title="Tandai siswa sudah kembali"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {permission.studentName}
                      </p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {permission.kelas}
                      </p>
                    </div>
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-white text-amber-700 border border-amber-200 text-[10px] font-bold">
                      Belum
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                    {permission.reason}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Scan: {permission.scannedAt ? formatDateTime(permission.scannedAt) : '-'}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-emerald-700 group-hover:text-emerald-800">
                      {isUpdating ? 'Menyimpan...' : 'Tandai Sudah Kembali'}
                    </span>
                    {isUpdating ? (
                      <Loader2 size={16} className="animate-spin text-emerald-600" />
                    ) : (
                      <CheckCircle size={16} className="text-emerald-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div id="daftar-scan" className="card-lg overflow-hidden mt-8 scroll-mt-24">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <History size={16} className="text-blue-500" />
              Data Siswa Hasil Scan Hari Ini
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {scannedPermissions.length} hasil scan · {notReturnedCount} belum kembali · {returnedCount} sudah kembali
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari siswa, kelas, alasan..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 overflow-x-auto">
              {RETURN_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setReturnFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                    returnFilter === filter.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-white hover:text-slate-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {scanError && (
          <div className="m-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{scanError}</span>
            <button
              onClick={() => loadScannedPermissions()}
              className="ml-auto text-xs font-bold hover:underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Siswa', 'Keperluan', 'Waktu Scan', 'Status Izin', 'Status Kembali', 'Aksi'].map((header) => (
                  <th
                    key={header}
                    className={`px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${
                      header === 'Aksi' ? 'text-right' : ''
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loadingScans ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 size={28} className="animate-spin text-blue-500" />
                      <p className="text-sm font-semibold">Memuat data scan...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredScans.length > 0 ? (
                filteredScans.map((permission) => {
                  const displayStatus = getDisplayStatus(permission);
                  const isReturned = getReturnState(permission) === 'returned';
                  return (
                    <tr
                      key={permission.id}
                      className={`transition-colors ${
                        isReturned
                          ? 'hover:bg-slate-50/70'
                          : 'bg-amber-50/30 hover:bg-amber-50/60'
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-slate-800">{permission.studentName}</p>
                        <p className="text-xs text-slate-400 font-semibold">{permission.kelas}</p>
                      </td>
                      <td className="px-5 py-4 min-w-[220px]">
                        <span className="inline-flex px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
                          {CATEGORY_LABELS[permission.category || 'lainnya'] || 'Lainnya'}
                        </span>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2" title={permission.reason}>
                          {permission.reason}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Est. {formatEstimatedReturn(permission)}
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-xs font-semibold text-slate-600">
                          {permission.scannedAt ? formatDateTime(permission.scannedAt) : '-'}
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={displayStatus} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {renderReturnBadge(permission)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        {renderReturnAction(permission)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <History size={32} className="opacity-20" />
                      <p className="text-sm font-semibold">
                        {scannedPermissions.length === 0
                          ? 'Belum ada siswa yang discan hari ini'
                          : 'Tidak ada data yang sesuai filter'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden">
          {loadingScans ? (
            <div className="px-5 py-14 text-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 size={28} className="animate-spin text-blue-500" />
                <p className="text-sm font-semibold">Memuat data scan...</p>
              </div>
            </div>
          ) : filteredScans.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredScans.map((permission) => {
                const isReturned = getReturnState(permission) === 'returned';
                const displayStatus = getDisplayStatus(permission);

                return (
                  <div
                    key={permission.id}
                    className={`p-4 space-y-4 ${
                      isReturned ? 'bg-white' : 'bg-amber-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {permission.studentName}
                        </p>
                        <p className="text-xs text-slate-400 font-semibold">
                          {permission.kelas}
                        </p>
                      </div>
                      {renderReturnBadge(permission)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Keperluan
                        </p>
                        <p className="font-semibold text-slate-700 mt-1">
                          {CATEGORY_LABELS[permission.category || 'lainnya'] || 'Lainnya'}
                        </p>
                        <p className="text-slate-500 mt-1 line-clamp-2">
                          {permission.reason}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Scan
                        </p>
                        <p className="font-semibold text-slate-700 mt-1">
                          {permission.scannedAt ? formatDateTime(permission.scannedAt) : '-'}
                        </p>
                        <p className="text-slate-400 mt-1">
                          Est. {formatEstimatedReturn(permission)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <StatusBadge status={displayStatus} />
                      <div className="flex-1 flex justify-end">
                        {renderReturnAction(permission, 'card')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-16 text-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <History size={32} className="opacity-20" />
                <p className="text-sm font-semibold">
                  {scannedPermissions.length === 0
                    ? 'Belum ada siswa yang discan hari ini'
                    : 'Tidak ada data yang sesuai filter'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
