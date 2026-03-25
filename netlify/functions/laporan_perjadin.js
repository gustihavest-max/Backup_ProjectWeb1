const pool = require('./db');

exports.handler = async () => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        a.id_perjadin, 
        GROUP_CONCAT(a.nama SEPARATOR ', ') AS nama,
        l.url_laporan, 
        l.url_sppd, 
        l.url_spj, 
        l.url_st,
        -- VALIDASI KETAT: Cek apakah panjang karakter > 10 --
        CASE 
          WHEN (CHAR_LENGTH(IFNULL(l.url_laporan, '')) > 10 AND 
                CHAR_LENGTH(IFNULL(l.url_sppd, '')) > 10 AND 
                CHAR_LENGTH(IFNULL(l.url_spj, '')) > 10 AND 
                CHAR_LENGTH(IFNULL(l.url_st, '')) > 10) 
          THEN 'Lengkap' 
          ELSE 'Belum Lengkap' 
        END AS status_dokumen
      FROM ajukanperjadin a
      LEFT JOIN laporan_perjadin l ON a.id_perjadin = l.id_perjadin
      GROUP BY a.id_perjadin
      ORDER BY a.id_perjadin DESC
    `);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, rows })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};