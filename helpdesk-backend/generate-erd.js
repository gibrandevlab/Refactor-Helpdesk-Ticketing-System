#!/usr/bin/env node
/**
 * generate-erd.js — ERD siap presentasi dari model Sequelize.
 *
 * Output (folder ./erd-slides, masing-masing .svg + .png):
 *   00-ringkasan          Peta semua tabel per modul (nama tabel saja)  -> slide pembuka
 *   01..0N-<modul>        Satu slide per modul, semua kolom, format 16:9 -> slide isi
 *   99-lampiran-lengkap   Semua tabel + semua kolom, ukuran asli         -> lampiran / zoom / cetak
 *
 * Pemakaian:
 *   node generate-erd.js                       # baca dari ./models (Sequelize)
 *   node generate-erd.js --title "Sistem X"    # judul di setiap slide
 *   node generate-erd.js --no-infer            # matikan relasi tebakan (hanya yang terdefinisi)
 *   node generate-erd.js --max-cols 12         # kolom per tabel di slide (default 8, 0 = semua)
 *   node generate-erd.js --out ./hasil         # folder output
 *   node generate-erd.js --dump-schema         # simpan schema.json (untuk debug / tanpa DB)
 *   node generate-erd.js --schema schema.json  # baca dari schema.json, tanpa Sequelize
 *   node generate-erd.js --font-dir ./fonts    # folder font tambahan untuk PNG
 *
 * Dependensi:  npm i @viz-js/viz
 * PNG (opsional): npm i @resvg/resvg-js   (tanpa ini hanya SVG yang dibuat)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { instance } = require('@viz-js/viz');

let Resvg = null;
try { ({ Resvg } = require('@resvg/resvg-js')); } catch (_) { /* PNG opsional */ }

/* ------------------------------------------------------------------ */
/* KONFIGURASI — edit bagian ini sesuai proyek                         */
/* ------------------------------------------------------------------ */

// Pengelompokan tabel ke modul. Urutan array = urutan slide.
// Tabel yang tidak cocok dengan modul manapun masuk ke "Lainnya".
const MODULES = [
  {
    id: 'master', slug: 'master-data', title: 'Master Data',
    desc: 'Organisasi, pengguna, dan klasifikasi',
    color: '#475569', bg: '#f1f5f9',
    match: /^(karyawan|departemen|bagian_departemen|jabatan|user|kategori|sub_kategori)$/,
  },
  {
    id: 'aset', slug: 'aset', title: 'Manajemen Aset',
    desc: 'Inventaris dan riwayat aset',
    color: '#0f766e', bg: '#f0fdfa',
    match: /^(inventory|asset_.+)$/,
  },
  {
    id: 'tiket', slug: 'tiket-helpdesk', title: 'Tiket & Helpdesk',
    desc: 'Pelaporan, penugasan, dan penyelesaian tiket',
    color: '#0369a1', bg: '#f0f9ff',
    match: /^(list_ticket|approval_ticket|assignment_ticket|ticket_chat|ticket_progress_log|laporan_feedback|teknisi)$/,
  },
  {
    id: 'maintenance', slug: 'preventive-maintenance', title: 'Preventive Maintenance & Checklist',
    desc: 'Jadwal perawatan, checklist, dan hasilnya',
    color: '#7c3aed', bg: '#f5f3ff',
    match: /^(preventive_|schedule_|maintenance_|checklist_|ticket_checklist_)/,
  },
];
const OTHER_MODULE = { id: 'lainnya', slug: 'lainnya', title: 'Lainnya', desc: 'Belum dikelompokkan', color: '#b45309', bg: '#fffbeb' };

// Jika sebuah nama kolom kunci dimiliki lebih dari satu tabel (mis. kode_asset ada di
// inventory dan tabel *_detail), tentukan tabel induknya di sini. Kalau tidak diisi,
// dipilih tabel dengan kolom terbanyak dan skrip akan memberi peringatan.
const KEY_OWNER = {
  kode_asset: 'inventory',
  id_ticket: 'list_ticket',
};

const SLIDE = { w: 1920, h: 1080, margin: 64, headerH: 130, footerH: 74, maxScale: 1.5 };
const AVAIL_W = SLIDE.w - SLIDE.margin * 2;
const AVAIL_H = SLIDE.h - SLIDE.headerH - SLIDE.footerH;
const FONT = 'Arial,Liberation Sans,Helvetica,sans-serif';   // dipakai di SVG akhir
const LAYOUT_FONT = 'Helvetica';                              // nama yang dikenal Graphviz untuk mengukur teks
const HEAD_PT = 17;
const ROW_PT = 15;

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const value = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i > -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};

const OUT_DIR = path.resolve(value('out', path.join(__dirname, 'erd-slides')));
const PROJECT_TITLE = value('title', 'Entity Relationship Diagram');
const SCHEMA_FILE = value('schema', null);
const FONT_DIR = value('font-dir', null);
const INFER = !flag('no-infer');
const MAX_COLS = parseInt(value('max-cols', '8'), 10);   // kolom per tabel di slide; 0 = semua

/* ------------------------------------------------------------------ */
/* 1. EKSTRAKSI SKEMA DARI SEQUELIZE                                   */
/* ------------------------------------------------------------------ */

function tableNameOf(model) {
  const t = typeof model.getTableName === 'function' ? model.getTableName() : model.tableName;
  return (t && typeof t === 'object' ? t.tableName : t) || model.name;
}

function shortType(type) {
  let s = type ? type.toString().toUpperCase() : '';
  if (s.length > 18) s = s.split('(')[0];
  return s;
}

function extractFromSequelize(sequelize) {
  const models = Object.values(sequelize.models);
  const modelByTable = new Map(models.map((m) => [tableNameOf(m), m]));

  // nama tabel / nama model (huruf kecil) -> nama tabel
  const lookup = new Map();
  models.forEach((m) => {
    lookup.set(tableNameOf(m).toLowerCase(), tableNameOf(m));
    lookup.set(m.name.toLowerCase(), tableNameOf(m));
  });
  const resolveTable = (ref) => {
    if (!ref) return null;
    if (typeof ref === 'function') return lookup.get(tableNameOf(ref).toLowerCase()) || null; // class Model
    const n = typeof ref === 'string' ? ref : ref.tableName;
    return n ? lookup.get(String(n).toLowerCase()) || null : null;
  };
  // references.key berisi nama field di DB; kita pakai nama atribut model
  const attrOfField = (model, field) =>
    Object.keys(model.rawAttributes).find((k) => (model.rawAttributes[k].field || k) === field) || field;

  const tables = models.map((m) => ({
    name: tableNameOf(m),
    columns: Object.entries(m.rawAttributes || {}).map(([name, a]) => ({
      name,
      type: shortType(a.type),
      primaryKey: !!a.primaryKey,
    })),
  }));

  const relations = [];
  const seen = new Set();
  const add = (from, fromCol, to, toCol) => {
    if (!from || !to || !fromCol) return;
    const key = `${from}.${fromCol}>${to}`;
    if (seen.has(key)) return;
    seen.add(key);
    relations.push({ from, fromCol, to, toCol: toCol || null });
  };

  // a) Asosiasi Sequelize. Catatan: di Sequelize v5/v6 nilainya 'BelongsTo' / 'HasMany'
  //    (huruf kapital), bukan 'belongsTo' seperti di skrip lama.
  models.forEach((m) => {
    Object.values(m.associations || {}).forEach((assoc) => {
      const type = assoc.associationType;
      if (type === 'BelongsTo') {
        add(tableNameOf(assoc.source), assoc.foreignKey, tableNameOf(assoc.target), assoc.targetKey);
      } else if (type === 'HasMany' || type === 'HasOne') {
        add(tableNameOf(assoc.target), assoc.foreignKey, tableNameOf(assoc.source), assoc.sourceKey);
      }
    });
  });

  // b) Kolom dengan `references` eksplisit
  models.forEach((m) => {
    Object.entries(m.rawAttributes || {}).forEach(([name, a]) => {
      if (!a.references) return;
      const to = resolveTable(typeof a.references === 'string' ? a.references : a.references.model);
      const keyField = typeof a.references === 'object' ? a.references.key : null;
      const tm = to && modelByTable.get(to);
      add(tableNameOf(m), name, to, tm && keyField ? attrOfField(tm, keyField) : null);
    });
  });

  return { tables, relations };
}

/* ------------------------------------------------------------------ */
/* 2. NORMALISASI + INFERENSI RELASI                                   */
/* ------------------------------------------------------------------ */

function finalizeSchema(raw) {
  const tables = raw.tables;
  const tableMap = new Map(tables.map((t) => [t.name, t]));
  const soleKey = (t) => {
    const pks = t.columns.filter((c) => c.primaryKey);
    return pks.length === 1 ? pks[0].name : null;
  };
  const defaultKey = (t) => soleKey(t) || (t.columns.find((c) => c.primaryKey) || {}).name || null;

  const relations = raw.relations
    .filter((r) => tableMap.has(r.from) && tableMap.has(r.to))
    .map((r) => ({ ...r, toCol: r.toCol || defaultKey(tableMap.get(r.to)), inferred: false }));

  const report = { inferred: [], ambiguous: [], unlinked: [] };

  if (INFER) {
    const has = new Set(relations.map((r) => `${r.from}.${r.fromCol}`));

    // nama kunci (PK tunggal, selain "id") -> tabel-tabel yang memilikinya
    const owners = new Map();
    tables.forEach((t) => {
      const k = soleKey(t);
      if (k && k !== 'id') owners.set(k, [...(owners.get(k) || []), t]);
    });
    const parentOf = (key) => {
      const pool = owners.get(key);
      const forced = KEY_OWNER[key] && pool.find((t) => t.name === KEY_OWNER[key]);
      const parent = forced || [...pool].sort((a, b) => b.columns.length - a.columns.length)[0];
      if (pool.length > 1 && !forced && !report.ambiguous.find((x) => x.key === key)) {
        report.ambiguous.push({ key, pool: pool.map((t) => t.name), chosen: parent.name });
      }
      return parent;
    };

    tables.forEach((t) => {
      t.columns.forEach((c) => {
        if (has.has(`${t.name}.${c.name}`)) return;

        // Aturan 1: nama kolom = nama PK tabel lain, atau diawali/diakhiri PK itu
        //           (id_departemen_lama, nik_pelapor, dibuat_oleh_nik, ...). PK terpanjang menang.
        const key = [...owners.keys()]
          .filter((k) => c.name === k || c.name.startsWith(`${k}_`) || c.name.endsWith(`_${k}`))
          .sort((a, b) => b.length - a.length)[0];

        let parent = null;
        let toCol = null;
        if (key) {
          parent = parentOf(key);
          toCol = key;
        } else {
          // Aturan 2 (dari skrip lama): id_<tabel> atau <tabel>_id
          const m = c.name.match(/^id_(.+)$|^(.+)_id$/);
          const guess = m && (m[1] || m[2]).toLowerCase();
          parent = guess && tables.find((x) => x.name.toLowerCase() === guess);
          toCol = parent && defaultKey(parent);
        }
        if (!parent || parent === t || !toCol) return;

        relations.push({ from: t.name, fromCol: c.name, to: parent.name, toCol, inferred: true });
        report.inferred.push(`${t.name}.${c.name} → ${parent.name}.${toCol}`);
      });
    });
  }

  // 1:1 bila kolom FK adalah satu-satunya PK tabelnya (tabel detail/ekstensi)
  relations.forEach((r) => { r.oneToOne = soleKey(tableMap.get(r.from)) === r.fromCol; });

  // Kolom bernama mirip FK yang tetap tidak terhubung -> supaya bisa dicek manual
  const linked = new Set(relations.map((r) => `${r.from}.${r.fromCol}`));
  tables.forEach((t) => t.columns.forEach((c) => {
    if (!linked.has(`${t.name}.${c.name}`) && soleKey(t) !== c.name &&
        /^id_|_id$|^nik|_nik$|^kode_/.test(c.name)) {
      report.unlinked.push(`${t.name}.${c.name}`);
    }
  }));

  const fk = new Set(relations.map((r) => `${r.from}.${r.fromCol}`));
  tables.forEach((t) => t.columns.forEach((c) => {
    c.badge = c.primaryKey ? 'PK' : fk.has(`${t.name}.${c.name}`) ? 'FK' : '';
  }));

  return { tables, relations, report };
}

/* ------------------------------------------------------------------ */
/* 3. PEMBUATAN DOT                                                    */
/* ------------------------------------------------------------------ */

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const q = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

function moduleOf(tableName) {
  return MODULES.find((m) => m.match.test(tableName)) || OTHER_MODULE;
}

function nodeLabel(node) {
  // tabel dari modul lain: bingkai putus-putus
  const frame = node.stub
    ? 'BORDER="2" CELLBORDER="0" STYLE="dashed" COLOR="#94A3B8"'
    : 'BORDER="0" CELLBORDER="1" COLOR="#CBD5E1"';
  const head =
    `<TR><TD PORT="h" BGCOLOR="${node.color}" ALIGN="CENTER" CELLPADDING="${node.rows.length ? 7 : 9}">` +
    `<FONT COLOR="#FFFFFF" POINT-SIZE="${HEAD_PT}"><B>${esc(node.title)}</B></FONT>` +
    (node.sub ? `<BR/><FONT COLOR="#E2E8F0" POINT-SIZE="${ROW_PT - 2}">${esc(node.sub)}</FONT>` : '') +
    '</TD></TR>';

  const body = node.rows.map((r) => {
    if (r.muted) {
      return `<TR><TD PORT="${r.port}" ALIGN="LEFT" BGCOLOR="#F8FAFC" CELLPADDING="4">` +
        `<FONT COLOR="#94A3B8" POINT-SIZE="${ROW_PT - 2}"><I>${esc(r.name)}</I></FONT></TD></TR>`;
    }
    const bg = r.badge === 'PK' ? '#FEF2F2' : r.badge === 'FK' ? '#EFF6FF' : '#FFFFFF';
    const col = r.badge === 'PK' ? '#B91C1C' : r.badge === 'FK' ? '#0369A1' : '#334155';
    const tag = r.badge
      ? `<FONT COLOR="${col}" POINT-SIZE="${ROW_PT - 4}"><B>${r.badge}</B></FONT>&#160;&#160;`
      : '';
    const name = `<FONT COLOR="${col}" POINT-SIZE="${ROW_PT}">${r.badge ? '<B>' : ''}${esc(r.name)}${r.badge ? '</B>' : ''}</FONT>`;
    const type = r.type ? `&#160;&#160;<FONT COLOR="#94A3B8" POINT-SIZE="${ROW_PT - 3}">${esc(r.type)}</FONT>` : '';
    return `<TR><TD PORT="${r.port}" ALIGN="LEFT" BGCOLOR="${bg}" CELLPADDING="4">${tag}${name}${type}</TD></TR>`;
  }).join('');

  return `<<TABLE ${frame} CELLSPACING="0" CELLPADDING="4">${head}${body}</TABLE>>`;
}

function buildDot({ rankdir, nodes, edges, clusters = [], style, transparent }) {
  const detail = style === 'detail';
  const out = [];
  out.push('digraph ERD {');
  out.push(`graph [rankdir=${rankdir}, splines=spline, nodesep=${detail ? 0.45 : 0.3}, ranksep=${detail ? 1.1 : 0.9}, ` +
    `pad=0.25, bgcolor="${transparent ? 'transparent' : '#ffffff'}", fontname=${q(LAYOUT_FONT)}];`);
  out.push(`node [shape=plain, fontname=${q(LAYOUT_FONT)}];`);
  out.push(`edge [fontname=${q(LAYOUT_FONT)}, color="#64748b", penwidth=${detail ? 1.4 : 1.2}, arrowsize=${detail ? 0.85 : 0.7}];`);

  const emitNode = (n) => `  ${q(n.id)} [label=${nodeLabel(n)}];`;

  clusters.forEach((c) => {
    out.push(`subgraph ${q('cluster_' + c.id)} {`);
    out.push(`  label=<<FONT COLOR="${c.color}" POINT-SIZE="22"><B>${esc(c.title)}</B></FONT>>;`);
    out.push(`  labeljust=l; style="rounded,filled"; fillcolor="${c.bg}"; color="${c.color}"; penwidth=1.5; margin=24;`);
    nodes.filter((n) => n.cluster === c.id).forEach((n) => out.push(emitNode(n)));
    out.push('}');
  });
  nodes.filter((n) => !clusters.some((c) => c.id === n.cluster)).forEach((n) => out.push(emitNode(n)));

  const sideOut = rankdir === 'LR' ? ':e' : '';
  const sideIn = rankdir === 'LR' ? ':w' : '';
  edges.forEach((e) => {
    // Arah gambar: induk -> anak, jadi urutannya terbaca dari master ke transaksi.
    if (detail) {
      const attrs = [
        'dir=both', 'arrowtail=tee', `arrowhead=${e.oneToOne ? 'tee' : 'crow'}`,
        e.inferred ? 'style=dashed' : 'style=solid',
      ];
      if (rankdir === 'LR') {
        // garis keluar dari baris PK dan masuk ke baris FK
        out.push(`  ${q(e.parent)}:${q(e.parentPort)}${sideOut} -> ${q(e.child)}:${q(e.childPort)}${sideIn} [${attrs.join(', ')}];`);
      } else {
        // mode atas-bawah: garis ke tabel, nama kolom FK jadi label
        attrs.push(`label=${q(' ' + e.label + ' ')}`, 'fontsize=12', 'fontcolor="#64748b"');
        out.push(`  ${q(e.parent)} -> ${q(e.child)} [${attrs.join(', ')}];`);
      }
    } else {
      // peta antar-modul: panah menunjuk ke modul yang dirujuk
      out.push(`  ${q(e.parent)}:h -> ${q(e.child)}:h [dir=back, arrowtail=normal, arrowsize=1.1, penwidth=${e.width}, ` +
        `label=${q('  ' + e.count + ' FK  ')}, fontsize=16, fontcolor="#334155"];`);
    }
  });

  out.push('}');
  return out.join('\n');
}

/* ------------------------------------------------------------------ */
/* 4. VIEW: ringkasan, per modul, lampiran                             */
/* ------------------------------------------------------------------ */

// Di slide: semua kolom kunci (PK/FK) + atribut pertama sampai batas MAX_COLS;
// kolom audit (created_at dst.) didahulukan untuk disembunyikan. Lampiran selalu lengkap.
function pickColumns(table, max) {
  if (!max || table.columns.length <= max + 1) return { cols: table.columns, hidden: 0 };
  const isAudit = (c) => /^(created|updated|deleted)_at$/.test(c.name);
  const keep = new Set(table.columns.filter((c) => c.badge));
  table.columns.forEach((c) => { if (keep.size < max && !c.badge && !isAudit(c)) keep.add(c); });
  const cols = table.columns.filter((c) => keep.has(c));
  return { cols, hidden: table.columns.length - cols.length };
}

function detailNode(table, mod, opts = {}) {
  let cols = table.columns;
  let hidden = 0;
  if (opts.only) cols = cols.filter((c) => opts.only.has(c.name));
  else if (opts.max) ({ cols, hidden } = pickColumns(table, opts.max));
  const rows = cols.map((c) => ({ name: c.name, type: c.type, badge: c.badge, port: `c${table.columns.indexOf(c)}` }));
  if (hidden) rows.push({ name: `… +${hidden} kolom lainnya`, type: '', badge: '', port: 'm', muted: true });
  return { id: table.name, title: table.name, color: mod.color, stub: !!opts.stub, cluster: opts.cluster || null, rows };
}
const portOf = (table, col) => {
  const i = table.columns.findIndex((c) => c.name === col);
  return i < 0 ? 'h' : `c${i}`;
};

function buildViews(schema) {
  const { tables, relations } = schema;
  const tableMap = new Map(tables.map((t) => [t.name, t]));
  const modOf = new Map(tables.map((t) => [t.name, moduleOf(t.name)]));
  const usedMods = [...MODULES, OTHER_MODULE].filter((m) => tables.some((t) => modOf.get(t.name) === m));
  const clusters = usedMods.map((m) => ({ id: m.id, title: m.title, color: m.color, bg: m.bg }));

  const detailEdge = (r) => ({
    parent: r.to, parentPort: portOf(tableMap.get(r.to), r.toCol),
    child: r.from, childPort: portOf(tableMap.get(r.from), r.fromCol),
    inferred: r.inferred, oneToOne: r.oneToOne, label: r.fromCol,
  });

  const views = [];

  // 00 — ringkasan: satu kartu per modul, panah = "merujuk ke" (jumlah FK lintas modul)
  const cross = new Map();
  relations.forEach((r) => {
    const parent = modOf.get(r.to).id;
    const child = modOf.get(r.from).id;
    if (parent === child) return;
    cross.set(`${parent}>${child}`, { parent, child, count: (cross.get(`${parent}>${child}`) || { count: 0 }).count + 1 });
  });
  views.push({
    slug: '00-ringkasan', kind: 'slide',
    title: PROJECT_TITLE,
    subtitle: `${tables.length} tabel · ${relations.length} relasi · ${usedMods.length} modul`,
    accent: '#0f172a', legend: 'overview', hasInferred: false,
    dot: {
      style: 'module', transparent: true,
      nodes: usedMods.map((m) => ({
        id: m.id, title: m.title, color: m.color, cluster: null,
        sub: `${tables.filter((t) => modOf.get(t.name) === m).length} tabel`,
        rows: tables.filter((t) => modOf.get(t.name) === m).map((t, i) => ({ name: t.name, type: '', badge: '', port: `r${i}` })),
      })),
      edges: [...cross.values()].map((c) => ({ ...c, width: (1.5 + Math.min(c.count, 24) / 5).toFixed(1) })),
    },
  });

  // 01.. — per modul
  usedMods.forEach((m, i) => {
    const inMod = new Set(tables.filter((t) => modOf.get(t.name) === m).map((t) => t.name));
    const internal = relations.filter((r) => inMod.has(r.from) && inMod.has(r.to));
    const outgoing = relations.filter((r) => inMod.has(r.from) && !inMod.has(r.to));
    const incomingFrom = new Set(relations.filter((r) => !inMod.has(r.from) && inMod.has(r.to)).map((r) => modOf.get(r.from).title));

    const stubCols = new Map();
    outgoing.forEach((r) => stubCols.set(r.to, new Set([...(stubCols.get(r.to) || []), r.toCol])));

    const nodes = [...inMod].map((n) => detailNode(tableMap.get(n), m, { max: MAX_COLS }));
    stubCols.forEach((cols, name) => nodes.push(detailNode(tableMap.get(name), modOf.get(name), { stub: true, only: cols })));

    const edges = [...internal, ...outgoing].map(detailEdge);
    const bits = [`${inMod.size} tabel`, `${internal.length + outgoing.length} relasi`];
    if (incomingFrom.size) bits.push(`dipakai oleh: ${[...incomingFrom].join(', ')}`);

    views.push({
      slug: `${String(i + 1).padStart(2, '0')}-${m.slug}`, kind: 'slide',
      title: m.title, subtitle: `${m.desc}  ·  ${bits.join('  ·  ')}`,
      accent: m.color, legend: 'keys',
      hasInferred: edges.some((e) => e.inferred), hasStubs: stubCols.size > 0,
      dot: { style: 'detail', transparent: true, nodes, edges },
    });
  });

  // 99 — lampiran lengkap (ukuran asli, tanpa bingkai slide)
  views.push({
    slug: '99-lampiran-lengkap', kind: 'full',
    dot: {
      style: 'detail', transparent: false, clusters,
      nodes: tables.map((t) => detailNode(t, modOf.get(t.name), { cluster: modOf.get(t.name).id })),
      edges: relations.map(detailEdge),
    },
  });

  return views;
}

/* ------------------------------------------------------------------ */
/* 5. RENDER: pilih orientasi terbaik, bingkai slide, PNG              */
/* ------------------------------------------------------------------ */

function svgSize(svg) {
  const m = svg.match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/);
  return { w: parseFloat(m[1]), h: parseFloat(m[2]) };
}

// Coba LR dan TB, pakai yang paling memenuhi kanvas 16:9 (skala terbesar = teks terbesar).
function renderBest(viz, dot) {
  let best = null;
  for (const rankdir of ['LR', 'TB']) {
    const svg = viz.renderString(buildDot({ ...dot, rankdir }), { engine: 'dot', format: 'svg' })
      .replace(/font-family="[^"]*"/g, `font-family="${FONT}"`);
    const { w, h } = svgSize(svg);
    const scale = Math.min(AVAIL_W / w, AVAIL_H / h);
    if (!best || scale > best.scale * 1.05) best = { svg, w, h, scale, rankdir };
  }
  return best;
}

function legendSvg(view, y) {
  const items = [];
  if (view.legend === 'overview') {
    items.push({ t: 'text', label: 'Panah menunjuk ke modul yang dirujuk. Angka = jumlah foreign key lintas modul.' });
  } else {
    items.push({ t: 'swatch', fill: '#FEF2F2', stroke: '#FECACA', label: 'PK  Primary key' });
    items.push({ t: 'swatch', fill: '#EFF6FF', stroke: '#BFDBFE', label: 'FK  Foreign key' });
    items.push({ t: 'line', dashed: false, label: 'Relasi (ujung bercabang = sisi "banyak")' });
  }
  if (view.hasInferred) items.push({ t: 'line', dashed: true, label: 'Relasi hasil deteksi nama kolom' });
  if (view.hasStubs) items.push({ t: 'swatch', fill: '#FFFFFF', stroke: '#94A3B8', dashed: true, label: 'Tabel dari modul lain' });

  let x = SLIDE.margin;
  const parts = [];
  items.forEach((it) => {
    if (it.t === 'swatch') {
      parts.push(`<rect x="${x}" y="${y - 15}" width="26" height="18" rx="3" fill="${it.fill}" stroke="${it.stroke}"${it.dashed ? ' stroke-dasharray="4 3"' : ''}/>`);
      x += 36;
    } else if (it.t === 'line') {
      parts.push(`<line x1="${x}" y1="${y - 6}" x2="${x + 42}" y2="${y - 6}" stroke="#64748b" stroke-width="2"${it.dashed ? ' stroke-dasharray="7 5"' : ''}/>`);
      x += 52;
    }
    parts.push(`<text x="${x}" y="${y}" font-size="17" fill="#475569">${esc(it.label)}</text>`);
    x += it.label.length * 8.6 + 34;
  });
  return parts.join('\n  ');
}

function wrapSlide(view, best) {
  const scale = Math.min(best.scale, SLIDE.maxScale);
  const tx = SLIDE.margin + (AVAIL_W - best.w * scale) / 2;
  const ty = SLIDE.headerH + (AVAIL_H - best.h * scale) / 2;
  const inner = best.svg.slice(best.svg.indexOf('<g id="graph0"'), best.svg.lastIndexOf('</svg>'));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${SLIDE.w}" height="${SLIDE.h}" viewBox="0 0 ${SLIDE.w} ${SLIDE.h}" font-family="${FONT}">
  <rect width="${SLIDE.w}" height="${SLIDE.h}" fill="#ffffff"/>
  <rect width="14" height="${SLIDE.h}" fill="${view.accent}"/>
  <text x="${SLIDE.margin}" y="70" font-size="42" font-weight="700" fill="#0f172a">${esc(view.title)}</text>
  <text x="${SLIDE.margin}" y="106" font-size="20" fill="#64748b">${esc(view.subtitle)}</text>
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">
${inner}
  </g>
  ${legendSvg(view, SLIDE.h - 28)}
</svg>
`;
}

function toPng(svg, width) {
  const opts = { fitTo: { mode: 'width', value: width }, background: '#ffffff',
    font: { loadSystemFonts: true, defaultFontFamily: 'Arial' } };
  if (FONT_DIR) opts.font.fontDirs = [path.resolve(FONT_DIR)];
  return new Resvg(svg, opts).render().asPng();
}

/* ------------------------------------------------------------------ */
/* 6. MAIN                                                             */
/* ------------------------------------------------------------------ */

async function main() {
  let db = null;
  try {
    let raw;
    if (SCHEMA_FILE) {
      console.log(`1. Membaca skema dari ${SCHEMA_FILE}...`);
      raw = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'));
    } else {
      console.log('1. Membaca model Sequelize...');
      db = require('./models');
      raw = extractFromSequelize(db.sequelize);
    }
    if (flag('dump-schema')) {
      fs.mkdirSync(OUT_DIR, { recursive: true });
      fs.writeFileSync(path.join(OUT_DIR, 'schema.json'), JSON.stringify(raw, null, 2));
    }

    const schema = finalizeSchema(raw);
    const { report } = schema;
    const declared = schema.relations.filter((r) => !r.inferred).length;
    console.log(`2. ${schema.tables.length} tabel, ${declared} relasi terdefinisi` +
      (INFER ? `, ${report.inferred.length} relasi hasil deteksi (garis putus-putus)` : ' (deteksi dimatikan)'));

    const other = schema.tables.filter((t) => moduleOf(t.name) === OTHER_MODULE).map((t) => t.name);
    if (other.length) console.log(`   ⚠ Belum masuk modul manapun (edit MODULES): ${other.join(', ')}`);
    if (report.inferred.length) {
      console.log('   Relasi hasil deteksi — mohon dicek kebenarannya:');
      report.inferred.forEach((s) => console.log(`     • ${s}`));
    }
    report.ambiguous.forEach((a) => console.log(
      `   ⚠ Kunci "${a.key}" dimiliki ${a.pool.join(', ')} → dipilih ${a.chosen} (atur KEY_OWNER jika keliru)`));
    if (report.unlinked.length) {
      console.log(`   ℹ Kolom mirip FK yang belum terhubung: ${report.unlinked.join(', ')}`);
    }

    const viz = await instance();
    fs.mkdirSync(OUT_DIR, { recursive: true });
    if (!Resvg) console.log('   (PNG dilewati — jalankan: npm i @resvg/resvg-js)');

    console.log('3. Membuat diagram...');
    for (const view of buildViews(schema)) {
      const best = renderBest(viz, view.dot);
      const svg = view.kind === 'slide' ? wrapSlide(view, best) : best.svg;
      fs.writeFileSync(path.join(OUT_DIR, `${view.slug}.svg`), svg);
      if (Resvg) {
        const width = view.kind === 'slide' ? 2560 : Math.min(Math.max(Math.round(best.w * 2), 3000), 8000);
        fs.writeFileSync(path.join(OUT_DIR, `${view.slug}.png`), toPng(svg, width));
      }
      console.log(`   ✓ ${view.slug}  (${best.rankdir}${view.kind === 'slide' ? `, skala ${Math.min(best.scale, SLIDE.maxScale).toFixed(2)}x` : ''})`);
    }
    console.log(`\n✅ Selesai. Hasil ada di: ${OUT_DIR}`);
  } catch (err) {
    console.error('❌ Gagal membuat ERD:', err);
    process.exitCode = 1;
  } finally {
    if (db && db.sequelize && db.sequelize.close) await db.sequelize.close();
    process.exit();
  }
}

main();