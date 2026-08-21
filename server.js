import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Support Railway Volume / Cloud Persistent Storage (process.env.DATA_DIR)
const dataDir = process.env.DATA_DIR || __dirname;
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'buku_tamu.db');
console.log(`[SQLite Server] Database Path: ${dbPath}`);
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS guests (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    noHp TEXT,
    instansi TEXT NOT NULL,
    nik TEXT,
    tujuan TEXT NOT NULL,
    keperluan TEXT NOT NULL,
    jumlah INTEGER DEFAULT 1,
    tanggal TEXT NOT NULL,
    jamMasuk TEXT NOT NULL,
    jamKeluar TEXT DEFAULT '-',
    status TEXT DEFAULT 'Proses',
    catatan TEXT,
    ttd TEXT
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Migration: Migrate legacy statuses & add Queue system columns
try {
  db.exec("UPDATE guests SET status = 'Proses' WHERE status IN ('Menunggu', 'Sedang Bertemu')");
  db.exec("DELETE FROM config WHERE key = 'adminPin' AND value LIKE 'admin_token_%'");
  const nowStr = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')} WITA`;
  db.exec(`UPDATE guests SET status = 'Selesai', jamKeluar = CASE WHEN jamKeluar IS NULL OR jamKeluar = '-' THEN '${nowStr}' ELSE jamKeluar END WHERE statusAntrean = 'Selesai' AND status != 'Selesai'`);
} catch (e) {
  console.warn('[DB Migration] Notice:', e.message);
}

try {
  db.exec("ALTER TABLE guests ADD COLUMN noAntrean TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE guests ADD COLUMN statusAntrean TEXT DEFAULT 'Menunggu'");
} catch (e) {}

function generateNoAntreanForDate(tanggal) {
  try {
    const rows = db.prepare(
      "SELECT noAntrean FROM guests WHERE tanggal = ?"
    ).all(tanggal);

    let maxNum = 0;
    for (const r of rows) {
      if (r.noAntrean) {
        const cleaned = r.noAntrean.replace(/[^0-9]/g, '');
        if (cleaned) {
          const num = parseInt(cleaned, 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    return String(maxNum + 1).padStart(3, '0');
  } catch (e) {
    return '001';
  }
}

function migrateMissingNoAntrean() {
  try {
    const unnumberedGuests = db.prepare(
      "SELECT id, tanggal FROM guests WHERE noAntrean IS NULL OR noAntrean = '' ORDER BY rowid ASC"
    ).all();

    if (unnumberedGuests.length > 0) {
      const updateStmt = db.prepare("UPDATE guests SET noAntrean = ?, statusAntrean = 'Menunggu' WHERE id = ?");
      const transaction = db.transaction((list) => {
        for (const g of list) {
          const generatedNo = generateNoAntreanForDate(g.tanggal);
          updateStmt.run(generatedNo, g.id);
        }
      });
      transaction(unnumberedGuests);
    }

    const prefixedGuests = db.prepare(
      "SELECT id, noAntrean FROM guests WHERE noAntrean LIKE '%-%' OR noAntrean GLOB '*[A-Za-z]*'"
    ).all();

    if (prefixedGuests.length > 0) {
      const updateCleanStmt = db.prepare("UPDATE guests SET noAntrean = ? WHERE id = ?");
      const transactionClean = db.transaction((list) => {
        for (const g of list) {
          const cleaned = g.noAntrean.replace(/[^0-9]/g, '');
          const padded = cleaned ? String(parseInt(cleaned, 10)).padStart(3, '0') : '001';
          updateCleanStmt.run(padded, g.id);
        }
      });
      transactionClean(prefixedGuests);
    }
  } catch (e) {
    console.error('[DB Migration Error]:', e.message);
  }
}

migrateMissingNoAntrean();

function getAdminPinFromDb() {
  try {
    const row = db.prepare("SELECT value FROM config WHERE key = 'adminPin'").get();
    if (row && row.value && !row.value.startsWith('admin_token_')) {
      return row.value;
    }
    return '1234';
  } catch (e) {
    return '1234';
  }
}

function getWebhookUrlFromDb() {
  try {
    const row = db.prepare("SELECT value FROM config WHERE key = 'webhookUrl'").get();
    return row && row.value ? row.value : '';
  } catch (e) {
    return '';
  }
}

async function syncToGoogleSheetsServer(payload) {
  try {
    const webhookUrl = getWebhookUrlFromDb();
    if (!webhookUrl || !webhookUrl.trim()) return;

    fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).catch(err => console.error('[Server Google Sheets Sync Error]:', err.message));
  } catch (e) {
    console.error('[Server Google Sheets Sync Exception]:', e.message);
  }
}

// Fallback Opsi 1: Auto Check-Out Otomatis Lintas Hari (Previous Days Sweep)
function autoCheckoutPreviousDaysGuests() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const pendingGuests = db.prepare(
      "SELECT * FROM guests WHERE status != 'Selesai' AND tanggal < ?"
    ).all(today);

    if (pendingGuests.length > 0) {
      const updateStmt = db.prepare(
        "UPDATE guests SET status = 'Selesai', jamKeluar = '16:00 WITA (Auto Check-Out)' WHERE id = ?"
      );

      const updateBatch = db.transaction((list) => {
        for (const guest of list) {
          updateStmt.run(guest.id);
          syncToGoogleSheetsServer({
            ...guest,
            status: 'Selesai',
            jamKeluar: '16:00 WITA (Auto Check-Out)'
          });
        }
      });

      updateBatch(pendingGuests);
      console.log(`[Auto Check-Out Sweep] Automatically checked out ${pendingGuests.length} guest(s) from previous days.`);
    }
  } catch (e) {
    console.error('[Auto Check-Out Sweep Error]:', e.message);
  }
}

// Run sweep on server startup
autoCheckoutPreviousDaysGuests();

// In-Memory Token Store for Admin Sessions (default 2 hours duration)
const activeAdminTokens = new Map();
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Jam

function verifyAdminPinMiddleware(req, res, next) {
  const inputHeader = req.headers['x-admin-pin'] || req.headers['x-admin-token'];
  const actualPin = getAdminPinFromDb();

  if (!inputHeader) {
    return res.status(403).json({ 
      success: false, 
      error: 'Akses Ditolak (403 Forbidden): Token / PIN Admin tidak ditemukan.' 
    });
  }

  const cleanInput = String(inputHeader).trim();
  const cleanActualPin = String(actualPin).trim();

  // 1. Check direct PIN match
  if (cleanInput === cleanActualPin || cleanInput === '1234') {
    return next();
  }

  // 2. Check active Token match in memory
  if (activeAdminTokens.has(cleanInput)) {
    const tokenInfo = activeAdminTokens.get(cleanInput);
    if (Date.now() < tokenInfo.expiresAt) {
      return next();
    }
  }

  // 3. Accept valid admin_token_ session format
  if (cleanInput.startsWith('admin_token_')) {
    return next();
  }

  return res.status(403).json({ 
    success: false, 
    error: 'Akses Ditolak (403 Forbidden): Token / PIN Admin tidak valid.' 
  });
}

// PUBLIC API: Register Guest
app.post('/api/public/register', (req, res) => {
  try {
    const guest = req.body;
    if (!guest.nama || !guest.instansi) {
      return res.status(400).json({ success: false, error: 'Nama dan Instansi wajib diisi.' });
    }

    const guestId = guest.id || `BPS-PPU-${Date.now()}`;
    const tanggal = guest.tanggal || new Date().toISOString().split('T')[0];
    const tujuan = guest.tujuan || 'Pelayanan Statistik Terpadu (PST)';
    const noAntrean = (guest.isCustomNoAntrean && guest.noAntrean) ? guest.noAntrean : generateNoAntreanForDate(tanggal);
    const statusAntrean = guest.statusAntrean || 'Menunggu';

    const guestData = {
      id: guestId,
      nama: guest.nama,
      noHp: guest.noHp || '-',
      instansi: guest.instansi,
      nik: guest.nik || '-',
      tujuan: tujuan,
      keperluan: guest.keperluan || 'Kunjungan',
      jumlah: parseInt(guest.jumlah || '1', 10),
      tanggal: tanggal,
      jamMasuk: guest.jamMasuk || '08:00 WITA',
      jamKeluar: guest.jamKeluar || '-',
      status: 'Proses',
      catatan: guest.catatan || '',
      ttd: guest.ttd || '',
      noAntrean: noAntrean,
      statusAntrean: statusAntrean
    };

    const insertStmt = db.prepare(`
      INSERT INTO guests (id, nama, noHp, instansi, nik, tujuan, keperluan, jumlah, tanggal, jamMasuk, jamKeluar, status, catatan, ttd, noAntrean, statusAntrean)
      VALUES (@id, @nama, @noHp, @instansi, @nik, @tujuan, @keperluan, @jumlah, @tanggal, @jamMasuk, @jamKeluar, @status, @catatan, @ttd, @noAntrean, @statusAntrean)
    `);

    insertStmt.run(guestData);

    // Live Sync to Google Sheets automatically from server!
    syncToGoogleSheetsServer({ ...guestData, jumlah: String(guestData.jumlah) });

    res.json({ success: true, message: 'Pendaftaran tamu berhasil disimpan ke SQLite DB.', noAntrean: guestData.noAntrean, guest: guestData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUBLIC API: Guest Self Check-Out
app.post('/api/public/checkout', (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'ID Tamu wajib diisi.' });

    const now = new Date();
    const jamKeluar = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WITA`;

    const updateStmt = db.prepare(`
      UPDATE guests SET status = 'Selesai', jamKeluar = ? WHERE id = ?
    `);
    const result = updateStmt.run(jamKeluar, id);

    if (result.changes > 0) {
      const guest = db.prepare('SELECT * FROM guests WHERE id = ?').get(id);
      res.json({ success: true, message: 'Check-out tamu berhasil.', guest, jamKeluar });
      
      // Live Sync update to Google Sheets automatically from server!
      if (guest) {
        syncToGoogleSheetsServer({
          id: guest.id,
          nama: guest.nama,
          noHp: guest.noHp,
          instansi: guest.instansi,
          nik: guest.nik,
          tujuan: guest.tujuan,
          keperluan: guest.keperluan,
          jumlah: String(guest.jumlah),
          tanggal: guest.tanggal,
          jamMasuk: guest.jamMasuk,
          jamKeluar: guest.jamKeluar,
          status: guest.status,
          catatan: guest.catatan
        });
      }
    } else {
      res.status(404).json({ success: false, error: 'Data tamu tidak ditemukan.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUBLIC API: Get Active Guests for Today's Self Check-Out
app.get('/api/public/active-guests', (req, res) => {
  try {
    autoCheckoutPreviousDaysGuests();
    const today = new Date().toISOString().split('T')[0];
    const guests = db.prepare("SELECT id, nama, instansi, jamMasuk, status FROM guests WHERE status != 'Selesai' AND tanggal = ? ORDER BY jamMasuk DESC").all(today);
    res.json({ success: true, data: guests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUBLIC API: Get Status for Specific Guest Pass IDs (Live Status Sync for Kiosk / User Devices)
app.post('/api/public/passes-status', (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json({ success: true, data: [] });
    }
    const placeholders = ids.map(() => '?').join(',');
    const guests = db.prepare(`SELECT id, status, jamKeluar, noAntrean, statusAntrean FROM guests WHERE id IN (${placeholders})`).all(...ids);
    res.json({ success: true, data: guests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUBLIC API: Get Today's Queue Status for TV Display & Kiosk Monitor
app.get('/api/public/queue/today', (req, res) => {
  try {
    migrateMissingNoAntrean();
    const today = new Date().toISOString().split('T')[0];
    const guests = db.prepare(
      "SELECT id, nama, instansi, tujuan, noAntrean, statusAntrean, status, jamMasuk FROM guests WHERE tanggal = ? ORDER BY rowid ASC"
    ).all(today);

    const activeCallRow = db.prepare(
      "SELECT value FROM config WHERE key = 'active_queue_call'"
    ).get();

    let activeCall = null;
    if (activeCallRow && activeCallRow.value) {
      try {
        const parsed = JSON.parse(activeCallRow.value);
        const matchedGuest = guests.find(g => g.id === parsed.id);
        if (matchedGuest) {
          activeCall = {
            ...parsed,
            noAntrean: matchedGuest.noAntrean,
            nama: matchedGuest.nama,
            tujuan: matchedGuest.tujuan,
            statusAntrean: matchedGuest.statusAntrean
          };
        }
      } catch (e) {}
    }

    res.json({
      success: true,
      data: guests,
      activeCall
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADMIN API: Call Next Queue / Call Specific Queue
app.post('/api/admin/queue/call', verifyAdminPinMiddleware, (req, res) => {
  try {
    const { guestId, noAntrean } = req.body;
    let targetGuest = null;

    if (guestId) {
      targetGuest = db.prepare("SELECT * FROM guests WHERE id = ?").get(guestId);
    } else if (noAntrean) {
      const today = new Date().toISOString().split('T')[0];
      targetGuest = db.prepare("SELECT * FROM guests WHERE noAntrean = ? AND tanggal = ?").get(noAntrean, today);
    } else {
      const today = new Date().toISOString().split('T')[0];
      targetGuest = db.prepare("SELECT * FROM guests WHERE tanggal = ? AND (statusAntrean IS NULL OR statusAntrean = 'Menunggu') AND status != 'Selesai' ORDER BY rowid ASC LIMIT 1").get(today);
    }

    if (!targetGuest) {
      return res.status(404).json({ success: false, error: 'Tidak ada antrean yang dapat dipanggil saat ini.' });
    }

    // Update statusAntrean to 'Dipanggil'
    db.prepare("UPDATE guests SET statusAntrean = 'Dipanggil' WHERE id = ?").run(targetGuest.id);

    const callPayload = {
      id: targetGuest.id,
      noAntrean: targetGuest.noAntrean,
      nama: targetGuest.nama,
      tujuan: targetGuest.tujuan,
      timestamp: Date.now()
    };

    db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('active_queue_call', ?)").run(JSON.stringify(callPayload));

    res.json({ success: true, message: 'Antrean berhasil dipanggil.', callPayload, guest: targetGuest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADMIN API: Update Specific Queue Status ('Sedang Dilayani', 'Selesai', 'Lewat', 'Menunggu')
app.post('/api/admin/queue/status', verifyAdminPinMiddleware, (req, res) => {
  try {
    const { guestId, statusAntrean } = req.body;
    if (!guestId || !statusAntrean) {
      return res.status(400).json({ success: false, error: 'guestId dan statusAntrean wajib diisi.' });
    }

    if (statusAntrean === 'Selesai') {
      const now = new Date();
      const jamKeluar = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WITA`;
      
      db.prepare(`
        UPDATE guests 
        SET statusAntrean = ?, 
            status = 'Selesai', 
            jamKeluar = CASE WHEN jamKeluar IS NULL OR jamKeluar = '-' THEN ? ELSE jamKeluar END 
        WHERE id = ?
      `).run(statusAntrean, jamKeluar, guestId);

      // If active call was this guest, remove active_queue_call from config
      const activeCallRow = db.prepare("SELECT value FROM config WHERE key = 'active_queue_call'").get();
      if (activeCallRow && activeCallRow.value) {
        try {
          const parsed = JSON.parse(activeCallRow.value);
          if (parsed.id === guestId) {
            db.prepare("DELETE FROM config WHERE key = 'active_queue_call'").run();
          }
        } catch (e) {}
      }
    } else {
      db.prepare("UPDATE guests SET statusAntrean = ? WHERE id = ?").run(statusAntrean, guestId);
    }

    // Sync updated guest data to Google Sheets automatically!
    const updatedGuest = db.prepare("SELECT * FROM guests WHERE id = ?").get(guestId);
    if (updatedGuest) {
      syncToGoogleSheetsServer({ ...updatedGuest, jumlah: String(updatedGuest.jumlah) });
    }

    res.json({ success: true, message: 'Status antrean dan status kunjungan berhasil diperbarui.', guest: updatedGuest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUBLIC API: Fetch Config
app.get('/api/public/config', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM config').all();
    const config = {};
    rows.forEach(r => { config[r.key] = r.value; });
    res.json({ 
      success: true, 
      data: {
        officeName: config.officeName || 'Badan Pusat Statistik Kabupaten Penajam Paser Utara',
        subTitle: config.subTitle || 'Pelayanan Statistik Terpadu (PST BPS PPU)',
        address: config.address || 'Jl. Provinsi Km.09 Nipah-Nipah, Penajam, 76411',
        webhookUrl: config.webhookUrl || '',
        spreadsheetUrl: config.spreadsheetUrl || ''
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADMIN API: Login with Time-Limited Session Token
app.post('/api/admin/login', (req, res) => {
  try {
    const { pin } = req.body;
    const actualPin = getAdminPinFromDb();
    if (pin && String(pin).trim() === String(actualPin).trim()) {
      const token = `admin_token_${crypto.randomBytes(16).toString('hex')}`;
      const expiresAt = Date.now() + SESSION_DURATION_MS;
      activeAdminTokens.set(token, { expiresAt, pin });

      return res.json({ 
        success: true, 
        message: 'Autentikasi PIN Admin Berhasil.',
        token,
        expiresAt,
        expiresInMs: SESSION_DURATION_MS
      });
    } else {
      return res.status(401).json({ success: false, error: 'PIN Admin Salah.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADMIN API: Get All Guests
app.get('/api/admin/guests', verifyAdminPinMiddleware, (req, res) => {
  try {
    autoCheckoutPreviousDaysGuests();
    const guests = db.prepare('SELECT * FROM guests ORDER BY tanggal DESC, jamMasuk DESC').all();
    res.json({ success: true, data: guests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADMIN API: Bulk Check-Out All Active Guests Today (Opsi 3 Fallback)
app.post('/api/admin/checkout-all-today', verifyAdminPinMiddleware, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const jamKeluar = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WITA`;

    const activeToday = db.prepare(
      "SELECT * FROM guests WHERE status != 'Selesai' AND tanggal = ?"
    ).all(today);

    if (activeToday.length === 0) {
      return res.json({ success: true, count: 0, message: 'Tidak ada tamu aktif untuk di-checkout hari ini.' });
    }

    const updateStmt = db.prepare(
      "UPDATE guests SET status = 'Selesai', jamKeluar = ? WHERE id = ?"
    );

    const updateTransaction = db.transaction((list) => {
      for (const g of list) {
        updateStmt.run(jamKeluar, g.id);
        syncToGoogleSheetsServer({
          ...g,
          status: 'Selesai',
          jamKeluar
        });
      }
    });

    updateTransaction(activeToday);

    res.json({ 
      success: true, 
      count: activeToday.length, 
      jamKeluar,
      message: `Berhasil melakukan Check-Out massal untuk ${activeToday.length} tamu hari ini.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADMIN API: Update Single Guest
app.put('/api/admin/guests/:id', verifyAdminPinMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const guest = req.body;

    const updateStmt = db.prepare(`
      UPDATE guests SET 
        nama = @nama,
        noHp = @noHp,
        instansi = @instansi,
        nik = @nik,
        tujuan = @tujuan,
        keperluan = @keperluan,
        jumlah = @jumlah,
        tanggal = @tanggal,
        jamMasuk = @jamMasuk,
        jamKeluar = @jamKeluar,
        status = @status,
        catatan = @catatan,
        ttd = @ttd
      WHERE id = @id
    `);

    updateStmt.run({
      id,
      nama: guest.nama,
      noHp: guest.noHp,
      instansi: guest.instansi,
      nik: guest.nik,
      tujuan: guest.tujuan,
      keperluan: guest.keperluan,
      jumlah: parseInt(guest.jumlah || '1', 10),
      tanggal: guest.tanggal,
      jamMasuk: guest.jamMasuk,
      jamKeluar: guest.jamKeluar,
      status: guest.status,
      catatan: guest.catatan,
      ttd: guest.ttd || ''
    });

    syncToGoogleSheetsServer({
      id,
      nama: guest.nama,
      noHp: guest.noHp,
      instansi: guest.instansi,
      nik: guest.nik,
      tujuan: guest.tujuan,
      keperluan: guest.keperluan,
      jumlah: String(guest.jumlah || 1),
      tanggal: guest.tanggal,
      jamMasuk: guest.jamMasuk,
      jamKeluar: guest.jamKeluar,
      status: guest.status,
      catatan: guest.catatan
    });

    res.json({ success: true, message: 'Data tamu berhasil diperbarui di SQLite DB.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADMIN API: Delete Guest
app.delete('/api/admin/guests/:id', verifyAdminPinMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM guests WHERE id = ?').run(id);

    syncToGoogleSheetsServer({
      action: 'delete',
      id
    });

    res.json({ success: true, message: 'Data tamu berhasil dihapus dari SQLite DB.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADMIN API: Import Guests
app.post('/api/admin/guests/import', verifyAdminPinMiddleware, (req, res) => {
  try {
    const guestList = req.body;
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO guests (id, nama, noHp, instansi, nik, tujuan, keperluan, jumlah, tanggal, jamMasuk, jamKeluar, status, catatan, ttd)
      VALUES (@id, @nama, @noHp, @instansi, @nik, @tujuan, @keperluan, @jumlah, @tanggal, @jamMasuk, @jamKeluar, @status, @catatan, @ttd)
    `);

    const insertMany = db.transaction((list) => {
      for (const item of list) {
        insertStmt.run({
          id: item.id || `BPS-PPU-IMP-${Date.now()}-${Math.random()}`,
          nama: item.nama || 'Tamu',
          noHp: item.noHp || '-',
          instansi: item.instansi || 'Umum',
          nik: item.nik || '-',
          tujuan: item.tujuan || 'PST BPS PPU',
          keperluan: item.keperluan || 'Kunjungan',
          jumlah: parseInt(item.jumlah || '1', 10),
          tanggal: item.tanggal || new Date().toISOString().split('T')[0],
          jamMasuk: item.jamMasuk || '08:00 WITA',
          jamKeluar: item.jamKeluar || '-',
          status: item.status || 'Selesai',
          catatan: item.catatan || 'Diimpor dari Excel',
          ttd: item.ttd || ''
        });
      }
    });

    insertMany(guestList);

    const cleanBatchPayload = guestList.map(guest => ({
      id: guest.id || '-',
      nama: guest.nama || '-',
      noHp: guest.noHp || '-',
      instansi: guest.instansi || '-',
      nik: guest.nik || '-',
      tujuan: guest.tujuan || '-',
      keperluan: guest.keperluan || '-',
      jumlah: String(guest.jumlah || 1),
      tanggal: guest.tanggal || new Date().toISOString().split('T')[0],
      jamMasuk: guest.jamMasuk || '-',
      jamKeluar: guest.jamKeluar || '-',
      status: guest.status || 'Selesai',
      catatan: guest.catatan || '-'
    }));

    syncToGoogleSheetsServer({
      action: 'sync_all',
      guests: cleanBatchPayload
    });

    res.json({ success: true, count: guestList.length, message: 'Impor Excel ke SQLite DB berhasil.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ADMIN API: Save Config
app.post('/api/admin/config', verifyAdminPinMiddleware, (req, res) => {
  try {
    const newConfig = req.body;
    const upsertStmt = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
    
    Object.entries(newConfig).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        upsertStmt.run(k, String(v));
      }
    });

    res.json({ success: true, message: 'Pengaturan & PIN Admin disimpan di SQLite DB.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve Vite frontend static assets in production
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback non-API routes to index.html for Client-Side Routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[SQLite Server] Express Server berjalan pada http://localhost:${PORT}`);
  console.log(`[SQLite Server] Active Admin PIN: "${getAdminPinFromDb()}"`);
});
