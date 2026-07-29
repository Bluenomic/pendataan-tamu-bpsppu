import React, { useState, useEffect } from 'react';
import GuestForm from '../components/GuestForm';
import GuestPassModal from '../components/GuestPassModal';
import { saveSingleGuestAsync, syncGuestToGoogleSheets, checkoutGuestAsync } from '../utils/storage';
import { Clock, MapPin, LogOut, Ticket, CheckCircle2, Sparkles, Eye } from 'lucide-react';

const LOCAL_STORAGE_PASS_KEY = 'bps_ppu_guest_active_pass_v1';

export default function PublicKioskPage({ config }) {
  const [selectedPassGuest, setSelectedPassGuest] = useState(null);
  const [activeMyPass, setActiveMyPass] = useState(null);
  const [checkoutMsg, setCheckoutMsg] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Load active pass from local storage on mount
  useEffect(() => {
    try {
      const savedPass = localStorage.getItem(LOCAL_STORAGE_PASS_KEY);
      if (savedPass) {
        const parsed = JSON.parse(savedPass);
        setActiveMyPass(parsed);
      }
    } catch (e) {
      console.error('Failed to load active pass from localStorage:', e);
    }
  }, []);

  // Save pass to local storage helper
  const saveMyPassToLocalStorage = (guestPass) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PASS_KEY, JSON.stringify(guestPass));
      setActiveMyPass(guestPass);
    } catch (e) {
      console.error('Failed to save active pass to localStorage:', e);
    }
  };

  const handleAddGuest = async (newGuest) => {
    // 1. Save to SQLite via public API
    await saveSingleGuestAsync(newGuest);

    // 2. Save active pass to device local storage
    saveMyPassToLocalStorage(newGuest);

    // 3. Sync to Google Sheets if configured
    if (config.webhookUrl) {
      await syncGuestToGoogleSheets(config.webhookUrl, newGuest);
    }
  };

  // Device Self Check-Out for own pass stored in localStorage
  const handleDeviceSelfCheckout = async () => {
    if (!activeMyPass || activeMyPass.status === 'Selesai') return;

    setIsCheckingOut(true);
    const res = await checkoutGuestAsync(activeMyPass.id);
    setIsCheckingOut(false);

    if (res && res.success) {
      const updatedPass = {
        ...activeMyPass,
        status: 'Selesai',
        jamKeluar: res.jamKeluar || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA'
      };

      saveMyPassToLocalStorage(updatedPass);
      setCheckoutMsg(`Terima kasih ${updatedPass.nama}! Kunjungan Anda telah ditandai Selesai pada ${updatedPass.jamKeluar}.`);

      if (config.webhookUrl) {
        syncGuestToGoogleSheets(config.webhookUrl, updatedPass);
      }
    } else {
      alert('Gagal melakukan check-out. Silakan coba lagi.');
    }
  };

  const isMyPassActive = activeMyPass && activeMyPass.status !== 'Selesai';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bps-bg)' }}>
      
      {/* 1. Public Kiosk Top Header */}
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

          {/* Device Active Pass Quick Action (If pass exists in localStorage) */}
          {activeMyPass && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                onClick={() => setSelectedPassGuest(activeMyPass)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '0.45rem 0.85rem',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Ticket size={15} color="#38bdf8" /> Pass Saya ({activeMyPass.nama})
              </button>

              {isMyPassActive && (
                <button 
                  onClick={handleDeviceSelfCheckout}
                  disabled={isCheckingOut}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.45rem 0.85rem',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                  title="Check-out mandiri untuk pass kunjungan Anda"
                >
                  <LogOut size={15} /> Check-Out Saya
                </button>
              )}
            </div>
          )}

        </div>
      </header>

      {/* 2. Device Active Pass Banner Notice (Stored in LocalStorage) */}
      {activeMyPass && (
        <div style={{ 
          background: isMyPassActive ? '#0077b6' : '#15803d', 
          color: '#ffffff', 
          padding: '0.65rem 1.5rem', 
          fontSize: '0.85rem', 
          fontWeight: '600' 
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Ticket size={18} />
              <div>
                {isMyPassActive ? (
                  <>
                    Pass Kunjungan Aktif: <b>{activeMyPass.nama}</b> ({activeMyPass.instansi}) • ID: <b>{activeMyPass.id}</b> • Masuk: <b>{activeMyPass.jamMasuk}</b>
                  </>
                ) : (
                  <>
                    ✓ Status Kunjungan Anda (<b>{activeMyPass.nama}</b>) Telah <b>Selesai</b> pada jam {activeMyPass.jamKeluar}. Terima kasih!
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                onClick={() => setSelectedPassGuest(activeMyPass)}
                style={{ background: '#ffffff', color: '#024282', border: 'none', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <Eye size={13} /> Lihat Tiket Pass
              </button>

              {isMyPassActive && (
                <button 
                  onClick={handleDeviceSelfCheckout}
                  disabled={isCheckingOut}
                  style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <LogOut size={13} /> Check-Out Mandiri
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Official Operating Hours Banner (#0099db) */}
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

      {/* Guest Pass Ticket Modal */}
      {selectedPassGuest && (
        <GuestPassModal 
          guest={selectedPassGuest}
          config={config}
          officeName={config.officeName}
          onClose={() => setSelectedPassGuest(null)}
          onUpdateLocalPass={saveMyPassToLocalStorage}
        />
      )}

    </div>
  );
}
