// netlify/functions/statistik_anggaran.js
const pool = require("./db");

exports.handler = async (event) => {
    if (event.httpMethod !== "GET") {
        return res(405, false, "Method not allowed");
    }

    try {
        // Query mengambil per kode kegiatan/MAK
        const [rows] = await pool.execute(`
            SELECT 
                kode_kegiatan,
                pagu_anggaran,
                anggaran_digunakan,
                sisa_anggaran
            FROM anggaran_kegiatan
            ORDER BY kode_kegiatan ASC
        `);

        // Hitung total akumulasi secara keseluruhan
        let totalPagu = 0;
        let totalDigunakan = 0;
        let totalSisa = 0;

        const items = rows.map((r) => {
            const pagu = parseFloat(r.pagu_anggaran || 0);
            const digunakan = parseFloat(r.anggaran_digunakan || 0);
            const sisa = parseFloat(r.sisa_anggaran || 0);

            totalPagu += pagu;
            totalDigunakan += digunakan;
            totalSisa += sisa;

            return {
                kode: r.kode_kegiatan,
                pagu,
                digunakan,
                sisa,
                persen: pagu > 0 ? ((digunakan / pagu) * 100).toFixed(2) : 0
            };
        });

        const totalPersen = totalPagu > 0 
            ? ((totalDigunakan / totalPagu) * 100).toFixed(2) 
            : 0;

        return res(200, true, "OK", {
            totalPagu,
            totalDigunakan,
            totalSisa,
            totalPersen,
            items // Array statistik per kode kegiatan
        });

    } catch (err) {
        console.error(err);
        return res(500, false, "Server error", null, err);
    }
};

function res(status, success, message, data = null, error = null) {
    return {
        statusCode: status,
        body: JSON.stringify({
            success,
            message,
            data,
            error: error ? error.message : null
        })
    };
}