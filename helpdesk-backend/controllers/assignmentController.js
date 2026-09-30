const {
  assignment_ticket,
  approval_ticket,
  list_ticket,
  teknisi,
  karyawan,
  kategori,
  sub_kategori,
  sequelize
} = require('../models');
const { ok, fail } = require('../utils/response');
const { Op } = require('sequelize');

// ==========================================
// 1. Mengambil tiket yang bisa di-assign oleh Admin
// ==========================================
exports.getAssignableTickets = async (req, res) => {
  try {
    const approvedList = await approval_ticket.findAll({
      where: { status_approval: 'Approve' },
      include: [
        {
          model: list_ticket,
          as: 'id_ticket_list_ticket',
          include: [
            { model: karyawan, as: 'nik_pelapor_karyawan' },
            { model: kategori, as: 'id_kategori_kategori' },
            { model: sub_kategori, as: 'id_sub_kategori_sub_kategori' },
            { model: assignment_ticket, as: 'assignment_ticket' }
          ]
        }
      ]
    });

    const rows = [];
    for (const item of approvedList) {
      const lt = item.id_ticket_list_ticket;
      if (!lt) continue;

      if (!lt.assignment_ticket) {
        rows.push({
          id_ticket: lt.id_ticket,
          reported: lt.nik_pelapor_karyawan?.nama || null,
          id_kategori: lt.id_kategori,
          kategori: lt.id_kategori_kategori?.nama_kategori || null,
          sub_kategori: lt.id_sub_kategori_sub_kategori?.nama_sub_kategori || null,
          asset: lt.kode_asset,
          tanggal: lt.tanggal_lapor,
          prioritas: lt.prioritas,
          deadline: lt.deadline
        });
      }
    }

    rows.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    return ok(res, rows);
  } catch (err) {
    console.error('Error getAssignableTickets (Sequelize):', err);
    return fail(res, 'Gagal mengambil daftar tiket assignment: ' + err.message, 500);
  }
};

// ==========================================
// 2. Mengambil teknisi berdasarkan kategori
// ==========================================
exports.getTeknisiByKategori = async (req, res) => {
  try {
    const idKategori = parseInt(req.params.id_kategori);

    const listTeknisi = await teknisi.findAll({
      where: {
        id_kategori: idKategori,
        status: 'Aktif'
      },
      include: [
        { model: karyawan, as: 'nik_karyawan' },
        {
          model: assignment_ticket,
          as: 'assignment_tickets',
          where: { status_pengerjaan: { [Op.notIn]: ['Selesai', 'Menunggu Approval User'] } },
          required: false
        }
      ]
    });

    const availableTeknisi = listTeknisi.filter(
      (tk) => !tk.assignment_tickets || tk.assignment_tickets.length === 0
    );

    const rows = availableTeknisi.map((tk) => ({
      id_teknisi: tk.id_teknisi,
      nama: tk.nik_karyawan?.nama || null,
      jumlah_tiket_ditangani: tk.jumlah_tiket_ditangani
    }));

    return ok(res, rows);
  } catch (err) {
    console.error('Error getTeknisiByKategori (Sequelize):', err);
    return fail(res, 'Gagal mengambil daftar teknisi: ' + err.message, 500);
  }
};

// ==========================================
// 3. Proses Assign Tiket (Admin)
// ==========================================
exports.assignTicket = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id_ticket } = req.params;
    const { id_teknisi, prioritas } = req.body;

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
      return fail(res, 'Tiket ini belum disetujui, tidak dapat di-assign.', 400);
    }

    const existingAssignment = await assignment_ticket.findOne({
      where: { id_ticket },
      transaction
    });

    if (existingAssignment) {
      await transaction.rollback();
      return fail(res, 'Tiket ini sudah pernah di-assign sebelumnya.', 400);
    }

    const busyCheck = await assignment_ticket.findOne({
      where: {
        id_teknisi,
        status_pengerjaan: { [Op.notIn]: ['Selesai', 'Menunggu Approval User'] }
      },
      transaction
    });

    if (busyCheck) {
      await transaction.rollback();
      return fail(res, 'Teknisi ini sedang menangani tiket lain yang belum selesai.', 400);
    }

    let hoursToAdd = 6;
    if (prioritas === 'Low') hoursToAdd = 12;
    else if (prioritas === 'Urgent') hoursToAdd = 4;

    const deadline = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);

    await assignment_ticket.create(
      {
        id_ticket,
        id_teknisi,
        tanggal_assign: new Date(),
        progress: 0,
        status_pengerjaan: 'Menunggu Diproses'
      },
      { transaction }
    );

    await list_ticket.update(
      {
        prioritas: prioritas || 'Normal',
        deadline,
        status: 'On Process'
      },
      { where: { id_ticket }, transaction }
    );

    await teknisi.increment('jumlah_tiket_ditangani', {
      by: 1,
      where: { id_teknisi },
      transaction
    });

    await transaction.commit();
    return ok(res, { id_ticket, id_teknisi, prioritas, deadline }, 'Tiket berhasil di-assign ke teknisi.');
  } catch (err) {
    await transaction.rollback();
    console.error('Error assignTicket (Sequelize):', err);
    return fail(res, 'Gagal assign tiket: ' + err.message, 500);
  }
};

// ==========================================
// 4. GET Tugas Teknisi (Dashboard Teknisi)
// ==========================================
exports.getMyAssignments = async (req, res) => {
  try {
    const dataTeknisi = await teknisi.findOne({
      where: { nik: req.user.nik }
    });

    if (!dataTeknisi) {
      return fail(res, 'Anda tidak terdaftar sebagai teknisi.', 403);
    }

    const assignments = await assignment_ticket.findAll({
      where: { id_teknisi: dataTeknisi.id_teknisi },
      include: [
        {
          model: list_ticket,
          as: 'id_ticket_list_ticket',
          include: [
            { model: karyawan, as: 'nik_pelapor_karyawan' },
            { model: kategori, as: 'id_kategori_kategori' },
            { model: sub_kategori, as: 'id_sub_kategori_sub_kategori' }
          ]
        }
      ],
      order: [['tanggal_assign', 'DESC']]
    });

    const rows = assignments.map((asg) => {
      const lt = asg.id_ticket_list_ticket;
      return {
        id_assignment: asg.id_assignment,
        id_ticket: asg.id_ticket,
        nama_pelapor: lt?.nik_pelapor_karyawan?.nama || null,
        nama_kategori: lt?.id_kategori_kategori?.nama_kategori || null,
        nama_sub_kategori: lt?.id_sub_kategori_sub_kategori?.nama_sub_kategori || null,
        aset: lt?.kode_asset || null,
        lampiran: lt?.lampiran || null,
        deskripsi: lt?.deskripsi || null,
        prioritas: lt?.prioritas || null,
        deadline: lt?.deadline || null,
        tanggal_assign: asg.tanggal_assign,
        progress: asg.progress,
        catatan_penyelesaian: asg.catatan_penyelesaian,
        status_pengerjaan: asg.status_pengerjaan,
        tanggal_selesai: asg.tanggal_selesai
      };
    });

    return ok(res, rows);
  } catch (err) {
    console.error('Error getMyAssignments (Sequelize):', err);
    return fail(res, 'Gagal mengambil tugas tiket: ' + err.message, 500);
  }
};

// ==========================================
// 5. GET Riwayat Teknisi
// ==========================================
exports.getRiwayatTeknisi = async (req, res) => {
  try {
    const dataTeknisi = await teknisi.findOne({
      where: { nik: req.user.nik }
    });

    if (!dataTeknisi) {
      return fail(res, 'Anda tidak terdaftar sebagai teknisi.', 403);
    }

    const assignments = await assignment_ticket.findAll({
      where: {
        id_teknisi: dataTeknisi.id_teknisi,
        status_pengerjaan: 'Selesai'
      },
      include: [
        {
          model: list_ticket,
          as: 'id_ticket_list_ticket',
          include: [
            { model: karyawan, as: 'nik_pelapor_karyawan' },
            { model: kategori, as: 'id_kategori_kategori' }
          ]
        }
      ],
      order: [['tanggal_selesai', 'DESC']]
    });

    const rows = assignments.map((asg) => {
      const lt = asg.id_ticket_list_ticket;
      return {
        id_ticket: asg.id_ticket,
        reported: lt?.nik_pelapor_karyawan?.nama || null,
        kategori: lt?.id_kategori_kategori?.nama_kategori || null,
        prioritas: lt?.prioritas || null,
        deadline: lt?.deadline || null,
        tanggal_selesai: asg.tanggal_selesai,
        progress: asg.progress,
        status: asg.status_pengerjaan
      };
    });

    return ok(res, rows);
  } catch (err) {
    console.error('Error getRiwayatTeknisi (Sequelize):', err);
    return fail(res, 'Gagal mengambil riwayat tiket: ' + err.message, 500);
  }
};

// ==========================================
// 6. Update Progress Tiket
// ==========================================
exports.updateProgress = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id_ticket } = req.params;
    const { progress, catatan_penyelesaian, status_pengerjaan } = req.body;

    const dataTeknisi = await teknisi.findOne({
      where: { nik: req.user.nik },
      transaction
    });

    if (!dataTeknisi) {
      await transaction.rollback();
      return fail(res, 'Anda tidak terdaftar sebagai teknisi.', 403);
    }

    const asgRow = await assignment_ticket.findOne({
      where: { id_ticket },
      transaction
    });

    if (!asgRow) {
      await transaction.rollback();
      return fail(res, 'Assignment tiket tidak ditemukan.', 404);
    }

    if (asgRow.id_teknisi !== dataTeknisi.id_teknisi) {
      await transaction.rollback();
      return fail(res, 'Tiket ini bukan tugas Anda.', 403);
    }

    const selesai = status_pengerjaan === 'Selesai';

    await assignment_ticket.update(
      {
        progress: progress !== undefined ? parseInt(progress) : asgRow.progress,
        catatan_penyelesaian: catatan_penyelesaian !== undefined ? catatan_penyelesaian : asgRow.catatan_penyelesaian,
        status_pengerjaan: status_pengerjaan || asgRow.status_pengerjaan,
        tanggal_selesai: selesai ? new Date() : null
      },
      { where: { id_ticket }, transaction }
    );

    if (selesai) {
      await list_ticket.update(
        { status: 'Solved' },
        { where: { id_ticket }, transaction }
      );
    }

    await transaction.commit();
    return ok(res, null, 'Progress tiket berhasil diperbarui.');
  } catch (err) {
    await transaction.rollback();
    console.error('Error updateProgress (Sequelize):', err);
    return fail(res, 'Gagal memperbarui progress tiket: ' + err.message, 500);
  }
};
