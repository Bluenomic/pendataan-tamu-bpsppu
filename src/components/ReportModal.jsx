import React, { useState } from 'react';
import { X, Printer, Calendar, FileText, Download, Building, Users, CheckCircle } from 'lucide-react';

export default function ReportModal({ guests, config, onClose }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterScope, setFilterScope] = useState('MONTH'); // 'MONTH' | 'ALL'

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Filter guests based on selected period
  const filteredReportGuests = guests.filter((g) => {
    if (filterScope === 'ALL') return true;
    if (!g.tanggal) return false;
    const d = new Date(g.tanggal);
    return d.getMonth() === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
  });

  // Calculate Summary Statistics
  const totalVisits = filteredReportGuests.length;
  const totalPeople = filteredReportGuests.reduce((acc, curr) => acc + (Number(curr.jumlah) || 1), 0);
  const completedVisits = filteredReportGuests.filter(g => g.status === 'Selesai').length;

  // Top Keperluan
  const keperluanCounts = {};
  filteredReportGuests.forEach(g => {
    const k = g.keperluan || 'Lainnya';
    keperluanCounts[k] = (keperluanCounts[k] || 0) + 1;
  });
  const sortedKeperluan = Object.entries(keperluanCounts).sort((a, b) => b[1] - a[1]);

  // Top Instansi
  const instansiCounts = {};
  filteredReportGuests.forEach(g => {
    const inst = g.instansi || 'Umum';
    instansiCounts[inst] = (instansiCounts[inst] || 0) + 1;
  });
  const sortedInstansi = Object.entries(instansiCounts).sort((a, b) => b[1] - a[1]);

  // Trigger Native Print Dialog
  const handlePrintReport = () => {
    window.print();
  };

  const periodTitle = filterScope === 'ALL' 
    ? 'SELURUH PERIODE KUNJUNGAN' 
    : `BULAN ${monthNames[selectedMonth].toUpperCase()} ${selectedYear}`;

  return (
    <div className="modal-overlay report-modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      
      {/* Modal Container */}
      <div 
        className="modal-content glass-panel report-modal-container" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '900px', width: '95vw', padding: 0, overflow: 'hidden' }}
      >
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print" style={{ 
          background: '#024282', 
          color: '#ffffff', 
          padding: '1rem 1.25rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '2px solid #002650'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={22} color="#fff" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Laporan Rekapitulasi Resmi PST</h3>
              <p style={{ fontSize: '0.75rem', color: '#38bdf8', margin: 0 }}>BPS Kabupaten Penajam Paser Utara</p>
            </div>
          </div>

          {/* Filter Period Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select 
              value={filterScope} 
              onChange={(e) => setFilterScope(e.target.value)}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', background: '#fff', color: '#000', border: '1px solid #ccc', fontWeight: '700' }}
            >
              <option value="MONTH">Per Bulan</option>
              <option value="ALL">Semua Data</option>
            </select>

            {filterScope === 'MONTH' && (
              <>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', background: '#fff', color: '#000', border: '1px solid #ccc', fontWeight: '700' }}
                >
                  {monthNames.map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>

                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', background: '#fff', color: '#000', border: '1px solid #ccc', fontWeight: '700' }}
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </>
            )}

            <button 
              className="btn btn-success btn-sm" 
              onClick={handlePrintReport}
              style={{ fontWeight: '800', marginLeft: '0.5rem' }}
            >
              <Printer size={15} /> Cetak / Download PDF
            </button>

            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.2rem' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT SHEET AREA */}
        <div id="printable-report-area" style={{ padding: '2rem', background: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif' }}>
          
          {/* Official BPS PPU Header KOP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', borderBottom: '3px double #000000', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
            <img src="/logo-bps.png" alt="Logo BPS" style={{ height: '64px', objectFit: 'contain' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                BADAN PUSAT STATISTIK KABUPATEN PENAJAM PASER UTARA
              </h2>
              <p style={{ fontSize: '0.85rem', fontWeight: '700', margin: '0.2rem 0', color: '#024282' }}>
                PELAYANAN STATISTIK TERPADU (PST) BPS PPU
              </p>
              <p style={{ fontSize: '0.75rem', margin: 0, color: '#444' }}>
                Jl. Provinsi Km.09 Nipah-Nipah, Penajam, 76411 • Email: bps6409@bps.go.id
              </p>
            </div>
          </div>

          {/* Report Title */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, textDecoration: 'underline' }}>
              LAPORAN REKAPITULASI KUNJUNGAN BUKU TAMU
            </h3>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', margin: '0.3rem 0 0', color: '#333' }}>
              PERIODE: {periodTitle}
            </p>
          </div>

          {/* Summary Executive Grid Box */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem', border: '1px solid #000', padding: '0.85rem', background: '#f8fafc' }}>
            
            <div style={{ borderRight: '1px solid #ccc', paddingRight: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#555', fontWeight: '700' }}>TOTAL REGISTRASI TAMU</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#024282' }}>{totalVisits} Kunjungan</div>
            </div>

            <div style={{ borderRight: '1px solid #ccc', paddingRight: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#555', fontWeight: '700' }}>TOTAL ANGGOTA ROMBONGAN</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#024282' }}>{totalPeople} Orang</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#555', fontWeight: '700' }}>STATUS SELESAI DILAYANI</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#16a34a' }}>{completedVisits} Tamu</div>
            </div>

          </div>

          {/* Summary Highlights */}
          {filteredReportGuests.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem', border: '1px solid #ccc', padding: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: '800', marginBottom: '0.3rem', borderBottom: '1px solid #ddd', paddingBottom: '0.2rem' }}>
                  📌 Kategori Keperluan Terbanyak:
                </div>
                {sortedKeperluan.slice(0, 3).map(([kep, count], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', margin: '0.15rem 0' }}>
                    <span>{i + 1}. {kep}</span>
                    <b>{count} kali</b>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontWeight: '800', marginBottom: '0.3rem', borderBottom: '1px solid #ddd', paddingBottom: '0.2rem' }}>
                  🏢 Instansi Asal Terbanyak:
                </div>
                {sortedInstansi.slice(0, 3).map(([inst, count], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', margin: '0.15rem 0' }}>
                    <span>{i + 1}. {inst}</span>
                    <b>{count} kunjungan</b>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Guests Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ background: '#024282', color: '#ffffff' }}>
                <th style={{ border: '1px solid #000', padding: '0.4rem', width: '30px', textAlign: 'center' }}>No</th>
                <th style={{ border: '1px solid #000', padding: '0.4rem', width: '80px' }}>Tanggal</th>
                <th style={{ border: '1px solid #000', padding: '0.4rem', width: '100px' }}>ID Tamu</th>
                <th style={{ border: '1px solid #000', padding: '0.4rem' }}>Nama Tamu</th>
                <th style={{ border: '1px solid #000', padding: '0.4rem' }}>Instansi / Alamat</th>
                <th style={{ border: '1px solid #000', padding: '0.4rem' }}>Tujuan Unit</th>
                <th style={{ border: '1px solid #000', padding: '0.4rem' }}>Keperluan</th>
                <th style={{ border: '1px solid #000', padding: '0.4rem', width: '45px', textAlign: 'center' }}>Jml</th>
                <th style={{ border: '1px solid #000', padding: '0.4rem', width: '60px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportGuests.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ border: '1px solid #000', padding: '1.5rem', textAlign: 'center', color: '#666' }}>
                    Tidak ada data kunjungan tamu pada periode ini.
                  </td>
                </tr>
              ) : (
                filteredReportGuests.map((g, idx) => (
                  <tr key={g.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ border: '1px solid #000', padding: '0.35rem', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '0.35rem' }}>{g.tanggal}</td>
                    <td style={{ border: '1px solid #000', padding: '0.35rem', fontFamily: 'monospace', fontWeight: '700' }}>{g.id}</td>
                    <td style={{ border: '1px solid #000', padding: '0.35rem', fontWeight: '700' }}>{g.nama}</td>
                    <td style={{ border: '1px solid #000', padding: '0.35rem' }}>{g.instansi}</td>
                    <td style={{ border: '1px solid #000', padding: '0.35rem' }}>{g.tujuan}</td>
                    <td style={{ border: '1px solid #000', padding: '0.35rem' }}>{g.keperluan}</td>
                    <td style={{ border: '1px solid #000', padding: '0.35rem', textAlign: 'center', fontWeight: '700' }}>{g.jumlah || 1}</td>
                    <td style={{ border: '1px solid #000', padding: '0.35rem', textAlign: 'center', fontWeight: '700' }}>{g.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Official Signatures Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', fontSize: '0.8rem', pageBreakInside: 'avoid' }}>
            <div style={{ textAlign: 'center', width: '220px' }}>
              <p style={{ margin: 0 }}>Mengetahui,</p>
              <p style={{ fontWeight: '800', margin: '0.2rem 0 3rem 0' }}>Petugas PST BPS PPU</p>
              <p style={{ borderBottom: '1px solid #000', fontWeight: '800', display: 'inline-block', paddingBottom: '0.1rem' }}>
                ( ......................................... )
              </p>
              <p style={{ fontSize: '0.7rem', color: '#555', margin: '0.2rem 0 0 0' }}>NIP. .....................................</p>
            </div>

            <div style={{ textAlign: 'center', width: '240px' }}>
              <p style={{ margin: 0 }}>Penajam, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p style={{ fontWeight: '800', margin: '0.2rem 0 3rem 0' }}>Kepala BPS Kab. Penajam Paser Utara</p>
              <p style={{ borderBottom: '1px solid #000', fontWeight: '800', display: 'inline-block', paddingBottom: '0.1rem' }}>
                ( ......................................... )
              </p>
              <p style={{ fontSize: '0.7rem', color: '#555', margin: '0.2rem 0 0 0' }}>NIP. .....................................</p>
            </div>
          </div>

        </div>

      </div>

      {/* STRICT ISOLATED MULTI-PAGE PRINT STYLESHEET */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm 12mm 12mm 12mm;
        }
        @media print {
          /* 1. HIDE ALL BACKGROUND APPLICATION UI */
          header, 
          footer, 
          nav, 
          main, 
          .no-print,
          #root > div > header,
          #root > div > main,
          #root > div > footer {
            display: none !important;
          }
          
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .report-modal-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            z-index: 999999 !important;
          }

          .report-modal-container {
            max-width: 100% !important;
            width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }

          #printable-report-area {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            font-size: 10pt !important;
          }

          table {
            page-break-inside: auto !important;
          }

          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }

          thead {
            display: table-header-group !important;
          }

          tfoot {
            display: table-footer-group !important;
          }

          .spreadsheet-table th, table th {
            background: #024282 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

    </div>
  );
}
