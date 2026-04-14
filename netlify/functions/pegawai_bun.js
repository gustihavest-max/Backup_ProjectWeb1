// netlify/functions/pegawai_bun.js
const pool = require('./db');

exports.handler = async (event) => {

  /* =====================================================
     1️⃣ VALIDASI METHOD
  ===================================================== */
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({
        success: false,
        message: 'Gunakan method POST'
      })
    };
  }

  try {

    /* =====================================================
       2️⃣ PARSE BODY
    ===================================================== */
    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Format JSON tidak valid'
        })
      };
    }

    const {
      page = 1,
      limit = 10,
      search = ""
    } = body;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    /* =====================================================
       3️⃣ BASE QUERY
    ===================================================== */
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

    /* =====================================================
       4️⃣ SEARCH FILTER
    ===================================================== */
    if (search && search.trim() !== "") {
      const keyword = `%${search.trim()}%`;

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

      params.push(keyword, keyword, keyword);
      countParams.push(keyword, keyword, keyword);
    }

    /* =====================================================
       5️⃣ ORDER + PAGINATION
    ===================================================== */
    query += ` ORDER BY nama_pegawai ASC LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    /* =====================================================
       6️⃣ EXECUTE QUERY
    ===================================================== */
    const [rows] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);

    const total = countResult[0].total || 0;
    const totalPages = Math.ceil(total / limitNum);

    /* =====================================================
       7️⃣ RESPONSE
    ===================================================== */
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: rows,          // 🔥 untuk fleksibilitas
        rows: rows,          // 🔥 backward compatibility (biar frontend lu ga rusak)
        page: pageNum,
        limit: limitNum,
        totalData: total,
        totalPages: totalPages
      })
    };

  } catch (err) {

    console.error("Error pegawai_bun:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Terjadi kesalahan server',
        error: err.message
      })
    };
  }
};
