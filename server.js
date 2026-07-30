import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const dbPath = path.join(__dirname, 'buku_tamu.db');
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

// Migration: Migrate legacy statuses to 2-stage status system ('Proses' & 'Selesai')
try {
  db.exec("UPDATE guests SET status = 'Proses' WHERE status IN ('Menunggu', 'Sedang Bertemu')");
} catch (e) {
  console.warn('[DB Migration] Status update notice:', e.message);
}

function getAdminPinFromDb() {
  try {
    const row = db.prepare("SELECT value FROM config WHERE key = 'adminPin'").get();
    return row && row.value ? row.value : '1234';
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

  // Check direct PIN match
  if (String(inputHeader).trim() === String(actualPin).trim()) {
    return next();
  }

  // Check Token match
  if (activeAdminTokens.has(inputHeader)) {
    const tokenInfo = activeAdminTokens.get(inputHeader);
    if (Date.now() < tokenInfo.expiresAt) {
      return next();
    } else {
      activeAdminTokens.delete(inputHeader);
      return res.status(401).json({ 
        success: false, 
        error: 'Sesi Admin Telah Kedaluwarsa. Silakan Login Ulang.' 
      });
    }
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
    const guestData = {
      id: guestId,
      nama: guest.nama,
      noHp: guest.noHp || '-',
      instansi: guest.instansi,
      nik: guest.nik || '-',
      tujuan: guest.tujuan || 'Pelayanan Statistik Terpadu (PST)',
      keperluan: guest.keperluan || 'Kunjungan',
      jumlah: parseInt(guest.jumlah || '1', 10),
      tanggal: guest.tanggal || new Date().toISOString().split('T')[0],
      jamMasuk: guest.jamMasuk || '08:00 WITA',
      jamKeluar: guest.jamKeluar || '-',
      status: 'Proses',
      catatan: guest.catatan || '',
      ttd: guest.ttd || ''
    };

    const insertStmt = db.prepare(`
      INSERT INTO guests (id, nama, noHp, instansi, nik, tujuan, keperluan, jumlah, tanggal, jamMasuk, jamKeluar, status, catatan, ttd)
      VALUES (@id, @nama, @noHp, @instansi, @nik, @tujuan, @keperluan, @jumlah, @tanggal, @jamMasuk, @jamKeluar, @status, @catatan, @ttd)
    `);

    insertStmt.run(guestData);

    // Live Sync to Google Sheets automatically from server!
    syncToGoogleSheetsServer({ ...guestData, jumlah: String(guestData.jumlah) });

    res.json({ success: true, message: 'Pendaftaran tamu berhasil disimpan ke SQLite DB.' });
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
    const guests = db.prepare(`SELECT id, status, jamKeluar FROM guests WHERE id IN (${placeholders})`).all(...ids);
    res.json({ success: true, data: guests });
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
        webhookUrl: config.webhookUrl || ''
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
