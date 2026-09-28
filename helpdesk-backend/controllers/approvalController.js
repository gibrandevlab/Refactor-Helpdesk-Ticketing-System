const {
  approval_ticket,
  list_ticket,
  karyawan,
  departemen,
  kategori,
  sub_kategori,
  sequelize
} = require('../models');
const { ok, fail } = require('../utils/response');
const { Op } = require('sequelize');

// ==========================================
// ADMIN: Ambil Daftar Tiket Menunggu Approval
// ==========================================
exports.getApprovalList = async (req, res) => {
  try {
    const { status } = req.query;
    const targetStatus = status || 'Menunggu Approval';

    const approvals = await approval_ticket.findAll({
      where: {
        status_approval: targetStatus
      },
      include: [
        {
          model: list_ticket,
          as: 'id_ticket_list_ticket',
          include: [
            { model: karyawan, as: 'nik_pelapor_karyawan' },
            { model: departemen, as: 'id_departemen_departemen' },
            { model: kategori, as: 'id_kategori_kategori' },
            { model: sub_kategori, as: 'id_sub_kategori_sub_kategori' }
          ]
        }
      ],
      order: [[{ model: list_ticket, as: 'id_ticket_list_ticket' }, 'tanggal_lapor', 'ASC']]
    });

    const rows = approvals.map((at) => {
      const lt = at.id_ticket_list_ticket;
      return {
        id_approval: at.id_approval,
        id_ticket: at.id_ticket,
        reported: lt?.nik_pelapor_karyawan?.nama || null,
        departemen: lt?.id_departemen_departemen?.nama_departemen || null,
        kategori: lt?.id_kategori_kategori?.nama_kategori || null,
        sub_kategori: lt?.id_sub_kategori_sub_kategori?.nama_sub_kategori || null,
        deskripsi: lt?.deskripsi || null,
        lampiran: lt?.lampiran || null,
        tanggal: lt?.tanggal_lapor || null,
        status: at.status_approval,
        catatan_approval: at.catatan_approval,
        tanggal_approval: at.tanggal_approval
      };
    });

    return ok(res, rows);
  } catch (err) {
    console.error('Error getApprovalList (Sequelize):', err);
    return fail(res, 'Gagal mengambil daftar approval: ' + err.message, 500);
  }
};

// ==========================================
// ADMIN: Proses Approval (Approve / Reject)
// ==========================================
exports.processApproval = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id_ticket } = req.params;
    const { keputusan, catatan } = req.body;

    if (!['Approve', 'Reject'].includes(keputusan)) {
      await transaction.rollback();
      return fail(res, "Keputusan tidak valid. Pilih 'Approve' atau 'Reject'.", 400);
    }

    const existing = await approval_ticket.findOne({
      where: { id_ticket },
      transaction
    });

    if (!existing) {
      await transaction.rollback();
      return fail(res, 'Data approval tiket tidak ditemukan.', 404);
    }

    if (existing.status_approval !== 'Menunggu Approval') {
      await transaction.rollback();
      return fail(res, `Tiket ini sudah diproses sebelumnya (${existing.status_approval}).`, 400);
    }

    const statusTicketBaru = keputusan === 'Approve' ? 'Menunggu Assignment' : 'Reject';

    await approval_ticket.update(
      {
        status_approval: keputusan,
        nik_admin: req.user.nik,
        tanggal_approval: new Date(),
        catatan_approval: catatan || null
      },
      { where: { id_ticket }, transaction }
    );

    await list_ticket.update(
      { status: statusTicketBaru },
      { where: { id_ticket }, transaction }
    );

    await transaction.commit();
    return ok(
      res,
      { id_ticket, status_approval: keputusan, status_ticket: statusTicketBaru },
      `Tiket berhasil di-${keputusan.toLowerCase()}.`
    );
  } catch (err) {
    await transaction.rollback();
    console.error('Error processApproval (Sequelize):', err);
    return fail(res, 'Gagal memproses approval: ' + err.message, 500);
  }
};

// ==========================================
// ADMIN / PEJABAT: Riwayat Approval
// ==========================================
exports.getRiwayatApproval = async (req, res) => {
  try {
    const approvals = await approval_ticket.findAll({
      where: {
        status_approval: { [Op.ne]: 'Menunggu Approval' }
      },
      include: [
        {
          model: list_ticket,
          as: 'id_ticket_list_ticket',
          include: [{ model: karyawan, as: 'nik_pelapor_karyawan' }]
        }
      ],
      order: [['tanggal_approval', 'DESC']]
    });

    const rows = approvals.map((at) => ({
      id_approval: at.id_approval,
      id_ticket: at.id_ticket,
      nik_admin: at.nik_admin,
      status_approval: at.status_approval,
      catatan_approval: at.catatan_approval,
      tanggal_approval: at.tanggal_approval,
      deskripsi: at.id_ticket_list_ticket?.deskripsi || null,
      reported: at.id_ticket_list_ticket?.nik_pelapor_karyawan?.nama || null
    }));

    return ok(res, rows);
  } catch (err) {
    console.error('Error getRiwayatApproval (Sequelize):', err);
    return fail(res, 'Gagal mengambil riwayat approval: ' + err.message, 500);
  }
};
