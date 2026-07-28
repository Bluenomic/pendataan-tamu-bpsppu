export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script - Webhook Buku Tamu Digital BPS Penajam Paser Utara
 * 
 * SANGAT PENTING SAAT DEPLOY:
 * 1. Buka Google Sheets di https://sheets.new
 * 2. Klik menu 'Ekstensi' -> 'Apps Script'
 * 3. Hapus semua kode default dan PASTE kode ini ke dalamnya.
 * 4. Klik 'Simpan' (ikon disket).
 * 5. Klik 'Terapkan' (Deploy) -> 'Penetapan baru' (New deployment).
 * 6. Pilih Jenis: 'Aplikasi Web' (Web App).
 * 7. Deskripsi: "Webhook Buku Tamu BPS PPU"
 * 8. Yang menjalankan: "Saya" (Me)
 * 9. Yang memiliki akses: "Siapa saja" (Anyone) <--- HARUS DILAKUKAN SUPAYA BISA MENERIMA DATA!
 * 10. Klik 'Terapkan', izinkan akses (Grant Access) jika diminta.
 * 11. Salin 'URL Aplikasi Web' yang dihasilkan dan tempelkan ke Pengaturan Web Buku Tamu!
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss ? ss.getSheets()[0] : null;
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: "error", message: "Sheet tidak ditemukan. Pastikan script dibuat dari menu Ekstensi -> Apps Script di dalam Google Sheets." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Buat Header jika sheet masih kosong (baris 1)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ID Tamu",
        "Tanggal",
        "Jam Masuk",
        "Jam Keluar",
        "Nama Lengkap",
        "No. HP / WhatsApp",
        "Instansi / Alamat",
        "NIK / Identitas",
        "Pegawai / Tujuan",
        "Keperluan",
        "Jumlah Rombongan",
        "Status",
        "Catatan"
      ]);
      
      var headerRange = sheet.getRange(1, 1, 1, 13);
      headerRange.setBackground("#024282");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    sheet.appendRow([
      data.id || "-",
      data.tanggal || new Date().toLocaleDateString('id-ID'),
      data.jamMasuk || "-",
      data.jamKeluar || "-",
      data.nama || "-",
      data.noHp || "-",
      data.instansi || "-",
      data.nik || "-",
      data.tujuan || "-",
      data.keperluan || "-",
      data.jumlah || 1,
      data.status || "Menunggu",
      data.catatan || "-"
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Data tamu berhasil ditambahkan ke Google Sheets" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  if (e && e.parameter && (e.parameter.nama || e.parameter.id)) {
    return doPost(e);
  }
  return ContentService.createTextOutput("Webhook Buku Tamu BPS PPU Aktif & Siap Menerima Data!");
}
`;
