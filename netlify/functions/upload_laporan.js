const pool = require('./db');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const {
      id_perjadin,
      nama,
      url_laporan,
      url_sppd,
      url_spj,
      url_st
    } = event.queryStringParameters || {};

    if (!id_perjadin) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'id_perjadin wajib'
        })
      };
    }

    // === Tentukan status dokumen ===
    // Jika semua URL tersedia → "lengkap", jika ada yang null → "belum lengkap"
    const status = url_laporan && url_sppd && url_spj && url_st ? "lengkap" : "belum lengkap";

    await pool.execute(
      `
      INSERT INTO laporan_perjadin
        (id_perjadin, nama, url_laporan, url_sppd, url_spj, url_st, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nama        = VALUES(nama),
        url_laporan = VALUES(url_laporan),
        url_sppd    = VALUES(url_sppd),
        url_spj     = VALUES(url_spj),
        url_st      = VALUES(url_st),
        status      = VALUES(status)
      `,
      [
        id_perjadin,
        nama || null,
        url_laporan || null,
        url_sppd || null,
        url_spj || null,
        url_st || null,
        status
      ]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Dokumen berhasil disimpan',
        status // kirim status balik ke frontend
      })
    };

  } catch (err) {
    console.error('UPLOAD LAPORAN ERROR:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Gagal menyimpan dokumen',
        error: err.message
      })
    };
  }
};
