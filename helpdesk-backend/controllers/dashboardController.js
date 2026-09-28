// controllers/dashboardController.js
const {
  list_ticket,
  karyawan,
  inventory,
  teknisi,
  laporan_feedback,
  assignment_ticket,
  sequelize
} = require('../models');
const { ok, fail } = require('../utils/response');

// ==========================================
// Fitur 2: Dashboard Admin
// ==========================================
const getAdminDashboard = async (req, res) => {
  try {
    let summary;
    try {
      const summaryRows = await sequelize.query('SELECT * FROM v_dashboard_summary', {
        type: sequelize.QueryTypes.SELECT
      });
      summary = summaryRows[0] || {};
    } catch (viewErr) {
      const [
        total_tiket,
        total_karyawan,
        total_inventory,
        total_teknisi,
        menunggu_approval,
        on_process,
        solved,
        reject,
        total_feedback,
        avgRatingRaw,
        feedback_positif,
        feedback_negatif
      ] = await Promise.all([
        list_ticket.count(),
        karyawan.count(),
        inventory.count(),
        teknisi.count({ where: { status: 'Aktif' } }),
        list_ticket.count({ where: { status: 'Menunggu Approval' } }),
        list_ticket.count({ where: { status: 'On Process' } }),
        list_ticket.count({ where: { status: 'Solved' } }),
        list_ticket.count({ where: { status: 'Reject' } }),
        laporan_feedback ? laporan_feedback.count() : 0,
        laporan_feedback ? laporan_feedback.aggregate('rating', 'AVG') : 0,
        laporan_feedback ? laporan_feedback.count({ where: { feedback: 'Positif' } }) : 0,
        laporan_feedback ? laporan_feedback.count({ where: { feedback: 'Negatif' } }) : 0
      ]);

      const rata_rata_rating = avgRatingRaw ? Number(avgRatingRaw).toFixed(1) : 0;

      summary = {
        total_tiket,
        total_karyawan,
        total_user: total_karyawan,
        total_inventory,
        total_asset: total_inventory,
        total_teknisi,
        menunggu_approval,
        waiting_approval: menunggu_approval,
        on_process,
        solved,
        reject,
        total_feedback,
        rata_rata_rating,
        feedback_positif,
        feedback_negatif
      };
    }

    summary.total_asset = summary.total_asset ?? summary.total_inventory ?? 0;
    summary.waiting_approval = summary.waiting_approval ?? summary.menunggu_approval ?? 0;
    summary.total_user = summary.total_user ?? summary.total_karyawan ?? 0;

    const allTickets = await list_ticket.findAll({
      attributes: ['tanggal_lapor'],
      order: [['tanggal_lapor', 'ASC']],
      raw: true
    });

    const monthlyMap = {};
    allTickets.forEach((t) => {
      if (t.tanggal_lapor) {
        const d = new Date(t.tanggal_lapor);
        const bulan = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[bulan] = (monthlyMap[bulan] || 0) + 1;
      }
    });

    const tiketBulanan = Object.entries(monthlyMap)
      .map(([bulan, jumlah]) => ({ bulan, jumlah }))
      .slice(-12);

    const aktivitasTerbaruRaw = await list_ticket.findAll({
      limit: 10,
      include: [{ model: karyawan, as: 'nik_pelapor_karyawan' }],
      order: [['tanggal_lapor', 'DESC']]
    });

    const aktivitasTerbaru = aktivitasTerbaruRaw.map((lt) => ({
      id_ticket: lt.id_ticket,
      reported: lt.nik_pelapor_karyawan?.nama || 'User',
      status: lt.status,
      tanggal_lapor: lt.tanggal_lapor
    }));

    return ok(res, { summary, tiketBulanan, aktivitasTerbaru });
  } catch (err) {
    console.error('Error getAdminDashboard (Sequelize):', err);
    return fail(res, 'Gagal mengambil data dashboard: ' + err.message, 500);
  }
};

// ==========================================
// Dashboard Teknisi Login
// ==========================================
const getTeknisiDashboard = async (req, res) => {
  try {
    const dataTeknisi = await teknisi.findOne({
      where: { nik: req.user.nik }
    });

    if (!dataTeknisi) {
      return fail(res, 'Data teknisi tidak ditemukan', 404);
    }

    const assignments = await assignment_ticket.findAll({
      where: { id_teknisi: dataTeknisi.id_teknisi },
      attributes: ['status_pengerjaan'],
      raw: true
    });

    const summary = {
      total_ditugaskan: assignments.length,
      menunggu_diproses: assignments.filter((a) => a.status_pengerjaan === 'Menunggu Diproses').length,
      proses: assignments.filter((a) => a.status_pengerjaan === 'Proses').length,
      selesai: assignments.filter((a) => a.status_pengerjaan === 'Selesai').length
    };

    return ok(res, summary);
  } catch (err) {
    console.error('Error getTeknisiDashboard (Sequelize):', err);
    return fail(res, 'Gagal mengambil dashboard teknisi: ' + err.message, 500);
  }
};

// ==========================================
// Dashboard User Login
// ==========================================
const getUserDashboard = async (req, res) => {
  try {
    const userTickets = await list_ticket.findAll({
      where: { nik_pelapor: req.user.nik },
      attributes: ['status'],
      raw: true
    });

    const summary = {
      total_tiket: userTickets.length,
      menunggu_approval: userTickets.filter((t) => t.status === 'Menunggu Approval').length,
      on_process: userTickets.filter((t) => t.status === 'On Process').length,
      solved: userTickets.filter((t) => t.status === 'Solved').length,
      reject: userTickets.filter((t) => t.status === 'Reject').length
    };

    return ok(res, summary);
  } catch (err) {
    console.error('Error getUserDashboard (Sequelize):', err);
    return fail(res, 'Gagal mengambil dashboard user: ' + err.message, 500);
  }
};

// 🔴 EKSPOR EKSPLISIT DALAM SATU OBJECT
module.exports = {
  getAdminDashboard,
  getTeknisiDashboard,
  getUserDashboard
};
