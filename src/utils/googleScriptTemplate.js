export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script - Webhook Buku Tamu Digital BPS Penajam Paser Utara
 * Fitur: Dual-Check Anti-Duplikat (ID Tamu + Nama & Tanggal)
 * 
 * CARA UPDATE DENGAN BENAR (SANGAT PENTING):
 * 1. Buka Google Sheets -> Ekstensi -> Apps Script.
 * 2. Hapus semua kode lama dan PASTE kode ini.
 * 3. Klik tombol Simpan 💾 (Ikon Disket).
 * 4. Klik tombol biru 'Terapkan' (Deploy) -> 'Kelola penetapan' (Manage deployments).
 * 5. Klik ikon PENSIL ✏️ (Edit) pada deployment yang aktif.
 * 6. Pada bagian Versi (Version), WAJIB PILIH 'Versi baru' (New version).
 * 7. Klik 'Terapkan' (Deploy). Selesai!
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss ? ss.getSheets()[0] : null;
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: "error", message: "Sheet tidak ditemukan." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 1. Buat Header jika sheet masih kosong
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
    
    // 2. Parse data payload
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
    
    var guestId = String(data.id || "").trim();
    var guestNama = String(data.nama || "").trim();
    var guestTanggal = String(data.tanggal || "").trim();

    var newRowData = [
      guestId || "-",
      guestTanggal || new Date().toLocaleDateString('id-ID'),
      data.jamMasuk || "-",
      data.jamKeluar || "-",
      guestNama || "-",
      data.noHp || "-",
      data.instansi || "-",
      data.nik || "-",
      data.tujuan || "-",
      data.keperluan || "-",
      data.jumlah || 1,
      data.status || "Menunggu",
      data.catatan || "-"
    ];

    // 3. LOGIKA DUAL-CHECK ANTI-DUPLIKAT (Cek ID Tamu ATAU Nama + Tanggal)
    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    if (lastRow > 1) {
      var allData = sheet.getRange(2, 1, lastRow - 1, 5).getValues(); // Ambil Kolom A (ID), B (Tanggal), E (Nama)
      for (var r = 0; r < allData.length; r++) {
        var rowId = String(allData[r][0] || "").trim();
        var rowTanggal = String(allData[r][1] || "").trim();
        var rowNama = String(allData[r][4] || "").trim();

        // Match 1: ID Tamu Sama
        var isIdMatch = (guestId !== "" && guestId !== "-" && rowId.toLowerCase() === guestId.toLowerCase());
        
        // Match 2: Nama & Tanggal Kunjungan Sama
        var isNameDateMatch = (guestNama !== "" && guestNama !== "-" && rowNama.toLowerCase() === guestNama.toLowerCase() && rowTanggal === guestTanggal);

        if (isIdMatch || isNameDateMatch) {
          targetRow = r + 2; // Offset baris (1-indexed + header)
          break;
        }
      }
    }

    // 4. Update baris lama ATAU Tambah baris baru
    if (targetRow > 1) {
      // UPDATE IN-PLACE (Mencegah Duplikat & Update Status/Jam Keluar)
      sheet.getRange(targetRow, 1, 1, 13).setValues([newRowData]);
    } else {
      // TAMBAH BARIS BARU (Jika benar-benar tamu baru)
      sheet.appendRow(newRowData);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        result: "success", 
        action: targetRow > 1 ? "updated" : "created",
        targetRow: targetRow,
        message: "Data tamu berhasil disinkronkan tanpa duplikat" 
      }))
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
  return ContentService.createTextOutput("Webhook Buku Tamu BPS PPU Aktif & Terproteksi Dual-Check Anti-Duplikat!");
}
`;
