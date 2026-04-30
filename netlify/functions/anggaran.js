const pool = require("./db");

exports.handler = async (event) => {

const body = JSON.parse(event.body);
const action = body.action;

/* ================= GET ALL ================= */
if(action==="getAll"){
    const [rows] = await pool.execute("SELECT * FROM anggaran_kegiatan");

    rows.forEach(r=>{
        r.pagu_anggaran=+r.pagu_anggaran;
        r.anggaran_digunakan=+r.anggaran_digunakan;
        r.sisa_anggaran=+r.sisa_anggaran;
    });

    return res(true,"OK",rows);
}

/* ================= GET BY KODE ================= */
if(action==="getByKode"){
    const [rows] = await pool.execute(
        "SELECT * FROM anggaran_kegiatan WHERE kode_kegiatan=?",
        [body.kode_kegiatan]
    );

    return res(true,"OK",rows[0]);
}

/* ================= INSERT ================= */
if(action==="insert"){
    const {
        kode_kegiatan,
        pagu_anggaran,
        anggaran_digunakan,
        pj_kegiatan,
        uraian_kegiatan
    } = body;

    const sisa = pagu_anggaran - anggaran_digunakan;

    await pool.execute(
        "INSERT INTO anggaran_kegiatan VALUES (?,?,?,?,?,?,?)",
        [
            kode_kegiatan,
            pagu_anggaran,
            anggaran_digunakan,
            sisa,
            pj_kegiatan,
            null,
            uraian_kegiatan
        ]
    );

    return res(true,"Berhasil tambah");
}

/* ================= UPDATE ================= */
if(action==="update"){
    const {
        kode_kegiatan,
        pagu_anggaran,
        anggaran_digunakan,
        pj_kegiatan,
        uraian_kegiatan
    } = body;

    const sisa = pagu_anggaran - anggaran_digunakan;

    await pool.execute(
        `UPDATE anggaran_kegiatan SET 
        pagu_anggaran=?,
        anggaran_digunakan=?,
        sisa_anggaran=?,
        pj_kegiatan=?,
        uraian_kegiatan=?
        WHERE kode_kegiatan=?`,
        [
            pagu_anggaran,
            anggaran_digunakan,
            sisa,
            pj_kegiatan,
            uraian_kegiatan,
            kode_kegiatan
        ]
    );

    return res(true,"Berhasil update");
}

/* ================= DELETE ================= */
if(action==="delete"){
    await pool.execute(
        "DELETE FROM anggaran_kegiatan WHERE kode_kegiatan=?",
        [body.kode_kegiatan]
    );

    return res(true,"Berhasil hapus");
}

return res(false,"Action tidak dikenal");
};

function res(success,message,data=null){
    return {
        statusCode:200,
        body:JSON.stringify({success,message,data})
    };
}
