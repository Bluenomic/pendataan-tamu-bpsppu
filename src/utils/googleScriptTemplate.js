export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script - Webhook Buku Tamu Digital BPS Penajam Paser Utara
 * Fitur: Synchronized Mirroring (Sync Hapus Data, Sync Master, & Upsert Dual-Check)
 * 
 * CARA UPDATE UNTUK MENGAKTIFKAN SYNC HAPUS DATA:
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
    
    // 1. Pastikan Header Row selalu ada
    ensureHeader(sheet);
    
    // 2. Parse data payload
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
    
    var action = (rawData && rawData.action) ? String(rawData.action).toLowerCase() : '';

    // =========================================================================
    // FITUR A: HAPUS BARIS DATA DI GOOGLE SHEETS (Jika dihapus di Admin Panel)
    // =========================================================================
    if (action === 'delete') {
      var targetId = String(rawData.id || "").trim().toLowerCase();
      var lastRow = sheet.getLastRow();
      var deleted = false;

      if (targetId && lastRow > 1) {
        var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < idValues.length; i++) {
          if (String(idValues[i][0]).trim().toLowerCase() === targetId) {
            sheet.deleteRow(i + 2); // Offset 1-indexed + header
            deleted = true;
            break;
          }
        }
      }

      return ContentService
        .createTextOutput(JSON.stringify({ 
          result: "success", 
          action: "delete",
          deleted: deleted,
          message: deleted ? "Data tamu berhasil dihapus dari Google Sheets" : "Data tamu tidak ditemukan di Google Sheets" 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // FITUR B: SYNC MASTER / FULL MIRROR (Penyinkronan Total 100% Sesuai Tabel Admin)
    // =========================================================================
    if (action === 'sync_all' || (rawData && Array.isArray(rawData.guests))) {
      var guestList = rawData.guests || [];
      var lastRow = sheet.getLastRow();

      // Bersihkan seluruh data lama di spreadsheet (Kecuali Header Baris 1)
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 13).clearContent();
      }

      if (guestList.length > 0) {
        var rowsData = [];
        for (var k = 0; k < guestList.length; k++) {
          var item = guestList[k] || {};
          rowsData.push([
            String(item.id || "-").trim(),
            String(item.tanggal || new Date().toLocaleDateString('id-ID')).trim(),
            String(item.jamMasuk || "-").trim(),
            String(item.jamKeluar || "-").trim(),
            String(item.nama || "-").trim(),
            String(item.noHp || "-").trim(),
            String(item.instansi || "-").trim(),
            String(item.nik || "-").trim(),
            String(item.tujuan || "-").trim(),
            String(item.keperluan || "-").trim(),
            Number(item.jumlah || 1),
            String(item.status || "Menunggu").trim(),
            String(item.catatan || "-").trim()
          ]);
        }
        sheet.getRange(2, 1, rowsData.length, 13).setValues(rowsData);
      }

      return ContentService
        .createTextOutput(JSON.stringify({ 
          result: "success", 
          action: "sync_all",
          count: guestList.length,
          message: "Google Sheets berhasil disinkronkan 100% dengan Admin Panel" 
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // =========================================================================
    // FITUR C: SINGLE / BATCH UPSERT DUAL-CHECK
    // =========================================================================
    var guestList = Array.isArray(rawData) ? rawData : [rawData];
    var lastRow = sheet.getLastRow();
    
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
        sheet.getRange(targetRow, 1, 1, 13).setValues([rowData]);
        updatedCount++;
      } else {
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
        message: "Sinkronisasi data tamu berhasil" 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureHeader(sheet) {
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
}

function doGet(e) {
  return ContentService.createTextOutput("Webhook Buku Tamu BPS PPU Aktif & Terproteksi Full Mirroring & Delete Sync!");
}
`;
