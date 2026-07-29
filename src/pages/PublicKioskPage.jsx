import React, { useState } from 'react';
import GuestForm from '../components/GuestForm';
import GuestPassModal from '../components/GuestPassModal';
import { saveSingleGuestAsync, syncGuestToGoogleSheets } from '../utils/storage';
import { Clock, MapPin } from 'lucide-react';

export default function PublicKioskPage({ config }) {
  const [selectedPassGuest, setSelectedPassGuest] = useState(null);
  const [showBanner] = useState(true);

  const handleAddGuest = async (newGuest) => {
    await saveSingleGuestAsync(newGuest);

    if (config.webhookUrl) {
      await syncGuestToGoogleSheets(config.webhookUrl, newGuest);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bps-bg)' }}>
      
      {/* 1. Public Kiosk Top Header (BPS PPU Branding Only) */}
      <header style={{ background: '#024282', color: '#ffffff', padding: '0.85rem 1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Logo & Office Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img 
              src="/logo-bps.png" 
              alt="Logo BPS" 
              style={{ height: '40px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} 
            />
            <div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '0.02em', color: '#ffffff', margin: 0, fontStyle: 'italic', fontFamily: 'sans-serif' }}>
                BADAN PUSAT STATISTIK
              </h1>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8', letterSpacing: '0.05em', fontStyle: 'italic' }}>
                KABUPATEN PENAJAM PASER UTARA
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Official Bright Cyan Banner (#0099db) */}
      {showBanner && (
        <div style={{ background: '#0099db', color: '#ffffff', padding: '0.65rem 1.5rem', fontSize: '0.85rem', fontWeight: '500' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
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
          </div>
        </div>
      )}

      {/* 3. Main Guest Registration Form */}
      <main style={{ flex: 1, paddingTop: '1.5rem' }}>
        <GuestForm 
          onAddGuest={handleAddGuest}
          onShowPass={(guest) => setSelectedPassGuest(guest)}
        />
      </main>

      {/* 4. Public Footer */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '1.25rem', 
        fontSize: '0.8rem', 
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--bps-card-border)',
        background: 'var(--bps-card)',
        marginTop: '2rem'
      }}>
        <div>
          © 2026 <b>BPS Buku Tamu Digital</b> • Badan Pusat Statistik Kabupaten Penajam Paser Utara
        </div>
        <div style={{ fontSize: '0.75rem', marginTop: '0.2rem', opacity: 0.8 }}>
          Pelayanan Statistik Terpadu (PST) • Penajam Paser Utara
        </div>
      </footer>

      {/* Guest Pass Ticket Modal */}
      {selectedPassGuest && (
        <GuestPassModal 
          guest={selectedPassGuest}
          officeName={config.officeName}
          onClose={() => setSelectedPassGuest(null)}
        />
      )}

    </div>
  );
}
