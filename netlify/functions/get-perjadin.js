const pool = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: 'Metode tidak diizinkan' }),
    };
  }

  try {
    const query = `
      SELECT 
        id,
        id_perjadin,
        nama,
        golongan,
        jabatan,
        tujuan,
        maksud,
        tanggal_berangkat,
        tanggal_pulang,
        lama_perjalanan,
        kendaraan,
        pj_kegiatan,
        pj_subkegiatan,
        rencanabiaya,
        urlbiaya,
        urldatadukung,
        email_user,
        created_at
      FROM ajukanperjadin
      ORDER BY id_perjadin DESC, id ASC
    `;

    const [rows] = await pool.execute(query);

    // ⬇⬇⬇ PENTING: KEMBALIKAN ARRAY LANGSUNG ⬇⬇⬇
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    };

  } catch (err) {
    console.error('❌ Error get-perjadin:', err);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([]), // frontend lama aman (anggap kosong)
    };
  }
};
