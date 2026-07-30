import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Printer, 
  CheckCircle, 
  Clock, 
  Filter, 
  Plus,
  FileSpreadsheet,
  CheckSquare,
  Square,
  FileText,
  PenTool,
  ExternalLink,
  X
} from 'lucide-react';
import { exportToExcel, importFromExcel } from '../utils/storage';
import ReportModal from './ReportModal';

export default function SpreadsheetTable({ 
  guests, 
  config,
  onUpdateGuest, 
  onDeleteGuest, 
  onImportGuests, 
  onSyncGoogleSheets,
  onShowPass,
  onEditGuest,
  onAddNewManual
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDate, setFilterDate] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [previewTtdGuest, setPreviewTtdGuest] = useState(null);

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        g.nama.toLowerCase().includes(query) ||
        g.instansi.toLowerCase().includes(query) ||
        g.keperluan.toLowerCase().includes(query) ||
        g.tujuan.toLowerCase().includes(query) ||
        g.id.toLowerCase().includes(query);

      const matchesStatus = filterStatus === 'ALL' || g.status === filterStatus;

      const today = new Date().toISOString().split('T')[0];
      let matchesDate = true;
      if (filterDate === 'TODAY') {
        matchesDate = g.tanggal === today;
      } else if (filterDate === 'WEEK') {
        const itemDate = new Date(g.tanggal);
        const diffDays = (new Date() - itemDate) / (1000 * 3600 * 24);
        matchesDate = diffDays <= 7;
      } else if (filterDate === 'MONTH') {
        const currentMonth = new Date().getMonth();
        const itemMonth = new Date(g.tanggal).getMonth();
        matchesDate = currentMonth === itemMonth;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [guests, searchQuery, filterStatus, filterDate]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredGuests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredGuests.map(g => g.id));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const cycleStatus = (guest) => {
    let nextStatus = 'Menunggu';
    let jamKeluar = guest.jamKeluar;

    if (guest.status === 'Menunggu') {
      nextStatus = 'Sedang Bertemu';
    } else if (guest.status === 'Sedang Bertemu') {
      nextStatus = 'Selesai';
      const now = new Date();
      jamKeluar = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WITA`;
    } else {
      nextStatus = 'Menunggu';
      jamKeluar = '-';
    }

    onUpdateGuest({
      ...guest,
      status: nextStatus,
      jamKeluar
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Yakin ingin menghapus ${selectedIds.length} data tamu terpilih?`)) {
      selectedIds.forEach(id => onDeleteGuest(id));
      setSelectedIds([]);
    }
  };

  const handleBatchMarkDone = () => {
    if (selectedIds.length === 0) return;
    const now = new Date();
    const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WITA`;
    
    guests.forEach(g => {
      if (selectedIds.includes(g.id)) {
        onUpdateGuest({
          ...g,
          status: 'Selesai',
          jamKeluar: g.jamKeluar === '-' ? nowStr : g.jamKeluar
        });
      }
    });
    setSelectedIds([]);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = await importFromExcel(file);
      onImportGuests(imported);
    } catch (err) {
      alert('Gagal mengimpor file Excel: ' + err.message);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await onSyncGoogleSheets();
    setTimeout(() => setIsSyncing(false), 500);
  };

  return (
    <div style={{ padding: '0 0.75rem 2rem 0.75rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Toolbar Panel (no-print) */}
      <div className="glass-panel no-print" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px', flex: '1 1 280px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                placeholder="Cari Nama, Instansi, Keperluan, atau ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="admin-action-buttons-grid">
              
              <button 
                className="btn btn-primary btn-sm btn-action-touch"
                onClick={() => setIsReportOpen(true)}
                title="Buka & Cetak Laporan Rekapitulasi Resmi BPS PPU"
              >
                <FileText size={15} />
                <span>Cetak Laporan PDF</span>
              </button>

              <button 
                className="btn btn-success btn-sm btn-action-touch"
                onClick={() => exportToExcel(filteredGuests)}
                title="Unduh data dalam format file Excel (.xlsx)"
              >
                <Download size={15} />
                <span>Ekspor Excel</span>
              </button>

              <label className="btn btn-secondary btn-sm btn-action-touch" style={{ cursor: 'pointer' }}>
                <Upload size={15} />
                <span>Impor Excel</span>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              <button 
                className="btn btn-secondary btn-sm btn-action-touch"
                onClick={handleSync}
                disabled={isSyncing}
                title="Kirim data ke Google Sheets Webhook"
              >
                <RefreshCw size={15} className={isSyncing ? 'spin' : ''} />
                <span>Sync Sheets</span>
              </button>

              <button 
                className="btn btn-success btn-sm btn-action-touch"
                onClick={() => {
                  const targetUrl = (config && config.spreadsheetUrl && config.spreadsheetUrl.trim())
                    ? config.spreadsheetUrl.trim()
                    : 'https://docs.google.com/spreadsheets/';
                  window.open(targetUrl, '_blank', 'noopener,noreferrer');
                }}
                title="Buka Dokumen Google Spreadsheet di Tab Baru"
                style={{ background: '#15803d', borderColor: '#16a34a', fontWeight: '800' }}
              >
                <FileSpreadsheet size={15} />
                <span>Buka Spreadsheet</span>
                <ExternalLink size={13} />
              </button>

              <button 
                className="btn btn-secondary btn-sm btn-action-touch"
                onClick={onAddNewManual}
              >
                <Plus size={15} />
                <span>Tambah Manual</span>
              </button>

            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--bps-card-border)', paddingTop: '0.75rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', width: '100%', maxWidth: '600px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Filter size={14} /> Filter:
              </span>

              <select 
                className="form-select"
                style={{ width: 'auto', flex: 1, minWidth: '130px', padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">Semua Status</option>
                <option value="Menunggu">Menunggu</option>
                <option value="Sedang Bertemu">Sedang Bertemu</option>
                <option value="Selesai">Selesai</option>
              </select>

              <select 
                className="form-select"
                style={{ width: 'auto', flex: 1, minWidth: '130px', padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              >
                <option value="ALL">Semua Tanggal</option>
                <option value="TODAY">Hari Ini</option>
                <option value="WEEK">7 Hari Terakhir</option>
                <option value="MONTH">Bulan Ini</option>
              </select>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                <b>{filteredGuests.length}</b> / {guests.length} data
              </span>
            </div>

            {selectedIds.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(2, 66, 130, 0.1)', padding: '0.35rem 0.65rem', borderRadius: '0px', border: '1px solid var(--bps-navy)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--bps-navy)' }}>
                  {selectedIds.length} Terpilih:
                </span>
                <button className="btn btn-success btn-sm" onClick={handleBatchMarkDone} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                  <CheckCircle size={13} /> Selesai
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleBatchDelete} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                  <Trash2 size={13} /> Hapus
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Main Table Grid (no-print) */}
      <div className="table-container glass-panel no-print" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="spreadsheet-table" style={{ minWidth: '1000px' }}>
          <thead>
            <tr>
              <th style={{ width: '36px', textAlign: 'center' }}>
                <button 
                  onClick={toggleSelectAll} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff' }}
                >
                  {selectedIds.length > 0 && selectedIds.length === filteredGuests.length ? (
                    <CheckSquare size={16} color="#ffffff" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th style={{ width: '36px' }}>No</th>
              <th style={{ width: '130px' }}>Tanggal & Waktu</th>
              <th style={{ width: '150px' }}>ID Tamu</th>
              <th style={{ width: '160px' }}>Nama Tamu</th>
              <th style={{ width: '160px' }}>Instansi / Alamat</th>
              <th style={{ width: '150px' }}>Tujuan Unit</th>
              <th>Keperluan</th>
              <th style={{ width: '80px', textAlign: 'center' }}>TTD</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Jumlah</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Status</th>
              <th style={{ textAlign: 'center', width: '110px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.length === 0 ? (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <FileSpreadsheet size={40} style={{ display: 'block', margin: '0 auto 0.75rem', opacity: 0.5 }} />
                  Tidak ada data tamu yang sesuai dengan pencarian / filter.
                </td>
              </tr>
            ) : (
              filteredGuests.map((g, idx) => {
                const isSelected = selectedIds.includes(g.id);
                const hasTtd = Boolean(g.ttd && g.ttd.trim());
                return (
                  <tr key={g.id} style={{ background: isSelected ? 'rgba(2, 66, 130, 0.12)' : undefined }}>
                    
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => toggleSelectOne(g.id)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                      >
                        {isSelected ? <CheckSquare size={16} color="var(--bps-navy)" /> : <Square size={16} />}
                      </button>
                    </td>

                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{idx + 1}</td>

                    <td>
                      <div style={{ fontWeight: '700', fontSize: '0.8rem' }}>{g.tanggal}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={11} /> {g.jamMasuk} {g.jamKeluar !== '-' ? `- ${g.jamKeluar}` : ''}
                      </div>
                    </td>

                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--bps-navy)', fontWeight: '800' }}>
                      {g.id}
                    </td>

                    <td>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{g.nama}</div>
                      {g.noHp && <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{g.noHp}</div>}
                    </td>

                    <td style={{ fontWeight: '600', fontSize: '0.825rem' }}>{g.instansi}</td>

                    <td style={{ fontSize: '0.825rem' }}>{g.tujuan}</td>

                    <td style={{ fontSize: '0.825rem' }}>
                      <div>{g.keperluan}</div>
                      {g.catatan && <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{g.catatan}"</div>}
                    </td>

                    {/* Digital Signature Preview Button */}
                    <td style={{ textAlign: 'center' }}>
                      {hasTtd ? (
                        <button 
                          onClick={() => setPreviewTtdGuest(g)}
                          title="Lihat Tanda Tangan Digital Tamu"
                          style={{
                            background: 'rgba(2, 66, 130, 0.1)',
                            border: '1px solid var(--bps-navy)',
                            color: 'var(--bps-navy)',
                            padding: '0.25rem 0.45rem',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}
                        >
                          <PenTool size={12} /> TTD
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'center', fontWeight: '700', fontSize: '0.825rem' }}>{g.jumlah || 1} org</td>

                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => cycleStatus(g)}
                        title="Klik untuk mengubah status kunjungan"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {g.status === 'Selesai' && (
                          <span className="status-badge status-selesai">✓ Selesai</span>
                        )}
                        {g.status === 'Sedang Bertemu' && (
                          <span className="status-badge status-bertemu">⏳ Bertemu</span>
                        )}
                        {g.status === 'Menunggu' && (
                          <span className="status-badge status-menunggu">🔔 Menunggu</span>
                        )}
                      </button>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                        <button 
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => onShowPass(g)}
                          title="Cetak Pass Tamu"
                        >
                          <Printer size={13} />
                        </button>
                        <button 
                          className="btn btn-secondary btn-icon btn-sm"
                          onClick={() => onEditGuest(g)}
                          title="Edit Data"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          className="btn btn-danger btn-icon btn-sm"
                          onClick={() => {
                            if (confirm(`Hapus data kunjungan ${g.nama}?`)) {
                              onDeleteGuest(g.id);
                            }
                          }}
                          title="Hapus Data"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Preview TTD Modal */}
      {previewTtdGuest && (
        <div className="modal-overlay" onClick={() => setPreviewTtdGuest(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--bps-card-border)', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--bps-navy)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <PenTool size={16} /> Tanda Tangan Digital Tamu
              </span>
              <button className="btn btn-secondary btn-icon" onClick={() => setPreviewTtdGuest(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#ffffff', border: '1.5px dashed var(--bps-navy)', padding: '1rem', margin: '0.5rem 0 1rem' }}>
              <img 
                src={previewTtdGuest.ttd} 
                alt={`TTD ${previewTtdGuest.nama}`} 
                style={{ width: '100%', maxHeight: '140px', objectFit: 'contain' }} 
              />
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {previewTtdGuest.nama}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {previewTtdGuest.instansi} • {previewTtdGuest.tanggal}
            </div>
          </div>
        </div>
      )}

      {/* Official Report Modal Dialog */}
      {isReportOpen && (
        <ReportModal 
          guests={guests}
          config={config}
          onClose={() => setIsReportOpen(false)}
        />
      )}

    </div>
  );
}
