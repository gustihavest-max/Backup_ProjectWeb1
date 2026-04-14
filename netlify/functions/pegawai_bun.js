const pool = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Gunakan POST' })
    };
  }

  try {
    const { page = 1, limit = 10, search = "" } = JSON.parse(event.body || "{}");

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT nip, nama_pegawai, jabatan, golongan
      FROM pegawai_bun
    `;

    let countQuery = `
      SELECT COUNT(*) AS total
      FROM pegawai_bun
    `;

    let params = [];
    let countParams = [];

    /* ===============================
       🔍 SEARCH
    =============================== */
    if (search && search.trim() !== "") {
      query += `
        WHERE nip LIKE ?
        OR nama_pegawai LIKE ?
        OR jabatan LIKE ?
      `;

      countQuery += `
        WHERE nip LIKE ?
        OR nama_pegawai LIKE ?
        OR jabatan LIKE ?
      `;

      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword);
      countParams.push(keyword, keyword, keyword);
    }

    /* ===============================
       📊 PAGINATION (FIX UTAMA DISINI)
    =============================== */
    query += ` ORDER BY nama_pegawai ASC LIMIT ? OFFSET ?`;

    // ✅ WAJIB TAMBAH PARAM INI
    params.push(limitNum, offset);

    const [rows] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limitNum);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        rows,
        page: pageNum,
        totalPages,
        totalData: total
      })
    };

  } catch (err) {
    console.error('Error pegawai_bun:', err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Server error',
        error: err.message
      })
    };
  }
};
