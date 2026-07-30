import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  HelpCircle, 
  Save, 
  FileCode,
  KeyRound,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/googleScriptTemplate';

export default function GoogleSheetsModal({ config, currentAdminPin, onSaveConfig, onClose }) {
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(config.spreadsheetUrl || '');
  const [officeName, setOfficeName] = useState(config.officeName || 'Badan Pusat Statistik Kabupaten Penajam Paser Utara');
  const [adminPin, setAdminPin] = useState(currentAdminPin || config.adminPin || '');
  const [showPin, setShowPin] = useState(false); // Censor toggle state
  
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (currentAdminPin) {
      setAdminPin(currentAdminPin);
    }
  }, [currentAdminPin]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setTestResult({ success: false, message: 'Isi URL Webhook terlebih dahulu!' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const testPayload = {
      id: 'TEST-PPU-001',
      nama: 'Uji Koneksi BPS PPU',
      noHp: '08123456789',
      instansi: 'Badan Pusat Statistik Penajam Paser Utara',
      nik: '6409000000000000',
      tujuan: 'Uji Sistem Webhook Google Sheets',
      keperluan: 'Pengujian Sinkronisasi Otomatis Buku Tamu',
      jumlah: 1,
      tanggal: new Date().toISOString().split('T')[0],
      jamMasuk: '08:00 WITA',
      jamKeluar: '-',
      status: 'Selesai',
      catatan: 'Data Pengujian Otomatis'
    };

    try {
      await fetch(webhookUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      
      setTestResult({ 
        success: true, 
        message: '✅ Sinyal Webhook Terkirim! Periksa tabel Google Sheets Anda, baris "Uji Koneksi BPS PPU" harus telah muncul.' 
      });
    } catch (err) {
      setTestResult({ 
        success: false, 
        message: `❌ Gagal menghubungi Webhook: ${err.message}` 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!adminPin.trim()) {
      alert('PIN Admin tidak boleh kosong!');
      return;
    }
    onSaveConfig({
      ...config,
      webhookUrl: webhookUrl.trim(),
      spreadsheetUrl: spreadsheetUrl.trim(),
      officeName: officeName.trim(),
      adminPin: adminPin.trim()
    });
    onClose();
  };

  const isConnected = Boolean(webhookUrl.trim());

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1.5px solid var(--bps-card-border)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: '#024282', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Share2 size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Integrasi Google Sheets & Pengaturan</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Sinkronkan data pendaftaran tamu ke spreadsheet secara online</p>
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
            <Share2 size={14} /> Pengaturan Webhook & PIN
          </button>
          <button 
            className={`btn btn-sm ${activeTab === 'guide' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('guide')}
            style={{ flex: 1 }}
          >
            <HelpCircle size={14} /> Panduan & Kode Google Script
          </button>
        </div>

        {activeTab === 'settings' ? (
          <div>

            {/* Connection Status Badge */}
            <div style={{ 
              background: isConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
              border: `1px solid ${isConnected ? '#22c55e' : '#f59e0b'}`,
              borderRadius: '8px', 
              padding: '0.75rem 1rem', 
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isConnected ? <CheckCircle2 size={18} color="#22c55e" /> : <AlertCircle size={18} color="#f59e0b" />}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: isConnected ? '#15803d' : '#b45309' }}>
                    {isConnected ? 'Status Webhook: Terhubung' : 'Status Webhook: Belum Terisi'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isConnected ? 'Data tamu baru akan otomatis disinkronkan ke Google Sheets.' : 'Isi URL Webhook Google Apps Script di bawah untuk mengaktifkan sinkronisasi.'}
                  </div>
                </div>
              </div>

              <a 
                href="https://sheets.new" 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', fontWeight: '700', whiteSpace: 'nowrap' }}
              >
                <ExternalLink size={13} /> Buat Sheet Baru
              </a>
            </div>
            
            {/* PIN Admin Setting with Sensor & Eye Toggle */}
            <div className="form-group" style={{ background: 'rgba(2, 66, 130, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(2, 66, 130, 0.2)', marginBottom: '1rem' }}>
              <label className="form-label" style={{ color: 'var(--bps-navy)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <KeyRound size={15} /> PIN Akses Petugas / Admin (Tersimpan di Database)
              </label>
              
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPin ? 'text' : 'password'}
                  className="form-input"
                  style={{ 
                    paddingRight: '2.5rem', 
                    fontWeight: '800', 
                    letterSpacing: showPin ? 'normal' : '0.25em',
                    fontSize: '1rem'
                  }}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Masukkan PIN Admin"
                  autoComplete="new-password"
                />
                <button 
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.25rem'
                  }}
                  title={showPin ? 'Sembunyikan PIN (Sensor)' : 'Tampilkan PIN'}
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', margin: 0 }}>
                PIN yang tersimpan di database `buku_tamu.db`. Klik ikon mata untuk melihat/menyensor PIN.
              </p>
            </div>

            {/* Google Sheets Webhook URL */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: '700' }}>URL Webhook Google Apps Script</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="url" 
                  className="form-input"
                  style={{ flex: 1 }}
                  value={webhookUrl}
                  onChange={(e) => {
                    setWebhookUrl(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleTestWebhook}
                  disabled={isTesting || !webhookUrl.trim()}
                  style={{ fontWeight: '700', flexShrink: 0 }}
                  title="Kirim payload uji ke Google Sheets"
                >
                  {isTesting ? <Loader2 size={15} className="spin" /> : <Zap size={15} color="#eab308" />}
                  {isTesting ? 'Menguji...' : 'Uji Koneksi'}
                </button>
              </div>
            </div>

            {/* Test Result Message Banner */}
            {testResult && (
              <div style={{ 
                background: testResult.success ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                border: `1px solid ${testResult.success ? '#22c55e' : '#ef4444'}`,
                color: testResult.success ? '#15803d' : '#b91c1c',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                {testResult.message}
              </div>
            )}

            {/* Direct Google Spreadsheet View Link */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: '700' }}>Link / URL File Google Spreadsheet (Untuk Tombol Buka Spreadsheet)</label>
              <input 
                type="url" 
                className="form-input"
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', margin: 0 }}>
                Tempel link Google Spreadsheet Anda di sini agar tombol "Buka Google Sheets" di Admin Panel langsung membuka dokumen Anda secara otomatis.
              </p>
            </div>

            {/* Nama Instansi */}
            <div className="form-group">
              <label className="form-label">Nama Instansi / Kantor BPS</label>
              <input 
                type="text" 
                className="form-input"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="Contoh: Badan Pusat Statistik Kabupaten Penajam Paser Utara"
              />
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
                📋 3 Langkah Praktis Menghubungkan Google Sheets:
              </h4>
              <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
                <li>Buka Google Sheets baru di <a href="https://sheets.new" target="_blank" rel="noreferrer" style={{ color: 'var(--bps-cyan)', textDecoration: 'underline', fontWeight: '700' }}>sheets.new <ExternalLink size={11} style={{ display: 'inline' }} /></a></li>
                <li>Klik menu <b>Ekstensi</b> → <b>Apps Script</b>. Hapus semua kode default, lalu salin (*paste*) kode di bawah.</li>
                <li>Klik <b>Terapkan (Deploy)</b> → <b>Penetapan Baru (New Deployment)</b> → Pilih <b>Aplikasi Web (Web App)</b>. Setel <i>Akses: Siapa Saja (Anyone)</i>. Salin URL deployment ke tab <b>Pengaturan Webhook</b>!</li>
              </ol>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--bps-navy)' }}>
                <FileCode size={16} /> Google Apps Script Code (Ready to Copy)
              </span>
              <button className="btn btn-primary btn-sm" onClick={handleCopyCode} style={{ fontWeight: '700' }}>
                {copied ? <Check size={14} color="#ffffff" /> : <Copy size={14} />}
                {copied ? 'Tersalin ke Clipboard!' : '1-Click Salin Kode Script'}
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
