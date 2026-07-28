import React from 'react';
import { X, Printer, Clock, QrCode, CheckCircle, MapPin } from 'lucide-react';

export default function GuestPassModal({ guest, officeName, onClose }) {
  if (!guest) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1.5px solid var(--bps-card-border)', paddingBottom: '0.65rem' }}>
          <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--bps-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={18} color="var(--success)" /> Kartu Pass Tamu Digital PST BPS PPU
          </span>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Printable Pass Ticket - BPS PPU Official Styling */}
        <div id="printable-pass" style={{ 
          background: '#ffffff', 
          color: '#1e293b', 
          padding: '1.75rem', 
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 52, 103, 0.12)',
          border: '2px solid #024282',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          {/* Header BPS Badge */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0099db', paddingBottom: '1rem', marginBottom: '1.15rem' }}>
            <div style={{ background: '#024282', color: '#fff', padding: '0.65rem 1rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <img 
                src="/logo-bps.png" 
                alt="Logo BPS" 
                style={{ height: '36px', objectFit: 'contain', background: '#fff', padding: '2px', borderRadius: '4px' }} 
              />
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontWeight: '800', fontSize: '0.85rem', letterSpacing: '0.04em', display: 'block', fontStyle: 'italic' }}>
                  BADAN PUSAT STATISTIK
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#38bdf8', letterSpacing: '0.02em', display: 'block', fontStyle: 'italic' }}>
                  KABUPATEN PENAJAM PASER UTARA
                </span>
              </div>
            </div>
            
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0.4rem 0 0', color: '#024282', letterSpacing: '-0.01em' }}>
              PAS KUNJUNGAN PELAYANAN STATISTIK TERPADU
            </h3>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: '800', color: '#0099db', marginTop: '0.2rem' }}>
              ID: {guest.id}
            </div>
          </div>

          {/* Guest Info Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', fontSize: '0.9rem', color: '#334155' }}>
            
            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>NAMA TAMU / PENANGGUNG JAWAB</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#024282' }}>{guest.nama}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Instansi: {guest.instansi}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>TUJUAN UNIT</div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#024282' }}>{guest.tujuan}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>ROMBONGAN</div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{guest.jumlah || 1} Orang</div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>KEPERLUAN KUNJUNGAN</div>
              <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{guest.keperluan}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e0f2fe', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #7dd3fc', fontSize: '0.8rem', color: '#0369a1', fontWeight: '700' }}>
              <span>TANGGAL: {guest.tanggal}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Clock size={13} /> {guest.jamMasuk}
              </span>
            </div>

          </div>

          {/* Footer & Office Address */}
          <div style={{ marginTop: '1.15rem', paddingTop: '0.85rem', borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              <div style={{ fontWeight: '800', color: '#16a34a' }}>✓ TERVERIFIKASI SISTEM PST</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                <MapPin size={11} /> Jl. Provinsi Km.09 Nipah-Nipah, Penajam
              </div>
            </div>
            <div style={{ background: '#f1f5f9', padding: '0.4rem', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
              <QrCode size={40} color="#024282" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>Tutup</button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Cetak Pass Tamu
          </button>
        </div>

      </div>
    </div>
  );
}
