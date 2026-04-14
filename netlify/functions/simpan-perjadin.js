const pool = require('./db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const body = JSON.parse(event.body);
  const { allPegawai, kode_kegiatan, rencanabiaya, email_user, ...data } = body;
  const biayaNum = Number(rencanabiaya);

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1. Validasi Anggaran
    const [anggaran] = await conn.execute(
      'SELECT sisa_anggaran, anggaran_digunakan FROM anggaran_kegiatan WHERE kode_kegiatan = ? FOR UPDATE',
      [kode_kegiatan]
    );

    if (!anggaran.length || anggaran[0].sisa_anggaran < biayaNum) {
      throw new Error('Anggaran tidak mencukupi atau kode tidak valid');
    }

    // 2. Generate ID Perjadin Baru
    const [[{ next_id }]] = await conn.execute('SELECT COALESCE(MAX(id_perjadin), 0) + 1 AS next_id FROM ajukanperjadin');

    // 3. Bulk Insert Pegawai (Sangat Efisien)
    const sql = `INSERT INTO ajukanperjadin (id_perjadin, email_user, nama, golongan, jabatan, tujuan, maksud, tanggal_berangkat, tanggal_pulang, lama_perjalanan, kendaraan, pj_kegiatan, kode_kegiatan, rencanabiaya) VALUES ?`;
    
    const values = allPegawai.map(p => [
      next_id, email_user, p.nama, p.golongan, p.jabatan, 
      data.tujuan, data.maksud, data.tanggal_berangkat, data.tanggal_pulang,
      data.lama_perjalanan, data.kendaraan, data.pj_kegiatan, kode_kegiatan, biayaNum
    ]);

    await conn.query(sql, [values]);

    // 4. Update Anggaran
    await conn.execute(
      'UPDATE anggaran_kegiatan SET sisa_anggaran = sisa_anggaran - ?, anggaran_digunakan = anggaran_digunakan + ? WHERE kode_kegiatan = ?',
      [biayaNum, biayaNum, kode_kegiatan]
    );

    await conn.commit();
    return { statusCode: 200, body: JSON.stringify({ success: true, id: next_id }) };

  } catch (err) {
    if (conn) await conn.rollback();
    return { statusCode: 500, body: JSON.stringify({ success: false, message: err.message }) };
  } finally {
    if (conn) conn.release();
  }
};