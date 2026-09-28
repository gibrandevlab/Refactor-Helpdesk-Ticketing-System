const { teknisi, karyawan, kategori, user, sequelize } = require('../models');
const { ok, created, fail } = require('../utils/response');

// ==========================================
// Fitur: Ambil Semua Data Teknisi
// ==========================================
exports.getAll = async (req, res) => {
  try {
    const teknisiList = await teknisi.findAll({
      include: [
        { model: karyawan, as: 'nik_karyawan' },
        { model: kategori, as: 'id_kategori_kategori' }
      ],
      order: [['id_teknisi', 'ASC']]
    });

    const formatted = teknisiList.map((tk) => ({
      id_teknisi: tk.id_teknisi,
      nama: tk.nik_karyawan?.nama || null,
      kategori_spesialis: tk.id_kategori_kategori?.nama_kategori || null,
      status: tk.status,
      jumlah_tiket_ditangani: tk.jumlah_tiket_ditangani
    }));

    return ok(res, formatted);
  } catch (err) {
    console.error('Error getAll teknisi (Sequelize):', err);
    return fail(res, 'Gagal mengambil data teknisi: ' + err.message, 500);
  }
};

// ==========================================
// Ambil Teknisi Berdasarkan Kategori
// ==========================================
exports.getByKategori = async (req, res) => {
  try {
    const { id_kategori } = req.params;

    const teknisiList = await teknisi.findAll({
      where: {
        id_kategori: parseInt(id_kategori),
        status: 'Aktif'
      },
      include: [
        { model: karyawan, as: 'nik_karyawan' }
      ],
      order: [['jumlah_tiket_ditangani', 'ASC']]
    });

    const formatted = teknisiList.map((tk) => ({
      id_teknisi: tk.id_teknisi,
      nama: tk.nik_karyawan?.nama || null,
      jumlah_tiket_ditangani: tk.jumlah_tiket_ditangani
    }));

    return ok(res, formatted);
  } catch (err) {
    console.error('Error getByKategori teknisi (Sequelize):', err);
    return fail(res, 'Gagal mengambil data teknisi berdasarkan kategori: ' + err.message, 500);
  }
};

// ==========================================
// Tambah Teknisi Baru (Auto Generate ID: TKN-0001)
// ==========================================
exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { nik, id_kategori } = req.body;
    if (!nik || !id_kategori) {
      await transaction.rollback();
      return fail(res, 'nik dan id_kategori wajib diisi', 400);
    }

    const lastTeknisi = await teknisi.findOne({
      order: [['id_teknisi', 'DESC']],
      transaction
    });

    let nextNumber = 1;
    if (lastTeknisi && lastTeknisi.id_teknisi) {
      const lastNumber = parseInt(lastTeknisi.id_teknisi.replace('TKN-', ''), 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    const id_teknisi = 'TKN-' + String(nextNumber).padStart(4, '0');

    await teknisi.create({
      id_teknisi,
      nik,
      id_kategori: parseInt(id_kategori),
      status: 'Aktif',
      jumlah_tiket_ditangani: 0
    }, { transaction });

    await user.update(
      { level: 'Teknisi' },
      { where: { nik }, transaction }
    );

    await transaction.commit();
    return created(res, { id_teknisi }, 'Teknisi berhasil ditambahkan');
  } catch (err) {
    await transaction.rollback();
    console.error('Error create teknisi (Sequelize):', err);
    return fail(res, 'Gagal menambah teknisi: ' + err.message, 500);
  }
};

// ==========================================
// Update Data / Status Teknisi
// ==========================================
exports.update = async (req, res) => {
  try {
    const { id_kategori, status } = req.body;
    const id_teknisi = req.params.id;

    await teknisi.update(
      {
        id_kategori: parseInt(id_kategori),
        status
      },
      { where: { id_teknisi } }
    );

    return ok(res, null, 'Teknisi berhasil diperbarui');
  } catch (err) {
    console.error('Error update teknisi (Sequelize):', err);
    return fail(res, 'Gagal memperbarui teknisi: ' + err.message, 500);
  }
};

// ==========================================
// Hapus Teknisi
// ==========================================
exports.remove = async (req, res) => {
  try {
    const id_teknisi = req.params.id;

    await teknisi.destroy({
      where: { id_teknisi }
    });

    return ok(res, null, 'Teknisi berhasil dihapus');
  } catch (err) {
    console.error('Gagal menghapus teknisi (Sequelize):', err);

    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return fail(res, 'Teknisi ini tidak bisa dihapus karena masih punya tiket yang di-assign ke dia (di tabel assignment_ticket). Assign ulang tiketnya ke teknisi lain dulu, atau hapus riwayat assignment-nya.', 400);
    }

    return fail(res, 'Gagal menghapus teknisi: ' + err.message, 500);
  }
};
