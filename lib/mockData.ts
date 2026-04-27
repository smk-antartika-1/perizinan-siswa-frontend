import { UserRole, PermissionStatus, User, Permission, Student } from './types';

// ============================================================
// MOCK USERS
// ============================================================
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Budi Santoso', role: UserRole.SISWA, email: 'budi@sekolah.id', username: '2024001', password: '2024001', nis: '2024001', kelas: 'XII IPA 1' },
  { id: 'u2', name: 'Siti Rahayu', role: UserRole.SISWA, email: 'siti@sekolah.id', username: '2024002', password: '2024002', nis: '2024002', kelas: 'XII IPA 1' },
  { id: 'u3', name: 'Ahmad Fauzi', role: UserRole.SISWA, email: 'ahmad@sekolah.id', username: '2024005', password: '2024005', nis: '2024005', kelas: 'XII IPS 2' },
  { id: 'u4', name: 'Dewi Kartika', role: UserRole.SISWA, email: 'dewi@sekolah.id', username: '2024007', password: '2024007', nis: '2024007', kelas: 'XI IPA 3' },
  { id: 'u5', name: 'Ibu Ratna Sari', role: UserRole.WALI_KELAS, email: 'ratna@sekolah.id', username: 'walikelas1', password: 'password', kelas: 'XII IPA 1', nip: 'NIP-001' },
  { id: 'u6', name: 'Bapak Hendro', role: UserRole.WALI_KELAS, email: 'hendro@sekolah.id', username: 'walikelas2', password: 'password', kelas: 'XII IPS 2', nip: 'NIP-002' },
  { id: 'u7', name: 'Pak Andi Wijaya', role: UserRole.GURU_PIKET, email: 'andi@sekolah.id', username: 'piket', password: 'password', nip: 'NIP-003' },
  { id: 'u8', name: 'Pak Slamet', role: UserRole.SECURITY, email: 'slamet@sekolah.id', username: 'security', password: 'password' },
  { id: 'u9', name: 'Admin IT', role: UserRole.ADMIN, email: 'admin@sekolah.id', username: 'admin', password: 'password', nip: 'NIP-ADM' },
];

// ============================================================
// MOCK STUDENTS (detail)
// ============================================================
export const MOCK_STUDENTS: Student[] = [
  { id: 's1', name: 'Budi Santoso', kelas: 'XII IPA 1', email: 'budi@sekolah.id', nis: '2024001', waliKelasId: 'u5' },
  { id: 's2', name: 'Siti Rahayu', kelas: 'XII IPA 1', email: 'siti@sekolah.id', nis: '2024002', waliKelasId: 'u5' },
  { id: 's3', name: 'Rizky Maulana', kelas: 'XII IPA 1', email: 'rizky@sekolah.id', nis: '2024003', waliKelasId: 'u5' },
  { id: 's4', name: 'Nurul Hidayah', kelas: 'XII IPA 1', email: 'nurul@sekolah.id', nis: '2024004', waliKelasId: 'u5' },
  { id: 's5', name: 'Ahmad Fauzi', kelas: 'XII IPS 2', email: 'ahmad@sekolah.id', nis: '2024005', waliKelasId: 'u6' },
  { id: 's6', name: 'Mira Susanti', kelas: 'XII IPS 2', email: 'mira@sekolah.id', nis: '2024006', waliKelasId: 'u6' },
  { id: 's7', name: 'Dewi Kartika', kelas: 'XI IPA 3', email: 'dewi@sekolah.id', nis: '2024007', waliKelasId: 'u5' },
  { id: 's8', name: 'Fajar Ramadhan', kelas: 'XI IPA 3', email: 'fajar@sekolah.id', nis: '2024008', waliKelasId: 'u5' },
  { id: 's9', name: 'Indah Permata', kelas: 'XI IPS 1', email: 'indah@sekolah.id', nis: '2024009', waliKelasId: 'u6' },
  { id: 's10', name: 'Galih Pratama', kelas: 'X IPA 2', email: 'galih@sekolah.id', nis: '2024010', waliKelasId: 'u6' },
];

// ============================================================
// MOCK PERMISSIONS
// ============================================================
const now = new Date();
const d = (offsetH: number) => new Date(now.getTime() + offsetH * 3600000).toISOString();

export const MOCK_PERMISSIONS: Permission[] = [
  {
    id: 'P-001', studentId: 'u1', studentName: 'Budi Santoso', kelas: 'XII IPA 1',
    reason: 'Keperluan Keluarga - Menghadiri acara pernikahan saudara',
    departureTime: d(-5), estimatedReturnTime: d(-3), actualReturnTime: d(-3.5),
    status: PermissionStatus.COMPLETED, createdAt: d(-6),
    approvedByWaliId: 'u5', approvedByWaliName: 'Ibu Ratna Sari',
    approvedByPiketId: 'u7', approvedByPiketName: 'Pak Andi Wijaya',
  },
  {
    id: 'P-002', studentId: 'u2', studentName: 'Siti Rahayu', kelas: 'XII IPA 1',
    reason: 'Sakit - Perlu periksa ke dokter',
    departureTime: d(-2), estimatedReturnTime: d(0),
    status: PermissionStatus.APPROVED_PIKET, createdAt: d(-3),
    approvedByWaliId: 'u5', approvedByWaliName: 'Ibu Ratna Sari',
    approvedByPiketId: 'u7', approvedByPiketName: 'Pak Andi Wijaya',
  },
  {
    id: 'P-003', studentId: 'u3', studentName: 'Ahmad Fauzi', kelas: 'XII IPS 2',
    reason: 'Urusan administrasi bank untuk beasiswa',
    departureTime: d(1), estimatedReturnTime: d(3),
    status: PermissionStatus.APPROVED_WALI, createdAt: d(-1),
    approvedByWaliId: 'u6', approvedByWaliName: 'Bapak Hendro',
  },
  {
    id: 'P-004', studentId: 'u1', studentName: 'Budi Santoso', kelas: 'XII IPA 1',
    reason: 'Kompetisi olimpiade matematika tingkat kabupaten',
    departureTime: d(2), estimatedReturnTime: d(6),
    status: PermissionStatus.PENDING, createdAt: d(0),
  },
  {
    id: 'P-005', studentId: 'u4', studentName: 'Dewi Kartika', kelas: 'XI IPA 3',
    reason: 'Keperluan pribadi yang mendesak',
    departureTime: d(-8), estimatedReturnTime: d(-6),
    status: PermissionStatus.REJECTED, createdAt: d(-9),
    rejectedReason: 'Alasan tidak memenuhi syarat perizinan',
  },
  {
    id: 'P-006', studentId: 'u2', studentName: 'Siti Rahayu', kelas: 'XII IPA 1',
    reason: 'Latihan paduan suara untuk lomba tingkat provinsi',
    departureTime: d(3), estimatedReturnTime: d(5),
    status: PermissionStatus.PENDING, createdAt: d(1),
  },
  {
    id: 'P-007', studentId: 'u3', studentName: 'Ahmad Fauzi', kelas: 'XII IPS 2',
    reason: 'Pertemuan OSIS dengan dinas pendidikan',
    departureTime: d(-4), estimatedReturnTime: d(-2), actualReturnTime: d(-2.5),
    status: PermissionStatus.COMPLETED, createdAt: d(-5),
    approvedByWaliId: 'u6', approvedByWaliName: 'Bapak Hendro',
    approvedByPiketId: 'u7', approvedByPiketName: 'Pak Andi Wijaya',
    nomorPolisi: 'B 1234 XYZ',
  },
];
