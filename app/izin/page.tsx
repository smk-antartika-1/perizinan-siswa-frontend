"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ClipboardList, Clock, Info, ChevronRight, Car, Loader2, AlertCircle } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useAppContext } from "@/context/AppContext";
import { PermissionStatus, UserRole } from "@/lib/types";

const MIN_REASON_LENGTH = 10;

function toTimeInputValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function buildEstimatedReturnTime(timeValue: string) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export default function IzinPage() {
  const { currentUser, canAccess } = useAuth();
  const { addPermission } = usePermissions();
  const { showToast } = useAppContext();
  const router = useRouter();

  const [reason, setReason] = useState("");
  const [category, setCategory] = useState<
    "sakit" | "keperluan" | "dispensasi" | "lainnya"
  >("keperluan");
  const [willNotReturn, setWillNotReturn] = useState(false);
  const [estimatedReturnTime, setEstimatedReturnTime] = useState(() =>
    toTimeInputValue(new Date(Date.now() + 2 * 3600000)),
  );
  const [nomorPolisi, setNomorPolisi] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeError, setTimeError] = useState("");
  const [submitError, setSubmitError] = useState("");

  if (!canAccess([UserRole.SISWA])) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
          <ClipboardList size={40} className="opacity-20" />
          <p className="font-medium">Anda tidak memiliki akses ke halaman ini</p>
        </div>
      </AppShell>
    );
  }

  const reasonTooShort = reason.trim().length > 0 && reason.trim().length < MIN_REASON_LENGTH;
  const isReasonValid = reason.trim().length >= MIN_REASON_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Inline time validation
    if (!willNotReturn) {
      const estimatedReturnDate = buildEstimatedReturnTime(estimatedReturnTime);
      if (estimatedReturnDate <= new Date()) {
        setTimeError("Estimasi kembali harus setelah jam sekarang.");
        return;
      }
    }
    setTimeError("");
    setSubmitError("");
    setLoading(true);

    try {
      const estimatedReturnDate = willNotReturn
        ? null
        : buildEstimatedReturnTime(estimatedReturnTime);

      await addPermission({
        studentId: currentUser.id,
        studentName: currentUser.name,
        kelas: currentUser.kelas || "",
        reason,
        departureTime: new Date().toISOString(),
        estimatedReturnTime: estimatedReturnDate
          ? estimatedReturnDate.toISOString()
          : null,
        status: PermissionStatus.PENDING,
        nomorPolisi: nomorPolisi || undefined,
        category,
        willNotReturn,
      });
      showToast("Pengajuan izin berhasil dikirim.", "success");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.message || "Pengajuan izin gagal. Coba beberapa saat lagi.";
      setSubmitError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const reasonPresets = [
    { label: "Keperluan Keluarga", category: "keperluan" as const },
    { label: "Sakit / Periksa Dokter", category: "sakit" as const },
    { label: "Urusan Administrasi", category: "keperluan" as const },
    { label: "Kompetisi / Lomba", category: "dispensasi" as const },
    { label: "Kegiatan Ekstrakurikuler", category: "dispensasi" as const },
  ];

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Ajukan Izin</h1>
        <p className="page-subtitle">
          Isi formulir pengajuan izin keluar sekolah dengan benar
        </p>
      </div>

      <div className="max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-lg p-6 md:p-8"
        >
          {/* Student Info */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-6">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {currentUser?.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{currentUser?.name}</p>
              <p className="text-xs text-blue-600 font-medium">{currentUser?.kelas}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Kategori Izin */}
            <div>
              <label htmlFor="izin-category" className="label">
                Kategori Izin <span className="text-red-400">*</span>
              </label>
              <select
                id="izin-category"
                required
                value={category}
                onChange={(e) => {
                  const nextCategory = e.target.value as
                    | "sakit"
                    | "keperluan"
                    | "dispensasi"
                    | "lainnya";
                  setCategory(nextCategory);
                  setWillNotReturn(nextCategory === "sakit");
                }}
                className="input"
              >
                <option value="keperluan">Keperluan Keluarga / Pribadi</option>
                <option value="sakit">Sakit (Tidak Wajib Kembali Hari Ini)</option>
                <option value="dispensasi">
                  Dispensasi Kegiatan Sekolah (OSIS / Lomba)
                </option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="izin-reason" className="label mb-0">
                  Alasan Izin <span className="text-red-400">*</span>
                </label>
                <span className={`text-xs font-semibold tabular-nums ${
                  reason.trim().length < MIN_REASON_LENGTH
                    ? "text-slate-400"
                    : "text-emerald-600"
                }`}>
                  {reason.trim().length}/{MIN_REASON_LENGTH}+
                </span>
              </div>
              <textarea
                id="izin-reason"
                required
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jelaskan alasan Anda dengan jelas dan singkat... (min. 10 karakter)"
                className={`input resize-none ${reasonTooShort ? "input-error" : ""}`}
              />
              {reasonTooShort && (
                <p className="field-error">
                  <AlertCircle size={12} />
                  Alasan terlalu singkat. Minimal {MIN_REASON_LENGTH} karakter.
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {reasonPresets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setReason(p.label);
                      setCategory(p.category);
                      setWillNotReturn(p.category === "sakit");
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-500 transition-colors font-medium animate-transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time — stack on small screens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Jam Berangkat</label>
                <div className="input bg-slate-50 flex items-center gap-2 cursor-not-allowed text-slate-500">
                  <Clock size={15} />
                  <span>Sekarang (otomatis)</span>
                </div>
              </div>
              <div>
                <label htmlFor="izin-return-time" className="label">
                  Estimasi Kembali
                </label>
                <input
                  id="izin-return-time"
                  type="time"
                  required={!willNotReturn}
                  disabled={willNotReturn}
                  value={estimatedReturnTime}
                  onChange={(e) => {
                    setEstimatedReturnTime(e.target.value);
                    setTimeError("");
                  }}
                  className={`input disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
                    timeError ? "input-error" : ""
                  }`}
                />
                {timeError && (
                  <p className="field-error">
                    <AlertCircle size={12} />
                    {timeError}
                  </p>
                )}
                <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={willNotReturn}
                    onChange={(e) => {
                      setWillNotReturn(e.target.checked);
                      setTimeError("");
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  Tidak kembali ke sekolah hari ini
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  {willNotReturn
                    ? "Estimasi kembali dinonaktifkan."
                    : "Pilih jam perkiraan siswa kembali ke sekolah."}
                </p>
              </div>
            </div>

            {/* Nomor Polisi */}
            <div>
              <label htmlFor="izin-nomor-polisi" className="label">
                <Car size={11} className="inline mr-1" />
                No. Polisi Kendaraan{" "}
                <span className="text-slate-300 font-normal normal-case">
                  (opsional)
                </span>
              </label>
              <input
                id="izin-nomor-polisi"
                type="text"
                value={nomorPolisi}
                onChange={(e) => setNomorPolisi(e.target.value.toUpperCase())}
                placeholder="Contoh: B 1234 XYZ"
                className="input font-mono"
              />
            </div>

            {/* Info */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
              <Info size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Pengajuan akan diteruskan ke <strong>Wali Kelas</strong> untuk
                disetujui, lalu diverifikasi oleh <strong>Guru Piket</strong>{" "}
                sebelum QR Code diterbitkan.
              </p>
            </div>

            {/* Inline submit error */}
            {submitError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 animate-fadeIn">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{submitError}</p>
              </div>
            )}

            <button
              type="submit"
              id="izin-submit-btn"
              disabled={loading || !isReasonValid}
              className="btn-primary w-full py-3.5 text-base"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  Kirim Pengajuan <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AppShell>
  );
}
