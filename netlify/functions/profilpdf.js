const pool = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Gunakan metode POST.' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { email, urlpdf } = body; // ubah 'pdf' → 'urlpdf'

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Email wajib diisi.' })
      };
    }

    // ======================================================
    // MODE 1 → SIMPAN / UPDATE URL PDF BARU
    // ======================================================
    if (urlpdf) {
      // Pastikan user ada di tabel daftaruser
      const [userRows] = await pool.execute(
        'SELECT nip, email, password, nama, phone FROM daftaruser WHERE email = ?',
        [email]
      );

      if (userRows.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            success: false,
            message: 'User tidak ditemukan di daftaruser.'
          })
        };
      }

      const user = userRows[0];

      // Simpan ke tabel userpdf (insert atau update)
      await pool.execute(
        `INSERT INTO userpdf (nip, email, password, nama, phone, urlpdf)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           nip = VALUES(nip),
           nama = VALUES(nama),
           phone = VALUES(phone),
           urlpdf = VALUES(urlpdf)`,
        [user.nip, user.email, user.password, user.nama, user.phone, urlpdf]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: '✅ URL PDF berhasil disimpan ke database.',
          urlpdf
        })
      };
    }

    // ======================================================
    // MODE 2 → AMBIL URL PDF DARI DATABASE
    // ======================================================
    const [rows] = await pool.execute(
      'SELECT urlpdf FROM userpdf WHERE email = ?',
      [email]
    );

    if (rows.length > 0 && rows[0].urlpdf) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          urlpdf: rows[0].urlpdf
        })
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: 'Belum ada file PDF tersimpan untuk user ini.'
        })
      };
    }
  } catch (error) {
    console.error('Error profilpdf.js:', error);
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
