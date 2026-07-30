import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Clock, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

export default function InteractiveCalendarView({ guests }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDateStr, setSelectedDateStr] = useState(today.toISOString().split('T')[0]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Map guests by date string YYYY-MM-DD
  const guestsByDate = useMemo(() => {
    const map = {};
    (guests || []).forEach(g => {
      if (g.tanggal) {
        if (!map[g.tanggal]) map[g.tanggal] = [];
        map[g.tanggal].push(g);
      }
    });
    return map;
  }, [guests]);

  // Calendar Days Computation
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ empty: true, key: `empty-${i}` });
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      const dayGuests = guestsByDate[dateStr] || [];

      days.push({
        empty: false,
        dayNumber: d,
        dateStr,
        guests: dayGuests,
        totalCount: dayGuests.length,
        peopleCount: dayGuests.reduce((acc, curr) => acc + (Number(curr.jumlah) || 1), 0),
        key: dateStr
      });
    }

    return days;
  }, [currentMonth, currentYear, guestsByDate]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Selected date guests list
  const selectedDateGuests = guestsByDate[selectedDateStr] || [];
  const selectedDatePeople = selectedDateGuests.reduce((acc, curr) => acc + (Number(curr.jumlah) || 1), 0);

  return (
    <div style={{ marginTop: '2rem' }}>
      
      {/* Calendar Header Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '2px solid var(--bps-navy)', paddingBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={22} color="var(--bps-navy)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            Kalender Kunjungan
          </h3>
        </div>
        
        {/* Month & Year Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrevMonth} title="Bulan Sebelumnya">
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontWeight: '800', fontSize: '0.95rem', minWidth: '140px', textAlign: 'center', color: 'var(--bps-navy)' }}>
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={handleNextMonth} title="Bulan Berikutnya">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* 1. CALENDAR GRID CONTAINER */}
        <div className="glass-panel" style={{ padding: '1rem' }}>
          
          {/* Day Names Header (Min - Sab) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', color: 'var(--bps-navy)', marginBottom: '0.5rem', borderBottom: '1px solid var(--bps-card-border)', paddingBottom: '0.4rem' }}>
            {dayNames.map((day, idx) => (
              <div key={idx} style={{ color: idx === 0 ? '#b91c1c' : undefined }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Dates Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {calendarGrid.map((cell) => {
              if (cell.empty) {
                return <div key={cell.key} style={{ minHeight: '64px', background: 'transparent' }} />;
              }

              const isSelected = cell.dateStr === selectedDateStr;
              const hasGuests = cell.totalCount > 0;
              const isToday = cell.dateStr === today.toISOString().split('T')[0];

              return (
                <div
                  key={cell.key}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  style={{
                    minHeight: '64px',
                    padding: '0.4rem',
                    background: isSelected 
                      ? 'rgba(2, 66, 130, 0.15)' 
                      : hasGuests 
                      ? 'rgba(0, 119, 182, 0.08)' 
                      : 'var(--bps-card)',
                    border: isSelected 
                      ? '2px solid #024282' 
                      : isToday 
                      ? '2px solid #16a34a' 
                      : '1px solid var(--bps-card-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease-in-out'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontWeight: isSelected || isToday ? '800' : '700', 
                      fontSize: '0.85rem',
                      color: isToday ? '#16a34a' : 'var(--text-primary)'
                    }}>
                      {cell.dayNumber}
                    </span>
                    {isToday && (
                      <span style={{ fontSize: '0.6rem', background: '#16a34a', color: '#fff', padding: '0.05rem 0.25rem', fontWeight: '800' }}>
                        HARI INI
                      </span>
                    )}
                  </div>

                  {hasGuests ? (
                    <div style={{ marginTop: '0.2rem' }}>
                      <span style={{ 
                        display: 'block', 
                        background: '#024282', 
                        color: '#ffffff', 
                        fontSize: '0.65rem', 
                        fontWeight: '800', 
                        padding: '0.15rem 0.3rem', 
                        textAlign: 'center',
                        lineHeight: '1.2'
                      }}>
                        {cell.totalCount} Sesi ({cell.peopleCount} Org)
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>-</span>
                  )}

                </div>
              );
            })}
          </div>

        </div>

        {/* 2. SELECTED DATE DETAILS PANEL */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1.5px solid var(--bps-card-border)', paddingBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={18} color="var(--bps-navy)" />
              <h4 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Rincian Kunjungan:
              </h4>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--bps-navy)', background: 'rgba(2, 66, 130, 0.1)', padding: '0.25rem 0.6rem', border: '1px solid var(--bps-navy)' }}>
              {selectedDateStr}
            </span>
          </div>

          {/* Date Summary Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--bps-bg)', padding: '0.75rem', border: '1px solid var(--bps-card-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>Total Sesi Kunjungan</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--bps-navy)' }}>{selectedDateGuests.length} Sesi</div>
            </div>
            <div style={{ background: 'var(--bps-bg)', padding: '0.75rem', border: '1px solid var(--bps-card-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>Total Orang / Rombongan</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--bps-navy)' }}>{selectedDatePeople} Orang</div>
            </div>
          </div>

          {/* Guest List for Selected Date */}
          {selectedDateGuests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', background: 'var(--bps-bg)', border: '1px dashed var(--bps-card-border)' }}>
              Tidak ada data kunjungan tamu pada tanggal <b>{selectedDateStr}</b>.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '340px', overflowY: 'auto' }}>
              {selectedDateGuests.map((g, idx) => (
                <div 
                  key={g.id}
                  style={{ 
                    padding: '0.75rem', 
                    background: 'var(--bps-bg)', 
                    border: '1px solid var(--bps-card-border)',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                      {idx + 1}. {g.nama}
                    </span>
                    <span className={`status-badge status-${g.status === 'Selesai' ? 'selesai' : 'bertemu'}`}>
                      {g.status === 'Selesai' ? '✓ Selesai' : '⏳ Proses'}
                    </span>
                  </div>

                  <div style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                    🏢 {g.instansi} ({g.jumlah || 1} Orang)
                  </div>
                  
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    🎯 Tujuan: {g.tujuan} • 💬 Keperluan: {g.keperluan}
                  </div>
                  
                  <div style={{ color: 'var(--bps-navy)', fontSize: '0.725rem', fontWeight: '700', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={11} /> Masuk: {g.jamMasuk} {g.jamKeluar !== '-' ? `| Keluar: ${g.jamKeluar}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
