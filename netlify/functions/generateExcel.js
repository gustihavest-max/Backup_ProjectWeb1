import XLSX from "xlsx";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { nama, golongan, jabatan } = body;

    if (!nama || !golongan || !jabatan) {
      return { statusCode: 400, body: "Semua field wajib diisi." };
    }

    const namaArr = nama.split(",").map((n) => n.trim());
    const golArr = golongan.split(",").map((g) => g.trim());
    const jabArr = jabatan.split(",").map((j) => j.trim());
    const maxLength = Math.max(namaArr.length, golArr.length, jabArr.length);

    const data = [];
    for (let i = 0; i < maxLength; i++) {
      data.push({
        No: i + 1,
        Nama: namaArr[i] || "",
        Golongan: golArr[i] || "",
        Jabatan: jabArr[i] || "",
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pegawai");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return {
      statusCode: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="data_pegawai.xlsx"',
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("Error generateExcel:", err);
    return { statusCode: 500, body: "Kesalahan saat membuat file Excel." };
  }
};
