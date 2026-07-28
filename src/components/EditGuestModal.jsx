import React, { useState } from 'react';
import { X, Save, Edit3 } from 'lucide-react';

export default function EditGuestModal({ guest, onSave, onClose }) {
  const [formData, setFormData] = useState({ ...guest });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.4rem', borderRadius: '8px' }}>
              <Edit3 size={18} color="#fff" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Edit Data Kunjungan Tamu</h3>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Nama Lengkap Tamu</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">No. HP / WhatsApp</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.noHp}
                onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status Kunjungan</label>
              <select 
                className="form-select"
                value={formData.status}
                onChange={(e) => {
                  const status = e.target.value;
                  let jamKeluar = formData.jamKeluar;
                  if (status === 'Selesai' && jamKeluar === '-') {
                    const now = new Date();
                    jamKeluar = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                  }
                  setFormData({ ...formData, status, jamKeluar });
                }}
              >
                <option value="Menunggu">Menunggu</option>
                <option value="Sedang Bertemu">Sedang Bertemu</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Asal Instansi / Perusahaan</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.instansi}
                onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Dituju</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.tujuan}
                onChange={(e) => setFormData({ ...formData, tujuan: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jumlah Rombongan</label>
              <input 
                type="number"
                min="1" 
                className="form-input"
                value={formData.jumlah || 1}
                onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value, 10) || 1 })}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Keperluan</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.keperluan}
                onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jam Masuk</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.jamMasuk}
                onChange={(e) => setFormData({ ...formData, jamMasuk: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Jam Keluar</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.jamKeluar}
                onChange={(e) => setFormData({ ...formData, jamKeluar: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Catatan Tambahan</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.catatan || ''}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              />
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Simpan Perubahan
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
