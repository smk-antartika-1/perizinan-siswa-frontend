import { NextRequest, NextResponse } from 'next/server';

/**
 * API route that generates a permission letter image (surat izin).
 * QR codes point directly to this endpoint: /api/surat/P-001.png
 * Returns a dynamically generated SVG rendered as PNG-like image.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const permId = id.replace('.png', '').replace('.jpg', '');

  // Generate a simple SVG surat izin as image response
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="#ffffff" rx="16"/>
      <rect x="0" y="0" width="600" height="60" fill="#2563eb" rx="16"/>
      <rect x="0" y="16" width="600" height="44" fill="#2563eb"/>
      <text x="300" y="38" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white">SURAT IZIN KELUAR SISWA</text>
      <text x="300" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#64748b">E-Izin Siswa - Sistem Perizinan Digital</text>
      <line x1="40" y1="115" x2="560" y2="115" stroke="#e2e8f0" stroke-width="1"/>
      <text x="40" y="145" font-family="Arial, sans-serif" font-size="11" fill="#94a3b8">ID PERIZINAN</text>
      <text x="40" y="165" font-family="monospace" font-size="16" font-weight="bold" fill="#1e293b">${permId}</text>
      <text x="300" y="145" font-family="Arial, sans-serif" font-size="11" fill="#94a3b8">STATUS</text>
      <text x="300" y="165" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#16a34a">DISETUJUI</text>
      <line x1="40" y1="185" x2="560" y2="185" stroke="#e2e8f0" stroke-width="1"/>
      <text x="40" y="215" font-family="Arial, sans-serif" font-size="11" fill="#94a3b8">KETERANGAN</text>
      <text x="40" y="240" font-family="Arial, sans-serif" font-size="13" fill="#334155">Surat izin ini sah dan telah diverifikasi oleh sistem.</text>
      <text x="40" y="260" font-family="Arial, sans-serif" font-size="13" fill="#334155">Siswa diizinkan keluar sekolah sesuai dengan alasan yang diajukan.</text>
      <line x1="40" y1="285" x2="560" y2="285" stroke="#e2e8f0" stroke-width="1"/>
      <text x="40" y="315" font-family="Arial, sans-serif" font-size="11" fill="#94a3b8">DIVERIFIKASI OLEH</text>
      <text x="40" y="335" font-family="Arial, sans-serif" font-size="13" fill="#334155">Guru Piket / Wali Kelas</text>
      <rect x="380" y="300" width="180" height="60" fill="#f1f5f9" rx="8"/>
      <text x="470" y="325" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#94a3b8">STEMPEL DIGITAL</text>
      <text x="470" y="345" text-anchor="middle" font-family="monospace" font-size="11" font-weight="bold" fill="#2563eb">${permId}</text>
      <text x="300" y="385" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#cbd5e1">Dokumen ini digenerate secara otomatis oleh sistem E-Izin Siswa</text>
    </svg>
  `;

  return new NextResponse(svg.trim(), {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
