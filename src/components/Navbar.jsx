import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  UserPlus, 
  BarChart3, 
  Settings, 
  Sun, 
  Moon, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  X,
  MapPin,
  Clock,
  Lock,
  Unlock
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  onRequestTabSwitch, 
  theme, 
  toggleTheme, 
  config, 
  openConfigModal,
  totalCount,
  isAdminUnlocked,
  onLockAdmin 
}) {
  const [showBanner, setShowBanner] = useState(true);
  const isSheetsConnected = Boolean(config?.webhookUrl);

  return (
    <header style={{ width: '100%' }}>
      
      {/* 1. Official BPS PPU Navy Header Bar (#024282) */}
      <div style={{ 
        background: '#024282', 
        color: '#ffffff', 
        padding: '0.85rem 1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '1rem' 
        }}>
          
          {/* Official BPS Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            
            {/* Official BPS Logo PNG */}
            <img 
              src="/logo-bps.png" 
              alt="Logo BPS" 
              style={{ height: '38px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} 
            />

            <div>
              <h1 style={{ 
                fontSize: '1.15rem', 
                fontWeight: '800', 
                letterSpacing: '0.02em', 
                color: '#ffffff', 
                margin: 0,
                fontStyle: 'italic',
                fontFamily: 'sans-serif'
              }}>
                BADAN PUSAT STATISTIK
              </h1>
              <div style={{ 
                fontSize: '0.85rem', 
                fontWeight: '700', 
                color: '#38bdf8', 
                letterSpacing: '0.05em',
                fontStyle: 'italic'
              }}>
                KABUPATEN PENAJAM PASER UTARA
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Input Tamu, Tabel Spreadsheet, Analytics) */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              className={`bps-tab-btn ${activeTab === 'form' ? 'active' : ''}`}
              onClick={() => onRequestTabSwitch('form')}
            >
              <UserPlus size={16} />
              Input Tamu PST
            </button>
            
            <button 
              className={`bps-tab-btn ${activeTab === 'table' ? 'active' : ''}`}
              onClick={() => onRequestTabSwitch('table')}
              title={isAdminUnlocked ? 'Buka Tabel Spreadsheet Data Tamu' : 'Diperlukan PIN Admin untuk melihat/mengedit tabel'}
            >
              <FileSpreadsheet size={16} />
              Tabel Spreadsheet
              {!isAdminUnlocked && <Lock size={12} color="#fbbf24" style={{ marginLeft: '2px' }} />}
              {totalCount > 0 && (
                <span style={{ 
                  background: '#0099db',
                  color: '#fff',
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '10px',
                  marginLeft: '0.2rem'
                }}>
                  {totalCount}
                </span>
              )}
            </button>

            <button 
              className={`bps-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => onRequestTabSwitch('analytics')}
              title={isAdminUnlocked ? 'Buka Analitik Kunjungan' : 'Diperlukan PIN Admin'}
            >
              <BarChart3 size={16} />
              Analitik
              {!isAdminUnlocked && <Lock size={12} color="#fbbf24" style={{ marginLeft: '2px' }} />}
            </button>
          </nav>

          {/* Right Action Icons & Admin Mode Lock Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            
            {/* Mode Access Badge & Lock Button */}
            {isAdminUnlocked ? (
              <button 
                onClick={onLockAdmin}
                title="Kunci Akses Admin (Kembali ke Mode Tamu)"
                style={{
                  background: '#16a34a',
                  border: '1px solid #22c55e',
                  color: '#ffffff',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Unlock size={14} /> Mode Admin (Kunci)
              </button>
            ) : (
              <button 
                onClick={() => onRequestTabSwitch('table')}
                title="Login / Buka Akses Petugas Admin"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fbbf24',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Lock size={14} /> Mode Tamu (Unlock)
              </button>
            )}

            {/* Google Sheets Sync Badge */}
            <button 
              onClick={openConfigModal}
              title="Pengaturan Google Sheets Webhook Sync"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Share2 size={14} color={isSheetsConnected ? '#4ade80' : '#fbbf24'} />
              <span>Google Sheets: </span>
              {isSheetsConnected ? (
                <span style={{ color: '#4ade80', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <CheckCircle2 size={13} /> Aktif
                </span>
              ) : (
                <span style={{ color: '#fbbf24', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <AlertCircle size={13} /> Sinkron
                </span>
              )}
            </button>

            {/* Settings Button */}
            <button 
              onClick={openConfigModal}
              title="Pengaturan Aplikasi & Ubah PIN Admin"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '0.45rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Settings size={17} />
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '0.45rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {theme === 'dark' ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="#38bdf8" />}
            </button>

          </div>

        </div>
      </div>

      {/* 2. Official Bright Cyan Banner (#0099db) From BPS PPU Website */}
      {showBanner && (
        <div style={{ 
          background: '#0099db', 
          color: '#ffffff', 
          padding: '0.65rem 1.5rem', 
          fontSize: '0.85rem',
          fontWeight: '500'
        }}>
          <div style={{ 
            maxWidth: '1400px', 
            margin: '0 auto', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
              <Clock size={16} style={{ flexShrink: 0 }} />
              <div>
                <b>Pelayanan Statistik Terpadu (PST)</b> dapat dikunjungi pada jam kerja <b>Senin–Kamis 07.30–16.00 WITA</b> dan <b>Jumat 07.30–16.30 WITA</b>.
                <span style={{ marginLeft: '0.5rem', opacity: 0.9 }}>
                  <MapPin size={13} style={{ display: 'inline', marginRight: '2px' }} />
                  Alamat: Jl. Provinsi Km.09 Nipah-Nipah, Penajam, 76411
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => setShowBanner(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '4px',
                padding: '0.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Tutup Pengumuman"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

    </header>
  );
}
