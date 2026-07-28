import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  HelpCircle, 
  Save, 
  FileCode,
  KeyRound 
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/googleScriptTemplate';

export default function GoogleSheetsModal({ config, onSaveConfig, onClose }) {
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [officeName, setOfficeName] = useState(config.officeName || 'Badan Pusat Statistik Kabupaten Penajam Paser Utara');
  const [adminPin, setAdminPin] = useState(config.adminPin || '1234');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!adminPin.trim()) {
      alert('PIN Admin tidak boleh kosong!');
      return;
    }
    onSaveConfig({
      ...config,
      webhookUrl: webhookUrl.trim(),
      officeName: officeName.trim(),
      adminPin: adminPin.trim()
    });
    alert('Pengaturan & PIN Admin berhasil disimpan!');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1.5px solid var(--bps-card-border)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: '#024282', padding: '0.45rem', borderRadius: '8px' }}>
              <Share2 size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Pengaturan Aplikasi & Hak Akses</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Kelola PIN Admin & Webhook Google Sheets</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--bps-bg)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--bps-card-border)' }}>
          <button 
            className={`btn btn-sm ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('settings')}
            style={{ flex: 1 }}
          >
            <Share2 size={14} /> Pengaturan & PIN Admin
          </button>
          <button 
            className={`btn btn-sm ${activeTab === 'guide' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('guide')}
            style={{ flex: 1 }}
          >
            <HelpCircle size={14} /> Panduan Google Sheets
          </button>
        </div>

        {activeTab === 'settings' ? (
          <div>
            
            {/* PIN Admin Setting */}
            <div className="form-group" style={{ background: 'rgba(2, 66, 130, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(2, 66, 130, 0.2)' }}>
              <label className="form-label" style={{ color: 'var(--bps-navy)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <KeyRound size={15} /> PIN Akses Petugas / Admin
              </label>
              <input 
                type="text" 
                className="form-input"
                style={{ fontWeight: '800', letterSpacing: '0.1em' }}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Contoh: 1234"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                PIN ini digunakan untuk mengunci & membuka akses tabel spreadsheet, fitur edit/hapus, serta analitik dari pengunjung umum.
              </p>
            </div>

            {/* Nama Instansi */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Nama Instansi / Kantor BPS</label>
              <input 
                type="text" 
                className="form-input"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="Contoh: Badan Pusat Statistik Kabupaten Penajam Paser Utara"
              />
            </div>

            {/* Google Sheets Webhook URL */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Google Apps Script Webhook URL</label>
              <input 
                type="url" 
                className="form-input"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Jika URL ini diisi, setiap ada data tamu baru akan langsung terkirim otomatis ke Google Sheets milik Anda!
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={onClose}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>
                <Save size={16} /> Simpan Pengaturan
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ background: 'var(--bps-bg)', padding: '1rem', borderRadius: '8px', fontSize: '0.825rem', lineHeight: '1.6', marginBottom: '1rem', border: '1px solid var(--bps-card-border)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '0.4rem', color: 'var(--bps-navy)' }}>
                📋 3 Langkah Mudah Menghubungkan ke Google Sheets:
              </h4>
              <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                <li>Buka Google Sheets baru di <a href="https://sheets.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--bps-cyan)', textDecoration: 'underline' }}>sheets.google.com <ExternalLink size={11} style={{ display: 'inline' }} /></a></li>
                <li>Klik menu <b>Ekstensi</b> → <b>Apps Script</b>. Hapus semua isi default, lalu paste kode di bawah.</li>
                <li>Klik <b>Terapkan (Deploy)</b> → <b>Penetapan Baru (New Deployment)</b> → Pilih <b>Aplikasi Web</b> (Akses: <i>Siapa Saja / Anyone</i>). Copy URL hasil deployment dan salin ke form di tab sebelah!</li>
              </ol>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--bps-navy)' }}>
                <FileCode size={16} /> Google Apps Script Code
              </span>
              <button className="btn btn-secondary btn-sm" onClick={handleCopyCode}>
                {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                {copied ? 'Tercopy!' : 'Salin Kode Script'}
              </button>
            </div>

            <pre style={{ 
              background: '#0f172a', 
              color: '#38bdf8', 
              padding: '1rem', 
              borderRadius: '8px', 
              fontSize: '0.75rem', 
              maxHeight: '220px', 
              overflowY: 'auto',
              border: '1px solid var(--bps-card-border)',
              fontFamily: 'monospace'
            }}>
              {GOOGLE_APPS_SCRIPT_CODE}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}
