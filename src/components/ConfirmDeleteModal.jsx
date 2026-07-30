import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmDeleteModal({ 
  isOpen, 
  title = 'Konfirmasi Penghapusan',
  message = 'Apakah Anda yakin ingin menghapus data ini?',
  itemName = '',
  onConfirm, 
  onClose,
  confirmText = 'Ya, Hapus Data',
  cancelText = 'Batal'
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose} 
      style={{ zIndex: 10000, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div 
        className="modal-content glass-panel" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '460px', 
          padding: '1.75rem', 
          borderRadius: '0px', 
          border: '1.5px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 20px 40px rgba(220, 38, 38, 0.15)',
          animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '0.55rem', borderRadius: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={22} color="#dc2626" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                {title}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Message Content */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          <p style={{ margin: '0 0 0.75rem 0', fontWeight: '500', lineHeight: 1.5 }}>
            {message}
          </p>

          {itemName && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px border-dashed #fca5a5', 
              borderLeft: '4px solid #dc2626',
              padding: '0.75rem 1rem', 
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#991b1b',
              wordBreak: 'break-word'
            }}>
              "{itemName}"
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{ fontWeight: '700' }}
          >
            {cancelText}
          </button>
          
          <button 
            type="button" 
            className="btn btn-danger" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{ 
              background: '#dc2626', 
              color: '#ffffff', 
              fontWeight: '800', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
          >
            <Trash2 size={16} />
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
