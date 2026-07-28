import * as XLSX from 'xlsx';

const STORAGE_KEY = 'bps_ppu_buku_tamu_data_v2';
const CONFIG_KEY = 'bps_ppu_buku_tamu_config_v2';

export const INITIAL_GUEST_DATA = [
  {
    id: 'BPS-PPU-2026-001',
    nama: 'Dr. Hendra Wijaya, M.Si',
    noHp: '081234567890',
    instansi: 'Bappeda Kabupaten Penajam Paser Utara',
    nik: '6409012304850001',
    tujuan: 'Kepala BPS Kab. Penajam Paser Utara',
    keperluan: 'Koordinasi Data PDRB & Publikasi Penajam Paser Utara Dalam Angka 2026',
    jumlah: 2,
    tanggal: new Date(Date.now() - 3600000 * 24 * 2).toISOString().split('T')[0],
    jamMasuk: '08:30 WITA',
    jamKeluar: '10:15 WITA',
    status: 'Selesai',
    catatan: 'Dokumen rekomendasi statistik telah diserahkan.',
    ttd: ''
  },
  {
    id: 'BPS-PPU-2026-002',
    nama: 'Siti Rahmawati, S.Stat',
    noHp: '085712345678',
    instansi: 'Dinas Kominfo Penajam Paser Utara',
    nik: '6409025509980003',
    tujuan: 'Tim Pelayanan Statistik Terpadu (PST)',
    keperluan: 'Konsultasi Data Inflasi & Survei Kepuasan Konsumen',
    jumlah: 1,
    tanggal: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0],
    jamMasuk: '09:15 WITA',
    jamKeluar: '11:00 WITA',
    status: 'Selesai',
    catatan: 'Permohonan rilis pers BRS',
    ttd: ''
  },
  {
    id: 'BPS-PPU-2026-003',
    nama: 'Ahmad Fauzi',
    noHp: '081398765432',
    instansi: 'Universitas Mulawarman',
    nik: '6409051211790005',
    tujuan: 'Subbagian Umum & Kepegawaian',
    keperluan: 'Pengajuan Izin Riset & Permohonan Mikrodata Pertanian ST2023',
    jumlah: 3,
    tanggal: new Date().toISOString().split('T')[0],
    jamMasuk: '09:00 WITA',
    jamKeluar: '-',
    status: 'Sedang Bertemu',
    catatan: 'Ruang PST Lt. 1',
    ttd: ''
  },
  {
    id: 'BPS-PPU-2026-004',
    nama: 'Dewi Lestari, S.I.Kom',
    noHp: '082133445566',
    instansi: 'Penajam Post Media',
    nik: '6409036004920002',
    tujuan: 'Humas / Subbag Umum',
    keperluan: 'Wawancara Press Berita Resmi Statistik (BRS)',
    jumlah: 1,
    tanggal: new Date().toISOString().split('T')[0],
    jamMasuk: '10:30 WITA',
    jamKeluar: '-',
    status: 'Menunggu',
    catatan: 'Liputan Rilis Inflasi PPU',
    ttd: ''
  }
];

export const getGuestData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_GUEST_DATA));
      return INITIAL_GUEST_DATA;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to read guest data:', e);
    return INITIAL_GUEST_DATA;
  }
};

export const saveGuestData = (guests) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
  } catch (e) {
    console.error('Failed to save guest data:', e);
  }
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
