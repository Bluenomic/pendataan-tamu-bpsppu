import React, { useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Building2, 
  FileText 
} from 'lucide-react';
import InteractiveCalendarView from './InteractiveCalendarView';

export default function AnalyticsView({ guests }) {
  // Metrics Computation
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const totalGuests = guests.reduce((sum, g) => sum + (g.jumlah || 1), 0);
    const totalVisits = guests.length;

    const todayGuestsList = guests.filter(g => g.tanggal === todayStr);
    const todayGuests = todayGuestsList.reduce((sum, g) => sum + (g.jumlah || 1), 0);

    const inProgress = guests.filter(g => g.status === 'Proses' || g.status === 'Menunggu' || g.status === 'Sedang Bertemu').length;
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
      inProgress,
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
        <div className="glass-card" style={{ background: 'var(--bps-card)', border: '1px solid var(--bps-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700' }}>Total Seluruh Tamu</span>
            <div style={{ background: '#024282', padding: '0.45rem', borderRadius: '0px', display: 'flex', alignItems: 'center' }}>
              <Users size={18} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {stats.totalGuests} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>orang</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontWeight: '600' }}>
            Dari {stats.totalVisits} sesi kunjungan PST
          </div>
        </div>

        {/* Tamu Hari Ini Card */}
        <div className="glass-card" style={{ background: 'var(--bps-card)', border: '1px solid var(--bps-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700' }}>Kunjungan Hari Ini</span>
            <div style={{ background: '#0077b6', padding: '0.45rem', borderRadius: '0px', display: 'flex', alignItems: 'center' }}>
              <Calendar size={18} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {stats.todayGuests} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>orang</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: '700' }}>
            <TrendingUp size={12} /> Hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
        </div>

        {/* Status Kunjungan Card */}
        <div className="glass-card" style={{ background: 'var(--bps-card)', border: '1px solid var(--bps-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '700' }}>Dalam Proses Kunjungan</span>
            <div style={{ background: '#0284c7', padding: '0.45rem', borderRadius: '0px', display: 'flex', alignItems: 'center' }}>
              <Clock size={18} color="#fff" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0284c7' }}>
            {stats.inProgress} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>sesi</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.3rem', fontWeight: '700' }}>
            ✓ Kunjungan Selesai: {stats.completed} sesi
          </div>
        </div>

      </div>

      {/* Analytics Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        
        {/* Top Keperluan Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--bps-card-border)', paddingBottom: '0.75rem' }}>
            <FileText size={20} color="var(--bps-navy)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Statistik Kategori Keperluan</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.topKeperluan.map(([keperluan, count], index) => {
              const percentage = Math.round((count / (stats.totalVisits || 1)) * 100);
              return (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{keperluan}</span>
                    <span style={{ color: 'var(--bps-cyan)', fontWeight: '800' }}>{count} ({percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bps-bg)', border: '1px solid var(--bps-card-border)' }}>
                    <div 
                      style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: '#024282',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1.5px solid var(--bps-card-border)', paddingBottom: '0.75rem' }}>
            <Building2 size={20} color="var(--bps-navy)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Instansi / Perusahaan Terbanyak</h3>
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
                  background: 'var(--bps-bg)',
                  border: '1px solid var(--bps-card-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    background: '#024282', 
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.75rem'
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-primary)' }}>{instansi}</span>
                </div>
                <span className="status-badge status-bertemu" style={{ fontSize: '0.8rem' }}>
                  {count} Kunjungan
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. INTERACTIVE CALENDAR VIEW */}
      <InteractiveCalendarView guests={guests} />

    </div>
  );
}
