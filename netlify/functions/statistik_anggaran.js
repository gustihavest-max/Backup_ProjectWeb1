// netlify/functions/statistik_anggaran.js
const pool = require("./db");

exports.handler = async (event) => {
    if (event.httpMethod !== "GET") {
        return res(405, false, "Method not allowed");
    }

    try {
        const [rows] = await pool.execute(`
            SELECT 
                SUM(pagu_anggaran) AS total_pagu,
                SUM(anggaran_digunakan) AS total_digunakan,
                SUM(sisa_anggaran) AS total_sisa
            FROM anggaran_kegiatan
        `);

        const r = rows[0];

        const totalPagu = parseFloat(r.total_pagu || 0);
        const totalDigunakan = parseFloat(r.total_digunakan || 0);
        const totalSisa = parseFloat(r.total_sisa || 0);

        const persen = totalPagu > 0 
            ? ((totalDigunakan / totalPagu) * 100).toFixed(2)
            : 0;

        return res(200, true, "OK", {
            totalPagu,
            totalDigunakan,
            totalSisa,
            persen
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
