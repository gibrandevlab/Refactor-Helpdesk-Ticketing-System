const {
  laporan_feedback,
  list_ticket,
  karyawan,
  assignment_ticket,
  teknisi
} = require('../models');
const { ok, created, fail } = require('../utils/response');

// ==========================================
// ADMIN: Ambil Semua Laporan Feedback
// ==========================================
exports.getAll = async (req, res) => {
  try {
    const feedbacks = await laporan_feedback.findAll({
      include: [
        { model: karyawan, as: 'nik_pelapor_karyawan' },
        {
          model: list_ticket,
          as: 'id_ticket_list_ticket',
          include: [
            {
              model: assignment_ticket,
              as: 'assignment_ticket',
              include: [
                {
                  model: teknisi,
                  as: 'id_teknisi_teknisi',
                  include: [{ model: karyawan, as: 'nik_karyawan' }]
                }
              ]
            }
          ]
        }
      ],
      order: [['tanggal', 'DESC']]
    });

    const rows = feedbacks.map((f) => {
      const lt = f.id_ticket_list_ticket;
      const asg = lt?.assignment_ticket;
      const tk = asg?.id_teknisi_teknisi;
      return {
        id_feedback: f.id_feedback,
        id_ticket: f.id_ticket,
        rating: f.rating,
        feedback: f.feedback,
        keterangan: f.keterangan,
        tanggal: f.tanggal,
        reported: f.nik_pelapor_karyawan?.nama || null,
        id_teknisi: asg?.id_teknisi || null,
        nama_teknisi: tk?.nik_karyawan?.nama || null
      };
    });

    return ok(res, rows);
  } catch (err) {
    console.error('Error getAll feedbacks (Sequelize):', err);
    return fail(res, 'Gagal mengambil data feedback: ' + err.message, 500);
  }
};

// ==========================================
// USER: Ambil Tiket Solved yang Belum Diberi Feedback
// ==========================================
exports.getSolvedTickets = async (req, res) => {
  try {
    const tickets = await list_ticket.findAll({
      where: {
        nik_pelapor: req.user.nik,
        status: 'Solved'
      },
      include: [
        {
          model: laporan_feedback,
          as: 'laporan_feedback',
          required: false
        }
      ],
      attributes: ['id_ticket', 'deskripsi', 'tanggal_lapor'],
      order: [['tanggal_lapor', 'DESC']]
    });

    // Filter tiket yang belum memiliki record laporan_feedback
    const unreviewedTickets = tickets
      .filter((t) => !t.laporan_feedback)
      .map((t) => ({
        id_ticket: t.id_ticket,
        deskripsi: t.deskripsi,
        tanggal_lapor: t.tanggal_lapor
      }));

    return ok(res, unreviewedTickets);
  } catch (err) {
    console.error('Error getSolvedTickets (Sequelize):', err);
    return fail(res, 'Gagal mengambil data tiket: ' + err.message, 500);
  }
};

// ==========================================
// USER: Ambil Riwayat Feedback Milik User Login
// ==========================================
exports.getMyFeedbacks = async (req, res) => {
  try {
    const feedbacks = await laporan_feedback.findAll({
      where: { nik_pelapor: req.user.nik },
      attributes: ['id_feedback', 'id_ticket', 'rating', 'feedback', 'keterangan', 'tanggal'],
      order: [['tanggal', 'DESC']]
    });

    return ok(res, feedbacks);
  } catch (err) {
    console.error('Error getMyFeedbacks (Sequelize):', err);
    return fail(res, 'Gagal mengambil riwayat feedback: ' + err.message, 500);
  }
};

// ==========================================
// USER: Kirim Feedback Baru
// ==========================================
exports.create = async (req, res) => {
  try {
    const { id_ticket, rating, feedback, keterangan } = req.body;

    if (!id_ticket || !rating) {
      return fail(res, 'Pilih tiket dan berikan rating bintang (1-5)', 400);
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return fail(res, 'Rating harus bernilai antara 1 sampai 5', 400);
    }

    const feedbackCategory = feedback || (numRating >= 4 ? 'Positif' : 'Negatif');

    const ticket = await list_ticket.findOne({
      where: { id_ticket }
    });

    if (!ticket) return fail(res, 'Tiket tidak ditemukan', 404);
    if (ticket.status !== 'Solved') return fail(res, 'Feedback hanya bisa diberikan untuk tiket yang berstatus Solved', 400);
    if (ticket.nik_pelapor !== req.user.nik) return fail(res, 'Anda tidak memiliki akses untuk tiket ini', 403);

    const existing = await laporan_feedback.findOne({
      where: { id_ticket }
    });

    if (existing) return fail(res, 'Tiket ini sudah pernah diberi feedback', 400);

    await laporan_feedback.create({
      id_ticket,
      nik_pelapor: req.user.nik,
      rating: numRating,
      feedback: feedbackCategory,
      keterangan: keterangan || null,
      tanggal: new Date()
    });

    return created(res, null, 'Terima kasih, feedback Anda berhasil dikirim');
  } catch (err) {
    console.error('Error create feedback (Sequelize):', err);
    return fail(res, 'Gagal mengirim feedback: ' + err.message, 500);
  }
};
