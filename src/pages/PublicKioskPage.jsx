import React, { useState, useEffect } from 'react';
import GuestForm from '../components/GuestForm';
import GuestPassModal from '../components/GuestPassModal';
import PassSelectorModal from '../components/PassSelectorModal';
import { saveSingleGuestAsync, syncGuestToGoogleSheets } from '../utils/storage';
import { Clock, MapPin, Ticket, Layers } from 'lucide-react';

const LOCAL_STORAGE_PASSES_KEY = 'bps_ppu_guest_passes_v2';

export default function PublicKioskPage({ config }) {
  const [selectedPassGuest, setSelectedPassGuest] = useState(null);
  const [myPasses, setMyPasses] = useState([]);
  const [isPassSelectorOpen, setIsPassSelectorOpen] = useState(false);
  const [showBanner] = useState(true);

  // Load active passes from local storage on mount (Auto-prune older than 24 hours)
  useEffect(() => {
    try {
      const savedPasses = localStorage.getItem(LOCAL_STORAGE_PASSES_KEY);
      if (savedPasses) {
        const parsed = JSON.parse(savedPasses);
        if (Array.isArray(parsed)) {
          const now = Date.now();
          const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
          const validPasses = parsed.filter(pass => {
            const passTime = pass.timestamp || (pass.tanggal ? new Date(pass.tanggal).getTime() : now);
            return now - passTime < TWENTY_FOUR_HOURS_MS;
          });
          setMyPasses(validPasses);
          localStorage.setItem(LOCAL_STORAGE_PASSES_KEY, JSON.stringify(validPasses));
        }
      }
    } catch (e) {
      console.error('Failed to load passes from localStorage:', e);
    }
  }, []);

  // Save or update pass in local storage array
  const saveOrUpdatePassInLocalStorage = (guestPass) => {
    try {
      const passWithTimestamp = {
        ...guestPass,
        timestamp: guestPass.timestamp || Date.now()
      };
      const existing = [...myPasses];
      const idx = existing.findIndex(p => p.id === passWithTimestamp.id);
      if (idx >= 0) {
        existing[idx] = passWithTimestamp;
      } else {
        existing.unshift(passWithTimestamp); // Insert new pass at the front
      }

      const now = Date.now();
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
      const validPasses = existing.filter(pass => {
        const passTime = pass.timestamp || (pass.tanggal ? new Date(pass.tanggal).getTime() : now);
        return now - passTime < TWENTY_FOUR_HOURS_MS;
      });

      localStorage.setItem(LOCAL_STORAGE_PASSES_KEY, JSON.stringify(validPasses));
      setMyPasses(validPasses);
    } catch (e) {
      console.error('Failed to save pass to localStorage:', e);
    }
  };

  const handleAddGuest = async (newGuest) => {
    // 1. Save to SQLite via public API
    await saveSingleGuestAsync(newGuest);

    // 2. Save/Update pass to device local storage array
    saveOrUpdatePassInLocalStorage(newGuest);

    // 3. Sync to Google Sheets if configured
    if (config.webhookUrl) {
      await syncGuestToGoogleSheets(config.webhookUrl, newGuest);
    }
  };

  // Open pass click handler (Header Top Button Only)
  const handleOpenMyPasses = () => {
    if (myPasses.length === 0) return;
    if (myPasses.length === 1) {
      setSelectedPassGuest(myPasses[0]);
    } else {
      setIsPassSelectorOpen(true);
    }
  };

  const latestPass = myPasses[0];
  const activePassesCount = myPasses.filter(p => p.status !== 'Selesai').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bps-bg)' }}>
      
      {/* 1. Public Kiosk Top Header (SINGLE ACCESSIBLE PASS BUTTON AT TOP HEADER!) */}
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

          {/* Device Active Passes Quick Button - TOP HEADER ONLY */}
          {myPasses.length > 0 && (
            <div>
              <button 
                onClick={handleOpenMyPasses}
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  padding: '0.55rem 1rem',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                {myPasses.length > 1 ? <Layers size={16} color="#38bdf8" /> : <Ticket size={16} color="#38bdf8" />}
                <span>
                  {myPasses.length === 1 
                    ? `Pass Saya (${myPasses[0].nama})` 
                    : `Pass Saya (${myPasses.length} Tiket Pass)`}
                </span>
                {activePassesCount > 0 && (
                  <span style={{ background: '#16a34a', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', fontWeight: '800' }}>
                    {activePassesCount} Aktif
                  </span>
                )}
              </button>
            </div>
          )}

        </div>
      </header>

      {/* 2. Device Active Pass Information Banner (NO DUPLICATE BUTTONS) */}
      {myPasses.length > 0 && latestPass && (
        <div style={{ 
          background: latestPass.status !== 'Selesai' ? '#0077b6' : '#15803d', 
          color: '#ffffff', 
          padding: '0.65rem 1.5rem', 
          fontSize: '0.85rem', 
          fontWeight: '600' 
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Ticket size={18} style={{ flexShrink: 0 }} />
            <div>
              {myPasses.length > 1 ? (
                <>
                  Tersimpan <b>{myPasses.length} Tiket Pass Kunjungan</b> pada perangkat ini ({activePassesCount} Aktif). Gunakan tombol <b>Pass Saya</b> di navbar atas untuk melihat rincian.
                </>
              ) : latestPass.status !== 'Selesai' ? (
                <>
                  Pass Kunjungan Aktif: <b>{latestPass.nama}</b> ({latestPass.instansi}) • ID: <b>{latestPass.id}</b> • Masuk: <b>{latestPass.jamMasuk}</b>.
                </>
              ) : (
                <>
                  ✓ Status Kunjungan Anda (<b>{latestPass.nama}</b>) Telah <b>Selesai</b> pada jam {latestPass.jamKeluar}.
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Official Operating Hours Banner */}
      {showBanner && (
        <div style={{ background: '#0099db', color: '#ffffff', padding: '0.55rem 1.5rem', fontSize: '0.8rem', fontWeight: '500' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
              <Clock size={15} style={{ flexShrink: 0 }} />
              <div>
                <b>Pelayanan Statistik Terpadu (PST)</b>: Senin–Kamis 07.30–16.00 WITA & Jumat 07.30–16.30 WITA.
                <span style={{ marginLeft: '0.5rem', opacity: 0.9 }}>
                  <MapPin size={12} style={{ display: 'inline', marginRight: '2px' }} />
                  Alamat: Jl. Provinsi Km.09 Nipah-Nipah, Penajam
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Guest Registration Form */}
      <main style={{ flex: 1, paddingTop: '1.5rem' }}>
        <GuestForm 
          onAddGuest={handleAddGuest}
          onShowPass={(guest) => setSelectedPassGuest(guest)}
        />
      </main>

      {/* 5. Public Footer */}
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

      {/* Single Guest Pass Ticket Modal */}
      {selectedPassGuest && (
        <GuestPassModal 
          guest={selectedPassGuest}
          config={config}
          officeName={config.officeName}
          onClose={() => setSelectedPassGuest(null)}
          onUpdateLocalPass={saveOrUpdatePassInLocalStorage}
        />
      )}

      {/* Multiple Passes Selector Modal */}
      {isPassSelectorOpen && (
        <PassSelectorModal 
          passes={myPasses}
          config={config}
          onSelectPass={(passItem) => setSelectedPassGuest(passItem)}
          onUpdatePass={saveOrUpdatePassInLocalStorage}
          onClose={() => setIsPassSelectorOpen(false)}
        />
      )}

    </div>
  );
}
