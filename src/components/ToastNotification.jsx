import React, { useEffect } from 'react';
import { CheckCircle2, X, Share2, AlertCircle } from 'lucide-react';

export default function ToastNotification({ message, type = 'success', onClose, duration = 3500 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isSuccess = type === 'success';

  return (
    <div style={{
      position: 'fixed',
      top: '1.25rem',
      right: '1.25rem',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.85rem 1.25rem',
      background: isSuccess ? 'rgba(22, 163, 74, 0.95)' : 'rgba(225, 29, 72, 0.95)',
      color: '#ffffff',
      borderRadius: '10px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${isSuccess ? '#4ade80' : '#fda4af'}`,
      fontSize: '0.875rem',
      fontWeight: '600',
      animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      maxWidth: '400px'
    }}>
      {isSuccess ? (
        <CheckCircle2 size={20} style={{ flexShrink: 0, color: '#86efac' }} />
      ) : (
        <AlertCircle size={20} style={{ flexShrink: 0, color: '#fca5a5' }} />
      )}
      
      <div style={{ flex: 1, lineHeight: '1.4' }}>
        {message}
      </div>

      <button 
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.8)',
          cursor: 'pointer',
          padding: '0.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'color 0.15s'
        }}
        title="Tutup Notifikasi"
      >
        <X size={16} />
      </button>
    </div>
  );
}
