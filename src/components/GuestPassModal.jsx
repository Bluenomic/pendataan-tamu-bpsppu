import React from 'react';
import { X, Printer, Building2, User, Clock, QrCode, CheckCircle } from 'lucide-react';

export default function GuestPassModal({ guest, officeName, onClose }) {
  if (!guest) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '0.75rem' }}>
          <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={18} color="var(--success)" /> Kartu Pass Tamu Digital
          </span>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Printable Pass Area */}
        <div id="printable-pass" style={{ 
          background: '#ffffff', 
          color: '#0f172a', 
          padding: '1.75rem', 
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          border: '2px dashed #cbd5e1'
        }}>
          {/* Header BPS Badge */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#312e81', color: '#fff', padding: '0.5rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Building2 size={22} color="#fff" />
              <span style={{ fontWeight: '800', fontSize: '0.9rem', letterSpacing: '0.03em' }}>
                BADAN PUSAT STATISTIK
              </span>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0.25rem 0 0', color: '#1e1b4b' }}>
              KARTU AKSES KUNJUNGAN TAMU
            </h3>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: '700', color: '#4338ca', marginTop: '0.2rem' }}>
              {guest.id}
            </div>
          </div>

          {/* Guest Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', fontSize: '0.9rem', color: '#334155' }}>
            
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>NAMA TAMU / PENANGGUNG JAWAB</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{guest.nama}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>{guest.instansi}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>TUJUAN UNIT</div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{guest.tujuan}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>ROMBONGAN</div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{guest.jumlah || 1} Orang</div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>KEPERLUAN</div>
              <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{guest.keperluan}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e0e7ff', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #c7d2fe', fontSize: '0.8rem', color: '#3730a3', fontWeight: '700' }}>
              <span>WAKTU: {guest.tanggal}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Clock size={13} /> {guest.jamMasuk} WIB
              </span>
            </div>

          </div>

          {/* QR Code Graphic & Footer */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>VALIDASI PETUGAS SECURITY:</div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981', marginTop: '0.2rem' }}>
                ✓ VERIFIED DIGITALLY
              </div>
            </div>
            <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
              <QrCode size={40} color="#312e81" />
            </div>
          </div>
        </div>

        {/* Buttons */}
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
