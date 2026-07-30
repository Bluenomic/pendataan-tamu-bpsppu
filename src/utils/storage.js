import * as XLSX from 'xlsx';

export const INITIAL_GUEST_DATA = [];

export const saveSingleGuestAsync = async (guest) => {
  try {
    await fetch('/api/public/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guest)
    });
  } catch (e) {
    console.error('[Public API] Failed to save guest:', e);
  }
};

// PUBLIC API: Guest Self Check-Out
export const checkoutGuestAsync = async (guestId) => {
  try {
    const response = await fetch('/api/public/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: guestId })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error('[Public API] Failed to checkout guest:', e);
  }
  return { success: false };
};

// PUBLIC API: Get Active Guests for Today's Self Check-Out
export const getActiveGuestsAsync = async () => {
  try {
    const response = await fetch('/api/public/active-guests');
    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data) {
        return resData.data;
      }
    }
  } catch (e) {
    console.error('[Public API] Failed to fetch active guests:', e);
  }
  return [];
};

export const checkoutAllTodayAsync = async (adminPin) => {
  if (!adminPin) return { success: false };
  try {
    const response = await fetch('/api/admin/checkout-all-today', {
      method: 'POST',
      headers: { 'x-admin-pin': adminPin }
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error('[Admin API] Failed bulk checkout today:', e);
  }
  return { success: false };
};

export const getGuestDataAsync = async (adminPin) => {
  if (!adminPin) return [];

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

export const getGuestData = () => [];

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
    console.error('[Admin API] Failed to update guest:', e);
  }
};

export const deleteSingleGuestAsync = async (id, adminPin) => {
  if (!adminPin) return;
  try {
    await fetch(`/api/admin/guests/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': adminPin }
    });
  } catch (e) {
    console.error('[Admin API] Failed to delete guest:', e);
  }
};

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
    console.error('[Admin API] Failed to import guests:', e);
  }
};

export const saveGuestData = (guests) => {};

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

export const saveAppConfigAsync = async (config, adminPin) => {
  const pin = adminPin || config.adminPin;
  if (!pin) return { success: false, error: 'Missing adminPin' };

  try {
    const response = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-pin': pin 
      },
      body: JSON.stringify(config)
    });
    return await response.json();
  } catch (e) {
    console.error('[Admin API] Failed to save config:', e);
    return { success: false, error: e.message };
  }
};

export const saveAppConfig = (config) => {};

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

export const syncGuestToGoogleSheets = async (webhookUrl, guest) => {
  if (!webhookUrl || !webhookUrl.trim()) return { success: false, message: 'URL Webhook belum diisi' };
  try {
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
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
      })
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteGuestFromGoogleSheets = async (webhookUrl, guestId) => {
  if (!webhookUrl || !webhookUrl.trim() || !guestId) return { success: false };
  try {
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'delete',
        id: guestId
      })
    });
    return { success: true };
  } catch (error) {
    console.error('Delete Sheets Error:', error);
    return { success: false, message: error.message };
  }
};

export const syncBatchGuestsToGoogleSheets = async (webhookUrl, guestList) => {
  if (!webhookUrl || !webhookUrl.trim()) return { success: false, message: 'URL Webhook belum diisi' };

  const cleanUrl = webhookUrl.trim();

  const cleanBatchPayload = (guestList || []).map(guest => ({
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
      body: JSON.stringify({
        action: 'sync_all',
        guests: cleanBatchPayload
      })
    });

    return { success: true, count: cleanBatchPayload.length, message: 'Full Mirror Sync berhasil' };
  } catch (error) {
    console.error('Batch Sync Error:', error);
    return { success: false, message: error.message };
  }
};
