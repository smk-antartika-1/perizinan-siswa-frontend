"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, XCircle, ScanLine, QrCode, Camera, Loader2, AlertTriangle, WifiOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Permission, PermissionStatus } from "@/lib/types";
import { getDisplayStatus } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";

const qrTokenCache = new Map<string, { qrUrl: string; expiresAt: string }>();
const qrTokenRequests = new Map<string, Promise<{ qrUrl: string; expiresAt: string }>>();

function hasUsableCachedQr(entry: { expiresAt: string }) {
  return new Date(entry.expiresAt).getTime() - Date.now() > 30_000;
}

export function SecureQRCode({
  permission,
  size = 180,
  includeMargin = false,
}: {
  permission: Permission;
  size?: number;
  includeMargin?: boolean;
}) {
  const { generateQr } = useAppContext();
  const [qrUrl, setQrUrl] = useState(() => {
    const cached = qrTokenCache.get(permission.id);
    return cached && hasUsableCachedQr(cached) ? cached.qrUrl : "";
  });
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadQr() {
      if (getDisplayStatus(permission) !== PermissionStatus.APPROVED_PIKET) {
        setQrUrl("");
        return;
      }

      const cached = qrTokenCache.get(permission.id);
      if (cached && hasUsableCachedQr(cached)) {
        setQrUrl(cached.qrUrl);
        return;
      }

      try {
        setError("");
        let request = qrTokenRequests.get(permission.id);
        if (!request) {
          request = generateQr(permission.id);
          qrTokenRequests.set(permission.id, request);
        }
        const result = await request;
        qrTokenCache.set(permission.id, result);
        if (!cancelled) setQrUrl(result.qrUrl);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "QR tidak dapat dibuat");
      } finally {
        qrTokenRequests.delete(permission.id);
      }
    }

    loadQr();
    return () => {
      cancelled = true;
    };
  }, [generateQr, permission]);

  if (error || !qrUrl) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-400"
        style={{ width: size, height: size }}
      >
        {error || "Memuat QR..."}
      </div>
    );
  }

  return <QRCodeSVG value={qrUrl} size={size} level="H" includeMargin={includeMargin} />;
}

// ============================================================
// QR Generator - generates QR from direct image URL
// ============================================================
export function QRGenerator({ permission }: { permission: Permission }) {
  if (getDisplayStatus(permission) !== PermissionStatus.APPROVED_PIKET)
    return null;

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl border border-slate-200">
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <SecureQRCode permission={permission} size={180} includeMargin />
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
  onScanned: (qrValue: string) => Promise<Permission | null>;
  onMarkComplete: (id: string) => void | Promise<void>;
}

type ScannerState =
  | "idle"
  | "requesting_permission"
  | "initializing"
  | "scanning"
  | "success"
  | "invalid";

export function QRScanner({
  permissions,
  onScanned,
  onMarkComplete,
}: QRScannerProps) {
  const { generateQr } = useAppContext();
  const [scannerState, setScannerState] = useState<ScannerState>("idle");
  const [scannedPermission, setScannedPermission] = useState<Permission | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrRef = useRef<any>(null);
  // Div yang digunakan html5-qrcode untuk inject video — HARUS punya explicit size
  const scannerContainerId = "qr-reader-container";

  const stopCamera = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        const scanner = html5QrRef.current;
        if (scanner.isScanning) {
          await scanner.stop();
        }
        await scanner.clear();
      } catch {
        // ignore cleanup errors
      }
      html5QrRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScannedPermission(null);

    // Cek HTTPS / localhost — kamera hanya bisa di secure context
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setCameraError(
        "Kamera hanya tersedia di HTTPS. Pastikan aplikasi diakses via https://",
      );
      return;
    }

    // Cek ketersediaan getUserMedia
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError(
        "Browser ini tidak mendukung akses kamera. Gunakan Chrome atau Safari terbaru.",
      );
      return;
    }

    setScannerState("requesting_permission");

    // Minta izin kamera terlebih dahulu secara eksplisit
    // Ini penting di iOS Safari agar permission prompt muncul sebelum html5-qrcode diinisialisasi
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      // Izin berhasil — hentikan stream sementara, html5-qrcode akan memulai ulang
      stream.getTracks().forEach((track) => track.stop());
    } catch (permErr: any) {
      const errName = permErr?.name || "";
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        setCameraError(
          "Izin kamera ditolak. Buka Pengaturan browser dan izinkan akses kamera untuk situs ini.",
        );
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        setCameraError("Kamera tidak ditemukan pada perangkat ini.");
      } else {
        setCameraError(
          "Tidak dapat mengakses kamera: " + (permErr?.message || errName || "Unknown error"),
        );
      }
      setScannerState("idle");
      return;
    }

    setScannerState("initializing");

    // Tunggu DOM terupdate dan elemen scanner benar-benar visible
    // 300ms lebih aman untuk mobile browser (Safari iOS butuh lebih lama)
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Pastikan elemen target ada di DOM
    const targetEl = document.getElementById(scannerContainerId);
    if (!targetEl) {
      setCameraError("Gagal menginisialisasi scanner. Coba muat ulang halaman.");
      setScannerState("idle");
      return;
    }

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      // Selalu buat instance baru untuk menghindari state kotor
      if (html5QrRef.current) {
        await stopCamera();
      }

      const scanner = new Html5Qrcode(scannerContainerId, {
        verbose: false,
      });
      html5QrRef.current = scanner;

      const onScanSuccess = async (decodedText: string) => {
        await stopCamera();
        setScannerState("idle");
        const perm = await onScanned(decodedText);
        if (perm) {
          setScannedPermission(perm);
          setScannerState("success");
        } else {
          setScannerState("invalid");
        }
      };

      const onScanFailure = () => {
        // Frame tidak mengandung QR — diabaikan
      };

      const config = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.75);
          return {
            width: qrboxSize,
            height: qrboxSize,
          };
        },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: { ideal: "environment" },
        },
      };

      try {
        // Coba kamera belakang terlebih dahulu
        await scanner.start(
          { facingMode: { ideal: "environment" } },
          config,
          onScanSuccess,
          onScanFailure,
        );
        setScannerState("scanning");
      } catch (envErr) {
        console.warn("Kamera belakang gagal, mencoba kamera depan...", envErr);
        // Fallback: buat instance baru untuk kamera depan
        try {
          await scanner.stop().catch(() => {});
          try { scanner.clear(); } catch { /* ignore */ }
          html5QrRef.current = null;

          const scanner2 = new Html5Qrcode(scannerContainerId, { verbose: false });
          html5QrRef.current = scanner2;
          await scanner2.start(
            { facingMode: "user" },
            config,
            onScanSuccess,
            onScanFailure,
          );
          setScannerState("scanning");
        } catch (userErr: any) {
          throw userErr;
        }
      }
    } catch (err: any) {
      console.error("Camera start failed:", err);
      const errName = err?.name || "";
      let msg = "Tidak dapat memulai kamera. ";
      if (errName === "NotAllowedError") {
        msg = "Izin kamera ditolak. Buka pengaturan browser dan izinkan akses kamera.";
      } else if (errName === "NotReadableError" || errName === "TrackStartError") {
        msg = "Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain dan coba lagi.";
      } else {
        msg += err?.message || "Pastikan izin kamera sudah diberikan.";
      }
      setCameraError(msg);
      setScannerState("idle");
    }
  }, [onScanned, stopCamera]);

  const handleStop = useCallback(async () => {
    await stopCamera();
    setScannerState("idle");
    setCameraError(null);
  }, [stopCamera]);

  // Simulate scan (fallback demo)
  const simulateScan = useCallback(() => {
    setScannerState("scanning");
    setScannedPermission(null);

    setTimeout(async () => {
      const active = permissions.find(
        (p) => getDisplayStatus(p) === PermissionStatus.APPROVED_PIKET,
      );
      if (active) {
        try {
          const { qrUrl } = await generateQr(active.id);
          const scanned = await onScanned(qrUrl);
          setScannedPermission(scanned);
          setScannerState(scanned ? "success" : "invalid");
        } catch {
          setScannerState("invalid");
        }
      } else {
        setScannerState("invalid");
      }
    }, 2000);
  }, [generateQr, onScanned, permissions]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleMarkComplete = () => {
    if (scannedPermission) {
      onMarkComplete(scannedPermission.id);
      setScannerState("idle");
      setScannedPermission(null);
    }
  };

  const isScanning = scannerState === "scanning";
  const isLoading = scannerState === "requesting_permission" || scannerState === "initializing";
  const isDone = scannerState === "success" || scannerState === "invalid";

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
  }[isDone ? scannerState as "success" | "invalid" : "idle"];

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center gap-6">
      {/* Corner decoration frame — hanya dekorasi, TIDAK membungkus scanner */}
      <div className="relative w-72">
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl z-10 pointer-events-none" />

        {/* Scanner container — html5-qrcode akan inject video di sini */}
        {/* PENTING: elemen ini HARUS selalu ada di DOM saat scanner aktif.
            Kita pakai visibility+height untuk hide/show, bukan conditional render atau display:none */}
        <div
          id={scannerContainerId}
          style={{
            width: "288px",
            height: isScanning || isLoading ? "288px" : "0px",
            overflow: "hidden",
            borderRadius: "16px",
            transition: "height 0.3s ease",
          }}
        />

        {/* State overlay — muncul saat tidak sedang scan */}
        {!isScanning && (
          <div
            className={`w-72 h-72 rounded-2xl border-2 ${resultConfig.bg} flex items-center justify-center`}
            style={{ marginTop: isLoading ? "8px" : "0" }}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 p-6 text-center"
                >
                  <Loader2 size={40} className="animate-spin text-blue-500" />
                  <p className="text-sm font-semibold text-slate-600">
                    {scannerState === "requesting_permission"
                      ? "Meminta izin kamera..."
                      : "Menginisialisasi kamera..."}
                  </p>
                  <p className="text-xs text-slate-400">
                    {scannerState === "requesting_permission"
                      ? "Ketuk 'Izinkan' saat browser meminta akses kamera"
                      : "Mohon tunggu sebentar..."}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3 p-6 text-center"
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
        )}
      </div>

      {/* Error message */}
      {cameraError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700"
        >
          {cameraError.includes("HTTPS") || cameraError.includes("https") ? (
            <WifiOff size={16} className="flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          )}
          <p className="text-xs font-medium leading-relaxed">{cameraError}</p>
        </motion.div>
      )}

      {/* Buttons */}
      <div className="w-full space-y-3">
        {isScanning ? (
          <button
            onClick={handleStop}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-700 text-white font-bold rounded-2xl hover:bg-slate-600 transition-colors text-base"
          >
            <XCircle size={20} />
            Berhenti Scan
          </button>
        ) : (
          <button
            onClick={startCamera}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors shadow-xl shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed text-base"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Camera size={22} />
            )}
            {isLoading ? "Memuat Kamera..." : "Scan dengan Kamera"}
          </button>
        )}

        {!isScanning && (
          <button
            onClick={simulateScan}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-semibold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            <ScanLine size={18} />
            Simulasi Scan (Demo)
          </button>
        )}
      </div>

      {scannerState === "success" && scannedPermission && (
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
