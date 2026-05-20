'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, 
  QrCode, Eye, AlertCircle, Calendar, ArrowRight, Zap 
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { Permission, PermissionStatus, UserRole } from '@/lib/types';
import { formatDateTime, formatTime, generateQRValue } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import Modal from '@/components/ui/Modal';
import { QRCodeSVG } from 'qrcode.react';

interface PermissionCardProps {
  permission: Permission;
  onApprove?: (id: string, comment?: string) => void;
  onReject?: (id: string, reason?: string) => void;
  onBypassApprove?: (id: string, urgencyReason: string) => void;
  userRole?: UserRole;
  showActions?: boolean;
}

export default function PermissionCard({
  permission: p,
  onApprove,
  onReject,
  onBypassApprove,
  userRole,
  showActions = false,
}: PermissionCardProps) {
  const router = useRouter();
  const { viewStudent, users } = useAppContext();
  
  const [expanded, setExpanded] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [bypassOpen, setBypassOpen] = useState(false);
  const [bypassReason, setBypassReason] = useState('');

  // Find Student NIS for global details modal
  const studentUser = users.find(u => u.name === p.studentName || u.id === p.studentId);
  const studentNis = studentUser?.nis || 'NIS-MOCK';

  const canApprove =
    showActions &&
    ((userRole === UserRole.WALI_KELAS && p.status === PermissionStatus.PENDING) ||
      (userRole === UserRole.GURU_PIKET && p.status === PermissionStatus.APPROVED_WALI) ||
      (userRole === UserRole.ADMIN && (p.status === PermissionStatus.PENDING || p.status === PermissionStatus.APPROVED_WALI)));

  // Stepper Mini config
  const isWaliDone = p.status !== PermissionStatus.PENDING && p.status !== PermissionStatus.REJECTED;
  const isPiketDone = p.status === PermissionStatus.APPROVED_PIKET || p.status === PermissionStatus.COMPLETED;
  const isReturnDone = p.status === PermissionStatus.COMPLETED || p.category === 'sakit';

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between"
      >
        <div>
          {/* Card Header */}
          <div className="p-4 flex items-center justify-between gap-3">
            {/* Avatar & Clickable Name */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div 
                onClick={() => viewStudent(studentNis)}
                className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-lg flex-shrink-0 cursor-pointer hover:bg-blue-200 transition-colors"
                title="Buka Profil Siswa"
              >
                {p.studentName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => viewStudent(studentNis)}
                  className="font-bold text-slate-800 text-sm hover:text-blue-600 hover:underline cursor-pointer text-left block truncate"
                  title="Buka Profil Siswa"
                >
                  {p.studentName}
                </button>
                <p className="text-xs text-slate-400 font-medium">{p.kelas} · {formatDateTime(p.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <StatusBadge status={p.status} />
              {p.status === PermissionStatus.APPROVED_PIKET && (
                <button
                  onClick={() => setQrOpen(true)}
                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  title="Lihat QR Code"
                >
                  <QrCode size={15} />
                </button>
              )}
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>
          </div>

          {/* Mini Stepper Timeline Progress Bar */}
          <div className="px-4 pb-3.5">
            <div className="flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-[10px] font-semibold">
              {/* Diajukan */}
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                <span className="text-slate-700">Diajukan</span>
              </div>
              
              <div className="flex-1 h-[2px] bg-slate-200">
                <div className={`h-full ${isWaliDone ? 'bg-emerald-500' : 'bg-slate-250'}`} />
              </div>

              {/* Wali Kelas */}
              <div 
                className="flex items-center gap-1 cursor-help"
                title={p.approvedByWaliName ? `Disetujui oleh Wali Kelas: ${p.approvedByWaliName}` : 'Menunggu persetujuan Wali Kelas'}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${
                  p.status === PermissionStatus.REJECTED && !p.approvedByWaliId ? 'bg-red-500' :
                  isWaliDone ? 'bg-emerald-500' : 'bg-slate-300'
                }`} />
                <span className={isWaliDone ? 'text-slate-700 font-bold' : 'text-slate-400'}>
                  {p.approvedByWaliName ? `Wali (${p.approvedByWaliName.split(' ')[0]})` : 'Wali'}
                </span>
              </div>

              <div className="flex-1 h-[2px] bg-slate-200">
                <div className={`h-full ${isPiketDone ? 'bg-emerald-500' : 'bg-slate-250'}`} />
              </div>

              {/* Guru Piket */}
              <div 
                className="flex items-center gap-1 cursor-help"
                title={p.approvedByPiketName ? `Disetujui oleh Guru Piket: ${p.approvedByPiketName}` : 'Menunggu persetujuan Guru Piket'}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${
                  p.status === PermissionStatus.REJECTED && p.approvedByWaliId ? 'bg-red-500' :
                  isPiketDone ? 'bg-emerald-500' : 'bg-slate-300'
                }`} />
                <span className={isPiketDone ? 'text-slate-700 font-bold' : 'text-slate-400'}>
                  {p.approvedByPiketName ? `Piket (${p.approvedByPiketName.split(' ')[0]})` : 'Piket'}
                </span>
              </div>

              <div className="flex-1 h-[2px] bg-slate-200">
                <div className={`h-full ${isReturnDone ? 'bg-emerald-500' : 'bg-slate-250'}`} />
              </div>

              {/* Kembali */}
              <div className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  isReturnDone ? 'bg-emerald-500' : 'bg-slate-300'
                }`} />
                <span className={isReturnDone ? 'text-slate-700' : 'text-slate-400'}>
                  {p.category === 'sakit' ? 'Sakit' : 'Kembali'}
                </span>
              </div>
            </div>
          </div>

          {/* Reason preview */}
          <div className="px-4 pb-4">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-[9px] mb-1">
                Kategori: <span className="text-blue-600">{p.category || 'lainnya'}</span>
              </p>
              <p className="text-xs text-slate-600 line-clamp-2 italic">"{p.reason}"</p>
            </div>
          </div>

          {/* Expanded Detail */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Jam Berangkat</p>
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-700">{formatTime(p.departureTime)}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Est. Kembali</p>
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-700">
                          {p.category === 'sakit' ? 'Bebas (Sakit)' : formatTime(p.estimatedReturnTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {p.nomorPolisi && (
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">No. Polisi Kendaraan</p>
                      <p className="text-xs font-mono font-bold text-slate-700">{p.nomorPolisi}</p>
                    </div>
                  )}

                  {p.approvedByWaliName && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2.5 flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-blue-500 flex-shrink-0" />
                      <p className="text-[10px] text-blue-700">Disetujui Wali Kelas: <strong>{p.approvedByWaliName}</strong></p>
                    </div>
                  )}
                  {p.approvedByPiketName && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2.5 flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                      <p className="text-[10px] text-emerald-700">Disetujui Guru Piket: <strong>{p.approvedByPiketName}</strong></p>
                    </div>
                  )}
                  {p.rejectedReason && (
                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-2.5 flex items-center gap-2">
                      <XCircle size={13} className="text-red-500 flex-shrink-0" />
                      <p className="text-[10px] text-red-700">Alasan Penolakan: <strong className="italic">"{p.rejectedReason}"</strong></p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Panel */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/40 space-y-3">
          
          {/* Notes input prior to action */}
          {canApprove && (
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Catatan Keputusan (Opsional)</label>
              <textarea
                placeholder="Tulis alasan keputusan Anda disini..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                rows={1}
                className="w-full text-xs input py-1.5 px-3 bg-white resize-none"
              />
            </div>
          )}

          <div className="flex gap-2 w-full flex-wrap">
            {/* View Details Redirect button (Universal CTA) */}
            <button
              onClick={() => router.push(`/izin/${p.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-600 transition-all shadow-sm select-none"
            >
              <Eye size={13} />
              Detail
            </button>

            {canApprove && (
              <>
                <button
                  onClick={() => {
                    if (!commentText.trim()) {
                      setRejectOpen(true);
                    } else {
                      onReject?.(p.id, commentText);
                      setCommentText('');
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all select-none"
                >
                  <XCircle size={13} />
                  Tolak
                </button>
                <button
                  onClick={() => {
                    onApprove?.(p.id, commentText);
                    setCommentText('');
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 select-none"
                >
                  <CheckCircle2 size={13} />
                  Setujui
                </button>
              </>
            )}

            {/* Bypass Button — only shown when onBypassApprove is provided and status is PENDING */}
            {onBypassApprove && showActions && p.status === PermissionStatus.PENDING && (
              <button
                onClick={() => { setBypassReason(''); setBypassOpen(true); }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-amber-400 bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-all shadow-sm select-none"
              >
                <Zap size={13} className="fill-amber-400" />
                Setujui Bypass (Darurat)
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* QR Code Modal preview */}
      <Modal isOpen={qrOpen} onClose={() => setQrOpen(false)} title="QR Code Tiket Siswa" size="sm">
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm">
            <QRCodeSVG value={generateQRValue(p)} size={180} level="H" />
          </div>
          <div className="text-center">
            <h4 className="font-bold text-slate-800 text-base">{p.studentName}</h4>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">{p.kelas} · ID: {p.id}</p>
          </div>
          <p className="text-xs text-slate-450 text-center leading-relaxed">
            Tiket QR perizinan aktif. Berikan struk QR fisik hasil cetak Guru Piket ke siswa atau gunakan lembar digital ini di pintu gerbang.
          </p>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="Konfirmasi Alasan Penolakan" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 text-xs text-red-700">
            <AlertCircle size={16} className="flex-shrink-0" />
            <p>Anda wajib memberikan alasan penolakan agar siswa memahami kendala pengajuan perizinan mereka.</p>
          </div>
          
          <textarea
            rows={3}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Tulis alasan penolakan, contoh: Dokumen/Surat Izin Orang Tua belum dilampirkan atau Alasan tidak mendesak..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/10 outline-none resize-none text-xs"
          />
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setRejectOpen(false)} 
              className="py-2.5 rounded-xl border border-slate-200 text-slate-650 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (!commentText.trim()) return;
                onReject?.(p.id, commentText);
                setRejectOpen(false);
                setCommentText('');
              }}
              disabled={!commentText.trim()}
              className="py-2.5 rounded-xl bg-red-600 disabled:opacity-50 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-md shadow-red-500/15"
            >
              Kirim &amp; Tolak Izin
            </button>
          </div>
        </div>
      </Modal>

      {/* Bypass Darurat Modal */}
      <Modal isOpen={bypassOpen} onClose={() => setBypassOpen(false)} title="⚡ Persetujuan Bypass Darurat" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-xs text-amber-800">
            <Zap size={16} className="flex-shrink-0 fill-amber-400 text-amber-600" />
            <div>
              <p className="font-bold mb-0.5">Tindakan ini melewati persetujuan Wali Kelas.</p>
              <p>Gunakan hanya untuk kondisi darurat mendesak. Alasan wajib dicatat dan akan tercatat di audit log perizinan.</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Alasan Urgensi / Darurat <span className="text-red-500">*</span></label>
            <textarea
              rows={3}
              value={bypassReason}
              onChange={e => setBypassReason(e.target.value)}
              placeholder="Contoh: Orang tua siswa dalam kondisi kritis, keperluan medis segera, dll..."
              className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none resize-none text-xs bg-amber-50/40"
              autoFocus
            />
            {bypassReason.trim().length === 0 && (
              <p className="text-[10px] text-red-500 font-semibold mt-1">Wajib diisi sebelum melanjutkan</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setBypassOpen(false)}
              className="py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (!bypassReason.trim()) return;
                onBypassApprove?.(p.id, bypassReason.trim());
                setBypassOpen(false);
                setBypassReason('');
              }}
              disabled={!bypassReason.trim()}
              className="py-2.5 rounded-xl bg-amber-500 disabled:opacity-50 text-white text-xs font-bold hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
            >
              <Zap size={12} className="fill-white" />
              Konfirmasi Bypass
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
