"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, XCircle, ScanLine, QrCode, Camera } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Permission, PermissionStatus } from "@/lib/types";
import { generateQRValue, getDisplayStatus } from "@/lib/utils";

// ============================================================
// QR Generator - generates QR from direct image URL
// ============================================================
export function QRGenerator({ permission }: { permission: Permission }) {
  if (getDisplayStatus(permission) !== PermissionStatus.APPROVED_PIKET)
    return null;

  const qrValue = generateQRValue(permission);

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl border border-slate-200">
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <QRCodeSVG value={qrValue} size={180} level="H" includeMargin />
      </div>
      <div className="text-center">
        <p className="font-bold text-slate-800">{permission.studentName}</p>
        <p className="text-sm text-slate-500">{permission.kelas}</p>
      </div>
      <p className="text-xs text-slate-400 text-center">
        Tunjukkan kode ini kepada petugas security saat keluar/masuk sekolah
      </p>
    </div>
  );
}

// ============================================================
// QR Scanner - uses device camera via html5-qrcode
// ============================================================
interface QRScannerProps {
  permissions: Permission[];
  onScanned: (permission: Permission | null) => void;
  onMarkComplete: (id: string) => void;
}

export function QRScanner({
  permissions,
  onScanned,
  onMarkComplete,
}: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<"idle" | "success" | "invalid">("idle");
  const [scannedPermission, setScannedPermission] = useState<Permission | null>(
    null,
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);

  const stopCamera = async () => {
    if (html5QrRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scanner = html5QrRef.current as any;
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        // ignore
      }
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setResult("idle");
    setScannedPermission(null);
    setScanning(true);

    // Safari/iOS strict check: navigator.mediaDevices is undefined on HTTP (non-localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        "Browser memblokir akses kamera. Pada iPhone/Safari, Anda WAJIB menggunakan HTTPS (atau localhost) untuk membuka kamera.",
      );
      setScanning(false);
      return;
    }

    // Wait for the next tick to ensure the DOM has updated and #qr-reader is visible
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scannerId = "qr-reader";
      const scanner = new Html5Qrcode(scannerId);
      html5QrRef.current = scanner;

      const onScanSuccess = (decodedText: string) => {
        const perm =
          permissions.find(
            (p) =>
              decodedText.includes(p.id) &&
              getDisplayStatus(p) === PermissionStatus.APPROVED_PIKET,
          ) || null;

        if (perm) {
          setScannedPermission(perm);
          setResult("success");
          onScanned(perm);
        } else {
          setResult("invalid");
          onScanned(null);
        }
        stopCamera();
      };

      const onScanFailure = () => {};

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          onScanSuccess,
          onScanFailure,
        );
      } catch (err1) {
        console.warn("Kamera belakang gagal, mencoba kamera depan...", err1);
        // Fallback to user camera if environment fails (e.g. on laptops)
        await scanner.start(
          { facingMode: "user" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          onScanSuccess,
          onScanFailure,
        );
      }
    } catch (err: any) {
      console.error("Camera start failed:", err);
      setCameraError(
        "Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser Anda. " + (err.message || ""),
      );
      setScanning(false);
    }
  };

  // Simulate scan (fallback when camera is not available)
  const simulateScan = () => {
    setScanning(true);
    setResult("idle");
    setScannedPermission(null);

    setTimeout(() => {
      const active = permissions.find(
        (p) => getDisplayStatus(p) === PermissionStatus.APPROVED_PIKET,
      );
      if (active) {
        setScannedPermission(active);
        setResult("success");
        onScanned(active);
      } else {
        setResult("invalid");
        onScanned(null);
      }
      setScanning(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkComplete = () => {
    if (scannedPermission) {
      onMarkComplete(scannedPermission.id);
      setResult("idle");
      setScannedPermission(null);
    }
  };

  const resultConfig = {
    success: {
      bg: "bg-emerald-50 border-emerald-300",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      text: "QR Code Valid",
      textColor: "text-emerald-700",
    },
    invalid: {
      bg: "bg-red-50 border-red-300",
      icon: XCircle,
      iconColor: "text-red-500",
      text: "QR Code Tidak Valid",
      textColor: "text-red-700",
    },
    idle: {
      bg: "bg-slate-50 border-slate-200",
      icon: QrCode,
      iconColor: "text-slate-300",
      text: "Siap Scan",
      textColor: "text-slate-400",
    },
  }[result];

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center gap-6">
      {/* Scanner Frame */}
      <div
        ref={scannerRef}
        className={`relative w-72 h-72 rounded-3xl border-2 ${resultConfig.bg} flex items-center justify-center overflow-hidden transition-all duration-500`}
      >
        {/* Corner decorations */}
        {[
          "top-2 left-2",
          "top-2 right-2",
          "bottom-2 left-2",
          "bottom-2 right-2",
        ].map((pos, i) => (
          <div
            key={i}
            className={`absolute ${pos} w-7 h-7 border-blue-500 ${
              i === 0
                ? "border-t-4 border-l-4 rounded-tl-xl"
                : i === 1
                  ? "border-t-4 border-r-4 rounded-tr-xl"
                  : i === 2
                    ? "border-b-4 border-l-4 rounded-bl-xl"
                    : "border-b-4 border-r-4 rounded-br-xl"
            }`}
          />
        ))}

        {/* Camera view */}
        <div
          id="qr-reader"
          className={`absolute inset-0 transition-opacity duration-300 ${scanning ? "opacity-100 z-layer-raised" : "opacity-0 -z-10"}`}
        />

        <AnimatePresence mode="wait">
          {!scanning && (
            <motion.div
              key="result"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3 p-6 text-center relative z-layer-raised"
            >
              <resultConfig.icon size={56} className={resultConfig.iconColor} />
              <p className={`font-bold text-sm ${resultConfig.textColor}`}>
                {resultConfig.text}
              </p>
              {scannedPermission && (
                <div className="bg-white/80 rounded-xl p-3 w-full">
                  <p className="font-semibold text-slate-800 text-sm">
                    {scannedPermission.studentName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {scannedPermission.kelas}
                  </p>
                  <p className="font-mono text-xs text-blue-600">
                    {scannedPermission.id}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {cameraError && (
        <p className="text-xs text-red-500 text-center">{cameraError}</p>
      )}

      {/* Buttons */}
      <div className="w-full space-y-3">
        <button
          onClick={startCamera}
          disabled={scanning}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-xl shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-base"
        >
          <Camera size={22} />
          {scanning ? "Memindai..." : "Scan dengan Kamera"}
        </button>

        <button
          onClick={simulateScan}
          disabled={scanning}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-semibold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
        >
          <ScanLine size={18} />
          Simulasi Scan (Demo)
        </button>
      </div>

      {result === "success" && scannedPermission && (
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
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Masuk
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Keluar
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Tidak Valid
        </div>
      </div>
    </div>
  );
}
