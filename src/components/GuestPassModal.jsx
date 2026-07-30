import React, { useState } from 'react';
import { X, Printer, Clock, QrCode, CheckCircle, MapPin, LogOut, Sparkles, Trash2 } from 'lucide-react';
import { checkoutGuestAsync, syncGuestToGoogleSheets } from '../utils/storage';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function GuestPassModal({ guest, officeName, onClose, config, onUpdateLocalPass, onDeleteLocalPass }) {
  const [currentGuest, setCurrentGuest] = useState(guest);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!currentGuest) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmDeletePass = () => {
    if (onDeleteLocalPass) {
      onDeleteLocalPass(currentGuest.id);
    }
    onClose();
  };

  const handleSelfCheckout = async () => {
    setIsCheckingOut(true);
    const res = await checkoutGuestAsync(currentGuest.id);
    setIsCheckingOut(false);

    if (res && res.success) {
      const updated = {
        ...currentGuest,
        status: 'Selesai',
        jamKeluar: res.jamKeluar || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA'
      };
      setCurrentGuest(updated);
      setCheckoutMsg(`Terima kasih! Kunjungan Anda telah ditandai Selesai pada ${updated.jamKeluar}.`);

      if (onUpdateLocalPass) {
        onUpdateLocalPass(updated);
      }

      if (config && config.webhookUrl) {
        syncGuestToGoogleSheets(config.webhookUrl, updated);
      }
    } else {
      alert('Gagal melakukan check-out. Silakan coba lagi.');
    }
  };

  const isCompleted = currentGuest.status === 'Selesai';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1.5px solid var(--bps-card-border)', paddingBottom: '0.65rem' }}>
          <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--bps-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={18} color="var(--success)" /> Kartu Pass Tamu Digital PST BPS PPU
          </span>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {checkoutMsg && (
          <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '0px', border: '1px solid #86efac', fontWeight: '700', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={18} /> {checkoutMsg}
          </div>
        )}

        {/* Printable Pass Ticket - BPS PPU Official Styling */}
        <div id="printable-pass" style={{ 
          background: '#ffffff', 
          color: '#1e293b', 
          padding: '1.75rem', 
          borderRadius: '0px',
          boxShadow: '0 10px 30px rgba(0, 52, 103, 0.12)',
          border: '2px solid #024282',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          {/* Header BPS Badge */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0099db', paddingBottom: '1rem', marginBottom: '1.15rem' }}>
            <div style={{ background: '#024282', color: '#fff', padding: '0.65rem 1rem', borderRadius: '0px', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <img 
                src="/logo-bps.png" 
                alt="Logo BPS" 
                style={{ height: '36px', objectFit: 'contain', background: '#fff', padding: '2px', borderRadius: '0px' }} 
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
              ID: {currentGuest.id}
            </div>
          </div>

          {/* Guest Info Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', fontSize: '0.9rem', color: '#334155' }}>
            
            <div style={{ background: '#f8fafc', padding: '0.85rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>NAMA TAMU / PENANGGUNG JAWAB</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#024282' }}>{currentGuest.nama}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Instansi: {currentGuest.instansi}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.65rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>TUJUAN UNIT</div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#024282' }}>{currentGuest.tujuan}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.65rem', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>ROMBONGAN</div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{currentGuest.jumlah || 1} Orang</div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.65rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>KEPERLUAN KUNJUNGAN</div>
              <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{currentGuest.keperluan}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e0f2fe', padding: '0.65rem 0.85rem', border: '1px solid #7dd3fc', fontSize: '0.8rem', color: '#0369a1', fontWeight: '700' }}>
              <span>TANGGAL: {currentGuest.tanggal}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Clock size={13} /> Masuk: {currentGuest.jamMasuk} {currentGuest.jamKeluar !== '-' ? `| Keluar: ${currentGuest.jamKeluar}` : ''}
              </span>
            </div>

          </div>

          {/* Footer & Office Address */}
          <div style={{ marginTop: '1.15rem', paddingTop: '0.85rem', borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              <div style={{ fontWeight: '800', color: isCompleted ? '#16a34a' : '#024282' }}>
                {isCompleted ? '✓ KUNJUNGAN SELESAI' : '⏳ KUNJUNGAN AKTIF'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                <MapPin size={11} /> Jl. Provinsi Km.09 Nipah-Nipah, Penajam
              </div>
            </div>
            <div style={{ background: '#f1f5f9', padding: '0.4rem', border: '1px solid #cbd5e1', textAlign: 'center' }}>
              <QrCode size={40} color="#024282" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          
          {!isCompleted ? (
            <button 
              className="btn btn-success" 
              onClick={handleSelfCheckout}
              disabled={isCheckingOut}
              style={{ fontWeight: '800', flex: 1 }}
            >
              <LogOut size={16} /> Tandai Selesai (Check-Out Saya)
            </button>
          ) : (
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <CheckCircle size={16} /> Kunjungan Anda Telah Selesai
            </span>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsDeleteConfirmOpen(true)}
              title="Hapus Tiket Pass dari Perangkat Ini"
              style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2', fontWeight: '700' }}
            >
              <Trash2 size={15} /> Hapus Pass
            </button>
            <button className="btn btn-secondary" onClick={onClose}>Tutup</button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={16} /> Cetak Pass
            </button>
          </div>

        </div>

      </div>

      <ConfirmDeleteModal 
        isOpen={isDeleteConfirmOpen}
        title="Hapus Pass Kunjungan"
        message="Apakah Anda yakin ingin menghapus kartu pass kunjungan ini dari perangkat Anda?"
        itemName={`${currentGuest.nama} - ID: ${currentGuest.id}`}
        onConfirm={handleConfirmDeletePass}
        onClose={() => setIsDeleteConfirmOpen(false)}
        confirmText="Ya, Hapus Pass"
      />

    </div>
  );
}
