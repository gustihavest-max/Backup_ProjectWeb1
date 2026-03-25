// netlify/functions/anggaran.js (REVISED FINAL)
const pool = require("./db");

// ======================= HANDLER ==========================
exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return jsonRes(405, false, "Method not allowed");
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (e) {
        return jsonRes(400, false, "Invalid JSON format");
    }

    const action = body.action;

    // ==========================================================
    // 1. GET ALL
    // ==========================================================
    if (action === "getAll") {
        try {
            const [rows] = await pool.execute(
                "SELECT * FROM anggaran_kegiatan ORDER BY kode_kegiatan ASC"
            );

            const formatted = rows.map(r => ({
                ...r,
                pagu_anggaran: toNum(r.pagu_anggaran),
                anggaran_digunakan: toNum(r.anggaran_digunakan),
                sisa_anggaran: toNum(r.sisa_anggaran)
            }));

            return jsonRes(200, true, "Data berhasil diambil", formatted);
        } catch (err) {
            console.error("ERROR GET ALL:", err);
            return jsonRes(500, false, "Server error during GET ALL", null, err);
        }
    }

    // ==========================================================
    // 2. GET BY KODE
    // ==========================================================
    if (action === "getByKode") {
        const { kode_kegiatan } = body;

        if (!kode_kegiatan)
            return jsonRes(400, false, "Kode kegiatan diperlukan");

        try {
            const [rows] = await pool.execute(
                "SELECT * FROM anggaran_kegiatan WHERE kode_kegiatan = ?",
                [kode_kegiatan]
            );

            if (rows.length === 0)
                return jsonRes(200, false, "Kode kegiatan tidak ditemukan");

            const row = rows[0];

            row.pagu_anggaran = toNum(row.pagu_anggaran);
            row.anggaran_digunakan = toNum(row.anggaran_digunakan);
            row.sisa_anggaran = toNum(row.sisa_anggaran);

            return jsonRes(200, true, "Data ditemukan", row);

        } catch (err) {
            console.error("ERROR GET BY KODE:", err);
            return jsonRes(500, false, "Server error during GET BY KODE", null, err);
        }
    }

    // ==========================================================
    // 3. INSERT DATA
    // ==========================================================
    if (action === "insert") {
        try {
            let {
                kode_kegiatan,
                pagu_anggaran,
                anggaran_digunakan = 0,
                pj_kegiatan,
                pj_subkegiatan,
                uraian_kegiatan
            } = body;

            // Validasi wajib
            if (!kode_kegiatan || pagu_anggaran === undefined || !pj_kegiatan || !uraian_kegiatan) {
                return jsonRes(400, false, "Data wajib (kode, pagu, pj_kegiatan, uraian) harus diisi.");
            }

            pagu_anggaran = toNum(pagu_anggaran);
            anggaran_digunakan = toNum(anggaran_digunakan);

            // Hitung sisa
            const sisa_anggaran = pagu_anggaran - anggaran_digunakan;

            await pool.execute(
                `INSERT INTO anggaran_kegiatan 
                (kode_kegiatan, pagu_anggaran, anggaran_digunakan, sisa_anggaran, pj_kegiatan, pj_subkegiatan, uraian_kegiatan)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    kode_kegiatan,
                    pagu_anggaran,
                    anggaran_digunakan,
                    sisa_anggaran,
                    pj_kegiatan,
                    pj_subkegiatan || null,
                    uraian_kegiatan
                ]
            );

            return jsonRes(200, true, "Data berhasil ditambahkan");

        } catch (err) {
            console.error("ERROR INSERT:", err);

            if (err.code === "ER_DUP_ENTRY")
                return jsonRes(409, false, "Kode kegiatan sudah ada", null, err);

            return jsonRes(500, false, "Gagal menambahkan data", null, err);
        }
    }

    // ==========================================================
    // 4. UPDATE DATA
    // ==========================================================
    if (action === "update") {
        try {
            let {
                kode_kegiatan,
                pagu_anggaran,
                anggaran_digunakan,
                pj_kegiatan,
                pj_subkegiatan,
                uraian_kegiatan
            } = body;

            if (!kode_kegiatan)
                return jsonRes(400, false, "Kode kegiatan diperlukan");

            // Ambil data lama
            const [check] = await pool.execute(
                "SELECT * FROM anggaran_kegiatan WHERE kode_kegiatan = ?",
                [kode_kegiatan]
            );

            if (check.length === 0)
                return jsonRes(404, false, "Kode kegiatan tidak ditemukan");

            const old = check[0];

            // Jika field tidak diisi, gunakan nilai lama
            pagu_anggaran = pagu_anggaran !== undefined ? toNum(pagu_anggaran) : toNum(old.pagu_anggaran);
            anggaran_digunakan = anggaran_digunakan !== undefined ? toNum(anggaran_digunakan) : toNum(old.anggaran_digunakan);

            const sisa_anggaran = pagu_anggaran - anggaran_digunakan;

            await pool.execute(
                `UPDATE anggaran_kegiatan SET
                    pagu_anggaran = ?, 
                    anggaran_digunakan = ?, 
                    sisa_anggaran = ?,
                    pj_kegiatan = ?, 
                    pj_subkegiatan = ?, 
                    uraian_kegiatan = ?
                WHERE kode_kegiatan = ?`,
                [
                    pagu_anggaran,
                    anggaran_digunakan,
                    sisa_anggaran,
                    pj_kegiatan || old.pj_kegiatan,
                    pj_subkegiatan || null,
                    uraian_kegiatan || old.uraian_kegiatan,
                    kode_kegiatan
                ]
            );

            return jsonRes(200, true, "Data berhasil diperbarui");

        } catch (err) {
            console.error("ERROR UPDATE:", err);
            return jsonRes(500, false, "Gagal memperbarui data", null, err);
        }
    }

    // ==========================================================
    // DEFAULT ACTION
    // ==========================================================
    return jsonRes(400, false, "Action tidak dikenal");
};

// ===================== HELPER FUNCTION =====================
function jsonRes(status, success, message, data = null, error = null) {
    return {
        statusCode: status,
        body: JSON.stringify({
            success,
            message,
            data,
            error: error ? error.message : undefined
        })
    };
}

function toNum(val) {
    return val === null || val === undefined ? 0 : parseFloat(val);
}
