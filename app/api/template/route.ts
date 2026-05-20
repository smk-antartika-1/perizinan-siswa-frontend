import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────
// Template definitions per role
// Each template has: headers (CSV columns) + sample rows
// ─────────────────────────────────────────────────────────────────

type TemplateConfig = {
  filename: string;
  description: string;
  headers: string[];
  samples: string[][];
};

const TEMPLATES: Record<string, TemplateConfig> = {
  siswa: {
    filename: 'template_import_siswa.csv',
    description: 'Template import data Siswa',
    headers: ['nama', 'nis', 'kelas', 'email', 'password'],
    samples: [
      ['Budi Santoso',     '2024001', 'XII IPA 1', 'budi@sekolah.id',     'password123'],
      ['Siti Rahayu',      '2024002', 'XII IPA 1', 'siti@sekolah.id',     'password123'],
      ['Ahmad Fauzi',      '2024003', 'XII IPS 2', 'ahmad@sekolah.id',    'password123'],
      ['Nurul Hidayah',    '2024004', 'XI IPA 2',  'nurul@sekolah.id',    'password123'],
      ['Dewi Kartika',     '2024005', 'XI IPS 1',  'dewi@sekolah.id',     'password123'],
    ],
  },

  wali_kelas: {
    filename: 'template_import_walikelas.csv',
    description: 'Template import data Wali Kelas',
    headers: ['nama', 'nip', 'kelas_binaan', 'email', 'password'],
    samples: [
      ['Ibu Ratna Sari',   'NIP-001', 'XII IPA 1', 'ratna@sekolah.id',    'password'],
      ['Bapak Hendro',     'NIP-002', 'XII IPS 2', 'hendro@sekolah.id',   'password'],
      ['Ibu Sri Wahyuni',  'NIP-003', 'XI IPA 3',  'sri.w@sekolah.id',    'password'],
    ],
  },

  guru_piket: {
    filename: 'template_import_gurupiket.csv',
    description: 'Template import data Guru Piket',
    headers: ['nama', 'nip', 'email', 'password'],
    samples: [
      ['Pak Andi Wijaya',  'NIP-G01', 'andi@sekolah.id',   'password'],
      ['Bu Diana Putri',   'NIP-G02', 'diana@sekolah.id',  'password'],
      ['Pak Rudi Hartono', 'NIP-G03', 'rudi@sekolah.id',   'password'],
    ],
  },

  security: {
    filename: 'template_import_security.csv',
    description: 'Template import data Security / Penjaga Gerbang',
    headers: ['nama', 'nip', 'email', 'password'],
    samples: [
      ['Pak Slamet',       'SCR-001', 'slamet@sekolah.id', 'password'],
      ['Pak Wahyu',        'SCR-002', 'wahyu@sekolah.id',  'password'],
    ],
  },

  admin: {
    filename: 'template_import_admin.csv',
    description: 'Template import data Administrator',
    headers: ['nama', 'nip', 'email', 'password'],
    samples: [
      ['Admin IT',         'ADM-001', 'admin@sekolah.id',  'password'],
    ],
  },
};

// ─────────────────────────────────────────────────────────────────
// GET /api/template?role=siswa
// ─────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get('role') ?? 'siswa';
  const config = TEMPLATES[role];

  if (!config) {
    return NextResponse.json(
      { error: `Peran "${role}" tidak dikenal. Gunakan: ${Object.keys(TEMPLATES).join(', ')}` },
      { status: 400 }
    );
  }

  // Build CSV content
  // First line: description comment
  const descriptionLine = `# ${config.description} — E-Izin Siswa`;
  // Second line: instruction comment
  const instructionLine = `# Hapus baris yang diawali "#" ini sebelum mengimpor. Isi data mulai baris ke-3.`;
  // Header row
  const headerRow = config.headers.join(',');
  // Sample rows (quoted to handle commas safely)
  const sampleRows = config.samples.map(row =>
    row.map(cell => `"${cell}"`).join(',')
  );

  const csvLines = [descriptionLine, instructionLine, headerRow, ...sampleRows];
  const csvContent = csvLines.join('\r\n');

  // Return as downloadable CSV with BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF';
  const body = bom + csvContent;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${config.filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
}
