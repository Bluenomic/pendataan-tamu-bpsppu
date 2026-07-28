import React, { useState } from 'react';
import SpreadsheetTable from '../components/SpreadsheetTable';
import AnalyticsView from '../components/AnalyticsView';
import GoogleSheetsModal from '../components/GoogleSheetsModal';
import GuestPassModal from '../components/GuestPassModal';
import EditGuestModal from '../components/EditGuestModal';
import ToastNotification from '../components/ToastNotification';
import { 
  getGuestDataAsync, 
  saveSingleGuestAsync, 
  updateSingleGuestAsync, 
  deleteSingleGuestAsync, 
  importGuestsAsync, 
  saveAppConfigAsync, 
  syncBatchGuestsToGoogleSheets 
} from '../utils/storage';
import { 
  Lock, 
  KeyRound, 
  LogOut, 
  FileSpreadsheet, 
  BarChart3, 
  Settings, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert,
  ArrowLeft,
  Sun,
  Moon
} from 'lucide-react';

export default function AdminPage({ config, onSaveConfig, theme, toggleTheme }) {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [currentAdminPin, setCurrentAdminPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'analytics'
  const [guests, setGuests] = useState([]);
  
  // Modals & Toast notification
  const [selectedPassGuest, setSelectedPassGuest] = useState(null);
  const [editingGuest, setEditingGuest] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Check login on submit
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setLoginError('Masukkan PIN Admin!');
      return;
    }

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput })
      });

      if (response.ok) {
        const pin = pinInput.trim();
        setIsAdminUnlocked(true);
        setCurrentAdminPin(pin);
        setLoginError('');

        // Fetch protected guest data using PIN header
        const fetchedGuests = await getGuestDataAsync(pin);
        setGuests(fetchedGuests);
        return;
      }
    } catch (err) {
      console.error('Login request failed:', err);
    }

    setLoginError('PIN Admin Salah! Silakan coba lagi.');
    setPinInput('');
  };

  // Lock / Logout Admin
  const handleLogout = () => {
    setIsAdminUnlocked(false);
    setCurrentAdminPin('');
    setGuests([]);
    setPinInput('');
    setLoginError('');
  };

  // Save Settings & PIN Admin to SQLite Database
  const handleSaveConfigAdmin = async (newConfig) => {
    await saveAppConfigAsync(newConfig, currentAdminPin);
    
    if (newConfig.adminPin) {
      setCurrentAdminPin(newConfig.adminPin);
    }

    onSaveConfig(newConfig);
    setToast({ message: 'Pengaturan & PIN Admin berhasil disimpan ke database!', type: 'success' });
  };

  // Update Single Guest
  const handleUpdateGuest = async (updatedGuest) => {
    setGuests(prev => prev.map(g => g.id === updatedGuest.id ? updatedGuest : g));
    await updateSingleGuestAsync(updatedGuest, currentAdminPin);
  };

  // Delete Guest
  const handleDeleteGuest = async (id) => {
    setGuests(prev => prev.filter(g => g.id !== id));
    await deleteSingleGuestAsync(id, currentAdminPin);
    setToast({ message: 'Data tamu berhasil dihapus.', type: 'success' });
  };

  // Import Guests from Excel
  const handleImportGuests = async (importedList) => {
    setGuests(prev => [...importedList, ...prev]);
    await importGuestsAsync(importedList, currentAdminPin);
    setToast({ message: `Berhasil mengimpor ${importedList.length} data dari Excel!`, type: 'success' });
  };

  // Add Manual Guest
  const handleAddNewManual = async () => {
    const now = new Date();
    const manualGuest = {
      id: `BPS-PPU-MAN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      nama: 'Tamu Baru',
      noHp: '-',
      instansi: 'Umum / Instansi',
      nik: '-',
      tujuan: 'Pelayanan Statistik Terpadu (PST)',
      keperluan: 'Konsultasi Data & Informasi Statistik',
      jumlah: 1,
      tanggal: now.toISOString().split('T')[0],
      jamMasuk: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WITA`,
      jamKeluar: '-',
      status: 'Menunggu',
      catatan: 'Diinput manual dari tabel admin',
      ttd: ''
    };
    
    setGuests(prev => [manualGuest, ...prev]);
    await saveSingleGuestAsync(manualGuest);
    setEditingGuest(manualGuest);
  };

  // Sync to Google Sheets (Non-blocking Background Sync - Clean Toast)
  const handleSyncGoogleSheets = () => {
    if (!config.webhookUrl) {
      setToast({ message: 'URL Webhook Google Sheets belum diisi! Silakan atur di Pengaturan.', type: 'error' });
      setIsConfigModalOpen(true);
      return;
    }

    if (guests.length === 0) {
      setToast({ message: 'Tabel saat ini kosong, tidak ada data untuk disinkronkan.', type: 'error' });
      return;
    }

    // Trigger background sync without blocking UI
    syncBatchGuestsToGoogleSheets(config.webhookUrl, guests);

    // Show sleek pop-up notification
    setToast({ 
      message: `Data tamu (${guests.length} baris) berhasil disinkronkan ke Google Sheets!`, 
      type: 'success' 
    });
  };

  const isSheetsConnected = Boolean(config?.webhookUrl);

  /* --------------------------------------------------------------------------
     A. LOGIN SCREEN (If not authenticated)
     -------------------------------------------------------------------------- */
  if (!isAdminUnlocked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bps-bg)', padding: '1rem' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '1.75rem', textAlign: 'center', background: 'var(--bps-card)' }}>
          
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--bps-navy)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700', marginBottom: '1.25rem' }}>
            <ArrowLeft size={14} /> Kembali ke Mode Kios Tamu
          </a>

          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <img src="/logo-bps.png" alt="Logo BPS" style={{ height: '44px', objectFit: 'contain', margin: '0 auto 0.75rem' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--bps-navy)' }}>
              Portal Pengelolaan Admin PST
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              BPS Kabupaten Penajam Paser Utara
            </p>
          </div>

          {loginError && (
            <div style={{ 
              background: 'var(--danger-bg)', 
              color: 'var(--danger)', 
              padding: '0.65rem 0.85rem', 
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
              <ShieldAlert size={16} /> {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} autoComplete="off">
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ textAlign: 'left' }}>Masukkan PIN Admin</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', textAlign: 'center', fontSize: '1rem', fontWeight: '600' }}
                  placeholder="Masukkan PIN Admin"
                  maxLength="12"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  autoComplete="new-password"
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', minHeight: '44px' }}>
              <Lock size={16} /> Masuk ke Dashboard Admin
            </button>
          </form>

        </div>
      </div>
    );
  }

  /* --------------------------------------------------------------------------
     B. ADMIN DASHBOARD PORTAL (Once Authenticated - Fully Responsive)
     -------------------------------------------------------------------------- */
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bps-bg)' }}>
      
      {/* Toast Notification Pop-up */}
      {toast && (
        <ToastNotification 
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Admin Top Header Bar - Responsive Container */}
      <header style={{ background: '#024282', color: '#ffffff', padding: '0.85rem 1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <div className="admin-header-responsive">
            
            {/* Logo & Title Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src="/logo-bps.png" alt="Logo BPS" style={{ height: '34px', objectFit: 'contain' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                    PORTAL ADM BPS PPU
                  </h1>
                  <span style={{ background: '#16a34a', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: '800' }}>
                    ONLINE
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#38bdf8', margin: 0, fontWeight: '600' }}>
                  Pengelolaan Buku Tamu PST
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="admin-nav-tabs">
              <button 
                className={`bps-tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                onClick={() => setActiveTab('table')}
              >
                <FileSpreadsheet size={16} />
                <span>Tabel Data</span>
              </button>

              <button 
                className={`bps-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <BarChart3 size={16} />
                <span>Analitik</span>
              </button>
            </nav>

            {/* Right Action Icons & Controls */}
            <div className="admin-controls-flex">
              
              {/* Google Sheets Status */}
              <button 
                onClick={() => setIsConfigModalOpen(true)}
                className="btn-admin-header-action"
                title="Pengaturan Google Sheets Sync"
              >
                <Share2 size={14} color={isSheetsConnected ? '#4ade80' : '#fbbf24'} />
                <span className="hide-on-mobile">Sheets: </span>
                {isSheetsConnected ? (
                  <span style={{ color: '#4ade80', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <CheckCircle2 size={13} /> Aktif
                  </span>
                ) : (
                  <span style={{ color: '#fbbf24', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <AlertCircle size={13} /> Off
                  </span>
                )}
              </button>

              {/* Settings */}
              <button 
                onClick={() => setIsConfigModalOpen(true)}
                className="btn-admin-icon"
                title="Pengaturan Aplikasi & PIN Admin"
              >
                <Settings size={17} />
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="btn-admin-icon"
                title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              >
                {theme === 'dark' ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="#38bdf8" />}
              </button>

              {/* Switch to Kiosk View */}
              <a 
                href="/" 
                className="btn btn-secondary btn-sm btn-kiosk-responsive"
                style={{ background: '#ffffff', color: '#024282', fontWeight: '800' }}
              >
                <ArrowLeft size={14} /> Kios
              </a>

              {/* Logout Admin Button */}
              <button 
                onClick={handleLogout}
                className="btn btn-danger btn-sm"
              >
                <LogOut size={14} /> Lock
              </button>

            </div>

          </div>

        </div>
      </header>

      {/* Main Admin Content */}
      <main style={{ flex: 1, paddingTop: '1rem', paddingBottom: '2rem' }}>
        {activeTab === 'table' && (
          <SpreadsheetTable 
            guests={guests}
            config={config}
            onUpdateGuest={handleUpdateGuest}
            onDeleteGuest={handleDeleteGuest}
            onImportGuests={handleImportGuests}
            onSyncGoogleSheets={handleSyncGoogleSheets}
            onShowPass={(guest) => setSelectedPassGuest(guest)}
            onEditGuest={(guest) => setEditingGuest(guest)}
            onAddNewManual={handleAddNewManual}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView guests={guests} />
        )}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--bps-card-border)', background: 'var(--bps-card)' }}>
        <div>
          © 2026 <b>BPS Buku Tamu Digital</b> • Portal Admin BPS Kabupaten Penajam Paser Utara
        </div>
      </footer>

      {/* Modals */}
      {isConfigModalOpen && (
        <GoogleSheetsModal 
          config={config}
          currentAdminPin={currentAdminPin}
          onSaveConfig={handleSaveConfigAdmin}
          onClose={() => setIsConfigModalOpen(false)}
        />
      )}

      {selectedPassGuest && (
        <GuestPassModal 
          guest={selectedPassGuest}
          officeName={config.officeName}
          onClose={() => setSelectedPassGuest(null)}
        />
      )}

      {editingGuest && (
        <EditGuestModal 
          guest={editingGuest}
          onSave={handleUpdateGuest}
          onClose={() => setEditingGuest(null)}
        />
      )}

    </div>
  );
}
