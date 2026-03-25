const pool = require('./db'); // pakai koneksi pool yang sama seperti login.js

exports.handler = async (event) => {
  // Hanya izinkan method POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Gunakan metode POST.' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { email, foto } = body;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Email wajib diisi.' })
      };
    }

    // ===========================================
    // MODE 1 → kalau ada foto, simpan/update ke DB
    // ===========================================
    if (foto) {
      // ambil data user dari daftaruser
      const [userRows] = await pool.execute(
        'SELECT nip, email, password, nama, phone FROM daftaruser WHERE email = ?',
        [email]
      );

      if (userRows.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ success: false, message: 'User tidak ditemukan di daftaruser.' })
        };
      }

      const user = userRows[0];

      // simpan/update ke tabel userphoto
      await pool.execute(
        `INSERT INTO userphoto (nip, email, password, nama, phone, urlphoto)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE urlphoto = VALUES(urlphoto)`,
        [user.nip, user.email, user.password, user.nama, user.phone, foto]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Foto berhasil disimpan.',
          urlphoto: foto // dikirim balik supaya langsung bisa ditampilkan di web
        })
      };
    }

    // ===========================================
    // MODE 2 → kalau tidak ada foto, ambil dari DB
    // ===========================================
    const [rows] = await pool.execute(
      'SELECT urlphoto FROM userphoto WHERE email = ?',
      [email]
    );

    if (rows.length > 0 && rows[0].urlphoto) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          foto: rows[0].urlphoto
        })
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: 'Belum ada foto tersimpan untuk user ini.'
        })
      };
    }

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Kesalahan server.',
        error: error.message
      })
    };
  }
};
