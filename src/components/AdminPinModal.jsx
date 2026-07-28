import React, { useState } from 'react';
import { Lock, KeyRound, X, Check, ShieldAlert } from 'lucide-react';

export default function AdminPinModal({ onUnlock, onClose, targetTabName }) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Masukkan PIN Admin!');
      return;
    }
    const success = onUnlock(pin);
    if (!success) {
      setErrorMsg('PIN Admin salah! Silakan coba lagi.');
      setPin('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
        
        {/* Modal Close Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Lock Icon Badge */}
        <div style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          background: '#024282', 
          margin: '0 auto 1rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(2, 66, 130, 0.3)'
        }}>
          <Lock size={32} color="#ffffff" />
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
          Autentikasi Hak Akses Admin
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 1.25rem' }}>
          {targetTabName ? `Akses fitur "${targetTabName}" memerlukan PIN Petugas/Admin.` : 'Masukkan PIN Admin untuk mengelola data buku tamu.'}
        </p>

        {errorMsg && (
          <div style={{ 
            background: 'var(--danger-bg)', 
            color: 'var(--danger)', 
            padding: '0.6rem 0.85rem', 
            borderRadius: '6px', 
            fontSize: '0.8rem', 
            fontWeight: '700', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            border: '1px solid rgba(220, 38, 38, 0.3)'
          }}>
            <ShieldAlert size={15} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="form-input"
                style={{ paddingLeft: '2.5rem', textAlign: 'center', fontSize: '1rem', fontWeight: '600' }}
                placeholder="Masukkan PIN Admin"
                maxLength="12"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg('');
                }}
                autoComplete="new-password"
                autoFocus
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Check size={16} /> Buka Akses
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
