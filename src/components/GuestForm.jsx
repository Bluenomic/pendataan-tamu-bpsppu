import React, { useState, useRef } from 'react';
import { 
  User, 
  Phone, 
  Building, 
  CreditCard, 
  Users, 
  Target, 
  FileText, 
  Clock, 
  CheckCircle, 
  PenTool, 
  RotateCcw,
  Sparkles,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GuestForm({ onAddGuest, onShowPass }) {
  const [formData, setFormData] = useState({
    nama: '',
    noHp: '',
    instansi: '',
    nik: '',
    tujuan: 'Pelayanan Statistik Terpadu (PST)',
    keperluan: 'Konsultasi Data & Informasi Statistik',
    jumlah: 1,
    catatan: ''
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  const keperluanOptions = [
    'Konsultasi Data & Informasi Statistik',
    'Permohonan Mikrodata & Publikasi BPS',
    'Riset / Penelitian / Pengajuan Magang',
    'Koordinasi / Audiensi Antar-Instansi',
    'Rapat & Keperluan Kepegawaian',
    'Kemitraan & Survey Lapangan',
    'Wawancara Press / Media BRS',
    'Keperluan Lainnya'
  ];

  const tujuanOptions = [
    'Pelayanan Statistik Terpadu (PST)',
    'Kepala BPS Kabupaten Penajam Paser Utara',
    'Subbagian Umum & Kepegawaian',
    'Tim Neraca Wilayah & Analisis Statistik',
    'Tim Statistik Sosial',
    'Tim Statistik Produksi',
    'Tim Distribusi & Jasa',
    'Tim Pengolahan & TI'
  ];

  // Signature Canvas Handlers
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#024282';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.instansi.trim()) {
      alert('Mohon lengkapi Nama Lengkap dan Instansi / Alamat!');
      return;
    }

    let ttdDataUrl = '';
    if (canvasRef.current) {
      ttdDataUrl = canvasRef.current.toDataURL();
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');

    const newGuest = {
      id: `BPS-PPU-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      ...formData,
      tanggal: now.toISOString().split('T')[0],
      jamMasuk: `${hours}:${mins} WITA`,
      jamKeluar: '-',
      status: 'Menunggu',
      ttd: ttdDataUrl
    };

    // Confetti Effect
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err) {}

    onAddGuest(newGuest);

    // Reset Form
    setFormData({
      nama: '',
      noHp: '',
      instansi: '',
      nik: '',
      tujuan: 'Pelayanan Statistik Terpadu (PST)',
      keperluan: 'Konsultasi Data & Informasi Statistik',
      jumlah: 1,
      catatan: ''
    });
    clearCanvas();

    // Show Pass Ticket Modal
    if (onShowPass) {
      onShowPass(newGuest);
    }
  };

  return (
    <div style={{ padding: '0 1rem 2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* Form Container */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1.5px solid var(--bps-card-border)', paddingBottom: '1rem' }}>
            <div style={{ background: '#024282', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Formulir Registrasi Kunjungan</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Silakan isi data tamu untuk mencetak Pass Kunjungan PST</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              {/* Nama Lengkap */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">
                  <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Nama Lengkap Tamu / Penanggung Jawab *
                </label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Contoh: Dr. Budi Santoso, M.Si"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                />
              </div>

              {/* No HP */}
              <div className="form-group">
                <label className="form-label">
                  <Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  No. HP / WhatsApp
                </label>
                <input 
                  type="tel" 
                  className="form-input"
                  placeholder="081234567890"
                  value={formData.noHp}
                  onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                />
              </div>

              {/* NIK / Identitas */}
              <div className="form-group">
                <label className="form-label">
                  <CreditCard size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  NIK / No. Identitas (Opsional)
                </label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="640901..."
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                />
              </div>

              {/* Instansi / Alamat */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">
                  <Building size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Asal Instansi / Perusahaan / Alamat *
                </label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Contoh: Bappeda Kab. Penajam Paser Utara / Dinas Kominfo"
                  value={formData.instansi}
                  onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                  required
                />
              </div>

              {/* Pegawai / Unit Dituju */}
              <div className="form-group">
                <label className="form-label">
                  <Target size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Unit / Pegawai Dituju *
                </label>
                <select 
                  className="form-select"
                  value={formData.tujuan}
                  onChange={(e) => setFormData({ ...formData, tujuan: e.target.value })}
                >
                  {tujuanOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Keperluan */}
              <div className="form-group">
                <label className="form-label">
                  <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Kategori Keperluan *
                </label>
                <select 
                  className="form-select"
                  value={formData.keperluan}
                  onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                >
                  {keperluanOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Jumlah Rombongan */}
              <div className="form-group">
                <label className="form-label">
                  <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Jumlah Tamu (Orang)
                </label>
                <input 
                  type="number" 
                  min="1"
                  max="50"
                  className="form-input"
                  value={formData.jumlah}
                  onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value, 10) || 1 })}
                />
              </div>

              {/* Catatan / Detail Keperluan */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Catatan Tambahan / Detail Kunjungan</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Keterangan singkat tambahan (opsional)"
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                />
              </div>

              {/* Digital Signature Pad */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label">
                    <PenTool size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    Tanda Tangan Digital (Opsional)
                  </label>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={clearCanvas}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    <RotateCcw size={12} /> Hapus TTD
                  </button>
                </div>
                <div style={{ border: '1.5px dashed var(--bps-cyan)', borderRadius: '8px', background: 'var(--bps-card)', overflow: 'hidden' }}>
                  <canvas 
                    ref={canvasRef}
                    width={500}
                    height={100}
                    style={{ width: '100%', height: '100px', cursor: 'crosshair', touchAction: 'none' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
              </div>

            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', marginTop: '1rem', fontSize: '0.95rem' }}
            >
              <CheckCircle size={18} />
              Simpan & Cetak Pass Tamu
            </button>
          </form>
        </div>

        {/* Live Pass Preview Card - FIXED DARK THEME BUG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bps-card)', border: '1.5px solid var(--bps-card-border)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1.5px solid var(--bps-card-border)', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--bps-navy)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <QrCode size={16} color="var(--bps-cyan)" /> Preview Ticket Pass
              </span>
              <span className="status-badge status-menunggu">Draft</span>
            </div>

            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#024282', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(2, 66, 130, 0.2)' }}>
                <User size={32} color="#fff" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                {formData.nama || 'Nama Tamu'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0.75rem', fontWeight: '600' }}>
                {formData.instansi || 'Instansi / Perusahaan'}
              </p>
            </div>

            <div style={{ background: 'var(--bps-bg)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', border: '1px solid var(--bps-card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Tujuan Unit:</span>
                <span style={{ fontWeight: '800', textAlign: 'right', color: 'var(--text-primary)' }}>{formData.tujuan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Keperluan:</span>
                <span style={{ fontWeight: '800', textAlign: 'right', color: 'var(--text-primary)' }}>{formData.keperluan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Jumlah Rombongan:</span>
                <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{formData.jumlah} Orang</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Waktu Kedatangan:</span>
                <span style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--text-primary)' }}>
                  <Clock size={13} color="var(--bps-cyan)" /> {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(0, 153, 219, 0.08)', border: '1px solid rgba(0, 153, 219, 0.2)', borderRadius: '8px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              📌 Data tamu akan otomatis disimpan ke sistem lokal & disinkronkan ke Google Sheets jika tersambung.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
