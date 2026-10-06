const {
  list_ticket,
  karyawan,
  departemen,
  kategori,
  sub_kategori,
  inventory,
  preventive_schedule,
  approval_ticket,
  assignment_ticket,
  teknisi,
  ticket_progress_log,
  ticket_chat,
  laporan_feedback,
  sequelize
} = require('../models');
const { ok, created, fail } = require('../utils/response');
const { Op } = require('sequelize');

// ==========================================
// Helper Include Relasi Sequelize (ListTicket)
// ==========================================
const includeFullTicket = [
  { model: karyawan, as: 'nik_pelapor_karyawan', required: false },
  { model: departemen, as: 'id_departemen_departemen', required: false },
  { model: kategori, as: 'id_kategori_kategori', required: false },
  { model: sub_kategori, as: 'id_sub_kategori_sub_kategori', required: false },
  {
    model: inventory,
    as: 'kode_asset_inventory',
    required: false,
    include: [
      { model: preventive_schedule, as: 'id_preventive_schedule_preventive_schedule', required: false }
    ]
  },
  { model: preventive_schedule, as: 'id_schedule_preventive_schedule', required: false },
  { model: approval_ticket, as: 'approval_ticket', required: false },
  {
    model: assignment_ticket,
    as: 'assignment_ticket',
    required: false,
    include: [
      {
        model: teknisi,
        as: 'id_teknisi_teknisi',
        required: false,
        include: [{ model: karyawan, as: 'nik_karyawan', required: false }]
      }
    ]
  }
];

// ==========================================
// Helper Format Ticket Output (Format JSON Konsisten)
// ==========================================
const formatTicket = (t) => {
  const inv = t.kode_asset_inventory;
  // Menangani jika assignment_ticket ter-load sebagai Array atau Object
  const asg = Array.isArray(t.assignment_ticket) ? t.assignment_ticket[0] : t.assignment_ticket;
  const tk = asg?.id_teknisi_teknisi;
  const app = Array.isArray(t.approval_ticket) ? t.approval_ticket[0] : t.approval_ticket;

  return {
    id_ticket: t.id_ticket,
    nik_pelapor: t.nik_pelapor,
    reported: t.nik_pelapor_karyawan?.nama || null,
    id_departemen: t.id_departemen,
    dept: t.id_departemen_departemen?.nama_departemen || null,
    id_kategori: t.id_kategori,
    nama_kategori: t.id_kategori_kategori?.nama_kategori || null,
    id_sub_kategori: t.id_sub_kategori,
    nama_sub_kategori: t.id_sub_kategori_sub_kategori?.nama_sub_kategori || null,
    kode_asset: t.kode_asset,
    aset: inv ? `${inv.kode_asset} - ${inv.nama_barang}` : null,
    nik_pemegang: inv?.nik_pemegang || null,
    deskripsi: t.deskripsi,
    lampiran: t.lampiran,
    tanggal: t.tanggal_lapor,
    status: t.status,
    prioritas: t.prioritas,
    deadline: t.deadline,
    status_approval: app?.status_approval || null,
    catatan_approval: app?.catatan_approval || null,
    id_teknisi: asg?.id_teknisi || null,
    nik_teknisi: tk?.nik || null,
    teknisi: tk?.nik_karyawan?.nama || null,
    progress: asg?.progress ?? null,
    status_pengerjaan: asg?.status_pengerjaan || null,
    is_paused: asg?.is_paused ?? null,
    tanggal_selesai: asg?.tanggal_selesai || null,
    catatan_penyelesaian: asg?.catatan_penyelesaian || null,
    user_konfirmasi: asg?.user_konfirmasi ?? null,
    // Frontend memakai penanda eksplisit ini untuk menampilkan Check Sheet.
    is_preventive: Boolean(t.deskripsi && t.deskripsi.includes('[PREVENTIVE]')),
    tanggal_konfirmasi_user: asg?.tanggal_konfirmasi_user || null,
    admin_approve: asg?.admin_approve ?? null,
    admin_approve_by: asg?.admin_approve_by || null,
    admin_approve_at: asg?.admin_approve_at || null,
    tanggal_dibuat_schedule: inv?.id_preventive_schedule_preventive_schedule?.created_at || t.id_schedule_preventive_schedule?.created_at || null,
  };
};

// ==========================================
// ADMIN: Ambil semua tiket
// ==========================================
exports.getAllTickets = async (req, res) => {
  try {
    const { status, id_kategori, id_departemen } = req.query;

    const where = {};
    if (status) where.status = status;
    if (id_kategori) where.id_kategori = parseInt(id_kategori);
    if (id_departemen) where.id_departemen = parseInt(id_departemen);

    const tickets = await list_ticket.findAll({
      where,
      include: includeFullTicket,
      order: [['tanggal_lapor', 'DESC']]
    });

    return ok(res, tickets.map(formatTicket));
  } catch (err) {
    console.error('Error getAllTickets (Sequelize):', err);
    return fail(res, 'Gagal memuat daftar tiket. Silakan coba lagi.', 500);
  }
};

// ==========================================
// ADMIN: Approve atau Reject Tiket Masuk
// ==========================================
exports.approveTicket = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { status_approval, catatan_approval } = req.body;
    const id_ticket = req.params.id;

    if (!['Approve', 'Reject'].includes(status_approval)) {
      await transaction.rollback();
      return fail(res, "Pilihan status tidak valid. Pilih 'Approve' atau 'Reject'.", 400);
    }

    const ticket = await list_ticket.findByPk(id_ticket, { transaction });
    if (!ticket) {
      await transaction.rollback();
      return fail(res, 'Tiket tidak ditemukan.', 404);
    }

    const approval = await approval_ticket.findOne({
      where: { id_ticket },
      transaction
    });
    if (!approval) {
      await transaction.rollback();
      return fail(res, 'Data approval tiket tidak ditemukan.', 404);
    }

    if (approval.status_approval !== 'Menunggu Approval') {
      await transaction.rollback();
      return fail(res, `Tiket ini sudah diproses sebelumnya (${approval.status_approval}).`, 400);
    }

    const newStatus = status_approval === 'Approve' ? 'Menunggu Assignment' : 'Reject';

    await approval_ticket.update(
      {
        status_approval,
        nik_admin: req.user.nik,
        tanggal_approval: new Date(),
        catatan_approval: catatan_approval || null
      },
      { where: { id_ticket }, transaction }
    );

    await list_ticket.update(
      { status: newStatus },
      { where: { id_ticket }, transaction }
    );

    await transaction.commit();
    return ok(res, null, `Tiket berhasil di-${status_approval.toLowerCase()}`);
  } catch (err) {
    await transaction.rollback();
    console.error('Error approveTicket (Sequelize):', err);
    return fail(res, 'Gagal memproses approval tiket: ' + err.message, 500);
  }
};

// ==========================================
// SEMUA ROLE: Detail tiket
// ==========================================
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await list_ticket.findOne({
      where: { id_ticket: req.params.id },
      include: includeFullTicket
    });

    if (!ticket) return fail(res, 'Tiket tidak ditemukan.', 404);
    return ok(res, formatTicket(ticket));
  } catch (err) {
    console.error('Error getTicketById (Sequelize):', err);
    return fail(res, 'Gagal mengambil detail tiket.', 500);
  }
};

// ==========================================
// USERS: My Ticket
// ==========================================
exports.getMyTickets = async (req, res) => {
  try {
    const nik = req.user.nik;

    const myInventory = await inventory.findAll({
      where: { nik_pemegang: nik },
      attributes: ['kode_asset'],
      raw: true
    });
    const myAssetCodes = myInventory.map((i) => i.kode_asset);

    const whereCondition = {
      [Op.or]: [
        { nik_pelapor: nik },
        ...(myAssetCodes.length > 0 ? [{ kode_asset: { [Op.in]: myAssetCodes } }] : [])
      ]
    };

    const tickets = await list_ticket.findAll({
      where: whereCondition,
      include: includeFullTicket,
      order: [['tanggal_lapor', 'DESC']]
    });

    return ok(res, tickets.map(formatTicket));
  } catch (err) {
    console.error('Error getMyTickets (Sequelize):', err);
    return fail(res, 'Gagal mengambil daftar tiket Anda.', 500);
  }
};

// ==========================================
// USERS / ADMIN: New Ticket
// ==========================================
const PRIORITAS_VALID = ['Low', 'Normal', 'Urgent'];

exports.createTicket = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let { id_kategori, id_sub_kategori, kode_asset, deskripsi, prioritas, id_departemen } = req.body;

    prioritas = PRIORITAS_VALID.includes(prioritas) ? prioritas : 'Normal';

    if (!id_kategori || !deskripsi) {
      await transaction.rollback();
      return fail(res, 'Kategori dan deskripsi keluhan wajib diisi.', 400);
    }

    if (!id_departemen) {
      const dataKaryawan = await karyawan.findOne({
        where: { nik: req.user.nik },
        transaction
      });
      if (!dataKaryawan) {
        await transaction.rollback();
        return fail(res, 'Data karyawan tidak ditemukan. Pastikan akun Anda sudah terdaftar.', 404);
      }
      id_departemen = dataKaryawan.id_departemen;
    }

    const idTicket = 'T' + Date.now();
    const lampiran = req.file ? `/uploads/lampiran/${req.file.filename}` : null;

    await list_ticket.create({
      id_ticket: idTicket,
      nik_pelapor: req.user.nik,
      id_departemen: parseInt(id_departemen),
      id_kategori: parseInt(id_kategori),
      id_sub_kategori: id_sub_kategori ? parseInt(id_sub_kategori) : null,
      kode_asset: kode_asset || null,
      deskripsi,
      lampiran,
      tanggal_lapor: new Date(),
      status: 'Menunggu Approval',
      prioritas
    }, { transaction });

    await approval_ticket.create({
      id_ticket: idTicket,
      status_approval: 'Menunggu Approval'
    }, { transaction });

    await transaction.commit();
    return created(res, { id_ticket: idTicket }, 'Tiket berhasil dibuat, menunggu approval.');
  } catch (err) {
    await transaction.rollback();
    console.error('Error createTicket (Sequelize):', err);
    return fail(res, 'Gagal membuat tiket: ' + err.message, 500);
  }
};

// ==========================================
// ADMIN: Assign Tiket + Hitung Deadline (SLA)
// ==========================================
exports.assignTicket = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id_ticket } = req.params;
    const { id_teknisi } = req.body;

    if (!id_teknisi) {
      await transaction.rollback();
      return fail(res, 'Teknisi wajib dipilih.', 400);
    }

    const approval = await approval_ticket.findOne({
      where: { id_ticket },
      transaction
    });
    if (!approval || approval.status_approval !== 'Approve') {
      await transaction.rollback();
      return fail(res, 'Tiket belum disetujui, tidak dapat di-assign.', 400);
    }

    const ticket = await list_ticket.findByPk(id_ticket, { transaction });
    if (!ticket) {
      await transaction.rollback();
      return fail(res, 'Tiket tidak ditemukan.', 404);
    }

    const prioritas = ticket.prioritas || 'Normal';
    let hoursToAdd = 6;
    if (prioritas === 'Low') hoursToAdd = 12;
    else if (prioritas === 'Urgent') hoursToAdd = 4;

    const deadline = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);

    await assignment_ticket.create({
      id_ticket,
      id_teknisi,
      tanggal_assign: new Date(),
      status_pengerjaan: 'Menunggu Diproses'
    }, { transaction });

    await list_ticket.update({
      deadline,
      status: 'On Process'
    }, { where: { id_ticket }, transaction });

    await transaction.commit();
    return ok(res, null, 'Tiket berhasil di-assign ke teknisi.');
  } catch (err) {
    await transaction.rollback();
    console.error('Error assignTicket (Sequelize):', err);
    return fail(res, 'Gagal assign tiket: ' + err.message, 500);
  }
};

// ==========================================
// ADMIN: Hapus Tiket
// ==========================================
exports.deleteTicket = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const ticket = await list_ticket.findByPk(id, { transaction });
    if (!ticket) {
      await transaction.rollback();
      return fail(res, 'Tiket tidak ditemukan.', 404);
    }

    const asg = await assignment_ticket.findOne({ where: { id_ticket: id }, transaction });
    if (asg) {
      await ticket_progress_log.destroy({ where: { id_assignment: asg.id_assignment }, transaction });
    }

    await ticket_chat.destroy({ where: { id_ticket: id }, transaction });
    await laporan_feedback.destroy({ where: { id_ticket: id }, transaction });
    await assignment_ticket.destroy({ where: { id_ticket: id }, transaction });
    await approval_ticket.destroy({ where: { id_ticket: id }, transaction });
    await list_ticket.destroy({ where: { id_ticket: id }, transaction });

    await transaction.commit();
    return ok(res, null, 'Tiket berhasil dihapus.');
  } catch (err) {
    await transaction.rollback();
    console.error('Error deleteTicket (Sequelize):', err);
    return fail(res, 'Gagal menghapus tiket.', 500);
  }
};

// ==========================================
// TEKNISI: Ambil tiket yang di-assign ke saya
// ==========================================
exports.getAssignedToMe = async (req, res) => {
  try {
    const dataTeknisi = await teknisi.findOne({
      where: { nik: req.user.nik }
    });
    if (!dataTeknisi) return fail(res, 'Anda tidak terdaftar sebagai teknisi.', 403);

    const assignments = await assignment_ticket.findAll({
      where: {
        id_teknisi: dataTeknisi.id_teknisi,
        status_pengerjaan: { [Op.notIn]: ['Selesai', 'Menunggu Approval User'] }
      },
      include: [
        {
          model: list_ticket,
          as: 'id_ticket_list_ticket',
          include: includeFullTicket
        }
      ],
      order: [['tanggal_assign', 'DESC']]
    });

    const rows = assignments.map((asg) => {
      const lt = asg.id_ticket_list_ticket;
      const inv = lt?.kode_asset_inventory;
      return {
        id_assignment: asg.id_assignment,
        progress: asg.progress,
        status_pengerjaan: asg.status_pengerjaan,
        is_paused: asg.is_paused,
        tanggal_assign: asg.tanggal_assign,
        tanggal_selesai: asg.tanggal_selesai,
        catatan_penyelesaian: asg.catatan_penyelesaian,
        user_konfirmasi: asg.user_konfirmasi,
        tanggal_konfirmasi_user: asg.tanggal_konfirmasi_user,
        admin_approve: asg.admin_approve,
        admin_approve_by: asg.admin_approve_by,
        admin_approve_at: asg.admin_approve_at,
        id_ticket: lt?.id_ticket,
        deskripsi: lt?.deskripsi,
        lampiran: lt?.lampiran,
        kode_asset: lt?.kode_asset,
        deadline: lt?.deadline,
        prioritas: lt?.prioritas,
        departemen: lt?.id_departemen_departemen?.nama_departemen || null,
        aset: inv ? `${inv.kode_asset} - ${inv.nama_barang}` : null,
        nama_pelapor: lt?.nik_pelapor_karyawan?.nama || null,
        nama_kategori: lt?.id_kategori_kategori?.nama_kategori || null,
        nama_sub_kategori: lt?.id_sub_kategori_sub_kategori?.nama_sub_kategori || null,
        tanggal_dibuat_schedule: inv?.id_preventive_schedule_preventive_schedule?.created_at || lt?.id_schedule_preventive_schedule?.created_at || null
      };
    });

    return ok(res, rows);
  } catch (err) {
    console.error('Error getAssignedToMe (Sequelize):', err);
    return fail(res, 'Gagal mengambil tugas tiket: ' + err.message, 500);
  }
};

// ==========================================
// TEKNISI: Riwayat tiket selesai
// ==========================================
exports.getRiwayatMe = async (req, res) => {
  try {
    const dataTeknisi = await teknisi.findOne({
      where: { nik: req.user.nik }
    });
    if (!dataTeknisi) return fail(res, 'Anda tidak terdaftar sebagai teknisi.', 403);

    const assignments = await assignment_ticket.findAll({
      where: {
        id_teknisi: dataTeknisi.id_teknisi,
        status_pengerjaan: 'Selesai'
      },
      include: [
        {
          model: list_ticket,
          as: 'id_ticket_list_ticket',
          include: includeFullTicket
        }
      ],
      order: [['tanggal_selesai', 'DESC']]
    });

    const rows = assignments.map((asg) => {
      const lt = asg.id_ticket_list_ticket;
      const inv = lt?.kode_asset_inventory;
      return {
        id_assignment: asg.id_assignment,
        progress: asg.progress,
        status_pengerjaan: asg.status_pengerjaan,
        tanggal_assign: asg.tanggal_assign,
        tanggal_selesai: asg.tanggal_selesai,
        catatan_penyelesaian: asg.catatan_penyelesaian,
        user_konfirmasi: asg.user_konfirmasi,
        tanggal_konfirmasi_user: asg.tanggal_konfirmasi_user,
        admin_approve: asg.admin_approve,
        admin_approve_by: asg.admin_approve_by,
        admin_approve_at: asg.admin_approve_at,
        id_ticket: lt?.id_ticket,
        deskripsi: lt?.deskripsi,
        lampiran: lt?.lampiran,
        kode_asset: lt?.kode_asset,
        departemen: lt?.id_departemen_departemen?.nama_departemen || null,
        nama_pelapor: lt?.nik_pelapor_karyawan?.nama || null,
        nama_kategori: lt?.id_kategori_kategori?.nama_kategori || null,
        tanggal_dibuat_schedule: inv?.id_preventive_schedule_preventive_schedule?.created_at || lt?.id_schedule_preventive_schedule?.created_at || null
      };
    });

    return ok(res, rows);
  } catch (err) {
    console.error('Error getRiwayatMe (Sequelize):', err);
    return fail(res, 'Gagal mengambil riwayat tiket: ' + err.message, 500);
  }
};

// ==========================================
// SEMUA ROLE: Histori Progres
// ==========================================
exports.getProgressHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const userNik = req.user.nik;

    const ticket = await list_ticket.findOne({
      where: { id_ticket: id },
      include: [{ model: assignment_ticket, as: 'assignment_ticket' }]
    });

    if (!ticket) return fail(res, 'Tiket tidak ditemukan.', 404);

    if (userRole === 'users' || userRole === 'user') {
      if (ticket.nik_pelapor !== userNik) {
        return fail(res, 'Anda tidak berhak melihat riwayat tiket ini.', 403);
      }
    } else if (userRole === 'teknisi') {
      const dataTeknisi = await teknisi.findOne({ where: { nik: userNik } });
      if (!dataTeknisi) return fail(res, 'Anda tidak terdaftar sebagai teknisi.', 403);

      if (ticket.assignment_ticket?.id_teknisi !== dataTeknisi.id_teknisi) {
        return fail(res, 'Tiket ini bukan tugas Anda.', 403);
      }
    }

    if (!ticket.assignment_ticket) {
      return ok(res, [], 'Belum ada riwayat progres.');
    }

    const history = await ticket_progress_log.findAll({
      where: { id_assignment: ticket.assignment_ticket.id_assignment },
      order: [['created_at', 'DESC']]
    });

    return ok(res, history);
  } catch (err) {
    console.error('Error getProgressHistory (Sequelize):', err);
    return fail(res, 'Gagal mengambil histori progres.', 500);
  }
};

// ==========================================
// TEKNISI: Toggle Pause / Resume
// ==========================================
exports.togglePause = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const id_ticket = req.params.id;
    const { progress, catatan_penyelesaian, status_pengerjaan } = req.body;

    const dataTeknisi = await teknisi.findOne({ where: { nik: req.user.nik }, transaction });
    if (!dataTeknisi) {
      await transaction.rollback();
      return fail(res, 'Anda tidak terdaftar sebagai teknisi.', 403);
    }

    const assignment = await assignment_ticket.findOne({
      where: { id_ticket, id_teknisi: dataTeknisi.id_teknisi },
      transaction
    });
    if (!assignment) {
      await transaction.rollback();
      return fail(res, 'Tiket ini bukan tugas Anda.', 404);
    }

    const ticketInfo = await list_ticket.findByPk(id_ticket, { transaction });
    const isPreventive = ticketInfo?.deskripsi?.includes('[PREVENTIVE]');
    if (isPreventive && status_pengerjaan === 'Selesai') {
      if (transaction) await transaction.rollback();
      return fail(res, 'Tiket preventive tidak dapat diselesaikan langsung. Lengkapi lalu ajukan Check Sheet untuk approval User.', 400);
    }
    if (assignment.status_pengerjaan === 'Menunggu Approval User') {
      if (transaction) await transaction.rollback();
      return fail(res, 'Check Sheet sedang menunggu approval User dan tidak dapat diubah.', 400);
    }

    const currentPaused = assignment.is_paused;
    const newPausedStatus = currentPaused ? 0 : 1;
    const currentProgress = progress !== undefined ? parseInt(progress) : assignment.progress;
    const finalStatusPengerjaan = status_pengerjaan || 'Proses';

    if (newPausedStatus === 1) {
      await assignment_ticket.update({
        is_paused: 1,
        paused_at: new Date(),
        progress: currentProgress,
        catatan_penyelesaian: catatan_penyelesaian || null
      }, { where: { id_assignment: assignment.id_assignment }, transaction });
    } else {
      const pausedAt = assignment.paused_at;
      if (pausedAt) {
        const pausedMs = Math.max(0, Date.now() - new Date(pausedAt).getTime());
        const ticket = await list_ticket.findByPk(id_ticket, { transaction });
        if (ticket && ticket.deadline) {
          const newDeadline = new Date(new Date(ticket.deadline).getTime() + pausedMs);
          await list_ticket.update({ deadline: newDeadline }, { where: { id_ticket }, transaction });
        }
      }

      await assignment_ticket.update({
        is_paused: 0,
        paused_at: null,
        progress: currentProgress,
        catatan_penyelesaian: catatan_penyelesaian || null
      }, { where: { id_assignment: assignment.id_assignment }, transaction });
    }

    const logCatatan = catatan_penyelesaian || (newPausedStatus ? 'Tiket Dijeda' : 'Tiket Dilanjutkan');
    await ticket_progress_log.create({
      id_assignment: assignment.id_assignment,
      progress: currentProgress,
      catatan: logCatatan,
      status_pengerjaan: finalStatusPengerjaan
    }, { transaction });

    await transaction.commit();
    return ok(res, { is_paused: newPausedStatus === 1 }, 'Status pause berhasil diperbarui.');
  } catch (error) {
    await transaction.rollback();
    console.error('Error togglePause (Sequelize):', error);
    return fail(res, 'Terjadi kesalahan pada server.', 500);
  }
};

// ==========================================
// TEKNISI: Update Progres Tiket
// ==========================================
exports.updateProgress = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    const { progress, catatan_penyelesaian, status_pengerjaan } = req.body;
    const id_ticket = req.params.id;

    const dataTeknisi = await teknisi.findOne({ where: { nik: req.user.nik }, transaction });
    if (!dataTeknisi) {
      if (transaction) await transaction.rollback();
      return fail(res, 'Anda tidak terdaftar sebagai teknisi.', 403);
    }

    const assignment = await assignment_ticket.findOne({
      where: { id_ticket, id_teknisi: dataTeknisi.id_teknisi },
      transaction
    });
    if (!assignment) {
      if (transaction) await transaction.rollback();
      return fail(res, 'Tiket ini bukan tugas Anda.', 404);
    }

    const ticketInfo = await list_ticket.findByPk(id_ticket, { transaction });
    if (!ticketInfo) {
      if (transaction) await transaction.rollback();
      return fail(res, 'Data tiket tidak ditemukan.', 404);
    }
    if (ticketInfo.deskripsi?.includes('[PREVENTIVE]') && status_pengerjaan === 'Selesai') {
      if (transaction) await transaction.rollback();
      return fail(res, 'Tiket preventive tidak dapat diselesaikan langsung. Lengkapi lalu ajukan Check Sheet untuk approval User.', 400);
    }

    if (assignment.is_paused && status_pengerjaan !== 'Selesai') {
      if (transaction) await transaction.rollback();
      return fail(res, 'Tiket sedang di-pause. Lanjutkan timer terlebih dahulu.', 400);
    }

    const intProgress = parseInt(progress) || 0;
    const defaultCatatan = catatan_penyelesaian || (status_pengerjaan === 'Proses' ? 'Memulai pengerjaan tiket' : 'Update progres');

    // 🔴 Gunakan sequelize.fn('GETDATE') agar aman dari error konversi string tanggal MSSQL
    await ticket_progress_log.create({
      id_assignment: assignment.id_assignment,
      progress: intProgress,
      catatan: defaultCatatan,
      status_pengerjaan: status_pengerjaan || 'Proses',
      created_at: sequelize.fn('GETDATE')
    }, { transaction });

    // Update assignment_ticket
    await assignment_ticket.update({
      progress: intProgress,
      catatan_penyelesaian: catatan_penyelesaian || null,
      status_pengerjaan: status_pengerjaan || 'Proses',
      tanggal_selesai: status_pengerjaan === 'Selesai' ? sequelize.fn('GETDATE') : null
    }, { where: { id_assignment: assignment.id_assignment }, transaction });

    // Update list_ticket
    if (status_pengerjaan === 'Selesai') {
      await list_ticket.update({ status: 'Solved' }, { where: { id_ticket }, transaction });

      if (ticketInfo?.kode_asset && ticketInfo?.deskripsi?.includes('[PREVENTIVE]')) {
        await inventory.update(
          { last_maintenance: sequelize.fn('GETDATE') },
          { where: { kode_asset: ticketInfo.kode_asset }, transaction }
        );
      }
    } else {
      await list_ticket.update({ status: 'On Process' }, { where: { id_ticket }, transaction });
    }

    await transaction.commit();
    return ok(res, null, 'Progress berhasil disimpan.');
  } catch (err) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {}
    }

    console.error('Error updateProgress (Sequelize):', err);
    const sqlError = err.original?.errors?.[0]?.message || err.original?.message || err.parent?.message || err.message;
    return fail(res, 'Gagal memperbarui progres: ' + (sqlError || 'Terjadi kesalahan database'), 500);
  }
};
// ==========================================
// TEKNISI: Request Return Tiket
// ==========================================
exports.requestReturnTicket = async (req, res) => {
  try {
    const { return_reason } = req.body;
    const id_ticket = req.params.id;

    if (!return_reason || return_reason.trim() === '') {
      return fail(res, 'Alasan pengembalian wajib diisi.', 400);
    }

    const dataTeknisi = await teknisi.findOne({ where: { nik: req.user.nik } });
    if (!dataTeknisi) return fail(res, 'Anda tidak terdaftar sebagai teknisi.', 403);

    const assignment = await assignment_ticket.findOne({
      where: { id_ticket, id_teknisi: dataTeknisi.id_teknisi }
    });
    if (!assignment) return fail(res, 'Tiket ini bukan tugas Anda.', 404);

    if (assignment.return_status === 'Pending') {
      return fail(res, 'Tiket ini sudah dalam proses pengembalian.', 400);
    }

    await assignment_ticket.update(
      {
        return_reason,
        return_status: 'Pending'
      },
      { where: { id_assignment: assignment.id_assignment } }
    );

    return ok(res, null, 'Permintaan pengembalian telah dikirim ke Admin.');
  } catch (err) {
    console.error('Error requestReturnTicket (Sequelize):', err);
    return fail(res, 'Gagal mengirim permintaan pengembalian.', 500);
  }
};

// ==========================================
// ADMIN: Ambil list tiket dikembalikan
// ==========================================
exports.getReturnedTickets = async (req, res) => {
  try {
    const assignments = await assignment_ticket.findAll({
      where: { return_status: 'Pending' },
      include: [
        {
          model: list_ticket,
          as: 'id_ticket_list_ticket',
          include: includeFullTicket
        },
        {
          model: teknisi,
          as: 'id_teknisi_teknisi',
          include: [{ model: karyawan, as: 'nik_karyawan' }]
        }
      ],
      order: [[{ model: list_ticket, as: 'id_ticket_list_ticket' }, 'tanggal_lapor', 'DESC']]
    });

    const rows = assignments.map((asg) => {
      const lt = asg.id_ticket_list_ticket;
      return {
        id_ticket: lt?.id_ticket,
        nik_pelapor: lt?.nik_pelapor,
        reported: lt?.nik_pelapor_karyawan?.nama || null,
        id_departemen: lt?.id_departemen,
        dept: lt?.id_departemen_departemen?.nama_departemen || null,
        id_kategori: lt?.id_kategori,
        kategori: lt?.id_kategori_kategori?.nama_kategori || null,
        id_sub_kategori: lt?.id_sub_kategori,
        sub_kategori: lt?.id_sub_kategori_sub_kategori?.nama_sub_kategori || null,
        kode_asset: lt?.kode_asset,
        deskripsi: lt?.deskripsi,
        lampiran: lt?.lampiran,
        tanggal: lt?.tanggal_lapor,
        prioritas: lt?.prioritas,
        return_reason: asg.return_reason,
        return_status: asg.return_status,
        id_teknisi: asg.id_teknisi,
        teknisi_nama: asg.id_teknisi_teknisi?.nik_karyawan?.nama || null
      };
    });

    return ok(res, rows);
  } catch (err) {
    console.error('Error getReturnedTickets (Sequelize):', err);
    return fail(res, 'Gagal mengambil data tiket pengembalian.', 500);
  }
};

// ==========================================
// ADMIN: Review Return (Approve / Reject)
// ==========================================
exports.reviewReturnTicket = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { action } = req.body;
    const id_ticket = req.params.id;

    if (!['Approve', 'Reject'].includes(action)) {
      await transaction.rollback();
      return fail(res, "Pilihan action harus 'Approve' atau 'Reject'.", 400);
    }

    const assignment = await assignment_ticket.findOne({
      where: { id_ticket, return_status: 'Pending' },
      transaction
    });

    if (!assignment) {
      await transaction.rollback();
      return fail(res, 'Tiket tidak ditemukan atau tidak dalam status pengembalian.', 404);
    }

    if (action === 'Approve') {
      await ticket_progress_log.destroy({
        where: { id_assignment: assignment.id_assignment },
        transaction
      });
      await assignment_ticket.destroy({
        where: { id_assignment: assignment.id_assignment },
        transaction
      });
      await list_ticket.update(
        { status: 'Menunggu Assignment', deadline: null },
        { where: { id_ticket }, transaction }
      );
    } else {
      await assignment_ticket.update(
        { return_status: 'None', return_reason: null },
        { where: { id_assignment: assignment.id_assignment }, transaction }
      );
      await list_ticket.update(
        { status: 'On Process' },
        { where: { id_ticket }, transaction }
      );
    }

    await transaction.commit();
    return ok(res, null, action === 'Approve' ? 'Pengembalian disetujui, tiket siap di-assign ulang.' : 'Pengembalian ditolak, tiket dikembalikan ke teknisi.');
  } catch (err) {
    await transaction.rollback();
    console.error('Error reviewReturnTicket (Sequelize):', err);
    return fail(res, 'Gagal memproses pengembalian tiket.', 500);
  }
};

// ==========================================
// USER: Konfirmasi hasil perbaikan
// ==========================================
exports.confirmByUser = async (req, res) => {
  try {
    const { idTicket } = req.params;
    const nikUser = req.user?.nik;

    const assignment = await assignment_ticket.findOne({
      where: { id_ticket: idTicket },
      include: [
        {
          model: list_ticket,
          as: 'id_ticket_list_ticket',
          include: [{ model: inventory, as: 'kode_asset_inventory' }]
        }
      ],
      order: [['tanggal_assign', 'DESC']]
    });

    if (!assignment) return fail(res, 'Tiket tidak ditemukan.', 404);

    if (assignment.status_pengerjaan !== 'Selesai') {
      return fail(res, 'Tiket belum selesai dikerjakan oleh teknisi.', 400);
    }

    if (assignment.user_konfirmasi === 1) {
      return fail(res, 'Tiket ini sudah pernah dikonfirmasi.', 400);
    }

    const lt = assignment.id_ticket_list_ticket;
    const isAuthorized = !!nikUser && (nikUser === lt?.nik_pelapor || nikUser === lt?.kode_asset_inventory?.nik_pemegang);

    if (!isAuthorized) {
      return fail(res, 'Anda tidak berhak melakukan konfirmasi untuk tiket ini.', 403);
    }

    await assignment_ticket.update(
      {
        user_konfirmasi: 1,
        tanggal_konfirmasi_user: new Date()
      },
      { where: { id_assignment: assignment.id_assignment } }
    );

    return ok(res, null, 'Terima kasih, konfirmasi perbaikan telah disimpan.');
  } catch (error) {
    console.error('Error confirmByUser (Sequelize):', error);
    return fail(res, 'Gagal melakukan konfirmasi.', 500);
  }
};

// ==========================================
// ADMIN: Final Approve Checklist
// ==========================================
exports.adminApproveTicket = async (req, res) => {
  try {
    const { idTicket } = req.params;
    const adminNama = req.user?.nama || req.user?.username || 'Admin';

    const assignment = await assignment_ticket.findOne({
      where: { id_ticket: idTicket },
      order: [['tanggal_assign', 'DESC']]
    });

    if (!assignment) {
      return fail(res, 'Assignment tiket tidak ditemukan.', 404);
    }

    if (assignment.status_pengerjaan !== 'Selesai') {
      return fail(res, 'Tiket belum selesai dikerjakan oleh teknisi.', 400);
    }

    if (assignment.admin_approve === 1) {
      return fail(res, 'Checklist tiket ini sudah pernah disetujui Admin.', 400);
    }

    await assignment_ticket.update(
      {
        admin_approve: 1,
        admin_approve_by: adminNama,
        admin_approve_at: new Date()
      },
      { where: { id_assignment: assignment.id_assignment } }
    );

    return ok(res, null, 'Checklist pekerjaan telah disetujui Admin.');
  } catch (err) {
    console.error('Error adminApproveTicket (Sequelize):', err);
    return fail(res, 'Gagal menyetujui checklist.', 500);
  }
};
