const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { user, karyawan, departemen } = require('../models');
const { ok, fail } = require('../utils/response');
require('dotenv').config();

// ==========================================
// Fitur 1: Login (Admin, Teknisi, Users)
// ==========================================
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return fail(res, 'Username dan password wajib diisi', 400);
    }

    const userData = await user.findOne({
      where: { username },
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
      ]
    });

    if (!userData) {
      return fail(res, 'Username atau password salah', 401);
    }

    if (userData.status === 'Nonaktif') {
      return fail(res, 'Akun Anda nonaktif, hubungi admin', 403);
    }

    const match = await bcrypt.compare(password, userData.password);
    if (!match) {
      return fail(res, 'Username atau password salah', 401);
    }

    const token = jwt.sign(
      {
        id_user: userData.id_user,
        nik: userData.nik,
        username: userData.username,
        level: userData.level
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const k = userData.nik_karyawan;

    return ok(res, {
      token,
      user: {
        nik: k?.nik || userData.nik,
        nama: k?.nama || null,
        username: userData.username,
        level: userData.level,
        departemen: k?.id_departemen_departemen?.nama_departemen || null
      }
    }, 'Login berhasil');
  } catch (err) {
    console.error('Error login (Sequelize):', err);
    return fail(res, 'Gagal login: ' + err.message, 500);
  }
};

// ==========================================
// Ganti Password Akun Sendiri
// ==========================================
exports.changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const userId = parseInt(req.user.id_user);

    const userData = await user.findByPk(userId);

    if (!userData) {
      return fail(res, 'User tidak ditemukan', 404);
    }

    const match = await bcrypt.compare(old_password, userData.password);
    if (!match) {
      return fail(res, 'Password lama salah', 401);
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await user.update(
      { password: hashed },
      { where: { id_user: userId } }
    );

    return ok(res, null, 'Password berhasil diubah');
  } catch (err) {
    console.error('Error changePassword (Sequelize):', err);
    return fail(res, 'Gagal mengubah password: ' + err.message, 500);
  }
};
