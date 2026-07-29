import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
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
    status TEXT DEFAULT 'Menunggu',
    catatan TEXT,
    ttd TEXT
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

function getAdminPinFromDb() {
  try {
    const row = db.prepare("SELECT value FROM config WHERE key = 'adminPin'").get();
    return row && row.value ? row.value : '1234';
  } catch (e) {
    return '1234';
  }
}

function verifyAdminPinMiddleware(req, res, next) {
  const inputPin = req.headers['x-admin-pin'];
  const actualPin = getAdminPinFromDb();

  if (!inputPin || inputPin !== actualPin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Akses Ditolak (403 Forbidden): PIN Admin tidak valid.' 
    });
  }
  next();
}

app.post('/api/public/register', (req, res) => {
  try {
    const guest = req.body;
    if (!guest.nama || !guest.instansi) {
      return res.status(400).json({ success: false, error: 'Nama dan Instansi wajib diisi.' });
    }

    const guestId = guest.id || `BPS-PPU-${Date.now()}`;

    const insertStmt = db.prepare(`
      INSERT INTO guests (id, nama, noHp, instansi, nik, tujuan, keperluan, jumlah, tanggal, jamMasuk, jamKeluar, status, catatan, ttd)
      VALUES (@id, @nama, @noHp, @instansi, @nik, @tujuan, @keperluan, @jumlah, @tanggal, @jamMasuk, @jamKeluar, @status, @catatan, @ttd)
    `);

    insertStmt.run({
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
      status: 'Menunggu',
      catatan: guest.catatan || '',
      ttd: guest.ttd || ''
    });

    res.json({ success: true, message: 'Pendaftaran tamu berhasil disimpan ke SQLite DB.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

app.post('/api/admin/login', (req, res) => {
  try {
    const { pin } = req.body;
    const actualPin = getAdminPinFromDb();
    if (pin === actualPin) {
      return res.json({ success: true, message: 'Autentikasi PIN Admin Berhasil.' });
    } else {
      return res.status(401).json({ success: false, error: 'PIN Admin Salah.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/admin/guests', verifyAdminPinMiddleware, (req, res) => {
  try {
    const guests = db.prepare('SELECT * FROM guests ORDER BY tanggal DESC, jamMasuk DESC').all();
    res.json({ success: true, data: guests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

    res.json({ success: true, message: 'Data tamu berhasil diperbarui di SQLite DB.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/admin/guests/:id', verifyAdminPinMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM guests WHERE id = ?').run(id);
    res.json({ success: true, message: 'Data tamu berhasil dihapus dari SQLite DB.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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
    res.json({ success: true, count: guestList.length, message: 'Impor Excel ke SQLite DB berhasil.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

app.listen(PORT, () => {
  console.log(`[SQLite Server] Express Server berjalan pada http://localhost:${PORT}`);
});
