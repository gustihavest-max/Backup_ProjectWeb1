const pool = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Gunakan POST.' })
    };
  }

  try {
    const { email } = JSON.parse(event.body);

    const [rows] = await pool.execute(
      `
      SELECT 
        id_perjadin,
        email_user,
        nama,
        golongan,
        tujuan,
        maksud,
        tanggal_berangkat,
        tanggal_pulang,
        urlbiaya,
        urldatadukung
      FROM ajukanperjadin
      ORDER BY id_perjadin DESC
      `
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, rows }),
    };

  } catch (err) {
    console.error('Error get-perjadin:', err);
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
