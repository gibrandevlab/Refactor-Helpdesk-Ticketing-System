const {
  inventory,
  departemen,
  kategori,
  karyawan,
  asset_holder_history,
  asset_department_history,
  asset_hardware,
  asset_hardware_detail,
  asset_software,
  asset_software_detail,
  list_ticket,
  sub_kategori,
  assignment_ticket,
  teknisi,
  sequelize
} = require('../models');
const { ok, created, fail } = require('../utils/response');
const { Op } = require('sequelize');

// ==========================================
// ADMIN: Ambil Semua Asset Inventory
// ==========================================
exports.getAll = async (req, res) => {
  try {
    const list = await inventory.findAll({
      include: [
        { model: departemen, as: 'id_departemen_departemen' },
        { model: kategori, as: 'id_kategori_kategori' },
        { model: karyawan, as: 'nik_pemegang_karyawan' }
      ],
      order: [['kode_asset', 'ASC']]
    });

    const rows = list.map((inv) => ({
      kode_asset: inv.kode_asset,
      nama_barang: inv.nama_barang,
      merk_model: inv.merk_model,
      computer_name: inv.computer_name,
      it_priority: inv.it_priority,
      tahun_perolehan: inv.tahun_perolehan,
      user_pemakai: inv.user_pemakai,
      email: inv.email,
      extension: inv.extension,
      divisi: inv.divisi,
      gedung: inv.gedung,
      ip_address: inv.ip_address,
      status_aset: inv.status_aset,
      dept: inv.id_departemen_departemen?.nama_departemen || null,
      kategori: inv.id_kategori_kategori?.nama_kategori || null,
      pemegang: inv.nik_pemegang_karyawan?.nama || null
    }));

    return ok(res, rows);
  } catch (err) {
    console.error('Error getAll inventory (Sequelize):', err);
    return fail(res, 'Gagal mengambil data inventory: ' + err.message, 500);
  }
};

// ==========================================
// STATISTIK: Jumlah Asset per Departemen
// ==========================================
exports.getStats = async (req, res) => {
  try {
    const jenis = (req.query.jenis || '').trim();

    const where = {};
    if (jenis) {
      where.nama_barang = { [Op.like]: `%${jenis}%` };
    }

    const stats = await inventory.findAll({
      attributes: [
        'id_departemen',
        [sequelize.fn('COUNT', sequelize.col('kode_asset')), 'jumlah']
      ],
      where,
      group: ['id_departemen'],
      raw: true
    });

    const deptIds = stats.map((s) => s.id_departemen).filter(Boolean);
    const depts = await departemen.findAll({
      where: { id_departemen: { [Op.in]: deptIds } }
    });

    const deptMap = {};
    depts.forEach((d) => {
      deptMap[d.id_departemen] = d.nama_departemen;
    });

    const rows = stats
      .map((s) => ({
        departemen: deptMap[s.id_departemen] || 'Lainnya',
        jumlah: parseInt(s.jumlah, 10) || 0
      }))
      .sort((a, b) => b.jumlah - a.jumlah);

    return ok(res, rows);
  } catch (err) {
    console.error('Error getStats inventory (Sequelize):', err);
    return fail(res, 'Gagal mengambil statistik inventory: ' + err.message, 500);
  }
};

// ==========================================
// OPSI FILTER: Opsi Jenis Barang Unik
// ==========================================
exports.getJenisOptions = async (req, res) => {
  try {
    const items = await inventory.findAll({
      where: {
        nama_barang: { [Op.ne]: null }
      },
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('nama_barang')), 'nama_barang']
      ],
      raw: true
    });

    const trimmedList = Array.from(
      new Set(
        items
          .map((i) => (i.nama_barang ? i.nama_barang.trim() : ''))
          .filter(Boolean)
      )
    ).sort();

    return ok(res, trimmedList);
  } catch (err) {
    console.error('Error getJenisOptions (Sequelize):', err);
    return fail(res, 'Gagal mengambil jenis asset: ' + err.message, 500);
  }
};

// ==========================================
// USER: Asset yang Dipegang Sendiri
// ==========================================
exports.getMyAssets = async (req, res) => {
  try {
    const items = await inventory.findAll({
      where: { nik_pemegang: req.user.nik },
      include: [
        { model: kategori, as: 'id_kategori_kategori' }
      ],
      order: [['kode_asset', 'ASC']]
    });

    const rows = items.map((inv) => ({
      kode_asset: inv.kode_asset,
      nama_barang: inv.nama_barang,
      merk_model: inv.merk_model,
      kategori: inv.id_kategori_kategori?.nama_kategori || null,
      status_aset: inv.status_aset
    }));

    return ok(res, rows);
  } catch (err) {
    console.error('Error getMyAssets (Sequelize):', err);
    return fail(res, 'Gagal mengambil aset saya: ' + err.message, 500);
  }
};

// ==========================================
// INPUT ASSET (Input baru + Record Riwayat Awal)
// ==========================================
exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      nama_barang, merk_model, id_departemen, id_kategori,
      computer_name, it_priority, tahun_perolehan, user_pemakai,
      email, extension, divisi, gedung, ip_address, status_aset,
    } = req.body;

    if (!nama_barang || !id_departemen || !id_kategori) {
      await transaction.rollback();
      return fail(res, 'nama_barang, id_departemen, id_kategori wajib diisi', 400);
    }

    const kodeAsset = 'AST-' + Date.now().toString().slice(-8);
    const nikPemegang = req.user.level === 'Admin' ? (req.body.nik_pemegang || null) : req.user.nik;
    const parsedDept = parseInt(id_departemen);
    const parsedKat = parseInt(id_kategori);

    await inventory.create({
      kode_asset: kodeAsset,
      nama_barang,
      merk_model: merk_model || null,
      id_departemen: parsedDept,
      id_kategori: parsedKat,
      nik_pemegang: nikPemegang,
      status_aset: status_aset || 'Aktif',
      computer_name: computer_name || null,
      it_priority: it_priority || null,
      tahun_perolehan: tahun_perolehan ? parseInt(tahun_perolehan) : null,
      user_pemakai: user_pemakai || null,
      email: email || null,
      extension: extension || null,
      divisi: divisi || null,
      gedung: gedung || null,
      ip_address: ip_address || null
    }, { transaction });

    if (nikPemegang) {
      const baru = await karyawan.findOne({
        where: { nik: nikPemegang },
        attributes: ['nama'],
        transaction
      });
      await asset_holder_history.create({
        kode_asset: kodeAsset,
        nik_lama: null,
        nama_lama: null,
        nik_baru: nikPemegang,
        nama_baru: baru?.nama || null,
        keterangan: 'Pemegang awal saat asset didaftarkan'
      }, { transaction });
    }

    if (parsedDept) {
      const deptAwal = await departemen.findOne({
        where: { id_departemen: parsedDept },
        attributes: ['nama_departemen'],
        transaction
      });
      await asset_department_history.create({
        kode_asset: kodeAsset,
        id_departemen_lama: null,
        nama_departemen_lama: null,
        id_departemen_baru: parsedDept,
        nama_departemen_baru: deptAwal?.nama_departemen || null,
        keterangan: 'Departemen awal saat asset didaftarkan'
      }, { transaction });
    }

    await transaction.commit();
    return created(res, { kode_asset: kodeAsset }, 'Aset berhasil didaftarkan');
  } catch (err) {
    await transaction.rollback();
    console.error('Error create inventory (Sequelize):', err);
    return fail(res, 'Gagal menambah aset: ' + err.message, 500);
  }
};

// ==========================================
// UPDATE ASSET (Pembaruan Data + Tracking Mutasi Pemegang & Dept)
// ==========================================
exports.update = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { kode } = req.params;
    const {
      nama_barang, merk_model, id_departemen, id_kategori, nik_pemegang,
      computer_name, it_priority, tahun_perolehan, user_pemakai,
      email, extension, divisi, gedung, ip_address, status_aset,
      keterangan_pindah, keterangan_pindah_departemen,
    } = req.body;

    const current = await inventory.findOne({
      where: { kode_asset: kode },
      attributes: ['nik_pemegang', 'id_departemen'],
      transaction
    });

    if (!current) {
      await transaction.rollback();
      return fail(res, 'Asset tidak ditemukan', 404);
    }

    const nikLama = current.nik_pemegang;
    const nikBaru = nik_pemegang || null;

    const idDeptLama = current.id_departemen;
    const idDeptBaru = id_departemen ? parseInt(id_departemen) : null;

    await inventory.update({
      nama_barang,
      merk_model: merk_model || null,
      id_departemen: idDeptBaru,
      id_kategori: id_kategori ? parseInt(id_kategori) : undefined,
      nik_pemegang: nikBaru,
      computer_name: computer_name || null,
      it_priority: it_priority || null,
      tahun_perolehan: tahun_perolehan ? parseInt(tahun_perolehan) : null,
      user_pemakai: user_pemakai || null,
      email: email || null,
      extension: extension || null,
      divisi: divisi || null,
      gedung: gedung || null,
      ip_address: ip_address || null,
      status_aset: status_aset || 'Aktif'
    }, { where: { kode_asset: kode }, transaction });

    if (nikLama !== nikBaru) {
      const lama = nikLama ? await karyawan.findOne({ where: { nik: nikLama }, attributes: ['nama'], transaction }) : null;
      const baru = nikBaru ? await karyawan.findOne({ where: { nik: nikBaru }, attributes: ['nama'], transaction }) : null;

      await asset_holder_history.create({
        kode_asset: kode,
        nik_lama: nikLama || null,
        nama_lama: lama?.nama || null,
        nik_baru: nikBaru,
        nama_baru: baru?.nama || null,
        keterangan: keterangan_pindah || null
      }, { transaction });
    }

    if (Number(idDeptLama) !== Number(idDeptBaru)) {
      const deptLama = idDeptLama ? await departemen.findOne({ where: { id_departemen: idDeptLama }, attributes: ['nama_departemen'], transaction }) : null;
      const deptBaru = idDeptBaru ? await departemen.findOne({ where: { id_departemen: idDeptBaru }, attributes: ['nama_departemen'], transaction }) : null;

      await asset_department_history.create({
        kode_asset: kode,
        id_departemen_lama: idDeptLama || null,
        nama_departemen_lama: deptLama?.nama_departemen || null,
        id_departemen_baru: idDeptBaru || null,
        nama_departemen_baru: deptBaru?.nama_departemen || null,
        keterangan: keterangan_pindah_departemen || null
      }, { transaction });
    }

    await transaction.commit();
    return ok(res, null, 'Aset berhasil diperbarui');
  } catch (err) {
    await transaction.rollback();
    console.error('Error update inventory (Sequelize):', err);
    return fail(res, 'Gagal memperbarui aset: ' + err.message, 500);
  }
};

// ==========================================
// HAPUS ASSET
// ==========================================
exports.remove = async (req, res) => {
  try {
    await inventory.destroy({
      where: { kode_asset: req.params.kode }
    });
    return ok(res, null, 'Aset berhasil dihapus');
  } catch (err) {
    console.error('Error remove inventory (Sequelize):', err);
    return fail(res, 'Gagal menghapus aset: ' + err.message, 500);
  }
};

// ==========================================
// DETAIL ASSET
// ==========================================
exports.getDetail = async (req, res) => {
  try {
    const { kode } = req.params;

    const inv = await inventory.findOne({
      where: { kode_asset: kode },
      include: [
        { model: departemen, as: 'id_departemen_departemen' },
        { model: kategori, as: 'id_kategori_kategori' },
        { model: karyawan, as: 'nik_pemegang_karyawan' }
      ]
    });

    if (!inv) {
      return fail(res, 'Asset tidak ditemukan', 404);
    }

    const profile = {
      kode_asset: inv.kode_asset,
      nama_barang: inv.nama_barang,
      merk_model: inv.merk_model,
      computer_name: inv.computer_name,
      it_priority: inv.it_priority,
      tahun_perolehan: inv.tahun_perolehan,
      user_pemakai: inv.user_pemakai,
      email: inv.email,
      extension: inv.extension,
      divisi: inv.divisi,
      gedung: inv.gedung,
      ip_address: inv.ip_address,
      status_aset: inv.status_aset,
      id_departemen: inv.id_departemen,
      id_kategori: inv.id_kategori,
      nik_pemegang: inv.nik_pemegang,
      dept: inv.id_departemen_departemen?.nama_departemen || null,
      kategori: inv.id_kategori_kategori?.nama_kategori || null,
      pemegang: inv.nik_pemegang_karyawan?.nama || null
    };

    const hardware = await asset_hardware.findAll({
      where: { kode_asset: kode },
      order: [['id', 'DESC']]
    });

    const hwDetailRow = await asset_hardware_detail.findOne({
      where: { kode_asset: kode }
    });
    const hardwareDetail = hwDetailRow || {
      serial_no_pc: '', mobo_type: '', kelas: '', processor: '',
      hdd_size: '', hdd_model: '', hdd_serial_no: '',
      memory_size: '', memory_type: '', display: '',
    };

    const software = await asset_software.findAll({
      where: { kode_asset: kode },
      order: [['id', 'DESC']]
    });

    const swDetailRow = await asset_software_detail.findOne({
      where: { kode_asset: kode }
    });
    const softwareDetail = swDetailRow || {
      operating_system: '', serial_no_os: '', ms_office: '', ms_office_sn: '',
      erp: 'TIDAK', wms: 'TIDAK', eris: 'TIDAK', cmms: 'TIDAK',
      visio: 'TIDAK', autocad: 'TIDAK', kaspersky: 'TIDAK',
      ms_project: 'TIDAK', acrobat: 'TIDAK',
    };

    // PERBAIKAN PADA QUERY RAW TICKETS
    const rawTickets = await list_ticket.findAll({
      where: { kode_asset: kode },
      order: [['tanggal_lapor', 'DESC']],
      include: [
        { model: karyawan, as: 'nik_pelapor_karyawan', required: false },
        { model: kategori, as: 'id_kategori_kategori', required: false },
        { model: sub_kategori, as: 'id_sub_kategori_sub_kategori', required: false },
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
      ]
    });

    const history = rawTickets.map((lt) => {
      const asg = lt.assignment_ticket;
      const tk = asg?.id_teknisi_teknisi;
      return {
        id_ticket: lt.id_ticket,
        tanggal: lt.tanggal_lapor,
        deskripsi: lt.deskripsi,
        status: lt.status,
        prioritas: lt.prioritas,
        kategori: lt.id_kategori_kategori?.nama_kategori || null,
        sub_kategori: lt.id_sub_kategori_sub_kategori?.nama_sub_kategori || null,
        pelapor: lt.nik_pelapor_karyawan?.nama || null,
        teknisi: tk?.nik_karyawan?.nama || null
      };
    });

    const pemegangHistoryAsc = await asset_holder_history.findAll({
      where: { kode_asset: kode },
      order: [['tanggal_pindah', 'ASC']]
    });

    const periods = pemegangHistoryAsc.map((row, idx) => ({
      nik: row.nik_baru,
      nama: row.nama_baru,
      mulai: row.tanggal_pindah,
      selesai: idx + 1 < pemegangHistoryAsc.length ? pemegangHistoryAsc[idx + 1].tanggal_pindah : null,
    }));

    const historyByHolder = periods.map((p) => {
      const tickets = history.filter((h) => {
        const t = new Date(h.tanggal).getTime();
        const mulai = new Date(p.mulai).getTime();
        const selesai = p.selesai ? new Date(p.selesai).getTime() : Infinity;
        return t >= mulai && t < selesai;
      });
      return {
        nik_pemegang: p.nik,
        nama_pemegang: p.nama || 'Tidak ada pemegang',
        periode_mulai: p.mulai,
        periode_selesai: p.selesai,
        tickets,
      };
    });

    const earliestStart = periods.length > 0 ? new Date(periods[0].mulai).getTime() : Infinity;
    const untrackedTickets = history.filter((h) => new Date(h.tanggal).getTime() < earliestStart);
    if (untrackedTickets.length > 0) {
      historyByHolder.push({
        nik_pemegang: null,
        nama_pemegang: 'Sebelum tercatat (data lama)',
        periode_mulai: null,
        periode_selesai: periods.length > 0 ? periods[0].mulai : null,
        tickets: untrackedTickets,
      });
    }

    historyByHolder.sort((a, b) => {
      const aTime = a.periode_mulai ? new Date(a.periode_mulai).getTime() : -Infinity;
      const bTime = b.periode_mulai ? new Date(b.periode_mulai).getTime() : -Infinity;
      return bTime - aTime;
    });

    const pemegangHistory = await asset_holder_history.findAll({
      where: { kode_asset: kode },
      order: [['tanggal_pindah', 'DESC']]
    });

    const departmentHistory = await asset_department_history.findAll({
      where: { kode_asset: kode },
      order: [['tanggal_pindah', 'DESC']]
    });

    return ok(res, {
      profile,
      hardware,
      hardwareDetail,
      software,
      softwareDetail,
      history,
      historyByHolder,
      pemegangHistory,
      departmentHistory,
    });
  } catch (err) {
    console.error('Error getDetail inventory (Sequelize):', err);
    return fail(res, 'Gagal mengambil detail aset: ' + err.message, 500);
  }
};

// =========================================================
// HARDWARE CRUD (Key-Value)
// =========================================================
exports.addHardware = async (req, res) => {
  try {
    const { kode } = req.params;
    const { komponen, spesifikasi, keterangan } = req.body;
    if (!komponen) return fail(res, 'komponen wajib diisi', 400);

    const result = await asset_hardware.create({
      kode_asset: kode,
      komponen,
      spesifikasi: spesifikasi || null,
      keterangan: keterangan || null
    });

    return created(res, { id: result.id }, 'Hardware berhasil ditambahkan');
  } catch (err) {
    console.error('Error addHardware (Sequelize):', err);
    return fail(res, 'Gagal menambah hardware: ' + err.message, 500);
  }
};

exports.updateHardware = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { komponen, spesifikasi, keterangan } = req.body;

    await asset_hardware.update(
      {
        komponen,
        spesifikasi: spesifikasi || null,
        keterangan: keterangan || null
      },
      { where: { id } }
    );

    return ok(res, null, 'Hardware berhasil diperbarui');
  } catch (err) {
    console.error('Error updateHardware (Sequelize):', err);
    return fail(res, 'Gagal memperbarui hardware: ' + err.message, 500);
  }
};

exports.deleteHardware = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await asset_hardware.destroy({ where: { id } });

    return ok(res, null, 'Hardware berhasil dihapus');
  } catch (err) {
    console.error('Error deleteHardware (Sequelize):', err);
    return fail(res, 'Gagal menghapus hardware: ' + err.message, 500);
  }
};

// =========================================================
// HARDWARE DETAIL (Fixed Fields - 1 Baris per Asset)
// =========================================================
exports.saveHardwareDetail = async (req, res) => {
  try {
    const { kode } = req.params;
    const {
      serial_no_pc, mobo_type, kelas, processor,
      hdd_size, hdd_model, hdd_serial_no,
      memory_size, memory_type, display,
    } = req.body;

    const [record, createdFlag] = await asset_hardware_detail.upsert({
      kode_asset: kode,
      serial_no_pc: serial_no_pc || null,
      mobo_type: mobo_type || null,
      kelas: kelas || null,
      processor: processor || null,
      hdd_size: hdd_size || null,
      hdd_model: hdd_model || null,
      hdd_serial_no: hdd_serial_no || null,
      memory_size: memory_size || null,
      memory_type: memory_type || null,
      display: display || null,
    });

    return ok(res, null, 'Detail hardware berhasil disimpan');
  } catch (err) {
    console.error('Error saveHardwareDetail (Sequelize):', err);
    return fail(res, 'Gagal menyimpan detail hardware: ' + err.message, 500);
  }
};

// =========================================================
// SOFTWARE CRUD (Key-Value)
// =========================================================
exports.addSoftware = async (req, res) => {
  try {
    const { kode } = req.params;
    const { nama_software, versi, lisensi, tanggal_install, keterangan } = req.body;
    if (!nama_software) return fail(res, 'nama_software wajib diisi', 400);

    const result = await asset_software.create({
      kode_asset: kode,
      nama_software,
      versi: versi || null,
      lisensi: lisensi || null,
      tanggal_install: tanggal_install ? new Date(tanggal_install) : null,
      keterangan: keterangan || null
    });

    return created(res, { id: result.id }, 'Software berhasil ditambahkan');
  } catch (err) {
    console.error('Error addSoftware (Sequelize):', err);
    return fail(res, 'Gagal menambah software: ' + err.message, 500);
  }
};

exports.updateSoftware = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nama_software, versi, lisensi, tanggal_install, keterangan } = req.body;

    await asset_software.update(
      {
        nama_software,
        versi: versi || null,
        lisensi: lisensi || null,
        tanggal_install: tanggal_install ? new Date(tanggal_install) : null,
        keterangan: keterangan || null
      },
      { where: { id } }
    );

    return ok(res, null, 'Software berhasil diperbarui');
  } catch (err) {
    console.error('Error updateSoftware (Sequelize):', err);
    return fail(res, 'Gagal memperbarui software: ' + err.message, 500);
  }
};

exports.deleteSoftware = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await asset_software.destroy({ where: { id } });

    return ok(res, null, 'Software berhasil dihapus');
  } catch (err) {
    console.error('Error deleteSoftware (Sequelize):', err);
    return fail(res, 'Gagal menghapus software: ' + err.message, 500);
  }
};

// =========================================================
// SOFTWARE DETAIL (Fixed Fields - 1 Baris per Asset)
// =========================================================
exports.saveSoftwareDetail = async (req, res) => {
  try {
    const { kode } = req.params;
    const {
      operating_system, serial_no_os, ms_office, ms_office_sn,
      erp, wms, eris, cmms, visio, autocad, kaspersky, ms_project, acrobat,
    } = req.body;

    await asset_software_detail.upsert({
      kode_asset: kode,
      operating_system: operating_system || null,
      serial_no_os: serial_no_os || null,
      ms_office: ms_office || null,
      ms_office_sn: ms_office_sn || null,
      erp: erp || 'TIDAK',
      wms: wms || 'TIDAK',
      eris: eris || 'TIDAK',
      cmms: cmms || 'TIDAK',
      visio: visio || 'TIDAK',
      autocad: autocad || 'TIDAK',
      kaspersky: kaspersky || 'TIDAK',
      ms_project: ms_project || 'TIDAK',
      acrobat: acrobat || 'TIDAK'
    });

    return ok(res, null, 'Detail software berhasil disimpan');
  } catch (err) {
    console.error('Error saveSoftwareDetail (Sequelize):', err);
    return fail(res, 'Gagal menyimpan detail software: ' + err.message, 500);
  }
};
