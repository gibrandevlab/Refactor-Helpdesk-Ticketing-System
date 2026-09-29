const {
  ticket_checklist_result,
  checklist_template,
  checklist_approval,
  karyawan,
  assignment_ticket,
  list_ticket,
  inventory,
  departemen,
  sub_kategori,
  teknisi,
  sequelize
} = require('../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// NIK akun IT Service default yang tanda tangannya otomatis dipakai
const DEFAULT_IT_SERVICE_NIK = process.env.DEFAULT_IT_SERVICE_NIK || 'GANTI_DENGAN_NIK_IT_SERVICE';

// Urutan kategori dipakai bersama
const KATEGORI_ORDER = ['CPU', 'Monitor', 'Software', 'Printer/Scanner', 'Network Equipment'];

// ============================================================
// GET daftar kategori unit yang tersedia
// ============================================================
exports.getKategoriList = async (req, res) => {
  try {
    const templates = await checklist_template.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('kategori_unit')), 'kategori_unit']],
      raw: true
    });

    const categories = templates.map((t) => t.kategori_unit).filter(Boolean);
    categories.sort((a, b) => {
      const idxA = KATEGORI_ORDER.indexOf(a);
      const idxB = KATEGORI_ORDER.indexOf(b);
      const orderA = idxA !== -1 ? idxA : 99;
      const orderB = idxB !== -1 ? idxB : 99;
      return orderA - orderB;
    });

    return res.json(categories);
  } catch (error) {
    console.error('getKategoriList error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal mengambil kategori checklist' });
  }
};

// ============================================================
// GET checklist result untuk satu ticket
// ============================================================
exports.getByTicket = async (req, res) => {
  try {
    const { idTicket } = req.params;

    const results = await ticket_checklist_result.findAll({
      where: { id_ticket: idTicket },
      include: [
        {
          model: checklist_template,
          as: 'id_item_checklist_template'
        }
      ]
    });

    const rows = results.map((r) => {
      const ct = r.id_item_checklist_template;
      return {
        id_result: r.id_result,
        id_item: r.id_item,
        kondisi: r.kondisi,
        kondisi_huruf: r.kondisi_huruf,
        catatan: r.catatan,
        checked_at: r.checked_at,
        kategori_unit: ct?.kategori_unit,
        uraian_pekerjaan: ct?.uraian_pekerjaan,
        alat_yang_digunakan: ct?.alat_yang_digunakan,
        penerimaan_default: ct?.penerimaan_default,
        urutan: ct?.urutan
      };
    });

    rows.sort((a, b) => {
      const idxA = KATEGORI_ORDER.indexOf(a.kategori_unit);
      const idxB = KATEGORI_ORDER.indexOf(b.kategori_unit);
      const orderA = idxA !== -1 ? idxA : 99;
      const orderB = idxB !== -1 ? idxB : 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.urutan || 0) - (b.urutan || 0);
    });

    return res.json(rows);
  } catch (error) {
    console.error('getByTicket error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal mengambil checklist ticket' });
  }
};

// ============================================================
// PATCH update satu item checklist
// ============================================================
exports.updateItem = async (req, res) => {
  try {
    const idResult = parseInt(req.params.idResult);
    let { kondisi, kondisi_huruf, catatan } = req.body;

    if (kondisi !== null && kondisi !== undefined && !['OK', 'NC'].includes(kondisi)) {
      return res.status(400).json({ message: 'kondisi harus OK, NC, atau null' });
    }

    if (kondisi === 'NC') {
      if (!['B', 'C', 'D'].includes(kondisi_huruf)) {
        return res.status(400).json({ message: 'Untuk kondisi NC, kondisi_huruf wajib diisi salah satu dari B/C/D' });
      }
    } else {
      kondisi_huruf = null;
    }

    await ticket_checklist_result.update(
      {
        kondisi: kondisi || null,
        kondisi_huruf: kondisi_huruf || null,
        catatan: catatan || null,
        checked_at: new Date()
      },
      { where: { id_result: idResult } }
    );

    return res.json({ message: 'Checklist berhasil diupdate' });
  } catch (error) {
    console.error('updateItem error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal update checklist' });
  }
};

// Helper: Memastikan baris checklist_approval tersedia
async function ensureApprovalRow(idTicket) {
  const existing = await checklist_approval.findOne({
    where: { id_ticket: idTicket }
  });

  if (!existing) {
    await checklist_approval.create({
      id_ticket: idTicket
    });
  }
}

// ============================================================
// GET status approval untuk satu ticket
// ============================================================
exports.getApprovalStatus = async (req, res) => {
  try {
    const { idTicket } = req.params;
    await ensureApprovalRow(idTicket);

    const ca = await checklist_approval.findOne({
      where: { id_ticket: idTicket }
    });

    const niks = [ca.dibuat_oleh_nik, ca.diketahui_oleh_nik, ca.disetujui_oleh_nik].filter(Boolean);
    const karyawans = await karyawan.findAll({
      where: { nik: { [Op.in]: niks } },
      attributes: ['nik', 'nama', 'tanda_tangan']
    });

    const karMap = {};
    karyawans.forEach((k) => {
      karMap[k.nik] = k;
    });

    const karD = ca.dibuat_oleh_nik ? karMap[ca.dibuat_oleh_nik] : null;
    const karK = ca.diketahui_oleh_nik ? karMap[ca.diketahui_oleh_nik] : null;
    const karS = ca.disetujui_oleh_nik ? karMap[ca.disetujui_oleh_nik] : null;

    const response = {
      ...ca.toJSON(),
      nama_dibuat_oleh: karD?.nama || null,
      ttd_dibuat_oleh: karD?.tanda_tangan || null,
      nama_diketahui_oleh: karK?.nama || null,
      ttd_diketahui_oleh: karK?.tanda_tangan || null,
      nama_disetujui_oleh: karS?.nama || null,
      ttd_disetujui_oleh: karS?.tanda_tangan || null
    };

    return res.json(response);
  } catch (error) {
    console.error('getApprovalStatus error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal mengambil status approval' });
  }
};

// ============================================================
// TAHAP 1 — Teknisi mengajukan Check Sheet ke User
// ============================================================
exports.ajukanApproval = async (req, res) => {
  try {
    const { idTicket } = req.params;

    const asg = await assignment_ticket.findOne({
      where: { id_ticket: idTicket },
      order: [['tanggal_assign', 'DESC']]
    });

    if (!asg) {
      return res.status(404).json({ message: 'Assignment ticket tidak ditemukan' });
    }
    if (asg.status_pengerjaan !== 'Selesai') {
      return res.status(400).json({ message: 'Ticket harus berstatus Selesai sebelum diajukan approval' });
    }

    const belumIsiCount = await ticket_checklist_result.count({
      where: {
        id_ticket: idTicket,
        kondisi: null
      }
    });

    if (belumIsiCount > 0) {
      return res.status(400).json({ message: `Masih ada ${belumIsiCount} item checklist yang belum diisi (OK/NC)` });
    }

    const itServiceKaryawan = await karyawan.findOne({
      where: { nik: DEFAULT_IT_SERVICE_NIK }
    });
    if (!itServiceKaryawan) {
      console.warn('DEFAULT_IT_SERVICE_NIK tidak ditemukan di tabel karyawan:', DEFAULT_IT_SERVICE_NIK);
    }

    await ensureApprovalRow(idTicket);

    await checklist_approval.update(
      {
        dibuat_oleh_nik: req.user.nik,
        tanggal_dibuat: new Date(),
        status_diketahui: 'Menunggu',
        diketahui_oleh_nik: null,
        tanggal_diketahui: null,
        catatan_diketahui: null,
        disetujui_oleh_nik: DEFAULT_IT_SERVICE_NIK,
        tanggal_disetujui: new Date(),
        status_disetujui: 'Approve',
        catatan_disetujui: null
      },
      { where: { id_ticket: idTicket } }
    );

    return res.json({ message: 'Check Sheet berhasil diajukan. Tanda tangan Teknisi & IT Service otomatis terisi, menunggu approval User.' });
  } catch (error) {
    console.error('ajukanApproval error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal mengajukan approval' });
  }
};

// ============================================================
// TAHAP 2 — User approve / reject (Diketahui)
// ============================================================
exports.approveByUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { idTicket } = req.params;
    const { action, catatan } = req.body;

    if (!['Approve', 'Reject'].includes(action)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'action harus Approve atau Reject' });
    }

    const approval = await checklist_approval.findOne({
      where: { id_ticket: idTicket },
      transaction
    });

    if (!approval || !approval.dibuat_oleh_nik) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Check Sheet belum diajukan Teknisi' });
    }

    await checklist_approval.update(
      {
        diketahui_oleh_nik: req.user.nik,
        tanggal_diketahui: new Date(),
        status_diketahui: action,
        catatan_diketahui: catatan || null
      },
      { where: { id_ticket: idTicket }, transaction }
    );

    if (action === 'Approve') {
      await assignment_ticket.update(
        {
          user_konfirmasi: 1,
          tanggal_konfirmasi_user: new Date()
        },
        { where: { id_ticket: idTicket }, transaction }
      );
    }

    await transaction.commit();
    return res.json({ message: `Check Sheet berhasil di-${action === 'Approve' ? 'setujui' : 'tolak'} User` });
  } catch (error) {
    await transaction.rollback();
    console.error('approveByUser error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal approve User' });
  }
};

// ============================================================
// TAHAP 3 (LEGACY) — IT Service approve / reject manual
// ============================================================
exports.approveByItService = async (req, res) => {
  try {
    const { idTicket } = req.params;
    const { action, catatan } = req.body;

    if (!['Approve', 'Reject'].includes(action)) {
      return res.status(400).json({ message: 'action harus Approve atau Reject' });
    }

    const approval = await checklist_approval.findOne({
      where: { id_ticket: idTicket }
    });

    if (!approval || approval.status_diketahui !== 'Approve') {
      return res.status(400).json({ message: 'Check Sheet harus di-approve User terlebih dahulu' });
    }

    await checklist_approval.update(
      {
        disetujui_oleh_nik: req.user.nik,
        tanggal_disetujui: new Date(),
        status_disetujui: action,
        catatan_disetujui: catatan || null
      },
      { where: { id_ticket: idTicket } }
    );

    if (action === 'Approve') {
      await assignment_ticket.update(
        {
          admin_approve: 1,
          admin_approve_by: req.user.nama || req.user.nik,
          admin_approve_at: new Date(),
          admin_konfirmasi: 1,
          tanggal_konfirmasi_admin: new Date()
        },
        { where: { id_ticket: idTicket } }
      );
    } else {
      await assignment_ticket.update(
        {
          admin_approve: 0,
          admin_konfirmasi: 0
        },
        { where: { id_ticket: idTicket } }
      );
    }

    return res.json({ message: `Check Sheet berhasil di-${action === 'Approve' ? 'setujui' : 'tolak'} IT Service` });
  } catch (error) {
    console.error('approveByItService error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal approve IT Service' });
  }
};

// Helper: Gambar TTD jika file ada
function drawSignatureIfExists(doc, ttdPath, x, yPos, width = 95, height = 45) {
  if (!ttdPath) return;
  const fullPath = path.join(__dirname, '..', ttdPath);
  if (fs.existsSync(fullPath)) {
    try {
      doc.image(fullPath, x, yPos, { width, height });
    } catch (e) {
      console.warn('Gagal render tanda tangan ke PDF:', e.message);
    }
  }
}

// Helper: Cari lokasi logo
function findLogoPath() {
  const candidates = [
    path.join(__dirname, '..', 'assets', 'logo bakrie.png'),
    path.join(__dirname, '..', 'assets', 'logo-bakrie.png'),
    path.join(__dirname, '..', 'public', 'assets', 'logo bakrie.png'),
    path.join(__dirname, '..', 'public', 'logo bakrie.png'),
    path.join(__dirname, '..', 'uploads', 'logo bakrie.png')
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

const CHECKSHEET_GROUPS = [
  { header: null, categories: ['CPU', 'Monitor', 'Software'] },
  { header: 'Kode Assets (Printer / Scanner *)', categories: ['Printer/Scanner'] },
  { header: 'Kode Assets (Network *)', categories: ['Network Equipment'] }
];

const normalizeKategori = (s) => String(s || '').trim().toLowerCase();

function buildGroupedChecklist(checklist) {
  const byKategori = {};
  checklist.forEach((item) => {
    const key = normalizeKategori(item.kategori_unit);
    if (!byKategori[key]) byKategori[key] = { label: item.kategori_unit, items: [] };
    byKategori[key].items.push(item);
  });

  const groupDefs = CHECKSHEET_GROUPS.map((g) => ({
    header: g.header,
    categories: g.categories.map(normalizeKategori)
  }));

  const knownKeys = groupDefs.flatMap((g) => g.categories);
  Object.keys(byKategori).forEach((key) => {
    if (!knownKeys.includes(key)) {
      groupDefs.push({ header: `Kode Assets (${byKategori[key].label} *)`, categories: [key] });
    }
  });

  return groupDefs
    .map((g) => ({
      header: g.header,
      categoryBlocks: g.categories
        .filter((key) => byKategori[key])
        .map((key) => ({ kategori_unit: byKategori[key].label, items: byKategori[key].items }))
    }))
    .filter((g) => g.categoryBlocks.length > 0);
}

// ============================================================
// DOWNLOAD PDF CHECK SHEET
// ============================================================
exports.downloadPdf = async (req, res) => {
  try {
    const { idTicket } = req.params;

    const lt = await list_ticket.findOne({
      where: { id_ticket: idTicket },
      include: [
        { model: inventory, as: 'kode_asset_inventory' },
        { model: departemen, as: 'id_departemen_departemen' },
        { model: sub_kategori, as: 'id_sub_kategori_sub_kategori' },
        {
          model: assignment_ticket,
          as: 'assignment_ticket',
          include: [
            {
              model: teknisi,
              as: 'id_teknisi_teknisi',
              include: [{ model: karyawan, as: 'nik_karyawan' }]
            }
          ]
        }
      ]
    });

    if (!lt) {
      return res.status(404).json({ message: 'Ticket tidak ditemukan' });
    }

    const asg = lt.assignment_ticket;
    const tk = asg?.id_teknisi_teknisi;
    const ticket = {
      id_ticket: lt.id_ticket,
      deskripsi: lt.deskripsi,
      tanggal_lapor: lt.tanggal_lapor,
      kode_asset: lt.kode_asset,
      nama_departemen: lt.id_departemen_departemen?.nama_departemen,
      nama_sub_kategori: lt.id_sub_kategori_sub_kategori?.nama_sub_kategori,
      nama_barang: lt.kode_asset_inventory?.nama_barang,
      merk_model: lt.kode_asset_inventory?.merk_model,
      status_pengerjaan: asg?.status_pengerjaan,
      nama_teknisi: tk?.nik_karyawan?.nama || null
    };

    const ca = await checklist_approval.findOne({
      where: { id_ticket: idTicket }
    });

    if (!ca || ca.status_diketahui !== 'Approve') {
      return res.status(400).json({ message: 'PDF hanya bisa didownload setelah disetujui User' });
    }

    const niks = [ca.dibuat_oleh_nik, ca.diketahui_oleh_nik, ca.disetujui_oleh_nik].filter(Boolean);
    const karyawans = await karyawan.findAll({
      where: { nik: { [Op.in]: niks } },
      attributes: ['nik', 'nama', 'tanda_tangan']
    });

    const karMap = {};
    karyawans.forEach((k) => {
      karMap[k.nik] = k;
    });

    const karD = ca.dibuat_oleh_nik ? karMap[ca.dibuat_oleh_nik] : null;
    const karK = ca.diketahui_oleh_nik ? karMap[ca.diketahui_oleh_nik] : null;
    const karS = ca.disetujui_oleh_nik ? karMap[ca.disetujui_oleh_nik] : null;

    const approval = {
      ...ca.toJSON(),
      nama_dibuat_oleh: karD?.nama || null,
      ttd_dibuat_oleh: karD?.tanda_tangan || null,
      nama_diketahui_oleh: karK?.nama || null,
      ttd_diketahui_oleh: karK?.tanda_tangan || null,
      nama_disetujui_oleh: karS?.nama || null,
      ttd_disetujui_oleh: karS?.tanda_tangan || null
    };

    const rawChecklist = await ticket_checklist_result.findAll({
      where: { id_ticket: idTicket },
      include: [
        { model: checklist_template, as: 'id_item_checklist_template' }
      ]
    });

    const checklist = rawChecklist.map((r) => {
      const ct = r.id_item_checklist_template;
      return {
        kategori_unit: ct?.kategori_unit,
        uraian_pekerjaan: ct?.uraian_pekerjaan,
        alat_yang_digunakan: ct?.alat_yang_digunakan,
        penerimaan_default: ct?.penerimaan_default,
        kondisi: r.kondisi,
        kondisi_huruf: r.kondisi_huruf,
        catatan: r.catatan,
        urutan: ct?.urutan
      };
    });

    checklist.sort((a, b) => {
      const idxA = KATEGORI_ORDER.indexOf(a.kategori_unit);
      const idxB = KATEGORI_ORDER.indexOf(b.kategori_unit);
      const orderA = idxA !== -1 ? idxA : 99;
      const orderB = idxB !== -1 ? idxB : 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.urutan || 0) - (b.urutan || 0);
    });

    // ===== GENERATE PDF =====
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CheckSheet_${idTicket}.pdf`);
    doc.pipe(res);

    const startX = 40;
    let y = 40;

    // HEADER TABLE
    const headerBoxHeight = 55;
    const headerLogoWidth = 70;
    const headerFormNoWidth = 160;
    const headerTitleWidth = 515 - headerLogoWidth - headerFormNoWidth;

    doc.rect(startX, y, headerLogoWidth, headerBoxHeight).stroke();
    doc.rect(startX + headerLogoWidth, y, headerTitleWidth, headerBoxHeight).stroke();
    doc.rect(startX + headerLogoWidth + headerTitleWidth, y, headerFormNoWidth, headerBoxHeight).stroke();

    const logoPath = findLogoPath();
    if (logoPath) {
      try {
        doc.image(logoPath, startX + 8, y + 8, { fit: [headerLogoWidth - 16, headerBoxHeight - 16] });
      } catch (e) {
        console.warn('Gagal render logo ke PDF:', e.message);
      }
    }

    doc.font('Helvetica-Bold').fontSize(14)
      .text('CHECK SHEET', startX + headerLogoWidth, y + 12, { width: headerTitleWidth, align: 'center' });
    doc.font('Helvetica').fontSize(8)
      .text('PERSONAL COMPUTER,SOFTWARE\nPRINTER,SCANNER & NETWORK', startX + headerLogoWidth, y + 30, { width: headerTitleWidth, align: 'center' });

    const formNoX = startX + headerLogoWidth + headerTitleWidth + 6;
    doc.font('Helvetica').fontSize(8);
    doc.text('No.Form : FRM/IT/CS/001', formNoX, y + 8, { width: headerFormNoWidth - 12 });
    doc.text('No.Rev : 00', formNoX, y + 20, { width: headerFormNoWidth - 12 });
    doc.text(`Tanggal : ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, formNoX, y + 32, { width: headerFormNoWidth - 12 });

    y += headerBoxHeight;

    // INFO TABLE
    const infoBoxHeight = 60;
    const infoBoxWidth = headerLogoWidth + headerTitleWidth + headerFormNoWidth;
    const infoLabelWidth = 160;

    doc.rect(startX, y, infoBoxWidth, infoBoxHeight).stroke();
    for (let i = 1; i <= 3; i++) {
      const lineY = y + (infoBoxHeight / 4) * i;
      doc.moveTo(startX, lineY).lineTo(startX + infoBoxWidth, lineY).stroke();
    }
    doc.moveTo(startX + infoLabelWidth, y).lineTo(startX + infoLabelWidth, y + infoBoxHeight).stroke();

    const infoRows = [
      ['Tanggal Pelaksanaan', new Date(ticket.tanggal_lapor).toLocaleDateString('id-ID')],
      ['IT Propertis', `${ticket.kode_asset || '-'} - ${ticket.nama_barang || ''}`],
      ['Department', ticket.nama_departemen || '-'],
      ['Sub Department', ticket.nama_sub_kategori || '-']
    ];

    doc.font('Helvetica').fontSize(9);
    infoRows.forEach(([label, value], idx) => {
      const rowY = y + (infoBoxHeight / 4) * idx;
      const textY = rowY + (infoBoxHeight / 4 / 2) - 5;
      doc.text(label, startX + 8, textY, { width: infoLabelWidth - 16 });
      doc.text(`: ${value}`, startX + infoLabelWidth + 8, textY, { width: infoBoxWidth - infoLabelWidth - 16 });
    });

    y += infoBoxHeight + 10;

    const rowHeight = 18;
    const colWidths = { no: 20, unit: 75, uraian: 140, alat: 65, penerimaan: 65, ok: 25, nc: 25, catatan: 97 };
    const fullTableWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);

    const ensureSpace = (needed = rowHeight) => {
      if (y + needed > 730) {
        doc.addPage();
        y = 40;
      }
    };

    const drawHeaderRow = () => {
      ensureSpace();
      const headers = [
        ['NO', colWidths.no], ['UNIT', colWidths.unit], ['URAIAN PEKERJAAN', colWidths.uraian],
        ['ALAT YANG\nDIGUNAKAN', colWidths.alat], ['PENERIMAAN', colWidths.penerimaan],
        ['OK', colWidths.ok], ['NC', colWidths.nc], ['CATATAN', colWidths.catatan]
      ];
      let x = startX;
      doc.font('Helvetica-Bold').fontSize(8);
      headers.forEach(([label, w]) => {
        doc.rect(x, y, w, rowHeight).stroke();
        doc.text(label, x + 2, y + 4, { width: w - 4, height: rowHeight - 4 });
        x += w;
      });
      y += rowHeight;
    };

    const drawGroupHeader = (label) => {
      ensureSpace();
      doc.moveTo(startX, y).lineTo(startX + fullTableWidth, y).stroke();
      doc.font('Helvetica-Bold').fontSize(8)
        .text(label, startX + 4, y + 4, { width: fullTableWidth - 8 });
      y += rowHeight;
      doc.moveTo(startX, y).lineTo(startX + fullTableWidth, y).stroke();
    };

    const drawCategoryBlock = (no, unitLabel, items) => {
      const blockHeight = items.length * rowHeight;
      if (y + blockHeight > 730) {
        doc.addPage();
        y = 40;
      }
      const blockTopY = y;

      let colX;
      items.forEach((item) => {
        colX = startX + colWidths.no + colWidths.unit;
        const rowCells = [
          [item.uraian_pekerjaan, colWidths.uraian],
          [item.alat_yang_digunakan || '-', colWidths.alat],
          [item.penerimaan_default || '-', colWidths.penerimaan],
          [item.kondisi === 'OK' ? 'v' : '', colWidths.ok],
          [item.kondisi === 'NC' ? (item.kondisi_huruf || 'v') : '', colWidths.nc],
          [item.catatan || '', colWidths.catatan]
        ];
        doc.font('Helvetica').fontSize(8);
        rowCells.forEach(([text, w]) => {
          doc.rect(colX, y, w, rowHeight).stroke();
          doc.text(String(text), colX + 2, y + 4, { width: w - 4, height: rowHeight - 4 });
          colX += w;
        });
        y += rowHeight;
      });

      doc.rect(startX, blockTopY, colWidths.no, blockHeight).stroke();
      doc.rect(startX + colWidths.no, blockTopY, colWidths.unit, blockHeight).stroke();
      const centerY = blockTopY + (blockHeight / 2) - 4;
      doc.font('Helvetica').fontSize(8);
      doc.text(String(no), startX + 2, centerY, { width: colWidths.no - 4, align: 'center' });
      doc.text(unitLabel, startX + colWidths.no + 2, centerY, { width: colWidths.unit - 4, align: 'center' });
    };

    const grouped = buildGroupedChecklist(checklist);
    drawHeaderRow();
    grouped.forEach((group) => {
      if (group.header) drawGroupHeader(group.header);
      group.categoryBlocks.forEach((block, idx) => {
        const no = idx + 1;
        drawCategoryBlock(no, block.kategori_unit, block.items);
      });
    });

    y += 15;
    if (y > 680) { doc.addPage(); y = 40; }

    const legendBoxTop = y;
    const legendBoxHeight = 42;
    const legendColWidth = 360;
    const legendBoxWidth = legendColWidth + 150;

    doc.rect(startX, legendBoxTop, legendBoxWidth, legendBoxHeight).stroke();
    doc.moveTo(startX + legendColWidth, legendBoxTop)
       .lineTo(startX + legendColWidth, legendBoxTop + legendBoxHeight)
       .stroke();

    doc.font('Helvetica-Bold').fontSize(7).text('Catatan:', startX + 4, y + 3);
    doc.font('Helvetica').fontSize(7);
    doc.text('B : Masih dapat beroperasi, dan masih bisa dipertahankan, sampai waktu disiapkan dan persiapan sparepart', startX + 4, y + 12, { width: legendColWidth - 8 });
    doc.text('C : Segera diperbaiki atau harus segera diperbaiki dan waktu perbaikan ditentukan ITS', startX + 4, y + 22, { width: legendColWidth - 8 });
    doc.text('D : Harus berhenti / tidak mampu berkerja', startX + 4, y + 32, { width: legendColWidth - 8 });

    doc.font('Helvetica-Bold').fontSize(7).text('Kondisi NC :', startX + legendColWidth + 4, y + 3);
    doc.font('Helvetica').fontSize(7);
    doc.text('B : Masih Baik', startX + legendColWidth + 4, y + 12);
    doc.text('C : Segera Diperbaiki', startX + legendColWidth + 4, y + 22);
    doc.text('D : Harus diganti', startX + legendColWidth + 4, y + 32);

    y += legendBoxHeight + 15;
    if (y > 640) { doc.addPage(); y = 40; }

    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('STATUS', startX, y, { width: 120 });
    doc.text('DIBUAT OLEH', startX + 120, y, { width: 120 });
    doc.text('DIKETAHUI (USER)', startX + 240, y, { width: 130 });
    doc.text('DISETUJUI (IT SERVICE)', startX + 370, y, { width: 130 });

    const yVal = y + 15;

    drawSignatureIfExists(doc, approval.ttd_dibuat_oleh, startX + 120, yVal);
    drawSignatureIfExists(doc, approval.ttd_diketahui_oleh, startX + 240, yVal);
    drawSignatureIfExists(doc, approval.ttd_disetujui_oleh, startX + 370, yVal);

    doc.font('Helvetica').fontSize(9);
    doc.text(ticket.status_pengerjaan || '-', startX, yVal + 55, { width: 120 });
    doc.text(
      `${approval.nama_dibuat_oleh || ticket.nama_teknisi || '-'}\n(${approval.tanggal_dibuat ? new Date(approval.tanggal_dibuat).toLocaleDateString('id-ID') : '-'})`,
      startX + 120, yVal + 55, { width: 120 }
    );
    doc.text(
      `${approval.nama_diketahui_oleh || '-'}\n(${approval.tanggal_diketahui ? new Date(approval.tanggal_diketahui).toLocaleDateString('id-ID') : '-'})`,
      startX + 240, yVal + 55, { width: 130 }
    );
    doc.text(
      `${approval.nama_disetujui_oleh || '-'}\n(${approval.tanggal_disetujui ? new Date(approval.tanggal_disetujui).toLocaleDateString('id-ID') : '-'})`,
      startX + 370, yVal + 55, { width: 130 }
    );

    doc.end();
  } catch (error) {
    console.error('downloadPdf error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal generate PDF' });
  }
};
