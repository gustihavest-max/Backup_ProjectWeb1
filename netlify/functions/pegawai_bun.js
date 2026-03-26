const pool = require('./db');

exports.handler = async (event) => {

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Gunakan POST.' })
    };
  }

  try {
    let body = {};
    try {
      body = JSON.parse(event.body);
    } catch {}

    const page = parseInt(body.page) || 1;
    const limit = parseInt(body.limit) || 10;
    const offset = (page - 1) * limit;

    console.log("PAGE:", page, "LIMIT:", limit, "OFFSET:", offset);

    /* QUERY DATA */
    const [rows] = await pool.query(`
      SELECT 
        nip,
        nama_pegawai,
        jabatan,
        golongan
      FROM pegawai_bun
      ORDER BY nama_pegawai ASC
      LIMIT ${limit} OFFSET ${offset}
    `);

    /* TOTAL */
    const [countResult] = await pool.query(`
      SELECT COUNT(*) AS total FROM pegawai_bun
    `);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    console.log("TOTAL:", total, "ROWS:", rows.length);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        rows,
        page,
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
