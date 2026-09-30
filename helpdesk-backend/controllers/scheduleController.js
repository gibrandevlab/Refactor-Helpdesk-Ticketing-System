const {
  preventive_schedule,
  schedule_asset,
  schedule_asset_claim,
  departemen,
  kategori,
  sub_kategori,
  inventory,
  user,
  teknisi,
  karyawan,
  checklist_template,
  maintenance_asset_type,
  maintenance_checklist_unit,
  maintenance_checklist_item,
  list_ticket,
  assignment_ticket,
  ticket_checklist_result,
  ticket_progress_log,
  checklist_approval,
  sequelize
} = require('../models');
const { Op } = require('sequelize');

// ============================================================
// HELPER FORMAT DATE UNTUK SQL SERVER
// ============================================================

// Khusus Kolom Tipe 'date' (YYYY-MM-DD) -> tanggal_mulai, tanggal_selesai, next_maintenance
function formatDateOnly(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (trimmed.includes('T')) return trimmed.split('T')[0];
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Khusus Kolom Tipe 'datetime' / 'datetime2' (YYYY-MM-DD HH:mm:ss) -> created_at, updated_at, tanggal_lapor
function formatDateTime(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function checklistForAsset(kodeAsset, transaction) {
  const asset = await inventory.findOne({ where: { kode_asset: kodeAsset }, include: [{ model: maintenance_asset_type, as: 'maintenance_asset_type', required: false }], transaction });
  if (!asset) throw new Error(`Aset ${kodeAsset} tidak ditemukan`);
  if (!asset.id_asset_type || !asset.maintenance_asset_type) throw new Error(`Aset ${kodeAsset} belum memiliki jenis aset maintenance. Lengkapi pemetaan aset terlebih dahulu.`);
  if (!asset.maintenance_asset_type.is_active) throw new Error(`Jenis aset maintenance ${asset.maintenance_asset_type.nama_jenis} untuk ${kodeAsset} sedang nonaktif.`);
  const items = await maintenance_checklist_item.findAll({ where: { id_asset_type: asset.id_asset_type, is_active: true }, include: [{ model: maintenance_checklist_unit, as: 'maintenance_checklist_unit', required: true, where: { is_active: true } }], order: [[{ model: maintenance_checklist_unit, as: 'maintenance_checklist_unit' }, 'urutan', 'ASC'], ['urutan', 'ASC'], ['id_maintenance_item', 'ASC']], transaction });
  if (!items.length) throw new Error(`Jenis aset ${asset.maintenance_asset_type.nama_jenis} belum memiliki checklist aktif.`);
  return { asset, type: asset.maintenance_asset_type, items };
}

function snapshotRows(idTicket, checklist) {
  return checklist.items.map(item => ({
    id_ticket: idTicket,
    // id_item tetap wajib untuk skema lama; nilainya adalah ID master baru dan
    // detail tampilan selalu memakai snapshot, bukan lookup template lama.
    id_item: item.id_maintenance_item,
    snapshot_uraian: item.uraian_pemeriksaan,
    snapshot_alat_metode: item.alat_metode,
    snapshot_kriteria_hasil: item.kriteria_hasil,
    snapshot_urutan: item.urutan,
    id_asset_type_snapshot: checklist.type.id_asset_type,
    nama_jenis_snapshot: checklist.type.nama_jenis,
    id_checklist_unit_snapshot: item.id_checklist_unit,
    nama_unit_snapshot: item.maintenance_checklist_unit.nama_unit,
    urutan_unit_snapshot: item.maintenance_checklist_unit.urutan
  }));
}

async function validateAssetsForChecklist(kodeAssets) {
  const errors = [];
  for (const kode of kodeAssets || []) {
    try { await checklistForAsset(kode); } catch (error) { errors.push(error.message); }
  }
  if (errors.length) throw new Error(`Tiket preventive tidak dibuat. ${errors.join(' ')}`);
}

// ============================================================
// AUTO-CREATE TICKET (UNTUK SATU SCHEDULE)
// ============================================================
async function autoCreateTicketsForSchedule(scheduleId) {
  try {
    const numericScheduleId = parseInt(scheduleId);
    console.log(`🚀 Auto-create tiket untuk schedule ID: ${numericScheduleId}`);

    const schedule = await preventive_schedule.findByPk(numericScheduleId);

    if (!schedule) {
      console.log(`❌ Schedule ${numericScheduleId} tidak ditemukan`);
      return;
    }

    const assets = await schedule_asset.findAll({
      where: { id_schedule: numericScheduleId }
    });

    if (assets.length === 0) {
      console.log(`⚠️ Schedule ${numericScheduleId} tidak memiliki aset`);
      return;
    }

    let teknisList = [];
    if (schedule.id_teknis) {
      const rawTeknis = schedule.id_teknis;
      try {
        const parsed = JSON.parse(rawTeknis);
        teknisList = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        teknisList = String(rawTeknis).split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    if (teknisList.length === 0) {
      console.log(`⚠️ Schedule ${numericScheduleId} tidak memiliki teknisi`);
      return;
    }

    const adminUser = await user.findOne({
      where: { level: { [Op.in]: ['Admin', 'IT Service', 'admin'] } }
    }) || await user.findOne();
    const adminNik = adminUser?.nik || 'ADMIN';

    const teknisiIds = [];
    for (const item of teknisList) {
      let idTeknisi = null;

      const byId = await teknisi.findOne({
        where: { id_teknisi: item }
      });
      if (byId) idTeknisi = byId.id_teknisi;

      if (!idTeknisi) {
        const byNama = await teknisi.findOne({
          include: [{ model: karyawan, as: 'nik_karyawan', where: { nama: item } }]
        });
        if (byNama) idTeknisi = byNama.id_teknisi;
      }

      if (!idTeknisi) {
        const byNik = await teknisi.findOne({
          where: { nik: item }
        });
        if (byNik) idTeknisi = byNik.id_teknisi;
      }

      if (idTeknisi && !teknisiIds.includes(idTeknisi)) {
        teknisiIds.push(idTeknisi);
      }
    }

    if (teknisiIds.length === 0) {
      console.log(`⚠️ Tidak ada teknisi valid untuk schedule ${numericScheduleId}`);
      return;
    }

    let nextMaintenanceDate = formatDateOnly(schedule.tanggal_selesai);

    if (!nextMaintenanceDate) {
      const nextDate = new Date();
      const frekuensi = Number(schedule.frekuensi) || 1;
      const satuan = schedule.satuan || 'hari';
      if (satuan === 'hari') nextDate.setDate(nextDate.getDate() + frekuensi);
      else if (satuan === 'minggu') nextDate.setDate(nextDate.getDate() + (frekuensi * 7));
      else if (satuan === 'bulan') nextDate.setMonth(nextDate.getMonth() + frekuensi);
      else if (satuan === 'tahun') nextDate.setFullYear(nextDate.getFullYear() + frekuensi);
      nextMaintenanceDate = formatDateOnly(nextDate);
    }

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const assignedTeknisiId = teknisiIds[i % teknisiIds.length];

      const existing = await list_ticket.findOne({
        where: {
          id_schedule: numericScheduleId,
          kode_asset: asset.kode_asset
        }
      });

      if (existing) {
        const existingAsg = await assignment_ticket.findOne({
          where: { id_ticket: existing.id_ticket }
        });

        if (existingAsg) {
          if (existingAsg.status_pengerjaan === 'Menunggu Diproses' && existingAsg.id_teknisi !== assignedTeknisiId) {
            await assignment_ticket.update(
              { id_teknisi: assignedTeknisiId, tanggal_assign: sequelize.fn('getdate') },
              { where: { id_assignment: existingAsg.id_assignment } }
            );
            console.log(`🔄 Re-assign tiket ${existing.id_ticket} ke teknisi ${assignedTeknisiId}`);
          }
        }
        continue;
      }

      const idTicket = `T${Date.now()}${Math.floor(Math.random() * 1000)}`.substring(0, 20);

      const transaction = await sequelize.transaction();
      try {
        const checklist = await checklistForAsset(asset.kode_asset, transaction);
        await list_ticket.create({
          id_ticket: idTicket,
          nik_pelapor: checklist.asset.nik_pemegang || adminNik,
          id_departemen: schedule.id_departemen,
          id_kategori: schedule.id_kategori || null,
          id_sub_kategori: schedule.id_sub_kategori || null,
          kode_asset: asset.kode_asset,
          deskripsi: `[PREVENTIVE] ${schedule.nama_schedule}${schedule.deskripsi ? ' - ' + schedule.deskripsi : ''}`,
          lampiran: null,
          tanggal_lapor: sequelize.fn('getdate'),
          status: 'On Process',
          id_schedule: numericScheduleId
        }, { transaction });

        await assignment_ticket.create({
          id_ticket: idTicket,
          id_teknisi: assignedTeknisiId,
          tanggal_assign: sequelize.fn('getdate'),
          progress: 0,
          status_pengerjaan: 'Menunggu Diproses'
        }, { transaction });

        await ticket_checklist_result.bulkCreate(snapshotRows(idTicket, checklist), { transaction });

        const currentInv = await inventory.findOne({
          where: { kode_asset: asset.kode_asset },
          transaction
        });

        await inventory.update({
          id_preventive_schedule: currentInv?.id_preventive_schedule ?? numericScheduleId,
          next_maintenance: nextMaintenanceDate
        }, {
          where: { kode_asset: asset.kode_asset },
          transaction
        });

        await transaction.commit();
        console.log(`✅ Tiket ${idTicket} dibuat untuk aset ${asset.kode_asset} (Teknisi: ${assignedTeknisiId})`);
      } catch (txErr) {
        await transaction.rollback();
        console.error(`❌ Error pembuatan tiket untuk aset ${asset.kode_asset}:`, txErr);
      }
    }

    console.log(`🎯 Auto-create selesai untuk schedule ${numericScheduleId}`);
  } catch (error) {
    console.error(`❌ Gagal auto-create ticket untuk schedule ${scheduleId}:`, error);
  }
}

// ============================================================
// CREATE TICKET FOR SINGLE ASSET
// ============================================================
async function createTicketForSingleAsset(scheduleId, kodeAsset, idTeknisi) {
  const numericScheduleId = parseInt(scheduleId);
  const schedule = await preventive_schedule.findByPk(numericScheduleId);

  if (!schedule) throw new Error('Schedule tidak ditemukan');

  const existingTicket = await list_ticket.findOne({
    where: { id_schedule: numericScheduleId, kode_asset: kodeAsset }
  });

  if (existingTicket) {
    const existingAsg = await assignment_ticket.findOne({
      where: { id_ticket: existingTicket.id_ticket }
    });
    if (existingAsg) {
      if (existingAsg.status_pengerjaan === 'Menunggu Diproses') {
        await assignment_ticket.update(
          { id_teknisi: idTeknisi, status_pengerjaan: 'Proses', tanggal_assign: sequelize.fn('getdate') },
          { where: { id_assignment: existingAsg.id_assignment } }
        );
      }
      return existingTicket.id_ticket;
    }
  }

  const adminUser = await user.findOne({
    where: { level: { [Op.in]: ['Admin', 'IT Service', 'admin'] } }
  }) || await user.findOne();
  const adminNik = adminUser?.nik || 'ADMIN';

  const idTicket = `T${Date.now()}${Math.floor(Math.random() * 1000)}`.substring(0, 20);

  const transaction = await sequelize.transaction();
  try {
    const checklist = await checklistForAsset(kodeAsset, transaction);
    await list_ticket.create({
      id_ticket: idTicket,
      nik_pelapor: checklist.asset.nik_pemegang || adminNik,
      id_departemen: schedule.id_departemen,
      id_kategori: schedule.id_kategori || null,
      id_sub_kategori: schedule.id_sub_kategori || null,
      kode_asset: kodeAsset,
      deskripsi: `[PREVENTIVE] ${schedule.nama_schedule}${schedule.deskripsi ? ' - ' + schedule.deskripsi : ''}`,
      lampiran: null,
      tanggal_lapor: sequelize.fn('getdate'),
      status: 'On Process',
      id_schedule: numericScheduleId
    }, { transaction });

    await assignment_ticket.create({
      id_ticket: idTicket,
      id_teknisi: idTeknisi,
      tanggal_assign: sequelize.fn('getdate'),
      progress: 0,
      status_pengerjaan: 'Proses'
    }, { transaction });

    await ticket_checklist_result.bulkCreate(snapshotRows(idTicket, checklist), { transaction });

    const currentInv = await inventory.findOne({
      where: { kode_asset: kodeAsset },
      transaction
    });

    await inventory.update({
      id_preventive_schedule: currentInv?.id_preventive_schedule ?? numericScheduleId,
      next_maintenance: formatDateOnly(schedule.tanggal_selesai)
    }, {
      where: { kode_asset: kodeAsset },
      transaction
    });

    await transaction.commit();
    return idTicket;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ============================================================
// HELPER ATTACH STATUS
// ============================================================
function attachStatus(schedule) {
  const total = Number(schedule.total_aset) || 0;
  const started = Number(schedule.started_aset) || 0;
  const completed = Number(schedule.completed_aset) || 0;

  if (total > 0 && completed >= total) {
    schedule.status = (schedule.user_confirmed === 1 || schedule.user_confirmed === true)
      ? 'userapprove'
      : 'approve';
  } else if (total > 0 && started >= 1) {
    schedule.status = 'progress';
  } else {
    schedule.status = 'plan';
  }

  if (schedule.teknisi_klaim_raw) {
    const names = (typeof schedule.teknisi_klaim_raw === 'string'
      ? schedule.teknisi_klaim_raw.split(',')
      : schedule.teknisi_klaim_raw)
      .map(n => n.trim())
      .filter(Boolean);

    const counts = {};
    names.forEach(n => {
      counts[n] = (counts[n] || 0) + 1;
    });

    schedule.teknisi_klaim = Object.entries(counts)
      .map(([nama, jumlah]) => `${nama}:${jumlah}`)
      .join('||');
  } else {
    schedule.teknisi_klaim = null;
  }
  delete schedule.teknisi_klaim_raw;

  return schedule;
}

// ============================================================
// HELPER ENRICH SCHEDULES
// ============================================================
async function enrichSchedules(scheduleList) {
  if (!scheduleList || scheduleList.length === 0) return [];

  const allTeknisiIds = new Set();
  scheduleList.forEach(s => {
    if (s.id_teknis) {
      String(s.id_teknis).split(',').forEach(id => {
        const trimmed = id.trim();
        if (trimmed) allTeknisiIds.add(trimmed);
      });
    }
  });

  const teknisiMap = {};
  if (allTeknisiIds.size > 0) {
    const teknisiList = await teknisi.findAll({
      where: { id_teknisi: { [Op.in]: Array.from(allTeknisiIds) } },
      include: [{ model: karyawan, as: 'nik_karyawan' }]
    });
    teknisiList.forEach(t => {
      if (t.nik_karyawan?.nama) teknisiMap[t.id_teknisi] = t.nik_karyawan.nama;
    });
  }

  const scheduleIds = scheduleList.map(s => s.id_schedule);

  const inventoryList = await inventory.findAll({
    where: { id_preventive_schedule: { [Op.in]: scheduleIds } },
    attributes: ['id_preventive_schedule', 'last_maintenance', 'next_maintenance'],
    raw: true
  });

  const scheduleAssets = await schedule_asset.findAll({
    where: { id_schedule: { [Op.in]: scheduleIds } },
    raw: true
  });

  const claims = await schedule_asset_claim.findAll({
    where: { id_schedule: { [Op.in]: scheduleIds } },
    raw: true
  });

  const claimTeknisiIds = Array.from(new Set(claims.map(c => c.id_teknisi)));
  const claimTeknisiMap = {};
  if (claimTeknisiIds.length > 0) {
    const claimTeknisis = await teknisi.findAll({
      where: { id_teknisi: { [Op.in]: claimTeknisiIds } },
      include: [{ model: karyawan, as: 'nik_karyawan' }]
    });
    claimTeknisis.forEach(t => {
      if (t.nik_karyawan?.nama) claimTeknisiMap[t.id_teknisi] = t.nik_karyawan.nama;
    });
  }

  const tickets = await list_ticket.findAll({
    where: { id_schedule: { [Op.in]: scheduleIds } },
    include: [
      {
        model: assignment_ticket,
        as: 'assignment_ticket',
        include: [
          {
            model: ticket_progress_log,
            as: 'ticket_progress_logs',
            attributes: ['created_at']
          }
        ]
      }
    ]
  });

  return scheduleList.map(s => {
    const sId = s.id_schedule;

    let teknisi_list = null;
    if (s.id_teknis) {
      const names = String(s.id_teknis).split(',')
        .map(id => id.trim())
        .map(id => teknisiMap[id])
        .filter(Boolean);
      if (names.length > 0) teknisi_list = Array.from(new Set(names)).join(', ');
    }

    const sInvs = inventoryList.filter(i => i.id_preventive_schedule === sId);
    let last_maintenance = null;
    let next_maintenance = null;

    sInvs.forEach(i => {
      if (i.last_maintenance) {
        const formattedLast = formatDateOnly(i.last_maintenance);
        if (!last_maintenance || formattedLast > last_maintenance) {
          last_maintenance = formattedLast;
        }
      }
      if (i.next_maintenance) {
        const formattedNext = formatDateOnly(i.next_maintenance);
        if (!next_maintenance || formattedNext < next_maintenance) {
          next_maintenance = formattedNext;
        }
      }
    });

    const sAssets = scheduleAssets.filter(sa => sa.id_schedule === sId);
    const total_aset = sAssets.length;

    const sClaims = claims.filter(c => c.id_schedule === sId);
    const sTickets = tickets.filter(t => t.id_schedule === sId);

    const startedAssetSet = new Set([
      ...sClaims.map(c => c.kode_asset),
      ...sTickets.map(t => t.kode_asset)
    ]);
    const started_aset = startedAssetSet.size;
    const teknisi_klaim_raw = sClaims.map(c => claimTeknisiMap[c.id_teknisi]).filter(Boolean).join(',');

    const completedAssetSet = new Set();
    const confirmedAssetSet = new Set();
    let totalProgressSum = 0;
    let activeTicketCount = 0;
    let max_progress = 0;
    const progressDatesArr = [];

    sTickets.forEach(t => {
      const asg = t.assignment_ticket;
      if (asg) {
        if (asg.progress > max_progress) max_progress = asg.progress;

        if (asg.status_pengerjaan !== 'Selesai') {
          totalProgressSum += (asg.progress || 0);
          activeTicketCount++;
        }

        if (asg.progress === 100 || asg.status_pengerjaan === 'Selesai') {
          if (t.kode_asset) completedAssetSet.add(t.kode_asset);
        }

        if (asg.status_pengerjaan === 'Selesai' && asg.user_konfirmasi === 1) {
          if (t.kode_asset) confirmedAssetSet.add(t.kode_asset);
        }

        const logs = asg.ticket_progress_logs;
        if (logs) {
          logs.forEach(log => {
            if (log.created_at) {
              const dStr = formatDateOnly(log.created_at);
              if (dStr) progressDatesArr.push(dStr);
            }
          });
        }
      }
    });

    const completed_aset = completedAssetSet.size;
    const user_confirmed = (total_aset > 0 && confirmedAssetSet.size === total_aset) ? 1 : 0;
    const progress = activeTicketCount > 0 ? Math.round(totalProgressSum / activeTicketCount) : null;
    const progress_dates = progressDatesArr.length > 0 ? Array.from(new Set(progressDatesArr)).join(', ') : null;

    const rawObj = {
      id_schedule: s.id_schedule,
      nama_schedule: s.nama_schedule,
      frekuensi: s.frekuensi,
      satuan: s.satuan,
      tanggal_mulai: formatDateOnly(s.tanggal_mulai),
      tanggal_selesai: formatDateOnly(s.tanggal_selesai),
      deskripsi: s.deskripsi,
      is_active: s.is_active,
      created_at: formatDateTime(s.created_at),
      checklist_kategori: s.checklist_kategori,
      nama_kategori: s.id_kategori_kategori?.nama_kategori || null,
      nama_sub_kategori: s.id_sub_kategori_sub_kategori?.nama_sub_kategori || null,
      id_departemen: s.id_departemen,
      id_kategori: s.id_kategori,
      id_sub_kategori: s.id_sub_kategori,
      id_teknis: s.id_teknis,
      teknisi_list,
      last_maintenance,
      next_maintenance,
      progress,
      total_aset,
      teknisi_klaim_raw,
      started_aset,
      completed_aset,
      user_confirmed,
      progress_dates,
      max_progress
    };

    return attachStatus(rawObj);
  });
}

// ============================================================
// GET SEMUA DEPARTEMEN + SCHEDULES
// ============================================================
exports.getDepartmentsWithSchedules = async (req, res) => {
  try {
    const departments = await departemen.findAll({
      order: [['nama_departemen', 'ASC']]
    });

    const allSchedules = await preventive_schedule.findAll({
      include: [
        { model: kategori, as: 'id_kategori_kategori' },
        { model: sub_kategori, as: 'id_sub_kategori_sub_kategori' }
      ],
      order: [
        ['is_active', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    const enrichedSchedules = await enrichSchedules(allSchedules);

    const result = departments.map(dept => {
      const deptSchedules = enrichedSchedules.filter(s => s.id_departemen === dept.id_departemen);
      return {
        id_departemen: dept.id_departemen,
        nama_departemen: dept.nama_departemen,
        schedules: deptSchedules,
        total_aktif: deptSchedules.filter(s => s.is_active).length
      };
    });

    return res.json(result);
  } catch (error) {
    console.error('getDepartmentsWithSchedules error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal mengambil data' });
  }
};

// ============================================================
// GET SCHEDULES BY DEPARTMENT ID
// ============================================================
exports.getSchedulesByDepartment = async (req, res) => {
  try {
    const deptId = parseInt(req.params.deptId);

    const schedules = await preventive_schedule.findAll({
      where: { id_departemen: deptId },
      include: [
        { model: kategori, as: 'id_kategori_kategori' },
        { model: sub_kategori, as: 'id_sub_kategori_sub_kategori' }
      ],
      order: [
        ['is_active', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    const enriched = await enrichSchedules(schedules);
    return res.json(enriched);
  } catch (error) {
    console.error('getSchedulesByDepartment error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal mengambil schedule' });
  }
};

// ============================================================
// GET ASET BY SCHEDULE ID
// ============================================================
exports.getAssetsBySchedule = async (req, res) => {
  try {
    const idSchedule = parseInt(req.params.id);

    const scheduleAssets = await schedule_asset.findAll({
      where: { id_schedule: idSchedule },
      include: [
        {
          model: inventory,
          as: 'kode_asset_inventory',
          include: [
            { model: departemen, as: 'id_departemen_departemen' },
            { model: kategori, as: 'id_kategori_kategori' },
            { model: karyawan, as: 'nik_pemegang_karyawan' }
          ]
        },
        { model: preventive_schedule, as: 'id_schedule_preventive_schedule' }
      ]
    });

    const claims = await schedule_asset_claim.findAll({
      where: { id_schedule: idSchedule },
      raw: true
    });

    const claimTeknisiIds = Array.from(new Set(claims.map(c => c.id_teknisi)));
    const claimTeknisiMap = {};
    if (claimTeknisiIds.length > 0) {
      const teknisiList = await teknisi.findAll({
        where: { id_teknisi: { [Op.in]: claimTeknisiIds } },
        include: [{ model: karyawan, as: 'nik_karyawan' }]
      });
      teknisiList.forEach(t => {
        claimTeknisiMap[t.id_teknisi] = t.nik_karyawan?.nama || null;
      });
    }

    const tickets = await list_ticket.findAll({
      where: { id_schedule: idSchedule },
      include: [
        {
          model: assignment_ticket,
          as: 'assignment_ticket',
          include: [
            {
              model: ticket_progress_log,
              as: 'ticket_progress_logs',
              order: [['created_at', 'DESC']]
            }
          ]
        }
      ],
      order: [['tanggal_lapor', 'DESC']]
    });

    const result = scheduleAssets.map(sa => {
      const inv = sa.kode_asset_inventory;
      const claim = claims.find(c => c.kode_asset === sa.kode_asset);
      const assetTickets = tickets.filter(t => t.kode_asset === sa.kode_asset);
      const latestTicket = assetTickets[0];
      const latestAsg = latestTicket?.assignment_ticket;

      let tanggal_mulai_progress = null;
      let tanggal_selesai_progress = null;

      assetTickets.forEach(t => {
        const asg = t.assignment_ticket;
        if (asg) {
          if (asg.tanggal_assign) {
            const formattedAssign = formatDateOnly(asg.tanggal_assign);
            if (!tanggal_mulai_progress || formattedAssign < tanggal_mulai_progress) {
              tanggal_mulai_progress = formattedAssign;
            }
          }
          const logs = asg.ticket_progress_logs;
          if (logs) {
            logs.forEach(log => {
              if (log.created_at) {
                const formattedLog = formatDateOnly(log.created_at);
                if (!tanggal_selesai_progress || formattedLog > tanggal_selesai_progress) {
                  tanggal_selesai_progress = formattedLog;
                }
              }
            });
          }
        }
      });

      return {
        kode_asset: inv?.kode_asset || sa.kode_asset,
        nama_barang: inv?.nama_barang || null,
        merk_model: inv?.merk_model || null,
        last_maintenance: formatDateOnly(inv?.last_maintenance),
        next_maintenance: formatDateOnly(inv?.next_maintenance),
        nama_departemen: inv?.id_departemen_departemen?.nama_departemen || null,
        nama_kategori: inv?.id_kategori_kategori?.nama_kategori || null,
        pemegang: inv?.nik_pemegang_karyawan?.nama || null,
        tanggal_dibuat: formatDateOnly(sa.id_schedule_preventive_schedule?.created_at),
        tanggal_mulai_progress,
        tanggal_selesai_progress,
        status_pengerjaan_asset: latestAsg?.status_pengerjaan || null,
        user_konfirmasi: latestAsg?.user_konfirmasi ?? null,
        admin_konfirmasi: (latestAsg?.admin_konfirmasi === 1 || latestAsg?.admin_approve === 1) ? 1 : 0,
        tanggal_konfirmasi_user: formatDateOnly(latestAsg?.tanggal_konfirmasi_user),
        catatan_penyelesaian: latestAsg?.catatan_penyelesaian || null,
        id_ticket: latestTicket?.id_ticket || null,
        claimed_by_id_teknisi: claim?.id_teknisi || null,
        claimed_by_nama: claim ? (claimTeknisiMap[claim.id_teknisi] || null) : null,
        claimed_ticket_id: claim?.id_ticket || null
      };
    });

    return res.json(result);
  } catch (error) {
    console.error('getAssetsBySchedule error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal mengambil aset' });
  }
};

// ============================================================
// GET SEMUA ASET YANG TERSEDIA
// ============================================================
exports.getAvailableAssets = async (req, res) => {
  try {
    const { deptId, kategoriId } = req.query;

    const where = {};
    if (deptId) where.id_departemen = parseInt(deptId);
    if (kategoriId) where.id_kategori = parseInt(kategoriId);

    const assets = await inventory.findAll({
      where,
      include: [
        { model: departemen, as: 'id_departemen_departemen' },
        { model: kategori, as: 'id_kategori_kategori' }
      ],
      order: [['nama_barang', 'ASC']]
    });

    const rows = assets.map(i => ({
      kode_asset: i.kode_asset,
      nama_barang: i.nama_barang,
      merk_model: i.merk_model,
      id_departemen: i.id_departemen,
      id_kategori: i.id_kategori,
      nama_departemen: i.id_departemen_departemen?.nama_departemen || null,
      nama_kategori: i.id_kategori_kategori?.nama_kategori || null
    }));

    return res.json(rows);
  } catch (error) {
    console.error('getAvailableAssets error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal mengambil aset' });
  }
};

// ============================================================
// CREATE SCHEDULE + AUTO-CREATE TICKET
// ============================================================
exports.createSchedule = async (req, res) => {
  try {
    const {
      nama_schedule,
      id_departemen,
      id_kategori,
      id_sub_kategori,
      tanggal_mulai,
      tanggal_selesai,
      id_teknis,
      deskripsi,
      aset_list,
      checklist_kategori
    } = req.body;

    if (!nama_schedule || !id_departemen || !tanggal_mulai || !tanggal_selesai) {
      return res.status(400).json({ message: 'Field wajib: nama_schedule, id_departemen, tanggal_mulai, tanggal_selesai' });
    }

    // Schedule boleh disimpan untuk persiapan, tetapi saat langsung ditugaskan
    // seluruh aset wajib sudah memiliki pemetaan dan checklist aktif.
    if (id_teknis && Array.isArray(aset_list) && aset_list.length) await validateAssetsForChecklist(aset_list);

    const tglMulaiStr = formatDateOnly(tanggal_mulai);
    const tglSelesaiStr = formatDateOnly(tanggal_selesai);

    if (!tglMulaiStr || !tglSelesaiStr) {
      return res.status(400).json({ message: 'Format tanggal_mulai / tanggal_selesai tidak valid' });
    }

    const start = new Date(tglMulaiStr);
    const end = new Date(tglSelesaiStr);

    if (end < start) {
      return res.status(400).json({ message: 'tanggal_selesai tidak boleh lebih awal dari tanggal_mulai' });
    }

    const frekuensi = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const satuan = 'hari';

    let idTeknisStr = null;
    if (Array.isArray(id_teknis) && id_teknis.length > 0) {
      idTeknisStr = id_teknis.join(',');
    } else if (typeof id_teknis === 'string' && id_teknis.trim()) {
      idTeknisStr = id_teknis.trim();
    }

    const checklistKategoriStr = JSON.stringify(Array.isArray(checklist_kategori) ? checklist_kategori : []);
    const nowTimestamp = formatDateTime(new Date());

    const newSchedule = await preventive_schedule.create({
      nama_schedule,
      id_departemen: parseInt(id_departemen),
      id_kategori: id_kategori ? parseInt(id_kategori) : null,
      id_sub_kategori: id_sub_kategori ? parseInt(id_sub_kategori) : null,
      frekuensi,
      satuan,
      tanggal_mulai: tglMulaiStr,
      tanggal_selesai: tglSelesaiStr,
      id_teknis: idTeknisStr,
      deskripsi: deskripsi || null,
      checklist_kategori: checklistKategoriStr,
      is_active: 1,
      created_at: sequelize.fn('getdate'),
      updated_at: sequelize.fn('getdate')
    });

    const id_schedule = newSchedule.id_schedule;

    if (aset_list && Array.isArray(aset_list) && aset_list.length > 0) {
      for (const kode of aset_list) {
        await schedule_asset.create({
          id_schedule,
          kode_asset: kode
        });

        await inventory.update(
          {
            id_preventive_schedule: id_schedule,
            next_maintenance: tglSelesaiStr
          },
          { where: { kode_asset: kode } }
        );
      }
    }

    if (idTeknisStr) {
      await autoCreateTicketsForSchedule(id_schedule);
    }

    return res.status(201).json({
      message: idTeknisStr
        ? 'Schedule berhasil dibuat & tiket otomatis dibuat'
        : 'Schedule berhasil dibuat, menunggu diklaim teknisi',
      id_schedule
    });
  } catch (error) {
    console.error('createSchedule error (Sequelize):', error);
    return res.status(500).json({ message: error?.message || 'Gagal membuat schedule' });
  }
};

// ============================================================
// UPDATE SCHEDULE + AUTO-CREATE TICKET
// ============================================================
exports.updateSchedule = async (req, res) => {
  try {
    const idSchedule = parseInt(req.params.id);
    const {
      nama_schedule,
      id_departemen,
      id_kategori,
      id_sub_kategori,
      tanggal_mulai,
      tanggal_selesai,
      id_teknis,
      deskripsi,
      is_active,
      aset_list,
      checklist_kategori
    } = req.body;

    const check = await preventive_schedule.findByPk(idSchedule);
    if (!check) return res.status(404).json({ message: 'Schedule tidak ditemukan' });

    let idTeknisStr = check.id_teknis;
    if (Array.isArray(id_teknis)) {
      idTeknisStr = id_teknis.length > 0 ? id_teknis.join(',') : null;
    } else if (typeof id_teknis === 'string') {
      idTeknisStr = id_teknis.trim() || null;
    }

    let checklistKategoriStr = check.checklist_kategori;
    if (checklist_kategori !== undefined) {
      checklistKategoriStr = JSON.stringify(Array.isArray(checklist_kategori) ? checklist_kategori : []);
    }

    let frekuensi = check.frekuensi;
    let satuan = check.satuan;
    let tglMulaiStr = formatDateOnly(check.tanggal_mulai);
    let tglSelesaiStr = formatDateOnly(check.tanggal_selesai);

    if (tanggal_mulai && tanggal_selesai) {
      const parsedMulai = formatDateOnly(tanggal_mulai);
      const parsedSelesai = formatDateOnly(tanggal_selesai);

      if (!parsedMulai || !parsedSelesai) {
        return res.status(400).json({ message: 'Format tanggal_mulai / tanggal_selesai tidak valid' });
      }

      const start = new Date(parsedMulai);
      const end = new Date(parsedSelesai);

      if (end < start) {
        return res.status(400).json({ message: 'tanggal_selesai tidak boleh lebih awal dari tanggal_mulai' });
      }

      frekuensi = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      satuan = 'hari';
      tglMulaiStr = parsedMulai;
      tglSelesaiStr = parsedSelesai;
    }

    const nowTimestamp = formatDateTime(new Date());

    await preventive_schedule.update(
      {
        nama_schedule: nama_schedule || check.nama_schedule,
        id_departemen: id_departemen ? parseInt(id_departemen) : check.id_departemen,
        id_kategori: id_kategori !== undefined ? (id_kategori ? parseInt(id_kategori) : null) : check.id_kategori,
        id_sub_kategori: id_sub_kategori !== undefined ? (id_sub_kategori ? parseInt(id_sub_kategori) : null) : check.id_sub_kategori,
        frekuensi,
        satuan,
        tanggal_mulai: tglMulaiStr,
        tanggal_selesai: tglSelesaiStr,
        id_teknis: idTeknisStr,
        deskripsi: deskripsi !== undefined ? deskripsi : check.deskripsi,
        checklist_kategori: checklistKategoriStr,
        is_active: is_active !== undefined ? (is_active ? 1 : 0) : check.is_active,
        updated_at: sequelize.fn('getdate')
      },
      { where: { id_schedule: idSchedule } }
    );

    if (aset_list !== undefined && Array.isArray(aset_list)) {
      await schedule_asset.destroy({ where: { id_schedule: idSchedule } });
      await inventory.update(
        { id_preventive_schedule: null, next_maintenance: null },
        { where: { id_preventive_schedule: idSchedule } }
      );

      if (aset_list.length > 0) {
        for (const kode of aset_list) {
          await schedule_asset.create({ id_schedule: idSchedule, kode_asset: kode });
          await inventory.update(
            { id_preventive_schedule: idSchedule, next_maintenance: tglSelesaiStr },
            { where: { kode_asset: kode } }
          );
        }
      }
    }

    const isActive = is_active !== undefined ? (is_active ? 1 : 0) : check.is_active;
    if (isActive === 1 && idTeknisStr) {
      const toValidate = aset_list !== undefined ? aset_list : (await schedule_asset.findAll({ where: { id_schedule: idSchedule }, attributes: ['kode_asset'], raw: true })).map(x => x.kode_asset);
      await validateAssetsForChecklist(toValidate);
    }
    if (isActive === 1 && idTeknisStr) {
      await autoCreateTicketsForSchedule(idSchedule);
    }

    return res.json({ message: 'Schedule berhasil diupdate' });
  } catch (error) {
    console.error('updateSchedule error (Sequelize):', error);
    return res.status(500).json({ message: error?.message || 'Gagal update schedule' });
  }
};

// ============================================================
// DELETE SCHEDULE
// ============================================================
exports.deleteSchedule = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const idSchedule = parseInt(req.params.id);

    const check = await preventive_schedule.findByPk(idSchedule, { transaction });
    if (!check) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Schedule tidak ditemukan' });
    }

    const tickets = await list_ticket.findAll({
      where: { id_schedule: idSchedule },
      attributes: ['id_ticket'],
      raw: true,
      transaction
    });
    const ticketIds = tickets.map(t => t.id_ticket);

    if (ticketIds.length > 0) {
      const assignments = await assignment_ticket.findAll({
        where: { id_ticket: { [Op.in]: ticketIds } },
        attributes: ['id_assignment'],
        raw: true,
        transaction
      });
      const assignmentIds = assignments.map(a => a.id_assignment);

      if (assignmentIds.length > 0) {
        await ticket_progress_log.destroy({
          where: { id_assignment: { [Op.in]: assignmentIds } },
          transaction
        });
      }

      try {
        await checklist_approval.destroy({
          where: { id_ticket: { [Op.in]: ticketIds } },
          transaction
        });
      } catch (e) {
        console.log('Lewati checklist_approval:', e.message);
      }

      await ticket_checklist_result.destroy({
        where: { id_ticket: { [Op.in]: ticketIds } },
        transaction
      });
      await assignment_ticket.destroy({
        where: { id_ticket: { [Op.in]: ticketIds } },
        transaction
      });
      await list_ticket.destroy({
        where: { id_ticket: { [Op.in]: ticketIds } },
        transaction
      });
    }

    await schedule_asset_claim.destroy({ where: { id_schedule: idSchedule }, transaction });
    await schedule_asset.destroy({ where: { id_schedule: idSchedule }, transaction });

    await inventory.update(
      { id_preventive_schedule: null, next_maintenance: null },
      { where: { id_preventive_schedule: idSchedule }, transaction }
    );

    await preventive_schedule.destroy({ where: { id_schedule: idSchedule }, transaction });

    await transaction.commit();
    return res.json({ message: 'Schedule & seluruh tiket terkait berhasil dihapus' });
  } catch (error) {
    await transaction.rollback();
    console.error('deleteSchedule error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal hapus schedule' });
  }
};

// ============================================================
// TOGGLE ACTIVE / INACTIVE
// ============================================================
exports.toggleActive = async (req, res) => {
  try {
    const idSchedule = parseInt(req.params.id);

    const schedule = await preventive_schedule.findByPk(idSchedule);
    if (!schedule) return res.status(404).json({ message: 'Schedule tidak ditemukan' });

    const newStatus = schedule.is_active ? 0 : 1;

    await preventive_schedule.update(
      { is_active: newStatus, updated_at: sequelize.fn('getdate') },
      { where: { id_schedule: idSchedule } }
    );

    if (newStatus === 1 && schedule.id_teknis) {
      await autoCreateTicketsForSchedule(idSchedule);
    }

    return res.json({ message: `Schedule ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}` });
  } catch (error) {
    console.error('toggleActive error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal toggle status' });
  }
};

// ============================================================
// GET SCHEDULE BY ID (EDIT)
// ============================================================
exports.getScheduleById = async (req, res) => {
  try {
    const idSchedule = parseInt(req.params.id);

    const schedule = await preventive_schedule.findByPk(idSchedule, {
      include: [
        { model: kategori, as: 'id_kategori_kategori' },
        { model: sub_kategori, as: 'id_sub_kategori_sub_kategori' }
      ]
    });

    if (!schedule) return res.status(404).json({ message: 'Schedule tidak ditemukan' });

    const enriched = await enrichSchedules([schedule]);
    const enrichedSchedule = enriched[0];

    const assets = await schedule_asset.findAll({
      where: { id_schedule: idSchedule },
      attributes: ['kode_asset'],
      raw: true
    });

    enrichedSchedule.aset_list = assets.map(a => a.kode_asset);

    if (enrichedSchedule.id_teknis) {
      enrichedSchedule.id_teknis = String(enrichedSchedule.id_teknis).split(',').map(s => s.trim()).filter(Boolean);
    } else {
      enrichedSchedule.id_teknis = [];
    }

    if (enrichedSchedule.progress_dates) {
      enrichedSchedule.progress_dates = String(enrichedSchedule.progress_dates).split(',').map(s => s.trim());
    } else {
      enrichedSchedule.progress_dates = [];
    }

    return res.json(enrichedSchedule);
  } catch (error) {
    console.error('getScheduleById error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal mengambil schedule' });
  }
};

// ============================================================
// TEKNISI: GET SCHEDULE TERSEDIA
// ============================================================
exports.getAvailableSchedules = async (req, res) => {
  try {
    const schedules = await preventive_schedule.findAll({
      where: {
        is_active: 1,
        [Op.or]: [
          { id_teknis: null },
          { id_teknis: '' }
        ]
      },
      include: [
        { model: departemen, as: 'id_departemen_departemen' },
        { model: schedule_asset, as: 'schedule_assets' }
      ],
      order: [['tanggal_mulai', 'ASC']]
    });

    const rows = schedules.map(s => ({
      id_schedule: s.id_schedule,
      nama_schedule: s.nama_schedule,
      deskripsi: s.deskripsi,
      tanggal_mulai: formatDateOnly(s.tanggal_mulai),
      tanggal_selesai: formatDateOnly(s.tanggal_selesai),
      departemen: s.id_departemen_departemen?.nama_departemen || null,
      total_aset: s.schedule_assets ? s.schedule_assets.length : 0
    }));

    return res.json(rows);
  } catch (error) {
    console.error('getAvailableSchedules error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal mengambil schedule tersedia' });
  }
};

// ============================================================
// TEKNISI: KLAIM SCHEDULE
// ============================================================
// ============================================================
// TEKNISI: KLAIM SCHEDULE
// ============================================================
exports.claimSchedule = async (req, res) => {
  try {
    const idSchedule = parseInt(req.params.id);

    const userNik = req.user?.nik;
    const dataTeknisi = await teknisi.findOne({
      where: {
        [Op.or]: [
          { nik: userNik },
          { id_teknisi: userNik }
        ]
      }
    });
    if (!dataTeknisi) {
      return res.status(403).json({ message: 'Anda tidak terdaftar sebagai teknisi aktif' });
    }

    const check = await preventive_schedule.findByPk(idSchedule);

    if (!check) return res.status(404).json({ message: 'Schedule tidak ditemukan' });
    if (!check.is_active) return res.status(400).json({ message: 'Schedule ini sudah nonaktif' });
    if (check.id_teknis && check.id_teknis !== dataTeknisi.id_teknisi) {
      return res.status(409).json({ message: 'Schedule ini baru saja diklaim teknisi lain' });
    }

    const scheduleAssets = await schedule_asset.findAll({ where: { id_schedule: idSchedule }, attributes: ['kode_asset'], raw: true });
    await validateAssetsForChecklist(scheduleAssets.map(x => x.kode_asset));

    await preventive_schedule.update(
      { id_teknis: dataTeknisi.id_teknisi, updated_at: sequelize.fn('getdate') },
      { where: { id_schedule: idSchedule } }
    );

    await autoCreateTicketsForSchedule(idSchedule);

    return res.json({ message: 'Schedule berhasil diklaim, tiket sudah dibuat' });
  } catch (error) {
    console.error('claimSchedule error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal mengklaim schedule' });
  }
};

// ============================================================
// TEKNISI: KLAIM SATU ASSET IN SCHEDULE
// ============================================================
exports.claimAssetToMe = async (req, res) => {
  try {
    const idSchedule = parseInt(req.params.id);
    const { kode_asset } = req.body;
    if (!kode_asset) {
      return res.status(400).json({ message: 'kode_asset wajib diisi' });
    }

    const userNik = req.user?.nik;
    const dataTeknisi = await teknisi.findOne({
      where: {
        [Op.or]: [
          { nik: userNik },
          { id_teknisi: userNik }
        ]
      }
    });
    if (!dataTeknisi) {
      return res.status(403).json({ message: 'Anda tidak terdaftar sebagai teknisi aktif' });
    }

    const schedule = await preventive_schedule.findByPk(idSchedule);
    if (!schedule) return res.status(404).json({ message: 'Schedule tidak ditemukan' });
    if (!schedule.is_active) return res.status(400).json({ message: 'Schedule ini sudah nonaktif' });

    const assetCheck = await schedule_asset.findOne({
      where: { id_schedule: idSchedule, kode_asset }
    });
    if (!assetCheck) return res.status(404).json({ message: 'Asset tidak ditemukan di schedule ini' });

    const idTicket = await createTicketForSingleAsset(idSchedule, kode_asset, dataTeknisi.id_teknisi);

    try {
      await schedule_asset_claim.create({
        id_schedule: idSchedule,
        kode_asset,
        id_teknisi: dataTeknisi.id_teknisi,
        id_ticket: idTicket,
        claimed_at: sequelize.fn('getdate')
      });
    } catch (dupErr) {
      if (dupErr.name === 'SequelizeUniqueConstraintError') {
        return res.json({ message: 'Asset berhasil diklaim', id_ticket: idTicket });
      }
      throw dupErr;
    }

    return res.json({ message: 'Asset berhasil diklaim, tiket sudah dibuat', id_ticket: idTicket });
  } catch (error) {
    console.error('claimAssetToMe error (Sequelize):', error);
    return res.status(500).json({ message: error.message || 'Gagal mengklaim asset' });
  }
};

// ============================================================
// UNCLAIM SCHEDULE
// ============================================================
exports.unclaimSchedule = async (req, res) => {
  try {
    const idSchedule = parseInt(req.params.id);

    await preventive_schedule.update(
      { id_teknis: null, updated_at: sequelize.fn('getdate') },
      { where: { id_schedule: idSchedule } }
    );

    const tickets = await list_ticket.findAll({
      where: { id_schedule: idSchedule },
      attributes: ['id_ticket'],
      raw: true
    });
    const ticketIds = tickets.map(t => t.id_ticket);

    if (ticketIds.length > 0) {
      const unstartedAssignments = await assignment_ticket.findAll({
        where: {
          id_ticket: { [Op.in]: ticketIds },
          status_pengerjaan: 'Menunggu Diproses'
        },
        attributes: ['id_ticket'],
        raw: true
      });
      const unstartedTicketIds = unstartedAssignments.map(a => a.id_ticket);

      if (unstartedTicketIds.length > 0) {
        await ticket_checklist_result.destroy({
          where: { id_ticket: { [Op.in]: unstartedTicketIds } }
        });
        await assignment_ticket.destroy({
          where: { id_ticket: { [Op.in]: unstartedTicketIds } }
        });
        await list_ticket.destroy({
          where: { id_ticket: { [Op.in]: unstartedTicketIds } }
        });
        console.log(`🗑️ Tiket belum diproses (${unstartedTicketIds.length}) dibersihkan dari schedule ${idSchedule}`);
      }
    }

    return res.json({ message: 'Klaim teknisi berhasil dibatalkan' });
  } catch (error) {
    console.error('unclaimSchedule error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal membatalkan klaim' });
  }
};
