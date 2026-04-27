'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, QrCode } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { Permission, PermissionStatus, UserRole } from '@/lib/types';
import { formatDateTime, formatTime } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { generateQRValue } from '@/lib/utils';

interface PermissionCardProps {
  permission: Permission;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  userRole?: UserRole;
  showActions?: boolean;
}

export default function PermissionCard({
  permission: p,
  onApprove,
  onReject,
  userRole,
  showActions = false,
}: PermissionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);

  const canApprove =
    showActions &&
    ((userRole === UserRole.WALI_KELAS && p.status === PermissionStatus.PENDING) ||
      (userRole === UserRole.GURU_PIKET && p.status === PermissionStatus.APPROVED_WALI) ||
      (userRole === UserRole.ADMIN && (p.status === PermissionStatus.PENDING || p.status === PermissionStatus.APPROVED_WALI)));

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-200 hover:shadow-md transition-all"
      >
        {/* Card Header */}
        <div className="p-4 flex items-center justify-between gap-3">
          {/* Avatar + Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-lg flex-shrink-0">
              {p.studentName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate">{p.studentName}</p>
              <p className="text-xs text-slate-400">{p.kelas} · {formatDateTime(p.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={p.status} />
            {p.status === PermissionStatus.APPROVED_PIKET && (
              <button
                onClick={() => setQrOpen(true)}
                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                title="Lihat QR"
              >
                <QrCode size={16} />
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Reason preview */}
        <div className="px-4 pb-3">
          <p className="text-sm text-slate-600 line-clamp-2 italic">"{p.reason}"</p>
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
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jam Berangkat</p>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">{formatTime(p.departureTime)}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Est. Kembali</p>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">{formatTime(p.estimatedReturnTime)}</span>
                    </div>
                  </div>
                </div>

                {p.nomorPolisi && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">No. Polisi Kendaraan</p>
                    <p className="text-sm font-semibold text-slate-700 font-mono">{p.nomorPolisi}</p>
                  </div>
                )}

                {p.approvedByWaliName && (
                  <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-blue-500" />
                    <p className="text-xs text-blue-700">Disetujui Wali: <strong>{p.approvedByWaliName}</strong></p>
                  </div>
                )}
                {p.approvedByPiketName && (
                  <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <p className="text-xs text-emerald-700">Disetujui Piket: <strong>{p.approvedByPiketName}</strong></p>
                  </div>
                )}
                {p.rejectedReason && (
                  <div className="bg-red-50 rounded-xl p-3 flex items-center gap-2">
                    <XCircle size={14} className="text-red-500" />
                    <p className="text-xs text-red-700">Alasan penolakan: <strong>{p.rejectedReason}</strong></p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        {canApprove && (
          <div className="px-4 pb-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => setRejectOpen(true)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-600 hover:text-white transition-all"
            >
              <XCircle size={15} /> Tolak
            </button>
            <button
              onClick={() => onApprove?.(p.id)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              <CheckCircle2 size={15} /> Setujui
            </button>
          </div>
        )}
      </motion.div>

      {/* QR Modal */}
      <Modal isOpen={qrOpen} onClose={() => setQrOpen(false)} title="QR Code Perizinan" size="sm">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <QRCodeSVG value={generateQRValue(p)} size={200} />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-800">{p.studentName}</p>
            <p className="text-sm text-slate-500">{p.kelas} · {p.id}</p>
          </div>
          <p className="text-xs text-slate-400 text-center">Tunjukkan QR ini ke petugas security saat keluar/masuk sekolah</p>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="Tolak Pengajuan" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Masukkan alasan penolakan untuk <strong>{p.studentName}</strong>:</p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Contoh: Alasan tidak memenuhi syarat..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-400 focus:ring-4 focus:ring-red-400/10 outline-none resize-none text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setRejectOpen(false)} className="py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">Batal</button>
            <button
              onClick={() => { onReject?.(p.id); setRejectOpen(false); }}
              className="py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
            >
              Tolak Sekarang
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
