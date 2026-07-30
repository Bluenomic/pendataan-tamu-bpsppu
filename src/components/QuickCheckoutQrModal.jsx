import React from 'react';
import { X, Printer, QrCode, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function QuickCheckoutQrModal({ isOpen, onClose, config }) {
  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const checkoutUrl = `${currentOrigin}/?action=quick-checkout`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(checkoutUrl)}&margin=10`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-content glass-panel print-area" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '520px', padding: '1.75rem', textAlign: 'center' }}
      >
        {/* Modal Header */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--bps-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <QrCode size={20} color="var(--bps-navy)" /> Poster QR Code Quick Check-Out
          </span>
          <button className="btn btn-secondary btn-icon" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Printable Poster Container */}
        <div style={{ 
          background: '#ffffff', 
          border: '2px solid #024282', 
          borderRadius: '0px', 
          padding: '2rem 1.5rem', 
          boxShadow: '0 10px 25px rgba(2, 66, 130, 0.1)' 
        }}>
          {/* Header BPS */}
          <div style={{ borderBottom: '2px solid #024282', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#024282', letterSpacing: '0.5px' }}>
              BADAN PUSAT STATISTIK
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0099db', letterSpacing: '1px' }}>
              KABUPATEN PENAJAM PASER UTARA
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginTop: '0.2rem' }}>
              Pelayanan Statistik Terpadu (PST BPS PPU)
            </div>
          </div>

          {/* Poster Title */}
          <div style={{ 
            background: 'linear-gradient(135deg, #024282, #0077b6)', 
            color: '#ffffff', 
            padding: '0.65rem 1rem', 
            fontSize: '1rem', 
            fontWeight: '800', 
            borderRadius: '0px', 
            marginBottom: '1.25rem',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            QUICK CHECK-OUT KUNJUNGAN
          </div>

          {/* QR Code Frame */}
          <div style={{ 
            background: '#ffffff', 
            display: 'inline-block', 
            padding: '0.85rem', 
            border: '2px dashed #0077b6', 
            borderRadius: '0px',
            marginBottom: '1.25rem' 
          }}>
            <img 
              src={qrImageUrl} 
              alt="QR Code Quick Check-Out" 
              style={{ width: '225px', height: '225px', display: 'block' }}
            />
          </div>

          {/* User Instructions */}
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #bae6fd', 
            borderRadius: '0px', 
            padding: '0.85rem 1rem', 
            fontSize: '0.825rem', 
            color: '#0369a1',
            textAlign: 'left',
            marginBottom: '1rem'
          }}>
            <div style={{ fontWeight: '800', marginBottom: '0.4rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldCheck size={16} /> Cara Penggunaan:
            </div>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.5 }}>
              <li>Buka <b>Kamera Smartphone</b> atau aplikasi <b>Pemindai QR</b> Anda.</li>
              <li>Arahkan kamera ke Kode QR di atas.</li>
              <li>Seluruh tiket kunjungan aktif Anda akan <b>otomatis Check-Out Selesai</b>.</li>
            </ol>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>Tutup</button>
          <button className="btn btn-primary" onClick={handlePrint} style={{ fontWeight: '800' }}>
            <Printer size={16} /> Cetak Poster QR
          </button>
        </div>

      </div>
    </div>
  );
}
