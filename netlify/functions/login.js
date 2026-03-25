// login.js
const pool = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Metode tidak diizinkan.' }),
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    // pakai pool langsung, tidak perlu end()
    const [rows] = await pool.execute(
      'SELECT email FROM daftaruser WHERE email = ? AND password = ?',
      [email, password]
    );

    if (rows.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Login berhasil! Hallo',
          email: rows[0].email
        })
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: 'Email atau Password salah.' })
      };
    }
  } catch (error) {
    console.error('Terjadi kesalahan Server:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Kesalahan server internal.',
        error: error.message
      })
    };
  }
};