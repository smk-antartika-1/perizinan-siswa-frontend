"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Shield,
  FileText,
  CheckCircle2,
  AlertCircle,
  Printer,
  MessageSquare,
  History,
  Check,
  X,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import AppShell from "@/components/layout/AppShell";
import { useAppContext } from "@/context/AppContext";
import { PermissionStatus, UserRole, STATUS_CONFIG } from "@/lib/types";
import {
  formatDate,
  formatEstimatedReturn,
  formatEstimatedReturnDateTime,
  formatTime,
  formatDateTime,
  generateQRValue,
  getDisplayStatus,
} from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiRequest } from "@/lib/api";

export default function PermissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    permissions,
    updatePermission,
    addPermissionComment,
    refreshData,
    currentUser,
    viewStudent,
    users,
    showToast,
  } = useAppContext();

  const [commentText, setCommentText] = useState("");
  const [nomorPolisiInput, setNomorPolisiInput] = useState("");
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Find target permission
  const permission = permissions.find((p) => p.id === id);

  if (!permission) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <AlertCircle size={48} className="text-red-500 opacity-80" />
          <h2 className="text-lg font-bold text-slate-800">
            Detail Perizinan Tidak Ditemukan
          </h2>
          <p className="text-sm">
            Maaf, data perizinan tidak terdaftar di sistem.
          </p>
          <button onClick={() => router.back()} className="btn-secondary mt-2">
            <ChevronLeft size={16} /> Kembali
          </button>
        </div>
      </AppShell>
    );
  }

  // Find Student NIS for global modal
  const studentUser = users.find(
    (u) => u.id === permission.studentId || u.name === permission.studentName,
  );
  const studentNis = studentUser?.nis || "NIS-MOCK";

  // Format category badge
  const categoryLabels: Record<string, string> = {
    sakit: "Sakit (Rawat Jalan)",
    keperluan: "Keperluan Keluarga",
    dispensasi: "Dispensasi Sekolah",
    lainnya: "Keperluan Lainnya",
  };

  const categoryStyles: Record<string, string> = {
    sakit: "bg-amber-50 border border-amber-100 text-amber-700",
    dispensasi: "bg-purple-50 border border-purple-100 text-purple-700",
    keperluan: "bg-blue-50 border border-blue-100 text-blue-700",
    lainnya: "bg-slate-50 border border-slate-100 text-slate-500",
  };

  const handleApprove = async () => {
    if (!currentUser) return;
    try {
      if (permission.status === PermissionStatus.PENDING) {
        await apiRequest(`/api/v1/permissions/${permission.id}/wali-approve`, {
          method: "PATCH",
          body: JSON.stringify({ note: commentText || undefined }),
        });
      } else if (permission.status === PermissionStatus.APPROVED_WALI) {
        await apiRequest(`/api/v1/permissions/${permission.id}/piket-approve`, {
          method: "PATCH",
          body: JSON.stringify({
            note: commentText || undefined,
            nomorPolisi: nomorPolisiInput || permission.nomorPolisi,
          }),
        });
      }
      await refreshData();
      showToast("Perizinan berhasil disetujui.", "success");
      setCommentText("");
      setNomorPolisiInput("");
    } catch {
      showToast("Gagal menyetujui perizinan.", "error");
    }
  };

  const handleReject = async () => {
    if (!currentUser) return;
    if (!commentText.trim()) {
      showToast("Harap tulis alasan penolakan pada kolom catatan.", "error");
      return;
    }

    try {
      await apiRequest(`/api/v1/permissions/${permission.id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason: commentText }),
      });
      await refreshData();
      showToast("Perizinan telah ditolak.", "info");
      setCommentText("");
    } catch {
      showToast("Gagal menolak perizinan.", "error");
    }
  };

  const handleToggleReturn = () => {
    if (!currentUser) return;
    const canManageReturn =
      currentUser.role === UserRole.GURU_PIKET ||
      currentUser.role === UserRole.SECURITY ||
      currentUser.role === UserRole.WALI_KELAS ||
      currentUser.role === UserRole.ADMIN;
    if (!canManageReturn) {
      showToast("Kepulangan siswa hanya dapat dicatat oleh petugas sekolah.", "error");
      return;
    }

    const nowStr = new Date().toISOString();
    const isCompleted = permission.status === PermissionStatus.COMPLETED;

    let nextStatus = isCompleted
      ? PermissionStatus.APPROVED_PIKET
      : PermissionStatus.COMPLETED;
    let auditAction = isCompleted
      ? "Dibatalkan Absen Kepulangan"
      : "Siswa Kembali ke Sekolah";
    let actualReturn = isCompleted ? undefined : nowStr;

    const newAudit = [
      ...(permission.auditLog || []),
      {
        id: `a-${Math.random().toString(36).substring(2, 9)}`,
        action: auditAction,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        timestamp: nowStr,
      },
    ];

    updatePermission(permission.id, {
      status: nextStatus,
      actualReturnTime: actualReturn,
      auditLog: newAudit,
    });

    showToast(
      isCompleted
        ? `Konfirmasi kepulangan untuk ${permission.studentName} dibatalkan.`
        : `${permission.studentName} telah dicatat kembali di sekolah.`,
      "success",
    );
  };

  const handlePrint = () => {
    // Print window using clean CSS overrides
    const printContent = printAreaRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (!printContent) return;

    // Create an iframe to print cleanly without messing nextjs state
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.write(`
        <html>
          <head>
            <title>Cetak Tiket QR Perizinan - ${permission.studentName}</title>
            <style>
              body {
                font-family: 'Courier New', Courier, monospace;
                padding: 20px;
                text-align: center;
                color: #000;
                background-color: #fff;
              }
              .ticket {
                max-width: 300px;
                margin: 0 auto;
                border: 2px dashed #000;
                padding: 15px;
              }
              .header {
                font-size: 16px;
                font-weight: bold;
                border-bottom: 2px dashed #000;
                padding-bottom: 10px;
                margin-bottom: 10px;
              }
              .title {
                font-size: 14px;
                font-weight: bold;
                margin-top: 10px;
              }
              .qr-box {
                margin: 15px auto;
                display: flex;
                justify-content: center;
              }
              .info {
                text-align: left;
                font-size: 11px;
                line-height: 1.4;
                margin-top: 10px;
                border-top: 1.5px dashed #000;
                padding-top: 8px;
              }
              .footer {
                margin-top: 15px;
                font-size: 9px;
                border-top: 2px dashed #000;
                padding-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                SMK ANTARTIKA 1 SIDOARJO<br/>
                <span style="font-size:10px;">TIKET IZIN KELUAR DIGITAL</span>
              </div>
              <div class="title">TIKET PERIZINAN</div>
              <div class="qr-box">
                ${printAreaRef.current.querySelector(".qr-container")?.innerHTML || ""}
              </div>
              <div class="info">
                <strong>Nama:</strong> ${permission.studentName}<br/>
                <strong>Kelas:</strong> ${permission.kelas}<br/>
                <strong>Kategori:</strong> ${categoryLabels[permission.category || "lainnya"]}<br/>
                <strong>Alasan:</strong> "${permission.reason}"<br/>
                <strong>Berangkat:</strong> ${formatDateTime(permission.departureTime)}<br/>
                <strong>Estimasi Kembali:</strong> ${formatEstimatedReturnDateTime(permission)}<br/>
                ${permission.nomorPolisi ? `<strong>No. Polisi:</strong> ${permission.nomorPolisi}<br/>` : ""}
                <strong>Pemberi Izin:</strong> ${permission.approvedByPiketName || "Guru Piket"}<br/>
              </div>
              <div class="footer">
                Tunjukkan struk QR ini ke petugas Security / Gerbang saat berangkat dan kembali.<br/>
                Semoga selamat sampai tujuan!
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
  };

  const displayStatus = getDisplayStatus(permission);

  // Stepper Visual Configuration
  const steps = [
    { label: "Diajukan", desc: "Izin diajukan siswa", done: true },
    {
      label: permission.approvedByWaliName
        ? `Wali Kelas (${permission.approvedByWaliName.split(" ")[0]})`
        : "Wali Kelas",
      desc: permission.approvedByWaliName
        ? `Disetujui: ${permission.approvedByWaliName}`
        : "Menunggu Wali Kelas",
      done:
        permission.status !== PermissionStatus.PENDING &&
        permission.status !== PermissionStatus.REJECTED,
      active: permission.status === PermissionStatus.PENDING,
      rejected:
        permission.status === PermissionStatus.REJECTED &&
        !permission.approvedByWaliId,
      timestamp: permission.approvedByWaliId
        ? permission.auditLog?.find((a) => a.action.includes("Wali"))?.timestamp
        : null,
    },
    {
      label: permission.approvedByPiketName
        ? `Guru Piket (${permission.approvedByPiketName.split(" ")[0]})`
        : "Guru Piket / QR",
      desc: permission.approvedByPiketName
        ? `Dicetak: ${permission.approvedByPiketName}`
        : "Menunggu Guru Piket",
      done:
        displayStatus === PermissionStatus.APPROVED_PIKET ||
        displayStatus === PermissionStatus.EXPIRED ||
        displayStatus === PermissionStatus.COMPLETED,
      active: permission.status === PermissionStatus.APPROVED_WALI,
      rejected:
        permission.status === PermissionStatus.REJECTED &&
        !!permission.approvedByWaliId,
      timestamp: permission.approvedByPiketId
        ? permission.auditLog?.find((a) => a.action.includes("Piket"))
            ?.timestamp
        : null,
    },
    {
      label: "Kembali",
      desc:
        permission.category === "sakit"
          ? "Sakit (Bebas Kepulangan)"
          : permission.actualReturnTime
            ? `Tiba: ${formatTime(permission.actualReturnTime)}`
            : "Siswa Belum Kembali",
      done:
        displayStatus === PermissionStatus.COMPLETED ||
        permission.category === "sakit",
      active:
        (displayStatus === PermissionStatus.APPROVED_PIKET ||
          displayStatus === PermissionStatus.EXPIRED) &&
        permission.category !== "sakit",
      isSakit: permission.category === "sakit",
      timestamp: permission.actualReturnTime,
    },
  ];

  // Logic to determine if user can approve
  const canApprove = () => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    if (
      permission.status === PermissionStatus.PENDING &&
      currentUser.role === UserRole.WALI_KELAS
    )
      return true;
    if (
      permission.status === PermissionStatus.APPROVED_WALI &&
      currentUser.role === UserRole.GURU_PIKET
    )
      return true;
    return false;
  };

  const canPrintTicket =
    currentUser &&
    (currentUser.role === UserRole.GURU_PIKET ||
      currentUser.role === UserRole.SECURITY ||
      currentUser.role === UserRole.ADMIN);

  const canManageReturn =
    currentUser &&
    (currentUser.role === UserRole.GURU_PIKET ||
      currentUser.role === UserRole.SECURITY ||
      currentUser.role === UserRole.WALI_KELAS ||
      currentUser.role === UserRole.ADMIN);

  return (
    <AppShell>
      {/* Hidden Print Container specifically targeted by Print CSS / JS */}
      <div ref={printAreaRef} className="hidden">
        <div className="qr-container">
          <QRCodeSVG value={generateQRValue(permission)} size={160} level="H" />
        </div>
      </div>

      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider hover:text-blue-600 transition-colors mb-2"
          >
            <ChevronLeft size={14} /> Kembali ke halaman sebelumnya
          </button>
          <div className="flex items-center gap-3">
            <h1 className="page-title">Detail Perizinan</h1>
            <StatusBadge permission={permission} />
          </div>
        </div>

        {/* Guru Piket & Admin Actions */}
        {(canPrintTicket || canManageReturn) && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Show Print Ticket button if QR is issued */}
            {canPrintTicket && (displayStatus === PermissionStatus.APPROVED_PIKET ||
              displayStatus === PermissionStatus.COMPLETED) && (
              <button
                onClick={handlePrint}
                className="btn-primary py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20"
              >
                <Printer size={16} /> Cetak Struk QR (Thermal)
              </button>
            )}

            {/* Attendance Toggle Checkbox */}
            {permission.category === "sakit" ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-500 font-semibold text-xs cursor-not-allowed">
                <ShieldCheck size={14} /> Sakit (Tidak Wajib Kembali)
              </span>
            ) : (
              canManageReturn && (displayStatus === PermissionStatus.APPROVED_PIKET ||
                displayStatus === PermissionStatus.EXPIRED ||
                displayStatus === PermissionStatus.COMPLETED) && (
                <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors shadow-sm select-none">
                  <input
                    type="checkbox"
                    checked={permission.status === PermissionStatus.COMPLETED}
                    onChange={handleToggleReturn}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-350 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Sudah Kembali ke Sekolah
                  </span>
                </label>
              )
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Detail Info & Timeline */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card: Student Info */}
          <div className="card p-6 border-slate-200">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <FileText size={16} className="text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Informasi Pengajuan & Siswa
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Siswa Bersangkutan
                  </span>
                  <button
                    onClick={() => viewStudent(studentNis)}
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline text-left mt-0.5"
                  >
                    {permission.studentName}
                  </button>
                  <span className="text-xs text-slate-500 block">
                    NIS: {studentNis} | Kelas: {permission.kelas}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Kategori Keperluan
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider mt-1 ${categoryStyles[permission.category || "lainnya"]}`}
                  >
                    {categoryLabels[permission.category || "lainnya"]}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Alasan / Keterangan
                  </span>
                  <p className="text-xs font-medium text-slate-700 mt-1 italic">
                    "{permission.reason}"
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Waktu Berangkat
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-slate-600">
                    <Calendar size={13} className="text-slate-400" />
                    <span className="text-xs font-medium">
                      {formatDate(permission.departureTime)}
                    </span>
                    <Clock size={13} className="text-slate-400 ml-1" />
                    <span className="text-xs font-medium">
                      {formatTime(permission.departureTime)} WIB
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Estimasi Kembali
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-slate-600">
                    <Calendar size={13} className="text-slate-400" />
                    <span className="text-xs font-medium">
                      {permission.estimatedReturnTime
                        ? formatDate(permission.estimatedReturnTime)
                        : "Tidak Kembali"}
                    </span>
                    <Clock size={13} className="text-slate-400 ml-1" />
                    <span className="text-xs font-medium">
                      {formatEstimatedReturn(permission)}
                    </span>
                  </div>
                </div>

                {permission.nomorPolisi && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      No. Polisi Kendaraan
                    </span>
                    <span className="inline-block px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 mt-1">
                      {permission.nomorPolisi}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stepper Approval Timeline (Horizontal / Vertical Visual) */}
          <div className="card p-6 border-slate-200">
            <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
              <History size={16} className="text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Perkembangan Persetujuan
              </h3>
            </div>

            {/* Stepper visual */}
            <div className="relative pl-6 md:pl-0 md:flex md:items-start justify-between gap-6 space-y-6 md:space-y-0">
              {/* Vertical line for mobile, horizontal for desktop */}
              <div className="absolute left-2.5 top-0 bottom-4 w-0.5 bg-slate-200 md:hidden" />

              {steps.map((step, idx) => {
                const isStepRejected =
                  step.rejected ||
                  (permission.status === PermissionStatus.REJECTED &&
                    idx === 2 &&
                    !permission.approvedByWaliId);
                return (
                  <div
                    key={idx}
                    className="relative md:flex-1 flex md:flex-col items-start md:items-center text-left md:text-center group"
                  >
                    {/* Stepper Dot */}
                    <div className="flex items-center justify-center flex-shrink-0 z-10">
                      {isStepRejected ? (
                        <div className="w-6 h-6 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-md">
                          <X size={12} className="stroke-[3px]" />
                        </div>
                      ) : step.done ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-md shadow-emerald-500/10">
                          <Check size={12} className="stroke-[3px]" />
                        </div>
                      ) : step.active ? (
                        <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center text-blue-600 shadow-md shadow-blue-500/10 animate-pulse">
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                        </div>
                      ) : step.isSakit ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-500 shadow-sm">
                          <Check size={12} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-slate-400">
                          <span className="text-[10px] font-bold">
                            {idx + 1}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Connecting line for desktop */}
                    {idx < steps.length - 1 && (
                      <div
                        className={`hidden md:block absolute top-3 left-[calc(50%+12px)] right-[calc(-50%+12px)] h-0.5 transition-colors ${
                          steps[idx + 1].done ||
                          (steps[idx + 1].isSakit && step.done)
                            ? "bg-emerald-500"
                            : "bg-slate-200"
                        }`}
                      />
                    )}

                    {/* Stepper Labels */}
                    <div className="ml-4 md:ml-0 md:mt-3 flex-1">
                      <p
                        className={`text-xs font-bold leading-tight ${
                          isStepRejected
                            ? "text-red-600"
                            : step.done
                              ? "text-slate-800"
                              : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {step.desc}
                      </p>
                      {step.timestamp && (
                        <p className="text-[9px] text-slate-350 font-mono mt-1">
                          {formatDateTime(step.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="card p-6 border-slate-200">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <History size={16} className="text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Riwayat Aktivitas & Audit Trail
              </h3>
            </div>

            <div className="space-y-4">
              {permission.auditLog && permission.auditLog.length > 0 ? (
                permission.auditLog.map((log) => (
                  <div key={log.id} className="flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-bold text-slate-700">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDateTime(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-0.5">
                        Oleh: <strong>{log.actorName}</strong> ({log.actorRole})
                      </p>
                      {log.details && (
                        <p className="text-slate-600 mt-1 bg-slate-50 border border-slate-100 p-2 rounded-xl italic">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs italic">
                  Belum ada riwayat aktivitas yang tercatat
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Actions Form & Comments */}
        <div className="space-y-8">
          {/* Action Approval Panel */}
          {canApprove() && (
            <div className="card p-6 border-blue-200 bg-gradient-to-br from-white to-blue-50/20">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
                <Shield size={16} className="text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Formulir Tindakan Persetujuan
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sebagai <strong>{currentUser?.name}</strong> (
                  {currentUser?.role === UserRole.WALI_KELAS
                    ? "Wali Kelas"
                    : "Guru Piket"}
                  ), Anda berhak menindaklanjuti pengajuan perizinan ini.
                </p>

                {/* Additional inputs based on role */}
                {permission.status === PermissionStatus.APPROVED_WALI &&
                  currentUser?.role === UserRole.GURU_PIKET && (
                    <div>
                      <label className="label text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        No. Polisi Kendaraan (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: L 1234 ABC"
                        value={nomorPolisiInput}
                        onChange={(e) =>
                          setNomorPolisiInput(e.target.value.toUpperCase())
                        }
                        className="input py-2 text-xs font-mono"
                      />
                    </div>
                  )}

                {/* Comments Box */}
                <div>
                  <label className="label text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Catatan Tambahan / Alasan
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      permission.status === PermissionStatus.PENDING
                        ? "Tulis catatan persetujuan atau alasan penolakan..."
                        : "Masukkan catatan (opsional)..."
                    }
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="input py-2 text-xs resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleReject}
                    className="btn-danger w-full justify-center text-xs py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 bg-white"
                  >
                    <X size={14} /> Tolak Izin
                  </button>
                  <button
                    onClick={handleApprove}
                    className="btn-primary w-full justify-center text-xs py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 text-white"
                  >
                    <Check size={14} /> Setujui Izin
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Preview Card (If QR issued) */}
          {(displayStatus === PermissionStatus.APPROVED_PIKET ||
            displayStatus === PermissionStatus.EXPIRED ||
            displayStatus === PermissionStatus.COMPLETED) && (
            <div className="card p-6 border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-200">
                <Printer size={16} className="text-slate-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  E-Ticket QR Perizinan
                </h3>
              </div>

              <div className="flex flex-col items-center p-4 bg-white border border-slate-200 rounded-3xl shadow-sm text-center">
                <p className="font-mono text-xs font-bold text-slate-400">
                  TIKET PERIZINAN
                </p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 my-4">
                  <QRCodeSVG
                    value={generateQRValue(permission)}
                    size={140}
                    level="H"
                  />
                </div>

                <h4 className="font-bold text-slate-800 text-sm">
                  {permission.studentName}
                </h4>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  {permission.kelas}
                </p>
                <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider mt-3 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
                  {displayStatus === PermissionStatus.COMPLETED ||
                  displayStatus === PermissionStatus.EXPIRED
                    ? "Tiket Expired (Selesai)"
                    : "Tiket Aktif (Scan Gate)"}
                </p>

                <button
                  onClick={handlePrint}
                  className="btn-secondary w-full justify-center text-xs py-2.5 rounded-xl mt-5"
                >
                  <Printer size={14} /> Print Tiket Fisik
                </button>
              </div>
            </div>
          )}

          {/* Discussion / Comment Logs */}
          <div className="card p-6 border-slate-200">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
              <MessageSquare size={16} className="text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Catatan & Diskusi ({permission.comments?.length || 0})
              </h3>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {permission.comments && permission.comments.length > 0 ? (
                permission.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-2xl"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                          {comment.userName.charAt(0)}
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">
                          {comment.userName}
                        </span>
                        <span className="text-[9px] text-blue-600 bg-blue-50 px-1 rounded font-medium">
                          {comment.userRole}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-350 font-mono">
                        {formatDateTime(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 italic">
                      "{comment.text}"
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs italic text-center py-6">
                  Belum ada catatan yang ditulis
                </p>
              )}
            </div>

            {/* Inline Comment Form */}
            {currentUser && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <textarea
                  rows={2}
                  placeholder="Tambahkan catatan baru..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="input py-2 text-xs resize-none"
                />
                <button
                  onClick={async () => {
                    if (!commentText.trim()) return;
                    try {
                      await addPermissionComment(permission.id, commentText);
                      showToast("Catatan berhasil ditambahkan.", "success");
                      setCommentText("");
                    } catch {
                      showToast("Gagal menambahkan catatan.", "error");
                    }
                  }}
                  className="btn-secondary py-1.5 px-3 text-xs ml-auto flex"
                  disabled={!commentText.trim()}
                >
                  Kirim Catatan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
