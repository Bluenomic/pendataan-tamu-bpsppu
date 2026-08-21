import React, { useState, useEffect, useRef } from 'react';
import { Clock, Volume2, VolumeX, Sparkles, Layers, CheckCircle2, UserCheck, ArrowLeft } from 'lucide-react';
import { fetchQueueStatusAsync } from '../utils/storage';
import { announceQueueCall, playChimeSound, unlockAudioContext, getIndonesianVoiceInfo } from '../utils/audioAnnouncer';

export default function QueueDisplayPage({ config, onBack }) {
  const [queueData, setQueueData] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');
  const [isPulse, setIsPulse] = useState(false);
  const [voiceInfo, setVoiceInfo] = useState({ hasIdVoice: true, voiceName: '' });

  const lastCalledIdRef = useRef(null);

  // Unlock Audio Context on any user click on the display screen
  useEffect(() => {
    const handleGlobalClick = () => unlockAudioContext();
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Check Voices
  useEffect(() => {
    const checkVoices = () => {
      setVoiceInfo(getIndonesianVoiceInfo());
    };
    checkVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = checkVoices;
    }
  }, []);

  // Live Clock Update (WITA Time)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WITA');
      setDateString(now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll Queue Status from Server (every 2 seconds)
  useEffect(() => {
    let isMounted = true;

    const pollStatus = async () => {
      const res = await fetchQueueStatusAsync();
      if (!isMounted) return;

      if (res && res.success) {
        if (Array.isArray(res.data)) {
          setQueueData(res.data);
        }

        if (res.activeCall && res.activeCall.noAntrean) {
          const currentCallId = `${res.activeCall.id}_${res.activeCall.timestamp || 0}`;
          
          if (lastCalledIdRef.current !== currentCallId) {
            // New call triggered!
            setActiveCall(res.activeCall);
            setIsPulse(true);
            setTimeout(() => setIsPulse(false), 3000);

            if (soundEnabled && lastCalledIdRef.current !== null) {
              announceQueueCall(res.activeCall.noAntrean, res.activeCall.tujuan);
            }
            lastCalledIdRef.current = currentCallId;
          }
        } else {
          setActiveCall(null);
        }
      }
    };

    pollStatus();
    const intervalId = setInterval(pollStatus, 2000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [soundEnabled]);

  const waitingQueue = queueData.filter(q => q.statusAntrean === 'Menunggu' || !q.statusAntrean);
  const dipanggilQueue = queueData.filter(q => q.statusAntrean === 'Dipanggil');
  const finishedCount = queueData.filter(q => q.statusAntrean === 'Selesai' || q.status === 'Selesai').length;

  const currentDisplayNo = activeCall?.noAntrean || (dipanggilQueue.length > 0 ? dipanggilQueue[dipanggilQueue.length - 1].noAntrean : '-');
  const currentDisplayName = activeCall?.nama || (dipanggilQueue.length > 0 ? dipanggilQueue[dipanggilQueue.length - 1].nama : 'Belum Ada Panggilan');
  const currentDisplayUnit = activeCall?.tujuan || (dipanggilQueue.length > 0 ? dipanggilQueue[dipanggilQueue.length - 1].tujuan : 'Pelayanan Statistik Terpadu');

  const handleTestSound = async () => {
    await playChimeSound();
    announceQueueCall('001', 'Pelayanan Statistik Terpadu');
  };

  return (
    <div style={{ 
      height: '100vh',
      maxHeight: '100vh',
      width: '100vw',
      maxWidth: '100vw',
      background: 'linear-gradient(135deg, #011627 0%, #024282 50%, #001f3f 100%)', 
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      
      {/* 1. Header Display TV */}
      <header style={{ 
        background: 'rgba(2, 66, 130, 0.85)', 
        backdropFilter: 'blur(12px)',
        padding: '0.65rem 1.5rem', 
        borderBottom: '2px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img 
            src="/logo-bps.png" 
            alt="Logo BPS" 
            style={{ height: '38px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} 
          />
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0, letterSpacing: '0.02em', color: '#ffffff', fontStyle: 'italic' }}>
              BADAN PUSAT STATISTIK KABUPATEN PENAJAM PASER UTARA
            </h1>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#38bdf8', fontStyle: 'italic' }}>
              DISPLAY ANTREAN PELAYANAN STATISTIK TERPADU (PST)
            </div>
          </div>
        </div>

        {/* Real-time Clock */}
        <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.25)', padding: '0.35rem 0.75rem', borderLeft: '3px solid #38bdf8' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ffffff', letterSpacing: '0.05em' }}>
            {timeString}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
            {dateString}
          </div>
        </div>
      </header>

      {/* 2. Main Content Grid (Hero Active Call & Upcoming Queue List) */}
      <main style={{ 
        flex: 1, 
        padding: '0.85rem 1.25rem', 
        display: 'grid', 
        gridTemplateColumns: '1.2fr 1fr', 
        gap: '1.25rem', 
        alignItems: 'stretch',
        minHeight: 0,
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        
        {/* Left Hero Section: Active Queue Being Called */}
        <div style={{ 
          background: isPulse ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.07)', 
          border: isPulse ? '3px solid #38bdf8' : '2px solid rgba(255, 255, 255, 0.15)', 
          backdropFilter: 'blur(16px)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.4s ease',
          minHeight: 0
        }}>
          
          <div style={{ 
            background: 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)', 
            color: '#ffffff', 
            padding: '0.45rem 1.6rem', 
            fontSize: '1.1rem', 
            fontWeight: '900', 
            letterSpacing: '0.1em',
            marginBottom: '1rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            DIPANGGIL SAAT INI
          </div>

          <div style={{ 
            fontSize: '7.5rem', 
            fontWeight: '900', 
            lineHeight: 1,
            letterSpacing: '0.04em', 
            color: '#38bdf8',
            textShadow: '0 0 40px rgba(56, 189, 248, 0.75)',
            margin: '0.25rem 0 1.25rem 0',
            fontFamily: 'monospace'
          }}>
            {currentDisplayNo}
          </div>

          <div style={{ 
            fontSize: '1.25rem', 
            color: '#cbd5e1', 
            fontWeight: '700',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '0.5rem 1.35rem',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            Tujuan: <span style={{ color: '#38bdf8', fontWeight: '900' }}>{currentDisplayUnit}</span>
          </div>

        </div>

        {/* Right Section: Upcoming Waiting Queue List */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          border: '1px solid rgba(255, 255, 255, 0.15)', 
          backdropFilter: 'blur(16px)',
          padding: '1.1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 0
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              paddingBottom: '0.65rem', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              marginBottom: '0.85rem'
            }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={20} color="#38bdf8" /> ANTREAN SELANJUTNYA
              </span>
              <span style={{ background: '#0284c7', color: '#fff', padding: '0.2rem 0.6rem', fontSize: '0.8rem', fontWeight: '800' }}>
                {waitingQueue.length} Tamu Menunggu
              </span>
            </div>

            {waitingQueue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
                <CheckCircle2 size={44} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>Semua Tamu Telah Dilayani</div>
                <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.25rem' }}>Belum ada antrean baru yang mendaftar saat ini.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'hidden', flex: 1, justifyContent: 'center' }}>
                {waitingQueue.slice(0, 3).map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    style={{ 
                      position: 'relative',
                      background: 'rgba(255, 255, 255, 0.08)', 
                      borderLeft: '4px solid #38bdf8', 
                      padding: '0.65rem 0.95rem', 
                      boxShadow: '0 3px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div style={{ paddingRight: '6rem' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', fontFamily: 'monospace', lineHeight: 1.1 }}>
                        {item.noAntrean || '-'}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: '800', marginTop: '0.1rem' }}>
                        Tujuan: {item.tujuan}
                      </div>
                    </div>
                    <span style={{ 
                      position: 'absolute', 
                      top: '0.65rem', 
                      right: '0.95rem',
                      background: 'rgba(56, 189, 248, 0.18)', 
                      color: '#38bdf8', 
                      border: '1.5px solid rgba(56, 189, 248, 0.4)', 
                      padding: '0.2rem 0.55rem', 
                      fontSize: '0.8rem', 
                      fontWeight: '800' 
                    }}>
                      Urutan #{idx + 1}
                    </span>
                  </div>
                ))}

                {waitingQueue.length > 3 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '0.5rem 0.85rem', 
                    background: 'rgba(56, 189, 248, 0.12)', 
                    border: '1.5px dashed rgba(56, 189, 248, 0.4)', 
                    color: '#38bdf8', 
                    fontSize: '0.85rem', 
                    fontWeight: '800', 
                    marginTop: '0.25rem',
                    letterSpacing: '0.01em'
                  }}>
                    + Dan {waitingQueue.length - 3} tamu antrean lainnya dalam daftar tunggu
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Today's Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.6rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '800', marginBottom: '0.1rem' }}>TOTAL HARI INI</div>
              <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#ffffff' }}>{queueData.length}</div>
            </div>
            <div style={{ background: 'rgba(22, 163, 74, 0.15)', padding: '0.6rem', textAlign: 'center', border: '1px solid rgba(22, 163, 74, 0.3)' }}>
              <div style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: '800', marginBottom: '0.1rem' }}>SELESAI DILAYANI</div>
              <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#4ade80' }}>{finishedCount}</div>
            </div>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.6rem', textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: '800', marginBottom: '0.1rem' }}>SISA ANTREAN</div>
              <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#38bdf8' }}>{waitingQueue.length}</div>
            </div>
          </div>

        </div>

      </main>

      {/* 3. Footer Marquee / Running Text */}
      <footer style={{ background: '#011222', padding: '0.45rem 0', borderTop: '2px solid rgba(56, 189, 248, 0.3)', overflow: 'hidden', whiteSpace: 'nowrap', boxSizing: 'border-box' }}>
        <div style={{ 
          display: 'inline-block', 
          paddingLeft: '100%', 
          animation: 'marquee 30s linear infinite',
          fontSize: '0.95rem',
          fontWeight: '700',
          color: '#e2e8f0'
        }}>
          📢 Selamat Datang di Pelayanan Statistik Terpadu (PST) BPS Kabupaten Penajam Paser Utara • Jam Operasional PST: Senin–Kamis 07.30–16.00 WITA & Jumat 07.30–16.30 WITA • Silakan perhatikan layar monitor saat nomor antrean Anda dipanggil • Terima kasih atas kunjungan Anda.
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translate(0, 0); }
            100% { transform: translate(-100%, 0); }
          }
        `}</style>
      </footer>

    </div>
  );
}
