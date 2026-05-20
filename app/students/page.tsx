"use client";

import { useState } from "react";
import {
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useAppContext } from "@/context/AppContext";
import { UserRole } from "@/lib/types";
import { groupByKelas } from "@/lib/utils";

export default function StudentsPage() {
  const { currentUser, canAccess } = useAuth();
  const { users } = useAppContext();
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  if (!canAccess([UserRole.WALI_KELAS, UserRole.GURU_PIKET])) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
          <Users size={40} className="opacity-20" />
          <p className="font-medium">
            Anda tidak memiliki akses ke halaman ini
          </p>
        </div>
      </AppShell>
    );
  }

  // Filter by role
  const allStudents = users
    .filter((u) => u.role === UserRole.SISWA)
    .map((u) => ({
      id: u.id,
      name: u.name,
      kelas: u.kelas || "-",
      email: u.email || "-",
      nis: u.nis || u.username,
      waliKelasId: "",
    }));

  const myStudents =
    currentUser?.role === UserRole.WALI_KELAS
      ? allStudents.filter((s) => s.kelas === currentUser.kelas)
      : allStudents;

  const filtered = myStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.kelas.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search),
  );

  const grouped = groupByKelas(filtered);

  const toggleGroup = (kelas: string) => {
    setOpenGroups((prev) => ({ ...prev, [kelas]: !prev[kelas] }));
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Data Siswa</h1>
        <p className="page-subtitle">
          {currentUser?.role === UserRole.WALI_KELAS
            ? `Kelas ${currentUser.kelas} · ${myStudents.length} siswa`
            : `Semua kelas · ${myStudents.length} siswa`}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />
        <input
          type="text"
          placeholder="Cari nama, kelas, atau NIS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Grouped List */}
      <div className="space-y-4">
        {Object.entries(grouped).length > 0 ? (
          Object.entries(grouped).map(([kelas, students]) => {
            const isOpen = openGroups[kelas] !== false;
            return (
              <div key={kelas} className="card-lg overflow-hidden">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(kelas)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                    <GraduationCap size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-slate-800">{kelas}</p>
                    <p className="text-xs text-slate-400">
                      {students.length} siswa
                    </p>
                  </div>
                  {isOpen ? (
                    <ChevronDown size={16} className="text-blue-400" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-400" />
                  )}
                </button>

                {/* Students List */}
                {isOpen && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {students.map((s, i) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-red-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">
                            {s.name}
                          </p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-mono text-xs font-semibold text-blue-600">
                            {s.nis}
                          </p>
                          <p className="text-[10px] text-slate-400">NIS</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Users size={36} className="opacity-20" />
            <p className="text-sm">Tidak ada siswa ditemukan</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
