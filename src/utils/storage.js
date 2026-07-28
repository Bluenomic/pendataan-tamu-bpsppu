import * as XLSX from 'xlsx';

const STORAGE_KEY = 'bps_ppu_buku_tamu_data_v2';
const CONFIG_KEY = 'bps_ppu_buku_tamu_config_v2';

export const INITIAL_GUEST_DATA = [];

// PUBLIC API: Register guest from Kiosk (No PIN needed)
export const saveSingleGuestAsync = async (guest) => {
  try {
    await fetch('/api/public/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guest)
    });
  } catch (e) {
    console.error('[Public API] Failed to save guest to SQLite:', e);
  }
};

// ADMIN API: Fetch all guests for Admin Table (EXPLICIT PIN REQUIRED)
export const getGuestDataAsync = async (adminPin) => {
  if (!adminPin) {
    return [];
  }

  try {
    const response = await fetch('/api/admin/guests', {
      headers: { 'x-admin-pin': adminPin }
    });
    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data) {
        return resData.data;
      }
    }
  } catch (e) {
    console.warn('[Admin API] Backend not reachable or PIN invalid');
  }

  return [];
};

export const getGuestData = () => {
  return [];
};

// ADMIN API: Update Single Guest (EXPLICIT PIN REQUIRED)
export const updateSingleGuestAsync = async (guest, adminPin) => {
  if (!adminPin) return;
  try {
    await fetch(`/api/admin/guests/${encodeURIComponent(guest.id)}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin
      },
      body: JSON.stringify(guest)
    });
  } catch (e) {
    console.error('[Admin API] Failed to update guest in SQLite:', e);
  }
};

// ADMIN API: Delete Single Guest (EXPLICIT PIN REQUIRED)
export const deleteSingleGuestAsync = async (id, adminPin) => {
  if (!adminPin) return;
  try {
    await fetch(`/api/admin/guests/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': adminPin }
    });
  } catch (e) {
    console.error('[Admin API] Failed to delete guest from SQLite:', e);
  }
};

// ADMIN API: Batch Import Guests (EXPLICIT PIN REQUIRED)
export const importGuestsAsync = async (guestList, adminPin) => {
  if (!adminPin) return;
  try {
    await fetch('/api/admin/guests/import', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin
      },
      body: JSON.stringify(guestList)
    });
  } catch (e) {
    console.error('[Admin API] Failed to import guests to SQLite:', e);
  }
};

export const saveGuestData = (guests) => {};

// PUBLIC API: Fetch Public Config (No PIN)
export const getAppConfigAsync = async () => {
  try {
    const response = await fetch('/api/public/config');
    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data) {
        return resData.data;
      }
    }
  } catch (e) {
    console.warn('[Public API] Config fallback');
  }
  return getAppConfig();
};

export const getAppConfig = () => {
  return {
    webhookUrl: '',
    autoSync: true,
    officeName: 'Badan Pusat Statistik Kabupaten Penajam Paser Utara',
    subTitle: 'Pelayanan Statistik Terpadu (PST BPS PPU)',
    address: 'Jl. Provinsi Km.09 Nipah-Nipah, Penajam, 76411'
  };
};

// ADMIN API: Save Config (PIN HEADER & BODY SENT)
export const saveAppConfigAsync = async (config, adminPin) => {
  const pin = adminPin || config.adminPin;
  if (!pin) {
    console.error('[Admin API] Cannot save config: missing adminPin!');
    return { success: false, error: 'Missing adminPin' };
  }

  try {
    const response = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-pin': pin 
      },
      body: JSON.stringify(config)
    });
    const resData = await response.json();
    return resData;
  } catch (e) {
    console.error('[Admin API] Failed to save config in SQLite:', e);
    return { success: false, error: e.message };
  }
};

export const saveAppConfig = (config) => {};

// Export Guest Data to Excel File
export const exportToExcel = (guestList, fileName = 'Buku_Tamu_BPS_PPU.xlsx') => {
  const formattedData = guestList.map((item, index) => ({
    'No': index + 1,
    'ID Tamu': item.id,
    'Tanggal': item.tanggal,
    'Jam Masuk': item.jamMasuk,
    'Jam Keluar': item.jamKeluar || '-',
    'Nama Lengkap': item.nama,
    'No. HP / WA': item.noHp,
    'Instansi / Alamat': item.instansi,
    'NIK / Identitas': item.nik || '-',
    'Pegawai / Tujuan': item.tujuan,
    'Keperluan': item.keperluan,
    'Jumlah (Orang)': item.jumlah || 1,
    'Status': item.status,
    'Catatan': item.catatan || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const colWidths = Object.keys(formattedData[0] || {}).map(key => ({
    wch: Math.max(key.length + 3, 15)
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku Tamu BPS PPU');
  XLSX.writeFile(workbook, fileName);
};

// Import Excel File to Guest Data
export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const newGuests = jsonData.map((row, idx) => ({
          id: row['ID Tamu'] || row['ID'] || `BPS-PPU-IMP-${Date.now()}-${idx}`,
          nama: row['Nama Lengkap'] || row['Nama'] || 'Tamu Tanpa Nama',
          noHp: row['No. HP / WA'] || row['No HP'] || '-',
          instansi: row['Instansi / Alamat'] || row['Instansi'] || 'Umum',
          nik: row['NIK / Identitas'] || row['NIK'] || '-',
          tujuan: row['Pegawai / Tujuan'] || row['Tujuan'] || 'Pelayanan Statistik Terpadu (PST)',
          keperluan: row['Keperluan'] || 'Kunjungan Umum',
          jumlah: parseInt(row['Jumlah (Orang)'] || row['Jumlah'] || '1', 10),
          tanggal: row['Tanggal'] || new Date().toISOString().split('T')[0],
          jamMasuk: row['Jam Masuk'] || '08:00 WITA',
          jamKeluar: row['Jam Keluar'] || '-',
          status: row['Status'] || 'Selesai',
          catatan: row['Catatan'] || 'Diimpor dari Excel',
          ttd: ''
        }));

        resolve(newGuests);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

// Sync Single Guest to Google Sheets Webhook
export const syncGuestToGoogleSheets = async (webhookUrl, guest) => {
  return syncBatchGuestsToGoogleSheets(webhookUrl, [guest]);
};

// INSTANT BATCH SYNC TO GOOGLE SHEETS (1 SINGLE HTTP REQUEST FOR ALL GUESTS!)
export const syncBatchGuestsToGoogleSheets = async (webhookUrl, guestList) => {
  if (!webhookUrl || !webhookUrl.trim()) return { success: false, message: 'URL Webhook belum diisi' };
  if (!guestList || guestList.length === 0) return { success: true, count: 0 };

  const cleanUrl = webhookUrl.trim();

  // Prepare clean array payload
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
    status: guest.status || 'Menunggu',
    catatan: guest.catatan || '-'
  }));

  try {
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(cleanBatchPayload)
    });

    return { success: true, count: guestList.length, message: 'Batch sync kilat berhasil' };
  } catch (error) {
    console.error('Batch Sync Error:', error);
    return { success: false, message: error.message };
  }
};
