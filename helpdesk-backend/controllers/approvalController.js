const pool = require('../config/db');
const { ok, fail } = require('../utils/response');

// ==========================================
// ADMIN: Ambil Daftar Tiket Menunggu Approval
// ==========================================
exports.getApprovalList = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT
        at.id_approval, lt.id_ticket, k.nama AS reported,
        d.nama_departemen AS departemen, ka.nama_kategori AS kategori,
        sk.nama_sub_kategori AS sub_kategori, lt.deskripsi, lt.lampiran,
        lt.tanggal_lapor AS tanggal, at.status_approval AS status,
        at.catatan_approval, at.tanggal_approval
      FROM approval_ticket at
      JOIN list_ticket lt ON lt.id_ticket = at.id_ticket
      JOIN karyawan k ON k.nik = lt.nik_pelapor
      JOIN departemen d ON d.id_departemen = lt.id_departemen
      JOIN kategori ka ON ka.id_kategori = lt.id_kategori
      LEFT JOIN sub_kategori sk ON sk.id_sub_kategori = lt.id_sub_kategori
    `;
    const params = [];
    if (status) {
      sql += ' WHERE at.status_approval = ?';
      params.push(status);
    } else {
      sql += " WHERE at.status_approval = 'Menunggu Approval'";
    }
    sql += ' ORDER BY lt.tanggal_lapor ASC';

    const [rows] = await pool.query(sql, params);
    return ok(res, rows);
  } catch (err) {
    return fail(res, 'Gagal mengambil daftar approval: ' + err.message, 500);
  }
};

// ==========================================
// ADMIN: Proses Approval (Approve / Reject)
// ==========================================
exports.processApproval = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id_ticket } = req.params;
    const { keputusan, catatan } = req.body; // 'Approve' | 'Reject'

    if (!['Approve', 'Reject'].includes(keputusan)) {
      return fail(res, "Keputusan tidak valid. Pilih 'Approve' atau 'Reject'.", 400);
    }

    const [existing] = await conn.query('SELECT status_approval FROM approval_ticket WHERE id_ticket = ?', [id_ticket]);
    if (existing.length === 0) {
      return fail(res, 'Data approval tiket tidak ditemukan.', 404);
    }
    if (existing[0].status_approval !== 'Menunggu Approval') {
      return fail(res, `Tiket ini sudah diproses sebelumnya (${existing[0].status_approval}).`, 400);
    }

    await conn.beginTransaction();

    await conn.query(
      `UPDATE approval_ticket
       SET status_approval = ?, nik_admin = ?, tanggal_approval = NOW(), catatan_approval = ?
       WHERE id_ticket = ?`,
      [keputusan, req.user.nik, catatan || null, id_ticket]
    );

    const statusTicketBaru = keputusan === 'Approve' ? 'Menunggu Assignment' : 'Reject';
    await conn.query('UPDATE list_ticket SET status = ? WHERE id_ticket = ?', [statusTicketBaru, id_ticket]);

    await conn.commit();
    return ok(
      res,
      { id_ticket, status_approval: keputusan, status_ticket: statusTicketBaru },
      `Tiket berhasil di-${keputusan.toLowerCase()}.`
    );
  } catch (err) {
    await conn.rollback();
    return fail(res, 'Gagal memproses approval: ' + err.message, 500);
  } finally {
    conn.release();
  }
};

// ==========================================
// ADMIN / PEJABAT: Riwayat Approval
// ==========================================
exports.getRiwayatApproval = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT at.*, lt.deskripsi, k.nama AS reported
      FROM approval_ticket at
      JOIN list_ticket lt ON lt.id_ticket = at.id_ticket
      JOIN karyawan k ON k.nik = lt.nik_pelapor
      WHERE at.status_approval != 'Menunggu Approval'
      ORDER BY at.tanggal_approval DESC
    `);
    return ok(res, rows);
  } catch (err) {
    return fail(res, 'Gagal mengambil riwayat approval.', 500);
  }
};
