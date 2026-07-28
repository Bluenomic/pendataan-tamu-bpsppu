import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'buku_tamu.db');
const db = new Database(dbPath);

console.log(`[SQLite] Database connected at: ${dbPath}`);

// Create Tables
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
    status TEXT DEFAULT 'Menunggu',
    catatan TEXT,
    ttd TEXT
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// REST API Endpoints

// GET /api/guests - Read all guests
app.get('/api/guests', (req, res) => {
  try {
    const guests = db.prepare('SELECT * FROM guests ORDER BY tanggal DESC, jamMasuk DESC').all();
    res.json({ success: true, data: guests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/guests - Create single guest
app.post('/api/guests', (req, res) => {
  try {
    const guest = req.body;
    const insertStmt = db.prepare(`
      INSERT INTO guests (id, nama, noHp, instansi, nik, tujuan, keperluan, jumlah, tanggal, jamMasuk, jamKeluar, status, catatan, ttd)
      VALUES (@id, @nama, @noHp, @instansi, @nik, @tujuan, @keperluan, @jumlah, @tanggal, @jamMasuk, @jamKeluar, @status, @catatan, @ttd)
    `);
    insertStmt.run({
      id: guest.id,
      nama: guest.nama || '',
      noHp: guest.noHp || '-',
      instansi: guest.instansi || '',
      nik: guest.nik || '-',
      tujuan: guest.tujuan || 'Pelayanan Statistik Terpadu (PST)',
      keperluan: guest.keperluan || 'Kunjungan',
      jumlah: parseInt(guest.jumlah || '1', 10),
      tanggal: guest.tanggal || new Date().toISOString().split('T')[0],
      jamMasuk: guest.jamMasuk || '08:00 WITA',
      jamKeluar: guest.jamKeluar || '-',
      status: guest.status || 'Menunggu',
      catatan: guest.catatan || '',
      ttd: guest.ttd || ''
    });
    res.json({ success: true, message: 'Data tamu berhasil disimpan ke SQLite' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/guests/:id - Update single guest
app.put('/api/guests/:id', (req, res) => {
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
    res.json({ success: true, message: 'Data tamu berhasil diperbarui di SQLite' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/guests/:id - Delete single guest
app.delete('/api/guests/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM guests WHERE id = ?').run(id);
    res.json({ success: true, message: 'Data tamu berhasil dihapus dari SQLite' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/guests/import - Batch import array of guests
app.post('/api/guests/import', (req, res) => {
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
    res.json({ success: true, count: guestList.length, message: 'Batch import SQLite berhasil' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/config - Get Config
app.get('/api/config', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM config').all();
    const config = {};
    rows.forEach(r => { config[r.key] = r.value; });
    res.json({ 
      success: true, 
      data: {
        webhookUrl: config.webhookUrl || '',
        autoSync: config.autoSync === 'false' ? false : true,
        officeName: config.officeName || 'Badan Pusat Statistik Kabupaten Penajam Paser Utara',
        subTitle: config.subTitle || 'Pelayanan Statistik Terpadu (PST BPS PPU)',
        address: config.address || 'Jl. Provinsi Km.09 Nipah-Nipah, Penajam, 76411'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/config - Save Config
app.post('/api/config', (req, res) => {
  try {
    const newConfig = req.body;
    const upsertStmt = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
    Object.entries(newConfig).forEach(([k, v]) => {
      upsertStmt.run(k, String(v));
    });
    res.json({ success: true, message: 'Pengaturan berhasil disimpan di SQLite' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`[SQLite Server] Server Express & Database SQLite berjalan pada http://localhost:${PORT}`);
});
