const pool = require('./db');

exports.handler = async (event) => {

  /* ===== VALIDASI METHOD ===== */
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Gunakan POST.' })
    };
  }

  try {

    /* ===== AMBIL PARAMETER ===== */
    const { page = 1, limit = 10 } = JSON.parse(event.body || "{}");

    const offset = (page - 1) * limit;

    /* ===== QUERY DATA PEGAWAI ===== */
    const [rows] = await pool.execute(
      `
      SELECT 
        nip,
        nama_pegawai,
        jabatan,
        golongan
      FROM pegawai_bun
      ORDER BY nama ASC
      LIMIT ? OFFSET ?
      `,
      [parseInt(limit), parseInt(offset)]
    );

    /* ===== HITUNG TOTAL DATA ===== */
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total FROM pegawai_bun`
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    /* ===== RESPONSE ===== */
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        rows,
        page: parseInt(page),
        totalPages,
        totalData: total
      }),
    };

  } catch (err) {
    console.error('Error get-pegawai:', err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Kesalahan server.',
        error: err.message
      }),
    };
  }
};
