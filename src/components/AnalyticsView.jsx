import React, { useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Building2, 
  FileText, 
  PieChart, 
  CheckCircle2 
} from 'lucide-react';

export default function AnalyticsView({ guests }) {
  // Metrics Computation
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const totalGuests = guests.reduce((sum, g) => sum + (g.jumlah || 1), 0);
    const totalVisits = guests.length;

    const todayGuestsList = guests.filter(g => g.tanggal === todayStr);
    const todayGuests = todayGuestsList.reduce((sum, g) => sum + (g.jumlah || 1), 0);

    const activeMeeting = guests.filter(g => g.status === 'Sedang Bertemu').length;
    const waiting = guests.filter(g => g.status === 'Menunggu').length;
    const completed = guests.filter(g => g.status === 'Selesai').length;

    // Top Keperluan Breakdown
    const keperluanCounts = {};
    guests.forEach(g => {
      const key = g.keperluan || 'Lainnya';
      keperluanCounts[key] = (keperluanCounts[key] || 0) + 1;
    });

    const topKeperluan = Object.entries(keperluanCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Top Instansi Breakdown
    const instansiCounts = {};
    guests.forEach(g => {
      const key = g.instansi || 'Umum';
      instansiCounts[key] = (instansiCounts[key] || 0) + 1;
    });

    const topInstansi = Object.entries(instansiCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalGuests,
      totalVisits,
      todayGuests,
      activeMeeting,
      waiting,
      completed,
      topKeperluan,
      topInstansi
    };
  }, [guests]);

  return (
    <div style={{ padding: '0 1rem 2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Total Tamu Card */}
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(30, 41, 59, 0.8))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Seluruh Tamu</span>
            <div style={{ background: 'var(--accent-gradient)', padding: '0.4rem', borderRadius: '8px' }}>
              <Users size={18} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats.totalGuests} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '400' }}>orang</span></div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Dari {stats.totalVisits} sesi kunjungan terdaftar
          </div>
        </div>

        {/* Tamu Hari Ini Card */}
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(30, 41, 59, 0.8))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Kunjungan Hari Ini</span>
            <div style={{ background: 'var(--info)', padding: '0.4rem', borderRadius: '8px' }}>
              <Calendar size={18} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats.todayGuests} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '400' }}>orang</span></div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <TrendingUp size={12} /> Hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
        </div>

        {/* Sedang Bertemu Card */}
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(30, 41, 59, 0.8))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Sedang Bertemu / Aktif</span>
            <div style={{ background: 'var(--success)', padding: '0.4rem', borderRadius: '8px' }}>
              <Clock size={18} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--info)' }}>{stats.activeMeeting} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '400' }}>sesi</span></div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Menunggu: {stats.waiting} | Selesai: {stats.completed}
          </div>
        </div>

      </div>

      {/* Analytics Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Top Keperluan Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '0.75rem' }}>
            <FileText size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Statistik Kategori Keperluan</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.topKeperluan.map(([keperluan, count], index) => {
              const percentage = Math.round((count / (stats.totalVisits || 1)) * 100);
              return (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: '600' }}>{keperluan}</span>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: '700' }}>{count} ({percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: 'var(--accent-gradient)',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Instansi Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '0.75rem' }}>
            <Building2 size={20} color="var(--info)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Instansi / Perusahaan Terbanyak</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {stats.topInstansi.map(([instansi, count], index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--bg-card-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: 'var(--accent-glow)', 
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.75rem'
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{instansi}</span>
                </div>
                <span className="status-badge status-bertemu" style={{ fontSize: '0.8rem' }}>
                  {count} Kunjungan
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
