import * as XLSX from 'xlsx';

const STORAGE_KEY = 'bps_ppu_buku_tamu_data_v2';
const CONFIG_KEY = 'bps_ppu_buku_tamu_config_v2';

export const INITIAL_GUEST_DATA = [];

// Fetch All Guests (Tries SQLite Backend first, falls back to localStorage)
export const getGuestDataAsync = async () => {
  try {
    const response = await fetch('/api/guests');
    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resData.data));
        return resData.data;
      }
    }
  } catch (e) {
    console.warn('[SQLite Backend] Backend server not reachable, using localStorage fallback');
  }

  // Fallback to localStorage
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_GUEST_DATA));
      return INITIAL_GUEST_DATA;
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_GUEST_DATA;
  }
};

export const getGuestData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_GUEST_DATA));
      return INITIAL_GUEST_DATA;
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_GUEST_DATA;
  }
};

// Add Single Guest to SQLite Database & LocalStorage
export const saveSingleGuestAsync = async (guest) => {
  try {
    await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guest)
    });
  } catch (e) {
    console.error('[SQLite Backend] Failed to save guest to SQLite:', e);
  }
};

// Update Single Guest in SQLite Database
export const updateSingleGuestAsync = async (guest) => {
  try {
    await fetch(`/api/guests/${encodeURIComponent(guest.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guest)
    });
  } catch (e) {
    console.error('[SQLite Backend] Failed to update guest in SQLite:', e);
  }
};

// Delete Single Guest in SQLite Database
export const deleteSingleGuestAsync = async (id) => {
  try {
    await fetch(`/api/guests/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.error('[SQLite Backend] Failed to delete guest from SQLite:', e);
  }
};

// Import Array of Guests to SQLite Database
export const importGuestsAsync = async (guestList) => {
  try {
    await fetch('/api/guests/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestList)
    });
  } catch (e) {
    console.error('[SQLite Backend] Failed to import guests to SQLite:', e);
  }
};

export const saveGuestData = (guests) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
  } catch (e) {
    console.error('Failed to save guest data locally:', e);
  }
};

// Config Async Operations
export const getAppConfigAsync = async () => {
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data) {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(resData.data));
        return resData.data;
      }
    }
  } catch (e) {
    console.warn('[SQLite Backend] Config endpoint fallback to localStorage');
  }
  return getAppConfig();
};

export const getAppConfig = () => {
  try {
    const config = localStorage.getItem(CONFIG_KEY);
    return config ? JSON.parse(config) : {
      webhookUrl: '',
      autoSync: true,
      officeName: 'Badan Pusat Statistik Kabupaten Penajam Paser Utara',
      subTitle: 'Pelayanan Statistik Terpadu (PST BPS PPU)',
      address: 'Jl. Provinsi Km.09 Nipah-Nipah, Penajam, 76411'
    };
  } catch (e) {
    return {
      webhookUrl: '',
      autoSync: true,
      officeName: 'Badan Pusat Statistik Kabupaten Penajam Paser Utara',
      subTitle: 'Pelayanan Statistik Terpadu (PST BPS PPU)',
      address: 'Jl. Provinsi Km.09 Nipah-Nipah, Penajam, 76411'
    };
  }
};

export const saveAppConfigAsync = async (config) => {
  try {
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  } catch (e) {
    console.error('Failed to save config in SQLite:', e);
  }
  saveAppConfig(config);
};

export const saveAppConfig = (config) => {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
};

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
  
  // Set Auto Column Widths
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
  if (!webhookUrl) return { success: false, message: 'URL Webhook belum diisi' };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(guest)
    });
    return { success: true, message: 'Data dikirim ke Google Sheets' };
  } catch (error) {
    console.error('Google Sheets Sync Error:', error);
    return { success: false, message: error.message };
  }
};
