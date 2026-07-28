import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import GuestForm from './components/GuestForm';
import SpreadsheetTable from './components/SpreadsheetTable';
import AnalyticsView from './components/AnalyticsView';
import GoogleSheetsModal from './components/GoogleSheetsModal';
import GuestPassModal from './components/GuestPassModal';
import EditGuestModal from './components/EditGuestModal';
import { 
  getGuestData, 
  saveGuestData, 
  getAppConfig, 
  saveAppConfig, 
  syncGuestToGoogleSheets 
} from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState('form');
  const [theme, setTheme] = useState('dark');
  const [guests, setGuests] = useState([]);
  const [config, setConfig] = useState(getAppConfig());
  
  // Modals state
  const [selectedPassGuest, setSelectedPassGuest] = useState(null);
  const [editingGuest, setEditingGuest] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Initialize Data & Theme
  useEffect(() => {
    const loadedData = getGuestData();
    setGuests(loadedData);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Add New Guest Handler
  const handleAddGuest = async (newGuest) => {
    const updatedGuests = [newGuest, ...guests];
    setGuests(updatedGuests);
    saveGuestData(updatedGuests);

    // Auto Sync to Google Sheets Webhook if configured
    if (config.webhookUrl) {
      await syncGuestToGoogleSheets(config.webhookUrl, newGuest);
    }
  };

  // Add Manual Blank/Template Guest (From Spreadsheet Toolbar)
  const handleAddNewManual = () => {
    const now = new Date();
    const manualGuest = {
      id: `BPS-MAN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      nama: 'Tamu Barus',
      noHp: '-',
      instansi: 'Umum / Instansi',
      nik: '-',
      tujuan: 'Pelayanan Statistik Terpadu (PST)',
      keperluan: 'Konsultasi Data & Informasi Statistik',
      jumlah: 1,
      tanggal: now.toISOString().split('T')[0],
      jamMasuk: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      jamKeluar: '-',
      status: 'Menunggu',
      catatan: 'Diinput manual dari tabel',
      ttd: ''
    };
    handleAddGuest(manualGuest);
    setEditingGuest(manualGuest);
  };

  // Update Single Guest Entry
  const handleUpdateGuest = (updatedGuest) => {
    const updatedGuests = guests.map(g => g.id === updatedGuest.id ? updatedGuest : g);
    setGuests(updatedGuests);
    saveGuestData(updatedGuests);
  };

  // Delete Guest Entry
  const handleDeleteGuest = (id) => {
    const updatedGuests = guests.filter(g => g.id !== id);
    setGuests(updatedGuests);
    saveGuestData(updatedGuests);
  };

  // Import Guests array from Excel
  const handleImportGuests = (importedList) => {
    const combined = [...importedList, ...guests];
    setGuests(combined);
    saveGuestData(combined);
  };

  // Save Config
  const handleSaveConfig = (newConfig) => {
    setConfig(newConfig);
    saveAppConfig(newConfig);
  };

  // Sync All Guests to Google Sheets
  const handleSyncGoogleSheets = async () => {
    if (!config.webhookUrl) {
      setIsConfigModalOpen(true);
      return;
    }
    let successCount = 0;
    for (const g of guests) {
      const res = await syncGuestToGoogleSheets(config.webhookUrl, g);
      if (res.success) successCount++;
    }
    alert(`Proses sinkronisasi selesai. Data terkirim ke Google Sheets!`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        config={config}
        openConfigModal={() => setIsConfigModalOpen(true)}
        totalCount={guests.length}
      />

      {/* Main View Content */}
      <main style={{ flex: 1, paddingTop: '1rem' }}>
        {activeTab === 'form' && (
          <GuestForm 
            onAddGuest={handleAddGuest}
            onShowPass={(guest) => setSelectedPassGuest(guest)}
          />
        )}

        {activeTab === 'table' && (
          <SpreadsheetTable 
            guests={guests}
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
      <footer style={{ 
        textAlign: 'center', 
        padding: '1.25rem', 
        fontSize: '0.8rem', 
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--bg-card-border)',
        background: 'var(--bg-glass)',
        marginTop: '2rem'
      }}>
        <div>
          © 2026 <b>BPS Buku Tamu Digital</b> • Dikembangkan untuk Program Magang Mitra Badan Pusat Statistik
        </div>
        <div style={{ fontSize: '0.75rem', marginTop: '0.2rem', opacity: 0.8 }}>
          Terintegrasi Excel Spreadsheet Export (.xlsx) & Google Sheets Webhook Sync
        </div>
      </footer>

      {/* Modals */}
      {isConfigModalOpen && (
        <GoogleSheetsModal 
          config={config}
          onSaveConfig={handleSaveConfig}
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
