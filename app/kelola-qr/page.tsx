'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  QrCode, Search, Printer, CheckCircle, RefreshCw, 
  ExternalLink, Calendar, Clock, AlertTriangle, ShieldCheck, UserCheck 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import AppShell from '@/components/layout/AppShell';
import { useAppContext } from '@/context/AppContext';
import { PermissionStatus, UserRole } from '@/lib/types';
import { formatDate, formatTime, formatDateTime, generateQRValue } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import StatusBadge from '@/components/ui/StatusBadge';

export default function KelolaQRPage() {
  const { canAccess } = useAuth();
  const { permissions, updatePermission, viewStudent, users, showToast } = useAppContext();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [selectedPermissionToPrint, setSelectedPermissionToPrint] = useState<any>(null);

  if (!canAccess([UserRole.GURU_PIKET, UserRole.ADMIN])) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <AlertTriangle size={48} className="text-red-500 opacity-80 animate-bounce" />
          <h2 className="text-lg font-bold text-slate-800">Akses Ditolak</h2>
          <p className="text-sm">Hanya Guru Piket dan Admin yang memiliki akses ke halaman operasional cetak QR ini.</p>
        </div>
      </AppShell>
    );
  }

  // Filter permissions that have been approved by Piket (meaning QR is active or completed)
  const qrPermissions = permissions.filter(p => 
    p.status === PermissionStatus.APPROVED_PIKET || p.status === PermissionStatus.COMPLETED
  );

  const filteredPermissions = qrPermissions.filter(p => {
    const matchesSearch = 
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.kelas.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const activeQRCount = qrPermissions.filter(p => p.status === PermissionStatus.APPROVED_PIKET).length;
  const completedCount = qrPermissions.filter(p => p.status === PermissionStatus.COMPLETED).length;

  const handleToggleReturn = (perm: typeof permissions[0]) => {
    const nowStr = new Date().toISOString();
    const isCompleted = perm.status === PermissionStatus.COMPLETED;

    let nextStatus = isCompleted ? PermissionStatus.APPROVED_PIKET : PermissionStatus.COMPLETED;
    let auditAction = isCompleted ? 'Dibatalkan Absen Kepulangan' : 'Siswa Kembali ke Sekolah';
    let actualReturn = isCompleted ? undefined : nowStr;

    const newAudit = [
      ...(perm.auditLog || []),
      {
        id: `a-${Math.random().toString(36).substring(2, 9)}`,
        action: auditAction,
        actorName: 'Guru Piket',
        actorRole: UserRole.GURU_PIKET,
        timestamp: nowStr,
      }
    ];

    updatePermission(perm.id, {
      status: nextStatus,
      actualReturnTime: actualReturn,
      auditLog: newAudit,
    });

    showToast(
      isCompleted 
        ? `Absensi pulang siswa ${perm.studentName} berhasil dibatalkan.`
        : `Konfirmasi kepulangan ${perm.studentName} sukses dicatat.`, 
      'success'
    );
  };

  const handlePrint = (perm: typeof permissions[0]) => {
    setSelectedPermissionToPrint(perm);
    
    // Set timeout to ensure render state is applied inside DOM
    setTimeout(() => {
      const qrBox = document.getElementById(`print-qr-${perm.id}`);
      const qrHTML = qrBox ? qrBox.innerHTML : '';

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.write(`
          <html>
            <head>
              <title>Cetak QR - ${perm.id}</title>
              <style>
                body {
                  font-family: 'Courier New', Courier, monospace;
                  padding: 15px;
                  text-align: center;
                  color: #000;
                  background-color: #fff;
                }
                .ticket {
                  max-width: 280px;
                  margin: 0 auto;
                  border: 2px dashed #000;
                  padding: 12px;
                }
                .header {
                  font-size: 15px;
                  font-weight: bold;
                  border-bottom: 2px dashed #000;
                  padding-bottom: 8px;
                  margin-bottom: 8px;
                }
                .title {
                  font-size: 13px;
                  font-weight: bold;
                  margin-top: 8px;
                }
                .qr-box {
                  margin: 12px auto;
                  display: flex;
                  justify-content: center;
                }
                .info {
                  text-align: left;
                  font-size: 11px;
                  line-height: 1.4;
                  margin-top: 8px;
                  border-top: 1.5px dashed #000;
                  padding-top: 6px;
                }
                .footer {
                  margin-top: 12px;
                  font-size: 8px;
                  border-top: 2px dashed #000;
                  padding-top: 8px;
                }
              </style>
            </head>
            <body>
              <div class="ticket">
                <div class="header">
                  SMK ANTARTIKA 1 SIDOARJO<br/>
                  <span style="font-size:9px;">OPERASIONAL GURU PIKET</span>
                </div>
                <div class="title">TICKET ID: ${perm.id}</div>
                <div class="qr-box">
                  ${qrHTML}
                </div>
                <div class="info">
                  <strong>Siswa:</strong> ${perm.studentName}<br/>
                  <strong>Kelas:</strong> ${perm.kelas}<br/>
                  <strong>Alasan:</strong> "${perm.reason}"<br/>
                  <strong>Berangkat:</strong> ${formatDateTime(perm.departureTime)}<br/>
                  <strong>Est. Kembali:</strong> ${perm.category === 'sakit' ? 'Selesai KBM (Bebas)' : formatDateTime(perm.estimatedReturnTime)}<br/>
                  ${perm.nomorPolisi ? `<strong>No. Polisi:</strong> ${perm.nomorPolisi}<br/>` : ''}
                </div>
                <div class="footer">
                  Tunjukkan QR ini ke Security di gerbang.<br/>
                  Terima kasih atas kerja samanya.
                </div>
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() {
                    window.frameElement.remove();
                  }, 100);
                };
              </script>
            </body>
          </html>
        `);
        doc.close();
      }
    }, 100);
  };

  const handleOpenStudentModal = (name: string) => {
    const studentUser = users.find(u => u.name === name);
    const studentNis = studentUser?.nis || 'NIS-MOCK';
    viewStudent(studentNis);
  };

  return (
    <AppShell>
      {/* Hidden container for iframe printers */}
      {selectedPermissionToPrint && (
        <div className="hidden">
          <div id={`print-qr-${selectedPermissionToPrint.id}`}>
            <QRCodeSVG value={generateQRValue(selectedPermissionToPrint)} size={150} level="H" />
          </div>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Kelola QR Code Perizinan</h1>
        <p className="page-subtitle">Sistem khusus cetak, cetak ulang struk QR fisik, dan konfirmasi absen kepulangan siswa oleh Guru Piket</p>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <QrCode size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">QR Code Aktif</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{activeQRCount} <span className="text-xs font-semibold text-slate-400">Siswa di luar</span></h3>
          </div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Siswa Kembali</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{completedCount} <span className="text-xs font-semibold text-slate-400">Tepat waktu</span></h3>
          </div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total QR Cetak</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{qrPermissions.length} <span className="text-xs font-semibold text-slate-400">Lembar tiket</span></h3>
          </div>
        </div>
      </div>

      {/* Main operational table */}
      <div className="card p-0 border-slate-200 overflow-hidden">
        {/* Table Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama, kelas, atau ID tiket..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none font-medium focus:border-blue-500"
            >
              <option value="all">Semua QR</option>
              <option value={PermissionStatus.APPROVED_PIKET}>Izin Aktif (Siswa Di luar)</option>
              <option value={PermissionStatus.COMPLETED}>Sudah Kembali</option>
            </select>
          </div>
        </div>

        {/* Table layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['ID Tiket', 'Siswa', 'Kategori', 'Jam Keluar / Estimasi', 'No. Polisi', 'Status QR', 'Aksi Operasional'].map((h, i) => (
                  <th key={i} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPermissions.length > 0 ? (
                filteredPermissions.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* Ticket ID */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{p.id}</span>
                        <button
                          onClick={() => router.push(`/izin/${p.id}`)}
                          className="p-1 rounded bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          title="Buka Lembar Persetujuan"
                        >
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </td>

                    {/* Student Metadata */}
                    <td className="px-6 py-4">
                      <div>
                        <button
                          onClick={() => handleOpenStudentModal(p.studentName)}
                          className="text-xs font-bold text-slate-800 hover:text-blue-600 hover:underline transition-colors block text-left"
                        >
                          {p.studentName}
                        </button>
                        <span className="text-[10px] text-slate-400 font-semibold">{p.kelas}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                        p.category === 'sakit' ? 'bg-amber-50 border border-amber-100 text-amber-700' :
                        p.category === 'dispensasi' ? 'bg-purple-50 border border-purple-100 text-purple-700' :
                        p.category === 'keperluan' ? 'bg-blue-50 border border-blue-100 text-blue-700' :
                        'bg-slate-50 border border-slate-100 text-slate-500'
                      }`}>
                        {p.category || 'lainnya'}
                      </span>
                    </td>

                    {/* Departure / Est. Return */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                        <Clock size={11} className="text-slate-400" />
                        <span>{formatTime(p.departureTime)}</span>
                        <span className="text-slate-300 mx-0.5">—</span>
                        <span>{p.category === 'sakit' ? 'Selesai KBM' : formatTime(p.estimatedReturnTime)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                        <Calendar size={9} />
                        <span>{formatDate(p.departureTime)}</span>
                      </div>
                    </td>

                    {/* License Plate */}
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-slate-700">
                      {p.nomorPolisi ? (
                        <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md">
                          {p.nomorPolisi}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-sans font-normal italic">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status} />
                    </td>

                    {/* Actions Panel */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {/* Thermal Print Trigger */}
                        <button
                          onClick={() => handlePrint(p)}
                          className="p-2 bg-blue-50 hover:bg-blue-600 border border-blue-100 text-blue-650 hover:text-white rounded-xl transition-all shadow-sm flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase leading-none"
                          title="Cetak Tiket QR"
                        >
                          <Printer size={13} />
                          Cetak Struk
                        </button>

                        {/* Inline Return Checkbox */}
                        {p.category === 'sakit' ? (
                          <span className="text-[10px] text-slate-400 font-medium italic select-none">
                            Sakit (Bebas Absen)
                          </span>
                        ) : (
                          <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 transition-colors rounded-xl cursor-pointer text-[10px] font-bold text-slate-600 select-none shadow-sm">
                            <input
                              type="checkbox"
                              checked={p.status === PermissionStatus.COMPLETED}
                              onChange={() => handleToggleReturn(p)}
                              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-350 cursor-pointer"
                            />
                            <span>Kembali</span>
                          </label>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                        <QrCode size={28} className="opacity-30" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-slate-600 text-sm">Tidak ada QR Code ditemukan</p>
                        <p className="text-xs mt-1">Gunakan kata kunci atau filter lain untuk memverifikasi.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
