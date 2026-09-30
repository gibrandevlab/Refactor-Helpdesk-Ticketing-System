var DataTypes = require("sequelize").DataTypes;
var _approval_ticket = require("./approval_ticket");
var _asset_department_history = require("./asset_department_history");
var _asset_hardware = require("./asset_hardware");
var _asset_hardware_detail = require("./asset_hardware_detail");
var _asset_history = require("./asset_history");
var _asset_holder_history = require("./asset_holder_history");
var _asset_software = require("./asset_software");
var _asset_software_detail = require("./asset_software_detail");
var _assignment_ticket = require("./assignment_ticket");
var _bagian_departemen = require("./bagian_departemen");
var _checklist_approval = require("./checklist_approval");
var _checklist_template = require("./checklist_template");
var _departemen = require("./departemen");
var _inventory = require("./inventory");
var _maintenance_asset_type = require("./maintenance_asset_type");
var _maintenance_checklist_item = require("./maintenance_checklist_item");
var _maintenance_checklist_unit = require("./maintenance_checklist_unit");
var _jabatan = require("./jabatan");
var _karyawan = require("./karyawan");
var _kategori = require("./kategori");
var _laporan_feedback = require("./laporan_feedback");
var _list_ticket = require("./list_ticket");
var _preventive_schedule = require("./preventive_schedule");
var _schedule_asset = require("./schedule_asset");
var _schedule_asset_claim = require("./schedule_asset_claim");
var _sub_kategori = require("./sub_kategori");
var _teknisi = require("./teknisi");
var _ticket_chat = require("./ticket_chat");
var _ticket_checklist_result = require("./ticket_checklist_result");
var _ticket_progress_log = require("./ticket_progress_log");
var _user = require("./user");

function initModels(sequelize) {
  var approval_ticket = _approval_ticket(sequelize, DataTypes);
  var asset_department_history = _asset_department_history(sequelize, DataTypes);
  var asset_hardware = _asset_hardware(sequelize, DataTypes);
  var asset_hardware_detail = _asset_hardware_detail(sequelize, DataTypes);
  var asset_history = _asset_history(sequelize, DataTypes);
  var asset_holder_history = _asset_holder_history(sequelize, DataTypes);
  var asset_software = _asset_software(sequelize, DataTypes);
  var asset_software_detail = _asset_software_detail(sequelize, DataTypes);
  var assignment_ticket = _assignment_ticket(sequelize, DataTypes);
  var bagian_departemen = _bagian_departemen(sequelize, DataTypes);
  var checklist_approval = _checklist_approval(sequelize, DataTypes);
  var checklist_template = _checklist_template(sequelize, DataTypes);
  var departemen = _departemen(sequelize, DataTypes);
  var inventory = _inventory(sequelize, DataTypes);
  var maintenance_asset_type = _maintenance_asset_type(sequelize, DataTypes);
  var maintenance_checklist_item = _maintenance_checklist_item(sequelize, DataTypes);
  var maintenance_checklist_unit = _maintenance_checklist_unit(sequelize, DataTypes);
  var jabatan = _jabatan(sequelize, DataTypes);
  var karyawan = _karyawan(sequelize, DataTypes);
  var kategori = _kategori(sequelize, DataTypes);
  var laporan_feedback = _laporan_feedback(sequelize, DataTypes);
  var list_ticket = _list_ticket(sequelize, DataTypes);
  var preventive_schedule = _preventive_schedule(sequelize, DataTypes);
  var schedule_asset = _schedule_asset(sequelize, DataTypes);
  var schedule_asset_claim = _schedule_asset_claim(sequelize, DataTypes);
  var sub_kategori = _sub_kategori(sequelize, DataTypes);
  var teknisi = _teknisi(sequelize, DataTypes);
  var ticket_chat = _ticket_chat(sequelize, DataTypes);
  var ticket_checklist_result = _ticket_checklist_result(sequelize, DataTypes);
  var ticket_progress_log = _ticket_progress_log(sequelize, DataTypes);
  var user = _user(sequelize, DataTypes);

  inventory.belongsToMany(preventive_schedule, { as: 'id_schedule_preventive_schedules', through: schedule_asset, foreignKey: "kode_asset", otherKey: "id_schedule" });
  preventive_schedule.belongsToMany(inventory, { as: 'kode_asset_inventories', through: schedule_asset, foreignKey: "id_schedule", otherKey: "kode_asset" });
  ticket_progress_log.belongsTo(assignment_ticket, { as: "id_assignment_assignment_ticket", foreignKey: "id_assignment"});
  assignment_ticket.hasMany(ticket_progress_log, { as: "ticket_progress_logs", foreignKey: "id_assignment"});
  karyawan.belongsTo(bagian_departemen, { as: "id_bagian_bagian_departemen", foreignKey: "id_bagian"});
  bagian_departemen.hasMany(karyawan, { as: "karyawans", foreignKey: "id_bagian"});
  ticket_checklist_result.belongsTo(checklist_template, { as: "id_item_checklist_template", foreignKey: "id_item"});
  checklist_template.hasMany(ticket_checklist_result, { as: "ticket_checklist_results", foreignKey: "id_item"});
  inventory.belongsTo(maintenance_asset_type, { as: 'maintenance_asset_type', foreignKey: 'id_asset_type' });
  maintenance_asset_type.hasMany(inventory, { as: 'inventories', foreignKey: 'id_asset_type' });
  maintenance_checklist_item.belongsTo(maintenance_asset_type, { as: 'maintenance_asset_type', foreignKey: 'id_asset_type' });
  maintenance_asset_type.hasMany(maintenance_checklist_item, { as: 'checklist_items', foreignKey: 'id_asset_type' });
  maintenance_checklist_unit.belongsTo(maintenance_asset_type, { as: 'maintenance_asset_type', foreignKey: 'id_asset_type' });
  maintenance_asset_type.hasMany(maintenance_checklist_unit, { as: 'checklist_units', foreignKey: 'id_asset_type' });
  maintenance_checklist_item.belongsTo(maintenance_checklist_unit, { as: 'maintenance_checklist_unit', foreignKey: 'id_checklist_unit' });
  maintenance_checklist_unit.hasMany(maintenance_checklist_item, { as: 'checklist_items', foreignKey: 'id_checklist_unit' });
  bagian_departemen.belongsTo(departemen, { as: "id_departemen_departemen", foreignKey: "id_departemen"});
  departemen.hasMany(bagian_departemen, { as: "bagian_departemens", foreignKey: "id_departemen"});
  inventory.belongsTo(departemen, { as: "id_departemen_departemen", foreignKey: "id_departemen"});
  departemen.hasMany(inventory, { as: "inventories", foreignKey: "id_departemen"});
  karyawan.belongsTo(departemen, { as: "id_departemen_departemen", foreignKey: "id_departemen"});
  departemen.hasMany(karyawan, { as: "karyawans", foreignKey: "id_departemen"});
  list_ticket.belongsTo(departemen, { as: "id_departemen_departemen", foreignKey: "id_departemen"});
  departemen.hasMany(list_ticket, { as: "list_tickets", foreignKey: "id_departemen"});
  preventive_schedule.belongsTo(departemen, { as: "id_departemen_departemen", foreignKey: "id_departemen"});
  departemen.hasMany(preventive_schedule, { as: "preventive_schedules", foreignKey: "id_departemen"});
  list_ticket.belongsTo(inventory, { as: "kode_asset_inventory", foreignKey: "kode_asset"});
  inventory.hasMany(list_ticket, { as: "list_tickets", foreignKey: "kode_asset"});
  schedule_asset.belongsTo(inventory, { as: "kode_asset_inventory", foreignKey: "kode_asset"});
  inventory.hasMany(schedule_asset, { as: "schedule_assets", foreignKey: "kode_asset"});
  karyawan.belongsTo(jabatan, { as: "id_jabatan_jabatan", foreignKey: "id_jabatan"});
  jabatan.hasMany(karyawan, { as: "karyawans", foreignKey: "id_jabatan"});
  approval_ticket.belongsTo(karyawan, { as: "nik_admin_karyawan", foreignKey: "nik_admin"});
  karyawan.hasMany(approval_ticket, { as: "approval_tickets", foreignKey: "nik_admin"});
  inventory.belongsTo(karyawan, { as: "nik_pemegang_karyawan", foreignKey: "nik_pemegang"});
  karyawan.hasMany(inventory, { as: "inventories", foreignKey: "nik_pemegang"});
  laporan_feedback.belongsTo(karyawan, { as: "nik_pelapor_karyawan", foreignKey: "nik_pelapor"});
  karyawan.hasMany(laporan_feedback, { as: "laporan_feedbacks", foreignKey: "nik_pelapor"});
  list_ticket.belongsTo(karyawan, { as: "nik_pelapor_karyawan", foreignKey: "nik_pelapor"});
  karyawan.hasMany(list_ticket, { as: "list_tickets", foreignKey: "nik_pelapor"});
  teknisi.belongsTo(karyawan, { as: "nik_karyawan", foreignKey: "nik"});
  karyawan.hasOne(teknisi, { as: "teknisi", foreignKey: "nik"});
  user.belongsTo(karyawan, { as: "nik_karyawan", foreignKey: "nik"});
  karyawan.hasMany(user, { as: "users", foreignKey: "nik"});
  inventory.belongsTo(kategori, { as: "id_kategori_kategori", foreignKey: "id_kategori"});
  kategori.hasMany(inventory, { as: "inventories", foreignKey: "id_kategori"});
  list_ticket.belongsTo(kategori, { as: "id_kategori_kategori", foreignKey: "id_kategori"});
  kategori.hasMany(list_ticket, { as: "list_tickets", foreignKey: "id_kategori"});
  preventive_schedule.belongsTo(kategori, { as: "id_kategori_kategori", foreignKey: "id_kategori"});
  kategori.hasMany(preventive_schedule, { as: "preventive_schedules", foreignKey: "id_kategori"});
  sub_kategori.belongsTo(kategori, { as: "id_kategori_kategori", foreignKey: "id_kategori"});
  kategori.hasMany(sub_kategori, { as: "sub_kategoris", foreignKey: "id_kategori"});
  teknisi.belongsTo(kategori, { as: "id_kategori_kategori", foreignKey: "id_kategori"});
  kategori.hasMany(teknisi, { as: "teknisis", foreignKey: "id_kategori"});
  approval_ticket.belongsTo(list_ticket, { as: "id_ticket_list_ticket", foreignKey: "id_ticket"});
  list_ticket.hasOne(approval_ticket, { as: "approval_ticket", foreignKey: "id_ticket"});
  assignment_ticket.belongsTo(list_ticket, { as: "id_ticket_list_ticket", foreignKey: "id_ticket"});
  list_ticket.hasOne(assignment_ticket, { as: "assignment_ticket", foreignKey: "id_ticket"});
  laporan_feedback.belongsTo(list_ticket, { as: "id_ticket_list_ticket", foreignKey: "id_ticket"});
  list_ticket.hasOne(laporan_feedback, { as: "laporan_feedback", foreignKey: "id_ticket"});
  ticket_chat.belongsTo(list_ticket, { as: "id_ticket_list_ticket", foreignKey: "id_ticket"});
  list_ticket.hasMany(ticket_chat, { as: "ticket_chats", foreignKey: "id_ticket"});
  inventory.belongsTo(preventive_schedule, { as: "id_preventive_schedule_preventive_schedule", foreignKey: "id_preventive_schedule"});
  preventive_schedule.hasMany(inventory, { as: "inventories", foreignKey: "id_preventive_schedule"});
  list_ticket.belongsTo(preventive_schedule, { as: "id_schedule_preventive_schedule", foreignKey: "id_schedule"});
  preventive_schedule.hasMany(list_ticket, { as: "list_tickets", foreignKey: "id_schedule"});
  schedule_asset.belongsTo(preventive_schedule, { as: "id_schedule_preventive_schedule", foreignKey: "id_schedule"});
  preventive_schedule.hasMany(schedule_asset, { as: "schedule_assets", foreignKey: "id_schedule"});
  list_ticket.belongsTo(sub_kategori, { as: "id_sub_kategori_sub_kategori", foreignKey: "id_sub_kategori"});
  sub_kategori.hasMany(list_ticket, { as: "list_tickets", foreignKey: "id_sub_kategori"});
  preventive_schedule.belongsTo(sub_kategori, { as: "id_sub_kategori_sub_kategori", foreignKey: "id_sub_kategori"});
  sub_kategori.hasMany(preventive_schedule, { as: "preventive_schedules", foreignKey: "id_sub_kategori"});
  assignment_ticket.belongsTo(teknisi, { as: "id_teknisi_teknisi", foreignKey: "id_teknisi"});
  teknisi.hasMany(assignment_ticket, { as: "assignment_tickets", foreignKey: "id_teknisi"});

  return {
    approval_ticket,
    asset_department_history,
    asset_hardware,
    asset_hardware_detail,
    asset_history,
    asset_holder_history,
    asset_software,
    asset_software_detail,
    assignment_ticket,
    bagian_departemen,
    checklist_approval,
    checklist_template,
    departemen,
    inventory,
    maintenance_asset_type,
    maintenance_checklist_item,
    maintenance_checklist_unit,
    jabatan,
    karyawan,
    kategori,
    laporan_feedback,
    list_ticket,
    preventive_schedule,
    schedule_asset,
    schedule_asset_claim,
    sub_kategori,
    teknisi,
    ticket_chat,
    ticket_checklist_result,
    ticket_progress_log,
    user,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
