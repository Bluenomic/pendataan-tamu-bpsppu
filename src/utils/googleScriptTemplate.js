export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script - Webhook Buku Tamu Digital BPS
 * 
 * CARA PENGGUNAAN:
 * 1. Buka Google Sheets baru di https://sheets.google.com
 * 2. Klik menu 'Ekstensi' -> 'Apps Script'
 * 3. Hapus semua kode default dan PASTE kode ini ke dalamnya.
 * 4. Klik 'Simpan' (ikon disket).
 * 5. Klik 'Terapkan' (Deploy) -> 'Penetapan baru' (New deployment).
 * 6. Pilih Jenis: 'Aplikasi Web' (Web App).
 * 7. Deskripsi: "Webhook Buku Tamu BPS"
 * 8. Yang menjalankan: "Saya" (Me)
 * 9. Yang memiliki akses: "Siapa saja" (Anyone) -> SANGAT PENTING agar web app bisa mengirim data.
 * 10. Klik 'Terapkan', izinkan akses jika diminta.
 * 11. Salin 'URL Aplikasi Web' yang dihasilkan dan tempelkan ke Pengaturan Web Buku Tamu!
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Buat Header jika sheet masih kosong
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
      
      // Format header
      var headerRange = sheet.getRange(1, 1, 1, 13);
      headerRange.setBackground("#1E3A8A");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
    }
    
    var data = JSON.parse(e.postData.contents);
    
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
      .createTextOutput(JSON.stringify({ result: "success", message: "Data tamu berhasil ditambahkan" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Webhook Buku Tamu BPS Aktif & Siap Menerima Data!");
}
`;
