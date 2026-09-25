const pool = require('../config/db');
const { ok, created, fail } = require('../utils/response');

// Fitur 15: Laporan Feedback - Ambil semua data (Khusus Admin)
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        f.id_feedback,
        f.id_ticket,
        f.rating,
        f.feedback,
        f.keterangan,
        f.tanggal,
        k.nama AS reported,
        a.id_teknisi,
        kt.nama AS nama_teknisi
      FROM laporan_feedback f
      JOIN karyawan k ON k.nik = f.nik_pelapor
      LEFT JOIN assignment_ticket a ON a.id_ticket = f.id_ticket
      LEFT JOIN teknisi tek ON tek.id_teknisi = a.id_teknisi
      LEFT JOIN karyawan kt ON kt.nik = tek.nik
      ORDER BY f.tanggal DESC
    `);
    return ok(res, rows);
  } catch (err) {
    return fail(res, 'Gagal mengambil data feedback: ' + err.message, 500);
  }
};

// Ambil tiket milik user login yang statusnya 'Solved' & belum diberi feedback
exports.getSolvedTickets = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.id_ticket, t.deskripsi, t.tanggal_lapor
      FROM list_ticket t
      LEFT JOIN laporan_feedback f ON f.id_ticket = t.id_ticket
      WHERE t.nik_pelapor = ? AND t.status = 'Solved' AND f.id_feedback IS NULL
      ORDER BY t.tanggal_lapor DESC
    `, [req.user.nik]);
    return ok(res, rows);
  } catch (err) {
    return fail(res, 'Gagal mengambil data tiket: ' + err.message, 500);
  }
};

// Ambil riwayat feedback yang pernah dikirim oleh user login
exports.getMyFeedbacks = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.id_feedback, f.id_ticket, f.rating, f.feedback, f.keterangan, f.tanggal
      FROM laporan_feedback f
      WHERE f.nik_pelapor = ?
      ORDER BY f.tanggal DESC
    `, [req.user.nik]);
    return ok(res, rows);
  } catch (err) {
    return fail(res, 'Gagal mengambil riwayat feedback: ' + err.message, 500);
  }
};

// Kirim Feedback baru (Bintang 1-5)
exports.create = async (req, res) => {
  try {
    const { id_ticket, rating, feedback, keterangan } = req.body;

    if (!id_ticket || !rating) {
      return fail(res, 'Pilih tiket dan berikan rating bintang (1-5)');
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return fail(res, 'Rating harus bernilai antara 1 sampai 5');
    }

    // Menentukan kategori Positif/Negatif secara otomatis dari rating jika tidak dikirim
    const feedbackCategory = feedback || (numRating >= 4 ? 'Positif' : 'Negatif');

    // 1. Validasi keberadaan & hak akses tiket
    const [ticket] = await pool.query('SELECT status, nik_pelapor FROM list_ticket WHERE id_ticket = ?', [id_ticket]);
    if (ticket.length === 0) return fail(res, 'Tiket tidak ditemukan', 404);
    if (ticket[0].status !== 'Solved') return fail(res, 'Feedback hanya bisa diberikan untuk tiket yang berstatus Solved');
    if (ticket[0].nik_pelapor !== req.user.nik) return fail(res, 'Anda tidak memiliki akses untuk tiket ini', 403);

    // 2. Cek apakah tiket sudah pernah diberi feedback
    const [existing] = await pool.query('SELECT id_feedback FROM laporan_feedback WHERE id_ticket = ?', [id_ticket]);
    if (existing.length > 0) return fail(res, 'Tiket ini sudah pernah diberi feedback', 400);

    // 3. Simpan ke Database
    await pool.query(
      'INSERT INTO laporan_feedback (id_ticket, nik_pelapor, rating, feedback, keterangan, tanggal) VALUES (?, ?, ?, ?, ?, NOW())',
      [id_ticket, req.user.nik, numRating, feedbackCategory, keterangan || null]
    );

    return created(res, null, 'Terima kasih, feedback Anda berhasil dikirim');
  } catch (err) {
    return fail(res, 'Gagal mengirim feedback: ' + err.message, 500);
  }
};
