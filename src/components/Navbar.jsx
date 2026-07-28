import React from 'react';
import { 
  Building2, 
  FileSpreadsheet, 
  UserPlus, 
  BarChart3, 
  Settings, 
  Sun, 
  Moon, 
  Share2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  theme, 
  toggleTheme, 
  config, 
  openConfigModal,
  totalCount 
}) {
  const isSheetsConnected = Boolean(config?.webhookUrl);

  return (
    <header className="glass-panel" style={{ margin: '1rem', padding: '0.85rem 1.5rem', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Left Side: Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            padding: '0.65rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px var(--accent-glow)'
          }}>
            <Building2 size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0 }} className="gradient-text">
                {config.officeName || 'Badan Pusat Statistik (BPS)'}
              </h1>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                padding: '0.15rem 0.5rem',
                borderRadius: '20px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                E-Buku Tamu v1.0
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              {config.subTitle || 'Pelayanan Terpadu & Buku Tamu Digital'}
            </p>
          </div>
        </div>

        {/* Middle Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.35rem', borderRadius: '12px', border: '1px solid var(--bg-card-border)' }}>
          <button 
            className={`btn btn-sm ${activeTab === 'form' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('form')}
            style={{ border: activeTab === 'form' ? 'none' : 'transparent' }}
          >
            <UserPlus size={16} />
            Input Tamu
          </button>
          
          <button 
            className={`btn btn-sm ${activeTab === 'table' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('table')}
            style={{ border: activeTab === 'table' ? 'none' : 'transparent' }}
          >
            <FileSpreadsheet size={16} />
            Data Spreadsheet
            {totalCount > 0 && (
              <span style={{ 
                background: activeTab === 'table' ? 'rgba(255,255,255,0.25)' : 'var(--accent-primary)',
                color: '#fff',
                fontSize: '0.7rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                marginLeft: '0.25rem'
              }}>
                {totalCount}
              </span>
            )}
          </button>

          <button 
            className={`btn btn-sm ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('analytics')}
            style={{ border: activeTab === 'analytics' ? 'none' : 'transparent' }}
          >
            <BarChart3 size={16} />
            Analitik
          </button>
        </nav>

        {/* Right Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          
          {/* Google Sheets Sync Badge & Button */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={openConfigModal}
            title="Pengaturan Google Sheets Webhook Sync"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Share2 size={15} color={isSheetsConnected ? 'var(--success)' : 'var(--warning)'} />
            <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Google Sheets: 
              {isSheetsConnected ? (
                <span style={{ color: 'var(--success)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <CheckCircle2 size={13} /> Aktif
                </span>
              ) : (
                <span style={{ color: 'var(--warning)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <AlertCircle size={13} /> Hubungkan
                </span>
              )}
            </span>
          </button>

          {/* Settings Modal Button */}
          <button 
            className="btn btn-secondary btn-icon"
            onClick={openConfigModal}
            title="Pengaturan Aplikasi"
          >
            <Settings size={18} />
          </button>

          {/* Dark / Light Mode Toggle */}
          <button 
            className="btn btn-secondary btn-icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#4f46e5" />}
          </button>

        </div>

      </div>
    </header>
  );
}
