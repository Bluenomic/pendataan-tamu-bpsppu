import React, { useState, useEffect } from 'react';
import { X, Ticket, Eye, LogOut, CheckCircle2, Clock, Building, Trash2 } from 'lucide-react';
import { checkoutGuestAsync, syncGuestToGoogleSheets, fetchPassesStatusAsync } from '../utils/storage';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function PassSelectorModal({ passes, config, onSelectPass, onUpdatePass, onDeleteLocalPass, onClose }) {
  const [passToDelete, setPassToDelete] = useState(null);

  // Live Sync status for all passes in selector list
  useEffect(() => {
    if (!Array.isArray(passes) || passes.length === 0) return;

    let isMounted = true;
    const checkPasses = async () => {
      try {
        const ids = passes.map(p => p.id);
        const serverStatuses = await fetchPassesStatusAsync(ids);
        if (!isMounted || !Array.isArray(serverStatuses) || serverStatuses.length === 0) return;

        serverStatuses.forEach(s => {
          const localMatch = passes.find(p => p.id === s.id);
          if (localMatch && (localMatch.status !== s.status || (s.jamKeluar && s.jamKeluar !== localMatch.jamKeluar))) {
            onUpdatePass({
              ...localMatch,
              status: s.status,
              jamKeluar: s.jamKeluar || localMatch.jamKeluar
            });
          }
        });
      } catch (e) {
        console.error('Failed selector modal status sync:', e);
      }
    };

    checkPasses();
    const intervalId = setInterval(checkPasses, 2000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [passes, onUpdatePass]);

  const handleCheckOutSingle = async (passItem, e) => {
    e.stopPropagation();
    if (passItem.status === 'Selesai') return;

    const res = await checkoutGuestAsync(passItem.id);
    if (res && res.success) {
      const updatedPass = {
        ...passItem,
        status: 'Selesai',
        jamKeluar: res.jamKeluar || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA'
      };

      onUpdatePass(updatedPass);

      if (config && config.webhookUrl) {
        syncGuestToGoogleSheets(config.webhookUrl, updatedPass);
      }
    } else {
      alert('Gagal melakukan check-out. Silakan coba lagi.');
    }
  };

  const handleConfirmDeleteSingle = () => {
    if (passToDelete && onDeleteLocalPass) {
      onDeleteLocalPass(passToDelete.id);
    }
    setPassToDelete(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', padding: '1.5rem' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1.5px solid var(--bps-card-border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: '#024282', padding: '0.4rem', borderRadius: '0px' }}>
              <Ticket size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--bps-navy)' }}>
                Daftar Tiket Pass Saya ({passes.length})
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Pilih tiket pass untuk melihat rincian, check-out, atau menghapus dari perangkat
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Passes Cards List */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {passes.map((passItem, index) => {
            const isCompleted = passItem.status === 'Selesai';
            return (
              <div 
                key={passItem.id || index}
                style={{
                  background: 'var(--bps-bg)',
                  border: '1.5px solid var(--bps-card-border)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {passItem.nama}
                    </span>
                    <span className={`status-badge status-${isCompleted ? 'selesai' : passItem.status === 'Sedang Bertemu' ? 'bertemu' : 'menunggu'}`} style={{ fontSize: '0.65rem' }}>
                      {isCompleted ? '✓ Selesai' : passItem.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    🏢 {passItem.instansi} ({passItem.jumlah || 1} Org)
                  </div>

                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'monospace' }}>
                    ID: {passItem.id} • Masuk: {passItem.jamMasuk} {passItem.jamKeluar !== '-' ? `| Keluar: ${passItem.jamKeluar}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onSelectPass(passItem);
                      onClose();
                    }}
                    style={{ fontWeight: '800', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    <Eye size={13} /> Lihat
                  </button>

                  {!isCompleted ? (
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={(e) => handleCheckOutSingle(passItem, e)}
                      style={{ fontWeight: '800', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      <LogOut size={13} /> Check-Out
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                      <CheckCircle2 size={13} /> Selesai
                    </span>
                  )}

                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPassToDelete(passItem);
                    }}
                    style={{ padding: '0.35rem 0.5rem', color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
                    title="Hapus Pass dari Perangkat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--bps-card-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Tutup</button>
        </div>

      </div>

      <ConfirmDeleteModal 
        isOpen={Boolean(passToDelete)}
        title="Hapus Pass Kunjungan"
        message="Apakah Anda yakin ingin menghapus pass kunjungan ini dari perangkat Anda?"
        itemName={passToDelete ? `${passToDelete.nama} - ID: ${passToDelete.id}` : ''}
        onConfirm={handleConfirmDeleteSingle}
        onClose={() => setPassToDelete(null)}
        confirmText="Ya, Hapus Pass"
      />

    </div>
  );
}
