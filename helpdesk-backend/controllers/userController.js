const bcrypt = require('bcryptjs');
const { user, karyawan, departemen } = require('../models');
const { ok, created, fail } = require('../utils/response');

// ==========================================
// Ambil Semua Data User
// ==========================================
exports.getAll = async (req, res) => {
  try {
    const users = await user.findAll({
      include: [
        {
          model: karyawan,
          as: 'nik_karyawan',
          include: [
            {
              model: departemen,
              as: 'id_departemen_departemen'
            }
          ]
        }
      ],
      order: [['id_user', 'ASC']]
    });

    const formattedUsers = users.map((u) => {
      const k = u.nik_karyawan;
      return {
        id_user: u.id_user,
        username: u.username,
        level: u.level,
        status: u.status,
        nik: u.nik,
        nama: k?.nama || null,
        departemen: k?.id_departemen_departemen?.nama_departemen || null
      };
    });

    return ok(res, formattedUsers);
  } catch (err) {
    console.error('Error getAll users (Sequelize):', err);
    return fail(res, 'Gagal mengambil data user: ' + err.message, 500);
  }
};

// ==========================================
// Tambah User Baru
// ==========================================
exports.create = async (req, res) => {
  try {
    const { username, password, nik, level } = req.body;
    if (!username || !password || !nik || !level) {
      return fail(res, 'Semua field wajib diisi', 400);
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await user.create({
      username,
      password: hashed,
      nik,
      level,
      status: 'Aktif'
    });

    return created(res, { id_user: newUser.id_user }, 'User berhasil ditambahkan');
  } catch (err) {
    console.error('Error create user (Sequelize):', err);
    return fail(res, 'Gagal menambah user: ' + err.message, 500);
  }
};

// ==========================================
// Update Status / Level User
// ==========================================
exports.update = async (req, res) => {
  try {
    const { level, status } = req.body;
    const id_user = parseInt(req.params.id);

    await user.update(
      { level, status },
      { where: { id_user } }
    );

    return ok(res, null, 'User berhasil diperbarui');
  } catch (err) {
    console.error('Error update user (Sequelize):', err);
    return fail(res, 'Gagal memperbarui user: ' + err.message, 500);
  }
};

// ==========================================
// Hapus User
// ==========================================
exports.remove = async (req, res) => {
  try {
    const id_user = parseInt(req.params.id);

    await user.destroy({
      where: { id_user }
    });

    return ok(res, null, 'User berhasil dihapus');
  } catch (err) {
    console.error('Error remove user (Sequelize):', err);
    return fail(res, 'Gagal menghapus user: ' + err.message, 500);
  }
};
