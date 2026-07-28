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
  FileText
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

  // Filtered Guests Computation
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      // Search match
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        g.nama.toLowerCase().includes(query) ||
        g.instansi.toLowerCase().includes(query) ||
        g.keperluan.toLowerCase().includes(query) ||
        g.tujuan.toLowerCase().includes(query) ||
        g.id.toLowerCase().includes(query);

      // Status match
      const matchesStatus = filterStatus === 'ALL' || g.status === filterStatus;

      // Date match
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

  // Handle Multi-select
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

  // Status Cycle: Menunggu -> Sedang Bertemu -> Selesai
  const cycleStatus = (guest) => {
    let nextStatus = 'Menunggu';
    let jamKeluar = guest.jamKeluar;

    if (guest.status === 'Menunggu') {
      nextStatus = 'Sedang Bertemu';
    } else if (guest.status === 'Sedang Bertemu') {
      nextStatus = 'Selesai';
      const now = new Date();
      jamKeluar = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
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

  // Batch Actions
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
    const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
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

  // File Upload Excel
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

  // Trigger Google Sheets Sync
  const handleSync = async () => {
    setIsSyncing(true);
    await onSyncGoogleSheets();
    setTimeout(() => setIsSyncing(false), 500);
  };

  return (
    <div style={{ padding: '0 0.75rem 2rem 0.75rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Toolbar Panel - Responsive */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* Row 1: Search & Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            
            {/* Search Input */}
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

            {/* Main Action Buttons Grid/Flex */}
            <div className="admin-action-buttons-grid">
              
              {/* Cetak Laporan PDF Official Button */}
              <button 
                className="btn btn-primary btn-sm btn-action-touch"
                onClick={() => setIsReportOpen(true)}
                title="Buka & Cetak Laporan Rekapitulasi Resmi BPS PPU"
              >
                <FileText size={15} />
                <span>Cetak Laporan PDF</span>
              </button>

              {/* Export Excel Button */}
              <button 
                className="btn btn-success btn-sm btn-action-touch"
                onClick={() => exportToExcel(filteredGuests)}
                title="Unduh data dalam format file Excel (.xlsx)"
              >
                <Download size={15} />
                <span>Ekspor Excel</span>
              </button>

              {/* Import Excel */}
              <label className="btn btn-secondary btn-sm btn-action-touch" style={{ cursor: 'pointer' }}>
                <Upload size={15} />
                <span>Impor Excel</span>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              {/* Google Sheets Sync Button */}
              <button 
                className="btn btn-secondary btn-sm btn-action-touch"
                onClick={handleSync}
                disabled={isSyncing}
                title="Kirim data ke Google Sheets Webhook"
              >
                <RefreshCw size={15} className={isSyncing ? 'spin' : ''} />
                <span>Sync Sheets</span>
              </button>

              {/* Add Manual Guest */}
              <button 
                className="btn btn-secondary btn-sm btn-action-touch"
                onClick={onAddNewManual}
              >
                <Plus size={15} />
                <span>Tambah Manual</span>
              </button>

            </div>

          </div>

          {/* Row 2: Filters & Batch Operations */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--bps-card-border)', paddingTop: '0.75rem' }}>
            
            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', width: '100%', maxWidth: '600px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Filter size={14} /> Filter:
              </span>

              {/* Status Filter */}
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

              {/* Date Filter */}
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

            {/* Batch Selection Operations */}
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

      {/* Spreadsheet Grid Table (Smooth Touch Scroll Wrapper) */}
      <div className="table-container glass-panel" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="spreadsheet-table" style={{ minWidth: '950px' }}>
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
              <th style={{ width: '90px', textAlign: 'center' }}>Jumlah</th>
              <th style={{ textAlign: 'center', width: '130px' }}>Status</th>
              <th style={{ textAlign: 'center', width: '110px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <FileSpreadsheet size={40} style={{ display: 'block', margin: '0 auto 0.75rem', opacity: 0.5 }} />
                  Tidak ada data tamu yang sesuai dengan pencarian / filter.
                </td>
              </tr>
            ) : (
              filteredGuests.map((g, idx) => {
                const isSelected = selectedIds.includes(g.id);
                return (
                  <tr key={g.id} style={{ background: isSelected ? 'rgba(2, 66, 130, 0.12)' : undefined }}>
                    
                    {/* Checkbox */}
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => toggleSelectOne(g.id)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                      >
                        {isSelected ? <CheckSquare size={16} color="var(--bps-navy)" /> : <Square size={16} />}
                      </button>
                    </td>

                    {/* No */}
                    <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{idx + 1}</td>

                    {/* Tanggal & Waktu */}
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '0.8rem' }}>{g.tanggal}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={11} /> {g.jamMasuk} {g.jamKeluar !== '-' ? `- ${g.jamKeluar}` : ''}
                      </div>
                    </td>

                    {/* ID Tamu */}
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--bps-navy)', fontWeight: '800' }}>
                      {g.id}
                    </td>

                    {/* Nama Tamu */}
                    <td>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{g.nama}</div>
                      {g.noHp && <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{g.noHp}</div>}
                    </td>

                    {/* Instansi */}
                    <td style={{ fontWeight: '600', fontSize: '0.825rem' }}>{g.instansi}</td>

                    {/* Tujuan */}
                    <td style={{ fontSize: '0.825rem' }}>{g.tujuan}</td>

                    {/* Keperluan */}
                    <td style={{ fontSize: '0.825rem' }}>
                      <div>{g.keperluan}</div>
                      {g.catatan && <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{g.catatan}"</div>}
                    </td>

                    {/* Rombongan */}
                    <td style={{ textAlign: 'center', fontWeight: '700', fontSize: '0.825rem' }}>{g.jumlah || 1} org</td>

                    {/* Status Badge with Click to Cycle */}
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

                    {/* Actions */}
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
