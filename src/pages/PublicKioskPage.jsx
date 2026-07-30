import React, { useState, useEffect } from 'react';
import GuestForm from '../components/GuestForm';
import GuestPassModal from '../components/GuestPassModal';
import PassSelectorModal from '../components/PassSelectorModal';
import QuickCheckoutQrModal from '../components/QuickCheckoutQrModal';
import QuickCheckoutSuccessModal from '../components/QuickCheckoutSuccessModal';
import { saveSingleGuestAsync, syncGuestToGoogleSheets, fetchPassesStatusAsync, checkoutGuestAsync } from '../utils/storage';
import { Clock, MapPin, Ticket, Layers, QrCode } from 'lucide-react';

const LOCAL_STORAGE_PASSES_KEY = 'bps_ppu_guest_passes_v2';

export default function PublicKioskPage({ config }) {
  const [selectedPassGuest, setSelectedPassGuest] = useState(null);
  const [myPasses, setMyPasses] = useState([]);
  const [isPassSelectorOpen, setIsPassSelectorOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [quickCheckoutResult, setQuickCheckoutResult] = useState({ isOpen: false, count: 0, passes: [] });
  const [showBanner] = useState(true);

  // Quick Checkout URL Scanner Trigger (?action=quick-checkout)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'quick-checkout') {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      executeQuickCheckoutOnDevice();
    }
  }, []);

  const executeQuickCheckoutOnDevice = async () => {
    try {
      const savedPassesStr = localStorage.getItem(LOCAL_STORAGE_PASSES_KEY);
      if (!savedPassesStr) {
        setQuickCheckoutResult({ isOpen: true, count: 0, passes: [] });
        return;
      }

      const parsedPasses = JSON.parse(savedPassesStr);
      if (!Array.isArray(parsedPasses) || parsedPasses.length === 0) {
        setQuickCheckoutResult({ isOpen: true, count: 0, passes: [] });
        return;
      }

      const activePasses = parsedPasses.filter(p => p.status !== 'Selesai');
      if (activePasses.length === 0) {
        setQuickCheckoutResult({ isOpen: true, count: 0, passes: [] });
        return;
      }

      const now = new Date();
      const jamKeluar = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WITA`;

      const updatedPassesList = [];

      for (const passItem of activePasses) {
        const res = await checkoutGuestAsync(passItem.id);
        const checkoutTime = (res && res.success && res.jamKeluar) ? res.jamKeluar : jamKeluar;
        const updated = {
          ...passItem,
          status: 'Selesai',
          jamKeluar: checkoutTime
        };
        updatedPassesList.push(updated);

        if (config && config.webhookUrl) {
          syncGuestToGoogleSheets(config.webhookUrl, updated);
        }
      }

      const newPasses = parsedPasses.map(p => {
        const found = updatedPassesList.find(u => u.id === p.id);
        return found || p;
      });

      localStorage.setItem(LOCAL_STORAGE_PASSES_KEY, JSON.stringify(newPasses));
      setMyPasses(newPasses);

      setQuickCheckoutResult({
        isOpen: true,
        count: updatedPassesList.length,
        passes: updatedPassesList
      });
    } catch (e) {
      console.error('Quick checkout execution failed:', e);
    }
  };

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

  // Live Sync Pass Status: Automatically sync pass status from backend server every 3 seconds
  useEffect(() => {
    let isMounted = true;

    const syncStatusFromBackend = async () => {
      try {
        const savedPassesStr = localStorage.getItem(LOCAL_STORAGE_PASSES_KEY);
        if (!savedPassesStr) return;
        const currentLocalPasses = JSON.parse(savedPassesStr);
        if (!Array.isArray(currentLocalPasses) || currentLocalPasses.length === 0) return;

        const passIds = currentLocalPasses.map(p => p.id);
        const serverStatuses = await fetchPassesStatusAsync(passIds);
        if (!isMounted || !Array.isArray(serverStatuses) || serverStatuses.length === 0) return;

        let hasChange = false;
        const updatedPasses = currentLocalPasses.map(localPass => {
          const matched = serverStatuses.find(s => s.id === localPass.id);
          if (matched && (matched.status !== localPass.status || (matched.jamKeluar && matched.jamKeluar !== localPass.jamKeluar))) {
            hasChange = true;
            return {
              ...localPass,
              status: matched.status,
              jamKeluar: matched.jamKeluar || localPass.jamKeluar
            };
          }
          return localPass;
        });

        if (hasChange && isMounted) {
          setMyPasses(updatedPasses);
          localStorage.setItem(LOCAL_STORAGE_PASSES_KEY, JSON.stringify(updatedPasses));

          setSelectedPassGuest(prevSelected => {
            if (prevSelected) {
              const updatedSelected = updatedPasses.find(p => p.id === prevSelected.id);
              return updatedSelected ? { ...updatedSelected } : prevSelected;
            }
            return prevSelected;
          });
        }
      } catch (e) {
        console.error('Failed to live sync pass status:', e);
      }
    };

    syncStatusFromBackend();
    const intervalId = setInterval(syncStatusFromBackend, 3000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
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

  const handleDeletePassInLocalStorage = (guestId) => {
    try {
      const updatedPasses = myPasses.filter(p => p.id !== guestId);
      localStorage.setItem(LOCAL_STORAGE_PASSES_KEY, JSON.stringify(updatedPasses));
      setMyPasses(updatedPasses);
      if (selectedPassGuest && selectedPassGuest.id === guestId) {
        setSelectedPassGuest(null);
      }
    } catch (e) {
      console.error('Failed to delete pass from localStorage:', e);
    }
  };

  const handleAddGuest = async (newGuest) => {
    // 1. Save to SQLite via public API (backend automatically syncs to Google Sheets once)
    await saveSingleGuestAsync(newGuest);

    // 2. Save/Update pass to device local storage array
    saveOrUpdatePassInLocalStorage(newGuest);
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
          onDeleteLocalPass={handleDeletePassInLocalStorage}
        />
      )}

      {/* Multiple Passes Selector Modal */}
      {isPassSelectorOpen && (
        <PassSelectorModal 
          passes={myPasses}
          config={config}
          onSelectPass={(passItem) => setSelectedPassGuest(passItem)}
          onUpdatePass={saveOrUpdatePassInLocalStorage}
          onDeleteLocalPass={handleDeletePassInLocalStorage}
          onClose={() => setIsPassSelectorOpen(false)}
        />
      )}

      {/* Quick Checkout QR Poster Modal */}
      <QuickCheckoutQrModal 
        isOpen={isQrModalOpen}
        config={config}
        onClose={() => setIsQrModalOpen(false)}
      />

      {/* Quick Checkout Success Celebration Modal */}
      <QuickCheckoutSuccessModal 
        isOpen={quickCheckoutResult.isOpen}
        checkedOutCount={quickCheckoutResult.count}
        checkedOutPasses={quickCheckoutResult.passes}
        officeName={config?.officeName}
        onClose={() => setQuickCheckoutResult({ isOpen: false, count: 0, passes: [] })}
      />

    </div>
  );
}
