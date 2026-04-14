// netlify/functions/simpan-perjadin.js
const pool = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid JSON' }) };
  }

  const {
    email_user,
    allPegawai,
    tujuan,
    maksud,
    tanggal_berangkat,
    tanggal_pulang,
    lama_perjalanan,
    kendaraan,
    pj_kegiatan,
    urlbiaya,
    urldatadukung,
    rencanabiaya,
    kode_kegiatan
  } = body;

  // Basic validation
  if (!email_user) return { statusCode: 400, body: JSON.stringify({ success: false, message: 'User tidak ditemukan' }) };
  if (!Array.isArray(allPegawai) || allPegawai.length === 0) return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Data pegawai kosong' }) };
  if (!kode_kegiatan) return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Kode kegiatan wajib' }) };
  if (!rencanabiaya || isNaN(Number(rencanabiaya))) return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Rencana biaya tidak valid' }) };

  const rencanaBiaya = Number(rencanabiaya);

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    /* =====================================================
       1️⃣ AMBIL id_perjadin BARU (SATU KALI)
       ===================================================== */
    const [[{ next_id }]] = await conn.execute(
      'SELECT COALESCE(MAX(id_perjadin), 0) + 1 AS next_id FROM ajukanperjadin'
    );
    const id_perjadin = next_id;

    /* =====================================================
       2️⃣ LOCK & VALIDASI ANGGARAN
       ===================================================== */
    const [rows] = await conn.execute(
      'SELECT pagu_anggaran, sisa_anggaran, anggaran_digunakan FROM anggaran_kegiatan WHERE kode_kegiatan = ? FOR UPDATE',
      [kode_kegiatan]
    );

    if (!rows || rows.length === 0) {
      await conn.rollback();
      conn.release();
      return { statusCode: 404, body: JSON.stringify({ success: false, message: 'Kode kegiatan tidak ditemukan' }) };
    }

    const anggaran = rows[0];
    const currentSisa = Number(anggaran.sisa_anggaran) || 0;
    const currentDigunakan = Number(anggaran.anggaran_digunakan) || 0;

    if (rencanaBiaya > currentSisa) {
      await conn.rollback();
      conn.release();
      return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Sisa anggaran tidak mencukupi' }) };
    }

    /* =====================================================
       3️⃣ INSERT SEMUA PEGAWAI (id_perjadin SAMA)
       ===================================================== */
    const insertSQL = `
      INSERT INTO ajukanperjadin
      (id_perjadin, email_user, nama, golongan, jabatan,
       tujuan, maksud, tanggal_berangkat, tanggal_pulang,
       lama_perjalanan, kendaraan, pj_kegiatan,
       kode_kegiatan, rencanabiaya, urlbiaya, urldatadukung)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    let rowsInserted = 0;

    for (const pegawai of allPegawai) {
      const values = [
        id_perjadin,
        email_user,
        pegawai.nama || null,
        pegawai.golongan || null,
        pegawai.jabatan || null,
        tujuan || null,
        maksud || null,
        tanggal_berangkat || null,
        tanggal_pulang || null,
        lama_perjalanan || null,
        kendaraan || null,
        pj_kegiatan || null,
        kode_kegiatan,
        rencanaBiaya,
        urlbiaya || null,
        urldatadukung || null
      ];

      const [resInsert] = await conn.execute(insertSQL, values);
      rowsInserted += resInsert.affectedRows || 0;
    }

    /* =====================================================
       4️⃣ UPDATE ANGGARAN
       ===================================================== */
    const newSisa = currentSisa - rencanaBiaya;
    const newDigunakan = currentDigunakan + rencanaBiaya;

    await conn.execute(
      'UPDATE anggaran_kegiatan SET sisa_anggaran = ?, anggaran_digunakan = ? WHERE kode_kegiatan = ?',
      [newSisa, newDigunakan, kode_kegiatan]
    );

    await conn.commit();
    conn.release();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Pengajuan #${id_perjadin} berhasil disimpan (${rowsInserted} pegawai)`,
        id_perjadin,
        rowsInserted,
        newSisa
      })
    };

  } catch (err) {
    console.error('Error simpan-perjadin:', err);
    if (conn) {
      try {
        await conn.rollback();
        conn.release();
      } catch (_) {}
    }
    return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Server error', error: err.message }) };
  }
};
