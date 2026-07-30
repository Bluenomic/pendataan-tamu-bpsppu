import React, { useEffect } from 'react';
import { CheckCircle2, Sparkles, X, Building, Clock, Ticket } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function QuickCheckoutSuccessModal({ isOpen, checkedOutCount, checkedOutPasses = [], onClose, officeName }) {
  useEffect(() => {
    if (isOpen && checkedOutCount > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.warn('Confetti effect error:', e);
      }
    }
  }, [isOpen, checkedOutCount]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)' }}>
      <div 
        className="modal-content glass-panel" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '480px', 
          padding: '1.75rem', 
          textAlign: 'center', 
          border: '2px solid #16a34a',
          boxShadow: '0 20px 40px rgba(22, 163, 74, 0.2)',
          animation: 'modalSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header Icon */}
        <div style={{ margin: '0 auto 1rem', width: '64px', height: '64px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #86efac' }}>
          <CheckCircle2 size={38} color="#16a34a" />
        </div>

        <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--text-primary)', margin: '0 0 0.4rem 0' }}>
          {checkedOutCount > 0 ? 'Check-Out Berhasil!' : 'Status Kunjungan Selesai'}
        </h2>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
          {checkedOutCount > 0 ? (
            <>
              Terima kasih telah berkunjung ke <b>{officeName || 'Badan Pusat Statistik Kabupaten Penajam Paser Utara'}</b>. 
              <br />
              <span style={{ color: '#16a34a', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem' }}>
                <Sparkles size={15} /> {checkedOutCount} Pass Kunjungan Aktif Anda Telah Selesai!
              </span>
            </>
          ) : (
            'Seluruh tiket pass kunjungan tersimpan di perangkat ini sudah berstatus Selesai.'
          )}
        </p>

        {/* List of checked out passes */}
        {checkedOutPasses.length > 0 && (
          <div style={{ background: 'var(--bps-bg)', border: '1px solid var(--bps-card-border)', padding: '0.85rem', textAlign: 'left', marginBottom: '1.25rem', maxHeight: '180px', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Ticket size={12} /> Tiket Pass Yang Dicheck-Out:
            </div>
            {checkedOutPasses.map((p, idx) => (
              <div key={p.id || idx} style={{ padding: '0.4rem 0', borderBottom: idx < checkedOutPasses.length - 1 ? '1px dashed var(--bps-card-border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{p.nama}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.instansi} • ID: {p.id}</div>
                </div>
                <span className="status-badge status-selesai" style={{ fontSize: '0.65rem' }}>
                  ✓ {p.jamKeluar || 'Selesai'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Close Action */}
        <button 
          className="btn btn-success" 
          onClick={onClose}
          style={{ width: '100%', fontWeight: '800', padding: '0.75rem', fontSize: '0.95rem' }}
        >
          Selesai & Tutup
        </button>

      </div>
    </div>
  );
}
