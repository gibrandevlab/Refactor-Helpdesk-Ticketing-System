// chatController.js
const {
  ticket_chat,
  list_ticket,
  teknisi,
  karyawan,
  assignment_ticket
} = require('../models');
const { ok, created, fail } = require('../utils/response');

/**
 * Normalisasi level user dari token.
 * - Bisa datang dari req.user.level atau req.user.role
 * - Tidak sensitif huruf besar/kecil ("users", "User", "USERS" -> "Users")
 * - Selain Admin & Teknisi dianggap user biasa (tetap dibatasi: hanya pelapor tiket)
 */
function normalizeLevel(reqUser) {
  const raw = String(reqUser?.level || reqUser?.role || '').trim().toLowerCase();
  if (raw === 'admin') return 'Admin';
  if (raw === 'teknisi') return 'Teknisi';
  return 'Users';
}

/** Bandingkan NIK sebagai string yang sudah di-trim (aman untuk number vs string / CHAR padding) */
function sameNik(a, b) {
  const x = String(a ?? '').trim();
  const y = String(b ?? '').trim();
  return x !== '' && x === y;
}

async function getSenderInfo(reqUser, level) {
  const nik = String(reqUser?.nik ?? '').trim();
  const nama = reqUser?.nama;

  if (level === 'Admin') {
    return {
      nama: nama || 'Admin / IT Support',
      id_teknisi: null
    };
  }

  if (level === 'Teknisi') {
    const dataTeknisi = await teknisi.findOne({
      where: { nik },
      attributes: ['id_teknisi']
    });

    const dataKaryawan = await karyawan.findOne({
      where: { nik },
      attributes: ['nama']
    });

    return {
      nama: dataKaryawan?.nama || nama || 'Teknisi',
      id_teknisi: dataTeknisi?.id_teknisi || null
    };
  }

  const dataKaryawan = await karyawan.findOne({
    where: { nik },
    attributes: ['nama']
  });

  return {
    nama: dataKaryawan?.nama || nama || 'User',
    id_teknisi: null
  };
}

async function checkAccess(id_ticket, nik, level) {
  if (level === 'Admin') return true;

  if (level === 'Users') {
    const ticket = await list_ticket.findOne({
      where: { id_ticket },
      attributes: ['nik_pelapor']
    });

    if (!ticket) {
      console.warn(`[chat] Tiket ${id_ticket} tidak ditemukan`);
      return false;
    }

    const allowed = sameNik(ticket.nik_pelapor, nik);
    if (!allowed) {
      console.warn(
        `[chat] Akses ditolak: tiket=${id_ticket}, nik_login="${nik}", nik_pelapor="${ticket.nik_pelapor}"`
      );
    }
    return allowed;
  }

  if (level === 'Teknisi') {
    const dataTeknisi = await teknisi.findOne({
      where: { nik },
      attributes: ['id_teknisi']
    });

    if (!dataTeknisi) return false;

    const assignment = await assignment_ticket.findOne({
      where: {
        id_ticket,
        id_teknisi: dataTeknisi.id_teknisi
      }
    });

    return !!assignment;
  }

  return false;
}

exports.getChats = async (req, res) => {
  try {
    const { id_ticket } = req.params;
    const nik = String(req.user?.nik ?? '').trim();
    const level = normalizeLevel(req.user);

    const allowed = await checkAccess(id_ticket, nik, level);
    if (!allowed) {
      return fail(res, 'Anda tidak memiliki akses ke chat tiket ini', 403);
    }

    const chats = await ticket_chat.findAll({
      where: { id_ticket },
      order: [['created_at', 'ASC']]
    });

    return ok(res, chats);
  } catch (err) {
    console.error('Error getChats (Sequelize):', err?.parent?.message || err);
    return fail(res, 'Gagal mengambil chat: ' + err.message, 500);
  }
};

exports.sendChat = async (req, res) => {
  try {
    const { id_ticket } = req.params;
    const message = String(req.body?.message ?? '');
    const nik = String(req.user?.nik ?? '').trim();
    const level = normalizeLevel(req.user);

    const hasFile = !!req.file;
    if (!message.trim() && !hasFile) {
      return fail(res, 'Pesan atau foto wajib diisi', 400);
    }

    const allowed = await checkAccess(id_ticket, nik, level);
    if (!allowed) {
      return fail(res, 'Anda tidak berhak mengirim chat ke tiket ini', 403);
    }

    const info = await getSenderInfo(req.user, level);

    let senderId = nik;
    if (level === 'Teknisi' && info.id_teknisi) {
      senderId = String(info.id_teknisi);
    }

    const attachmentUrl = hasFile ? `/uploads/${req.file.filename}` : null;

    const newChat = await ticket_chat.create({
      id_ticket,
      sender_id: senderId.slice(0, 15),          // kolom STRING(15)
      sender_role: level,                        // 'Admin' | 'Teknisi' | 'Users' (STRING(7))
      sender_name: String(info.nama || 'User').slice(0, 100), // kolom STRING(100)
      message: message.trim(),
      attachment_url: attachmentUrl,
      is_read: 0                                 // kolom SMALLINT, jangan pakai boolean
    });

    return created(res, newChat, 'Pesan berhasil dikirim');
  } catch (err) {
    console.error('Error sendChat (Sequelize):', err?.parent?.message || err);
    return fail(res, 'Gagal mengirim chat: ' + err.message, 500);
  }
};
