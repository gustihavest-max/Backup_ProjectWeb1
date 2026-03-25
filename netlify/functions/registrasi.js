// register.js
const pool = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, message: 'Metode tidak diizinkan.' }),
    };
  }

  try {
    const { nip, email, password, nama, phone } = JSON.parse(event.body);

    if (!nip || !email || !password || !nama || !phone) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Semua field wajib diisi.' }),
      };
    }

    // cek apakah NIP sudah ada
    const [rows] = await pool.execute(
      'SELECT nip FROM daftaruser WHERE nip = ?',
      [nip]
    );

    if (rows.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'NIP sudah terdaftar. Gunakan NIP lain.'
        }),
      };
    }

    // insert data baru
    await pool.execute(
      'INSERT INTO daftaruser (nip, email, password, nama, phone) VALUES (?, ?, ?, ?, ?)',
      [nip, email, password, nama, phone]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Registrasi berhasil!' }),
    };

  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Kesalahan server internal.',
        error: error.message
      }),
    };
  }
};
