import * as XLSX from 'xlsx';

const STORAGE_KEY = 'bps_buku_tamu_data_v1';
const CONFIG_KEY = 'bps_buku_tamu_config_v1';

export const INITIAL_GUEST_DATA = [
  {
    id: 'GUEST-2026-001',
    nama: 'Dr. Hendra Wijaya, M.Si',
    noHp: '081234567890',
    instansi: 'Dinas Komunikasi dan Informatika',
    nik: '3374012304850001',
    tujuan: 'Drs. Supriyadi (Kepala BPS)',
    keperluan: 'Konsultasi Data PDRB & Inflasi Daerah',
    jumlah: 2,
    tanggal: new Date(Date.now() - 3600000 * 24 * 2).toISOString().split('T')[0],
    jamMasuk: '08:30',
    jamKeluar: '10:15',
    status: 'Selesai',
    catatan: 'Dokumen rekomendasi statistik telah diserahkan.',
    ttd: ''
  },
  {
    id: 'GUEST-2026-002',
    nama: 'Siti Rahmawati, S.Stat',
    noHp: '085712345678',
    instansi: 'Universitas Diponegoro',
    nik: '3374025509980003',
    tujuan: 'Tim Pelayanan Statistik Terpadu (PST)',
    keperluan: 'Pengajuan Izin Riset & Permohonan Mikrodata ST2023',
    jumlah: 1,
    tanggal: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0],
    jamMasuk: '09:15',
    jamKeluar: '11:00',
    status: 'Selesai',
    catatan: 'Mahasiswa S2 Penelitian Pertanian',
    ttd: ''
  },
  {
    id: 'GUEST-2026-003',
    nama: 'Ahmad Fauzi',
    noHp: '081398765432',
    instansi: 'Bappeda Provinsi',
    nik: '3374051211790005',
    tujuan: 'Tim Neraca Wilayah & Analisis Statistik',
    keperluan: 'Koordinasi Data Publikasi Daerah Dalam Angka',
    jumlah: 3,
    tanggal: new Date().toISOString().split('T')[0],
    jamMasuk: '09:00',
    jamKeluar: '-',
    status: 'Sedang Bertemu',
    catatan: 'Ruang Rapat Utama lantai 2',
    ttd: ''
  },
  {
    id: 'GUEST-2026-004',
    nama: 'Dewi Lestari, S.I.Kom',
    noHp: '082133445566',
    instansi: 'Radar Nusantara Post',
    nik: '3374036004920002',
    tujuan: 'Humas / Subbag Umum',
    keperluan: 'Liputan Media Berita Resmi Statistik (BRS)',
    jumlah: 1,
    tanggal: new Date().toISOString().split('T')[0],
    jamMasuk: '10:30',
    jamKeluar: '-',
    status: 'Menunggu',
    catatan: 'Menunggu rilis pers jam 11.00 WIB',
    ttd: ''
  },
  {
    id: 'GUEST-2026-005',
    nama: 'Budi Santoso',
    noHp: '085290001122',
    instansi: 'PT. Jasa Konsultan Mandiri',
    nik: '3374061508840004',
    tujuan: 'Tim Pengadaan / PPK BPS',
    keperluan: 'Aktivasi Kemitraan & Survey Lapangan',
    jumlah: 2,
    tanggal: new Date().toISOString().split('T')[0],
    jamMasuk: '11:00',
    jamKeluar: '-',
    status: 'Menunggu',
    catatan: 'Konfirmasi pertemuan via WA',
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
      officeName: 'Badan Pusat Statistik (BPS)',
      subTitle: 'Pelayanan Terpadu & Buku Tamu Digital'
    };
  } catch (e) {
    return {
      webhookUrl: '',
      autoSync: true,
      officeName: 'Badan Pusat Statistik (BPS)',
      subTitle: 'Pelayanan Terpadu & Buku Tamu Digital'
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
export const exportToExcel = (guestList, fileName = 'Buku_Tamu_BPS.xlsx') => {
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Buku Tamu BPS');
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
          id: row['ID Tamu'] || row['ID'] || `GUEST-IMP-${Date.now()}-${idx}`,
          nama: row['Nama Lengkap'] || row['Nama'] || 'Tamu Tanpa Nama',
          noHp: row['No. HP / WA'] || row['No HP'] || '-',
          instansi: row['Instansi / Alamat'] || row['Instansi'] || 'Umum',
          nik: row['NIK / Identitas'] || row['NIK'] || '-',
          tujuan: row['Pegawai / Tujuan'] || row['Tujuan'] || 'Resepsionis',
          keperluan: row['Keperluan'] || 'Kunjungan Umum',
          jumlah: parseInt(row['Jumlah (Orang)'] || row['Jumlah'] || '1', 10),
          tanggal: row['Tanggal'] || new Date().toISOString().split('T')[0],
          jamMasuk: row['Jam Masuk'] || '08:00',
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
    const response = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script requires no-cors for simple redirects
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
