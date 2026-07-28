export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script - Webhook Buku Tamu Digital BPS Penajam Paser Utara
 * Fitur: Batch Processing Kilat (Batch Sync Super Cepat < 0.5 Detik) & Anti-Duplikat
 * 
 * CARA UPDATE:
 * 1. Buka Google Sheets -> Ekstensi -> Apps Script.
 * 2. Hapus semua kode lama dan PASTE kode ini.
 * 3. Klik tombol Simpan 💾 (Ikon Disket).
 * 4. Klik 'Terapkan' (Deploy) -> 'Kelola penetapan' (Manage deployments).
 * 5. Klik ikon PENSIL ✏️ (Edit) -> Versi: 'Versi baru' (New version).
 * 6. Klik 'Terapkan' (Deploy). Selesai!
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
    
    // 2. Parse data payload (Dapat menerima Single Object maupun Batch Array)
    var rawData = null;
    if (e && e.postData && e.postData.contents) {
      try {
        rawData = JSON.parse(e.postData.contents);
      } catch (err) {
        rawData = e.parameter || {};
      }
    } else if (e && e.parameter) {
      rawData = e.parameter;
    }
    
    var guestList = Array.isArray(rawData) ? rawData : [rawData];
    var lastRow = sheet.getLastRow();
    
    // 3. Peta memori untuk pencarian ID Tamu & Nama+Tanggal kilat
    var existingRowsMap = {};
    if (lastRow > 1) {
      var allData = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
      for (var r = 0; r < allData.length; r++) {
        var rowId = String(allData[r][0] || "").trim().toLowerCase();
        var rowTanggal = String(allData[r][1] || "").trim();
        var rowNama = String(allData[r][4] || "").trim().toLowerCase();

        if (rowId && rowId !== "-") {
          existingRowsMap["id:" + rowId] = r + 2;
        }
        if (rowNama && rowNama !== "-") {
          existingRowsMap["nd:" + rowNama + "|" + rowTanggal] = r + 2;
        }
      }
    }

    var updatedCount = 0;
    var createdCount = 0;

    // 4. Proses Batch dalam 1 siklus eksekusi memori super cepat
    for (var i = 0; i < guestList.length; i++) {
      var item = guestList[i] || {};
      var guestId = String(item.id || "").trim();
      var guestNama = String(item.nama || "").trim();
      var guestTanggal = String(item.tanggal || "").trim();

      var rowData = [
        guestId || "-",
        guestTanggal || new Date().toLocaleDateString('id-ID'),
        item.jamMasuk || "-",
        item.jamKeluar || "-",
        guestNama || "-",
        item.noHp || "-",
        item.instansi || "-",
        item.nik || "-",
        item.tujuan || "-",
        item.keperluan || "-",
        item.jumlah || 1,
        item.status || "Menunggu",
        item.catatan || "-"
      ];

      var targetRow = existingRowsMap["id:" + guestId.toLowerCase()] || existingRowsMap["nd:" + guestNama.toLowerCase() + "|" + guestTanggal];

      if (targetRow && targetRow > 1) {
        // Update baris di tempat (In-place update)
        sheet.getRange(targetRow, 1, 1, 13).setValues([rowData]);
        updatedCount++;
      } else {
        // Tambah baris baru
        sheet.appendRow(rowData);
        createdCount++;
        
        var newLastRow = sheet.getLastRow();
        if (guestId) existingRowsMap["id:" + guestId.toLowerCase()] = newLastRow;
        if (guestNama) existingRowsMap["nd:" + guestNama.toLowerCase() + "|" + guestTanggal] = newLastRow;
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        result: "success", 
        processed: guestList.length,
        updated: updatedCount,
        created: createdCount,
        message: "Sinkronisasi batch selesai kilat" 
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
  return ContentService.createTextOutput("Webhook Buku Tamu BPS PPU Aktif & Terproteksi Batch Processing Kilat!");
}
`;
