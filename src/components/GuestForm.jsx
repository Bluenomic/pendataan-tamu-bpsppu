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

  // Precision Coordinate Calculation (Scaling CSS display vs internal Canvas resolution)
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
    
    // Scale factor to map CSS display width/height to internal canvas width/height
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Signature Canvas Handlers
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#024282';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
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

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err) {}

    onAddGuest(newGuest);

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

    if (onShowPass) {
      onShowPass(newGuest);
    }
  };

  return (
    <div style={{ padding: '0 0.75rem 2rem 0.75rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div className="form-preview-layout">
        
        {/* 1. Form Container */}
        <div className="glass-panel form-card-padding">
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1.5px solid var(--bps-card-border)', paddingBottom: '0.85rem' }}>
            <div style={{ background: '#024282', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Formulir Registrasi Kunjungan</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Silakan isi data tamu untuk mencetak Pass Kunjungan PST</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="responsive-form-grid">
              
              <div className="form-group full-width-field">
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

              <div className="form-group full-width-field">
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

              <div className="form-group full-width-field-mobile">
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

              <div className="form-group full-width-field-mobile">
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

              <div className="form-group full-width-field-mobile">
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

              <div className="form-group full-width-field">
                <label className="form-label">Catatan Tambahan / Detail Kunjungan</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Keterangan singkat tambahan (opsional)"
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                />
              </div>

              {/* Digital Signature Pad - Extra Large Spacious Canvas */}
              <div className="form-group full-width-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
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
                <div style={{ border: '1.5px dashed var(--bps-navy)', borderRadius: '0px', background: '#ffffff', overflow: 'hidden', touchAction: 'none' }}>
                  <canvas 
                    ref={canvasRef}
                    width={700}
                    height={220}
                    style={{ width: '100%', height: '175px', cursor: 'crosshair', touchAction: 'none', display: 'block' }}
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
              className="btn btn-primary btn-submit-touch"
              style={{ width: '100%', padding: '0.85rem', marginTop: '1.25rem', fontSize: '0.95rem', fontWeight: '800' }}
            >
              <CheckCircle size={18} />
              Simpan & Cetak Pass Tamu
            </button>
          </form>
        </div>

        {/* 2. Live Pass Preview Card */}
        <div className="preview-card-container">
          <div className="glass-panel form-card-padding" style={{ background: 'var(--bps-card)', border: '1.5px solid var(--bps-card-border)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1.5px solid var(--bps-card-border)', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--bps-navy)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <QrCode size={16} color="var(--bps-cyan)" /> Preview Ticket Pass
              </span>
              <span className="status-badge status-menunggu">Draft</span>
            </div>

            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#024282', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(2, 66, 130, 0.2)' }}>
                <User size={28} color="#fff" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                {formData.nama || 'Nama Tamu'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0.75rem', fontWeight: '600', wordBreak: 'break-word' }}>
                {formData.instansi || 'Instansi / Perusahaan'}
              </p>
            </div>

            <div style={{ background: 'var(--bps-bg)', padding: '0.85rem', borderRadius: '0px', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.8rem', border: '1px solid var(--bps-card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Tujuan Unit:</span>
                <span style={{ fontWeight: '800', textAlign: 'right', color: 'var(--text-primary)' }}>{formData.tujuan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
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

            <div style={{ marginTop: '1rem', padding: '0.65rem', background: 'rgba(0, 153, 219, 0.08)', border: '1px solid rgba(0, 153, 219, 0.2)', borderRadius: '0px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
              📌 Data tamu akan otomatis disimpan ke sistem & disinkronkan ke Google Sheets.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
