const pool = require('./db');

exports.handler = async (event) => {
  try {
    const { search = "", limit = 500 } = JSON.parse(event.body || "{}");
    
    let query = `SELECT nama_pegawai, jabatan, golongan FROM pegawai_bun`;
    let params = [];

    if (search) {
      query += ` WHERE nama_pegawai LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY nama_pegawai ASC LIMIT ${parseInt(limit)}`;
    
    const [rows] = await pool.execute(query, params);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, rows })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};