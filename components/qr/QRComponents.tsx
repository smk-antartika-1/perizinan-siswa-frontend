'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, ScanLine, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Permission, PermissionStatus } from '@/lib/types';
import { generateQRValue } from '@/lib/utils';

// ============================================================
// QR Generator
// ============================================================
export function QRGenerator({ permission }: { permission: Permission }) {
  if (permission.status !== PermissionStatus.APPROVED_PIKET) return null;

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl border border-slate-200">
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <QRCodeSVG
          value={generateQRValue(permission)}
          size={180}
          level="H"
          includeMargin
        />
      </div>
      <div className="text-center">
        <p className="font-bold text-slate-800">{permission.studentName}</p>
        <p className="text-sm text-slate-500">{permission.kelas}</p>
        <p className="font-mono text-xs text-blue-600 mt-1">{permission.id}</p>
      </div>
      <p className="text-xs text-slate-400 text-center">
        Tunjukkan kode ini kepada petugas security saat keluar/masuk sekolah
      </p>
    </div>
  );
}

// ============================================================
// QR Scanner (Simulated)
// ============================================================
interface QRScannerProps {
  permissions: Permission[];
  onScanned: (permission: Permission | null) => void;
  onMarkComplete: (id: string) => void;
}

export function QRScanner({ permissions, onScanned, onMarkComplete }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<'idle' | 'success' | 'invalid'>('idle');
  const [scannedPermission, setScannedPermission] = useState<Permission | null>(null);

  const simulateScan = () => {
    setScanning(true);
    setResult('idle');
    setScannedPermission(null);

    setTimeout(() => {
      const active = permissions.find(p => p.status === PermissionStatus.APPROVED_PIKET);
      if (active) {
        setScannedPermission(active);
        setResult('success');
        onScanned(active);
      } else {
        setResult('invalid');
        onScanned(null);
      }
      setScanning(false);
    }, 2000);
  };

  const handleMarkComplete = () => {
    if (scannedPermission) {
      onMarkComplete(scannedPermission.id);
      setResult('idle');
      setScannedPermission(null);
    }
  };

  const resultConfig = {
    success: { bg: 'bg-emerald-50 border-emerald-300', icon: CheckCircle, iconColor: 'text-emerald-500', text: 'QR Code Valid!', textColor: 'text-emerald-700' },
    invalid: { bg: 'bg-red-50 border-red-300', icon: XCircle, iconColor: 'text-red-500', text: 'QR Code Tidak Valid', textColor: 'text-red-700' },
    idle: { bg: 'bg-slate-50 border-slate-200', icon: QrCode, iconColor: 'text-slate-300', text: 'Siap Scan', textColor: 'text-slate-400' },
  }[result];

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center gap-6">
      {/* Scanner Frame */}
      <div className={`relative w-72 h-72 rounded-3xl border-2 ${resultConfig.bg} flex items-center justify-center overflow-hidden transition-all duration-500`}>
        {/* Corner decorations */}
        {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-7 h-7 border-blue-500 ${
            i === 0 ? 'border-t-4 border-l-4 rounded-tl-xl' :
            i === 1 ? 'border-t-4 border-r-4 rounded-tr-xl' :
            i === 2 ? 'border-b-4 border-l-4 rounded-bl-xl' :
            'border-b-4 border-r-4 rounded-br-xl'
          }`} />
        ))}

        <AnimatePresence mode="wait">
          {scanning ? (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-sm text-blue-600 font-medium">Memindai...</p>
              {/* Scanning line */}
              <motion.div
                animate={{ top: ['15%', '85%', '15%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute left-4 right-4 h-0.5 bg-blue-500/60 shadow-[0_0_8px_2px_rgba(99,102,241,0.4)]"
                style={{ position: 'absolute' }}
              />
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-3 p-6 text-center">
              <resultConfig.icon size={56} className={resultConfig.iconColor} />
              <p className={`font-bold text-sm ${resultConfig.textColor}`}>{resultConfig.text}</p>
              {scannedPermission && (
                <div className="bg-white/80 rounded-xl p-3 w-full">
                  <p className="font-semibold text-slate-800 text-sm">{scannedPermission.studentName}</p>
                  <p className="text-xs text-slate-500">{scannedPermission.kelas}</p>
                  <p className="font-mono text-xs text-blue-600">{scannedPermission.id}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Buttons */}
      <button
        onClick={simulateScan}
        disabled={scanning}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-xl shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-base"
      >
        <ScanLine size={22} />
        {scanning ? 'Memindai QR Code...' : 'Simulasi Scan QR'}
      </button>

      {result === 'success' && scannedPermission && (
        <button
          onClick={handleMarkComplete}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors"
        >
          <CheckCircle size={18} />
          Tandai Siswa Sudah Kembali
        </button>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Masuk</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" />Keluar</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" />Tidak Valid</div>
      </div>
    </div>
  );
}
