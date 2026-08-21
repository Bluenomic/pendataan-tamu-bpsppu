import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  RotateCcw, 
  CheckCircle, 
  SkipForward, 
  Monitor, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { fetchQueueStatusAsync, callQueueAsync, updateQueueStatusAsync } from '../utils/storage';
import { announceQueueCall, playChimeSound, unlockAudioContext, getIndonesianVoiceInfo } from '../utils/audioAnnouncer';

export default function QueueControlView({ adminPin, onOpenTvDisplay }) {
  const [queueList, setQueueList] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL'); // 'ALL' | 'A' | 'B' | 'WAITING' | 'DONE'
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notice, setNotice] = useState('');
  const [voiceInfo, setVoiceInfo] = useState({ hasIdVoice: true, voiceName: 'Memuat Voice Engine...' });

  const loadQueueData = async () => {
    const res = await fetchQueueStatusAsync(adminPin);
    if (res && res.success) {
      if (Array.isArray(res.data)) {
        setQueueList(res.data);
      }
      setActiveCall(res.activeCall || null);
    }
  };

  useEffect(() => {
    loadQueueData();
    const intervalId = setInterval(loadQueueData, 3000);
    
    // Check speech synthesis voice engine
    const checkVoice = () => {
      setVoiceInfo(getIndonesianVoiceInfo());
    };
    checkVoice();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = checkVoice;
    }

    return () => clearInterval(intervalId);
  }, []);

  const showNotification = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const handleCallNext = async () => {
    unlockAudioContext();
    const nextWaiting = queueList.find(q => q.statusAntrean === 'Menunggu' || !q.statusAntrean);

    if (!nextWaiting) {
      showNotification('Tidak ada antrean yang menunggu saat ini.');
      return;
    }

    // 1. Immediately play audio call & set active state
    if (soundEnabled && nextWaiting.noAntrean) {
      announceQueueCall(nextWaiting.noAntrean, nextWaiting.tujuan);
    }
    setActiveCall({
      id: nextWaiting.id,
      noAntrean: nextWaiting.noAntrean,
      nama: nextWaiting.nama,
      tujuan: nextWaiting.tujuan,
      timestamp: Date.now()
    });
    showNotification(`Dipanggil: ${nextWaiting.noAntrean} - ${nextWaiting.nama}`);

    // 2. Sync to backend API
    setIsLoading(true);
    await callQueueAsync({ guestId: nextWaiting.id }, adminPin);
    setIsLoading(false);
    loadQueueData();
  };

  const handleRecall = () => {
    unlockAudioContext();
    if (!activeCall || !activeCall.noAntrean) {
      showNotification('Belum ada antrean yang aktif dipanggil.');
      return;
    }
    showNotification(`Memanggil ulang: ${activeCall.noAntrean}`);
    if (soundEnabled) {
      announceQueueCall(activeCall.noAntrean, activeCall.tujuan);
    }
  };

  const handleCallSpecific = async (guest) => {
    unlockAudioContext();
    if (!guest || !guest.noAntrean) return;

    // 1. Immediately play audio call & set active state
    if (soundEnabled) {
      announceQueueCall(guest.noAntrean, guest.tujuan);
    }

    setActiveCall({
      id: guest.id,
      noAntrean: guest.noAntrean,
      nama: guest.nama,
      tujuan: guest.tujuan,
      timestamp: Date.now()
    });
    showNotification(`Dipanggil: ${guest.noAntrean} - ${guest.nama}`);

    // 2. Sync to backend API
    setIsLoading(true);
    await callQueueAsync({ guestId: guest.id }, adminPin);
    setIsLoading(false);
    loadQueueData();
  };

  const handleUpdateStatus = async (guestId, newStatus) => {
    unlockAudioContext();
    const res = await updateQueueStatusAsync(guestId, newStatus, adminPin);
    if (res && res.success) {
      showNotification(`Status antrean diperbarui menjadi: ${newStatus}`);
      loadQueueData();
    }
  };

  const filteredList = queueList.filter(item => {
    if (filterCategory === 'WAITING') return item.statusAntrean === 'Menunggu' || !item.statusAntrean;
    if (filterCategory === 'CALLED') return item.statusAntrean === 'Dipanggil';
    if (filterCategory === 'DONE') return item.statusAntrean === 'Selesai' || item.status === 'Selesai';
    return true;
  });

  const waitingCount = queueList.filter(q => q.statusAntrean === 'Menunggu' || !q.statusAntrean).length;
  const calledCount = queueList.filter(q => q.statusAntrean === 'Dipanggil').length;
  const doneCount = queueList.filter(q => q.statusAntrean === 'Selesai' || q.status === 'Selesai').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Header Hero Control Card */}
      <div className="glass-panel" style={{ padding: '1.5rem', border: '1.5px solid var(--bps-card-border)', background: 'var(--bps-card)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1.5px solid var(--bps-card-border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Volume2 color="var(--bps-cyan)" size={22} /> Kontrol Panggilan Antrean PST BPS
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Kelola nomor antrean tamu PST, pemanggilan suara otomatis, dan monitor display TV.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                unlockAudioContext();
                setSoundEnabled(!soundEnabled);
              }}
              style={{ fontWeight: '700' }}
            >
              {soundEnabled ? <Volume2 size={15} color="#16a34a" /> : <VolumeX size={15} color="#dc2626" />}
              {soundEnabled ? 'Suara Pemanggil: AKTIF' : 'Suara Pemanggil: MATI'}
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => {
                unlockAudioContext();
                announceQueueCall('001', 'Pelayanan Statistik Terpadu');
              }}
            >
              🔊 Tes Suara
            </button>

            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={onOpenTvDisplay}
              style={{ background: '#0284c7', borderColor: '#0284c7', fontWeight: '800' }}
            >
              <Monitor size={15} /> Buka Display TV Monitor <ExternalLink size={13} />
            </button>
          </div>
        </div>

        {/* Voice Engine Diagnostics Banner */}
        <div style={{ 
          background: voiceInfo.hasIdVoice ? '#f0fdf4' : '#fffbeb', 
          border: voiceInfo.hasIdVoice ? '1px solid #bbf7d0' : '1px solid #fde68a', 
          color: voiceInfo.hasIdVoice ? '#166534' : '#92400e', 
          padding: '0.5rem 0.85rem', 
          fontSize: '0.775rem', 
          fontWeight: '700', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          flexWrap: 'wrap'
        }}>
          <span>🔊 <b>Voice Engine Status:</b> {voiceInfo.voiceName}</span>
          {!voiceInfo.hasIdVoice && (
            <span style={{ fontSize: '0.725rem', opacity: 0.9 }}>
              (Saran: Gunakan browser <b>Google Chrome</b> atau <b>Microsoft Edge</b> untuk mendapatkan suara Bahasa Indonesia resmi jernih).
            </span>
          )}
        </div>

        {notice && (
          <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', color: '#0369a1', padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} /> {notice}
          </div>
        )}

        {/* Big Active Queue Status Banner */}
        <div style={{ 
          background: 'linear-gradient(135deg, #024282 0%, #001f3f 100%)', 
          color: '#ffffff', 
          padding: '1.5rem', 
          display: 'grid', 
          gridTemplateColumns: '1fr auto', 
          gap: '1.5rem',
          alignItems: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              NOMOR ANTREAN SAAT INI DIPANGGIL
            </div>
            <div style={{ fontSize: '3.25rem', fontWeight: '900', color: '#ffffff', lineHeight: 1.1, margin: '0.3rem 0', fontFamily: 'monospace' }}>
              {activeCall?.noAntrean || 'Belum Ada'}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#e2e8f0' }}>
              {activeCall?.nama ? `👤 ${activeCall.nama}` : 'Silakan tekan tombol "Panggil Antrean Berikutnya"'}
            </div>
            {activeCall?.tujuan && (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Tujuan: {activeCall.tujuan}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button 
              type="button"
              className="btn btn-success"
              onClick={handleCallNext}
              disabled={isLoading}
              style={{ padding: '0.75rem 1.25rem', fontWeight: '900', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)' }}
            >
              <Play size={18} /> Panggil Antrean Berikutnya
            </button>

            <button 
              type="button"
              className="btn btn-secondary"
              onClick={handleRecall}
              disabled={!activeCall}
              style={{ fontWeight: '800', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
            >
              <RotateCcw size={16} /> Panggil Ulang Suara
            </button>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '1.25rem' }}>
          <div style={{ background: 'var(--bps-bg)', padding: '0.75rem 1rem', border: '1px solid var(--bps-card-border)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL HARI INI</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--bps-navy)' }}>{queueList.length} Tamu</div>
          </div>
          <div style={{ background: '#eff6ff', padding: '0.75rem 1rem', border: '1px solid #bfdbfe', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#1d4ed8', fontWeight: '700' }}>MENUNGGU</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e40af' }}>{waitingCount} Antrean</div>
          </div>
          <div style={{ background: '#fef3c7', padding: '0.75rem 1rem', border: '1px solid #fde68a', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: '700' }}>SEDANG DIPANGGIL</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#92400e' }}>{calledCount} Antrean</div>
          </div>
          <div style={{ background: '#f0fdf4', padding: '0.75rem 1rem', border: '1px solid #bbf7d0', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: '700' }}>SELESAI DILAYANI</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#166534' }}>{doneCount} Tamu</div>
          </div>
        </div>

      </div>

      {/* 2. Queue List Table Section */}
      <div className="glass-panel" style={{ padding: '1.25rem', border: '1.5px solid var(--bps-card-border)', background: 'var(--bps-card)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={18} color="var(--bps-cyan)" /> Daftar Antrean Hari Ini ({filteredList.length})
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button 
              className={`btn btn-sm ${filterCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterCategory('ALL')}
            >
              Semua ({queueList.length})
            </button>
            <button 
              className={`btn btn-sm ${filterCategory === 'WAITING' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterCategory('WAITING')}
            >
              Menunggu ({waitingCount})
            </button>
            <button 
              className={`btn btn-sm ${filterCategory === 'CALLED' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterCategory('CALLED')}
            >
              Dipanggil ({calledCount})
            </button>
            <button 
              className={`btn btn-sm ${filterCategory === 'DONE' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterCategory('DONE')}
            >
              Selesai ({doneCount})
            </button>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <div style={{ fontWeight: '700' }}>Tidak ada antrean dalam kategori ini.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="spreadsheet-table">
              <thead>
                <tr>
                  <th>No. Antrean</th>
                  <th>Nama Tamu</th>
                  <th>Instansi</th>
                  <th>Tujuan Unit</th>
                  <th>Jam Masuk</th>
                  <th>Status Antrean</th>
                  <th>Aksi Pemanggilan</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item) => {
                  const isCurrentActive = activeCall && activeCall.noAntrean === item.noAntrean;
                  const isDone = item.statusAntrean === 'Selesai' || item.status === 'Selesai';
                  const isSkipped = item.statusAntrean === 'Lewat';

                  return (
                    <tr 
                      key={item.id}
                      style={{ 
                        background: isCurrentActive ? 'rgba(56, 189, 248, 0.15)' : undefined,
                        fontWeight: isCurrentActive ? '800' : 'normal'
                      }}
                    >
                      <td>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: '900', 
                          fontSize: '1.05rem', 
                          color: '#024282',
                          background: '#e0f2fe',
                          padding: '0.2rem 0.58rem',
                          border: '1px solid #7dd3fc'
                        }}>
                          {item.noAntrean || '-'}
                        </span>
                      </td>
                      <td><b>{item.nama}</b></td>
                      <td>{item.instansi}</td>
                      <td>{item.tujuan}</td>
                      <td><Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />{item.jamMasuk}</td>
                      <td>
                        {isDone ? (
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: '800' }}>
                            ✓ Selesai
                          </span>
                        ) : isSkipped ? (
                          <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: '800' }}>
                            ⏭️ Dilewati
                          </span>
                        ) : isCurrentActive ? (
                          <span style={{ background: '#bae6fd', color: '#0369a1', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: '800' }}>
                            🔊 Dipanggil
                          </span>
                        ) : (
                          <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
                            ⏳ Menunggu
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button 
                            type="button" 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleCallSpecific(item)}
                            title="Panggil Tamu Ini"
                            style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                          >
                            <Volume2 size={13} /> Panggil
                          </button>

                          {!isDone && (
                            <button 
                              type="button" 
                              className="btn btn-success btn-sm"
                              onClick={() => handleUpdateStatus(item.id, 'Selesai')}
                              title="Tandai Selesai"
                              style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                            >
                              <CheckCircle size={13} /> Selesai
                            </button>
                          )}

                          {!isDone && (
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleUpdateStatus(item.id, 'Lewat')}
                              title="Lewati Antrean"
                              style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                            >
                              <SkipForward size={13} /> Lewati
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
