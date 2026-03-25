const mysql = require('mysql2/promise');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Metode tidak diizinkan.' }) };
  }

  let connection;
  try {
    const { email } = JSON.parse(event.body);

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    const [rows] = await connection.execute(
      'SELECT nip, email, nama, phone FROM daftaruser WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify(rows[0])
      };
    } else {
      return { statusCode: 404, body: JSON.stringify({ message: 'User tidak ditemukan.' }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Kesalahan server', error: err.message }) };
  } finally {
    if (connection) await connection.end();
  }
};