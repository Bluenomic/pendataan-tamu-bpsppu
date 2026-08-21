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
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #011627 0%, #024282 50%, #001f3f 100%)', 
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      overflow: 'hidden'
    }}>
      
      {/* 1. Header Display TV */}
      <header style={{ 
        background: 'rgba(2, 66, 130, 0.85)', 
        backdropFilter: 'blur(12px)',
        padding: '1rem 2rem', 
        borderBottom: '2px solid rgba(56, 189, 248, 0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <img 
            src="/logo-bps.png" 
            alt="Logo BPS" 
            style={{ height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} 
          />
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: '900', margin: 0, letterSpacing: '0.02em', color: '#ffffff', fontStyle: 'italic' }}>
              BADAN PUSAT STATISTIK KABUPATEN PENAJAM PASER UTARA
            </h1>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#38bdf8', fontStyle: 'italic' }}>
              DISPLAY ANTREAN PELAYANAN STATISTIK TERPADU (PST)
            </div>
          </div>
        </div>

        {/* Real-time Clock */}
        <div style={{ textAlign: 'right', background: 'rgba(0,0,0,0.25)', padding: '0.4rem 0.85rem', borderLeft: '3px solid #38bdf8' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff', letterSpacing: '0.05em' }}>
            {timeString}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
            {dateString}
          </div>
        </div>
      </header>

      {/* 2. Main Content Grid (Hero Active Call & Upcoming Queue List) */}
      <main style={{ flex: 1, padding: '1.5rem 2rem', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.75rem', alignItems: 'stretch' }}>
        
        {/* Left Hero Section: Active Queue Being Called */}
        <div style={{ 
          background: isPulse ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.07)', 
          border: isPulse ? '3px solid #38bdf8' : '2px solid rgba(255, 255, 255, 0.15)', 
          backdropFilter: 'blur(16px)',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.4s ease'
        }}>
          
          <div style={{ 
            background: 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)', 
            color: '#ffffff', 
            padding: '0.45rem 1.5rem', 
            fontSize: '1rem', 
            fontWeight: '900', 
            letterSpacing: '0.1em',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            DIPANGGIL SAAT INI
          </div>

          <div style={{ 
            fontSize: '6.5rem', 
            fontWeight: '900', 
            lineHeight: 1,
            letterSpacing: '0.04em', 
            color: '#38bdf8',
            textShadow: '0 0 35px rgba(56, 189, 248, 0.6)',
            margin: '0.5rem 0 1.5rem 0',
            fontFamily: 'monospace'
          }}>
            {currentDisplayNo}
          </div>

          <div style={{ 
            fontSize: '1.15rem', 
            color: '#cbd5e1', 
            fontWeight: '700',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '0.5rem 1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            Tujuan: <span style={{ color: '#38bdf8', fontWeight: '800' }}>{currentDisplayUnit}</span>
          </div>

        </div>

        {/* Right Section: Upcoming Waiting Queue List */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          border: '1px solid rgba(255, 255, 255, 0.15)', 
          backdropFilter: 'blur(16px)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              paddingBottom: '0.85rem', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              marginBottom: '1.25rem'
            }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={20} color="#38bdf8" /> ANTREAN SELANJUTNYA
              </span>
              <span style={{ background: '#0284c7', color: '#fff', padding: '0.2rem 0.65rem', fontSize: '0.8rem', fontWeight: '800' }}>
                {waitingQueue.length} Tamu Menunggu
              </span>
            </div>

            {waitingQueue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <CheckCircle2 size={42} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1rem', fontWeight: '700' }}>Semua Tamu Telah Dilayani</div>
                <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Belum ada antrean baru yang mendaftar saat ini.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
                {waitingQueue.slice(0, 3).map((item, idx) => (
                  <div 
                    key={item.id || idx}
                    style={{ 
                      position: 'relative',
                      background: 'rgba(255, 255, 255, 0.08)', 
                      borderLeft: '4px solid #38bdf8', 
                      padding: '0.85rem 1.15rem', 
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}
                  >
                    <div style={{ paddingRight: '6.5rem' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff', fontFamily: 'monospace', lineHeight: 1.2 }}>
                        {item.noAntrean || '-'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '700', marginTop: '0.15rem' }}>
                        Tujuan: {item.tujuan}
                      </div>
                    </div>
                    <span style={{ 
                      position: 'absolute', 
                      top: '0.85rem', 
                      right: '1.15rem',
                      background: 'rgba(56, 189, 248, 0.15)', 
                      color: '#38bdf8', 
                      border: '1px solid rgba(56, 189, 248, 0.3)', 
                      padding: '0.25rem 0.6rem', 
                      fontSize: '0.75rem', 
                      fontWeight: '800' 
                    }}>
                      Urutan #{idx + 1}
                    </span>
                  </div>
                ))}

                {waitingQueue.length > 3 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '0.65rem 1rem', 
                    background: 'rgba(56, 189, 248, 0.12)', 
                    border: '1px dashed rgba(56, 189, 248, 0.4)', 
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.75rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700' }}>TOTAL HARI INI</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#ffffff' }}>{queueData.length}</div>
            </div>
            <div style={{ background: 'rgba(22, 163, 74, 0.15)', padding: '0.75rem', textAlign: 'center', border: '1px solid rgba(22, 163, 74, 0.3)' }}>
              <div style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: '700' }}>SELESAI DILAYANI</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#4ade80' }}>{finishedCount}</div>
            </div>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.75rem', textAlign: 'center', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: '700' }}>SISA ANTREAN</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#38bdf8' }}>{waitingQueue.length}</div>
            </div>
          </div>

        </div>

      </main>

      {/* 3. Footer Marquee / Running Text */}
      <footer style={{ background: '#011222', padding: '0.65rem 0', borderTop: '2px solid rgba(56, 189, 248, 0.3)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ 
          display: 'inline-block', 
          paddingLeft: '100%', 
          animation: 'marquee 30s linear infinite',
          fontSize: '0.9rem',
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
