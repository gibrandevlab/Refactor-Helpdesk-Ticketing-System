/* SQL Server additive migration. Run once against the database used by DB_NAME. */
IF OBJECT_ID('project_sistem_magang_test.maintenance_asset_type', 'U') IS NULL
BEGIN
  CREATE TABLE project_sistem_magang_test.maintenance_asset_type (
    id_asset_type INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    nama_jenis VARCHAR(100) NOT NULL,
    is_active BIT NOT NULL CONSTRAINT DF_maintenance_asset_type_active DEFAULT 1,
    created_at DATETIME NULL, updated_at DATETIME NULL,
    CONSTRAINT UQ_maintenance_asset_type_nama UNIQUE (nama_jenis)
  );
END;
IF OBJECT_ID('project_sistem_magang_test.maintenance_checklist_item', 'U') IS NULL
BEGIN
  CREATE TABLE project_sistem_magang_test.maintenance_checklist_item (
    id_maintenance_item INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    id_asset_type INT NOT NULL,
    uraian_pemeriksaan VARCHAR(255) NOT NULL,
    alat_metode VARCHAR(255) NULL, kriteria_hasil VARCHAR(255) NULL,
    urutan INT NOT NULL CONSTRAINT DF_maintenance_checklist_item_urutan DEFAULT 0,
    is_active BIT NOT NULL CONSTRAINT DF_maintenance_checklist_item_active DEFAULT 1,
    created_at DATETIME NULL, updated_at DATETIME NULL,
    CONSTRAINT FK_maintenance_checklist_item_type FOREIGN KEY (id_asset_type) REFERENCES project_sistem_magang_test.maintenance_asset_type(id_asset_type)
  );
  CREATE INDEX IX_maintenance_checklist_item_type_active_order ON project_sistem_magang_test.maintenance_checklist_item(id_asset_type, is_active, urutan);
END;
IF COL_LENGTH('project_sistem_magang_test.inventory', 'id_asset_type') IS NULL
  ALTER TABLE project_sistem_magang_test.inventory ADD id_asset_type INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_inventory_maintenance_asset_type')
  ALTER TABLE project_sistem_magang_test.inventory ADD CONSTRAINT FK_inventory_maintenance_asset_type FOREIGN KEY (id_asset_type) REFERENCES project_sistem_magang_test.maintenance_asset_type(id_asset_type);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_inventory_asset_type' AND object_id = OBJECT_ID('project_sistem_magang_test.inventory'))
  CREATE INDEX IX_inventory_asset_type ON project_sistem_magang_test.inventory(id_asset_type);
IF COL_LENGTH('project_sistem_magang_test.ticket_checklist_result', 'snapshot_uraian') IS NULL
BEGIN
  ALTER TABLE project_sistem_magang_test.ticket_checklist_result ADD snapshot_uraian VARCHAR(255) NULL, snapshot_alat_metode VARCHAR(255) NULL, snapshot_kriteria_hasil VARCHAR(255) NULL, snapshot_urutan INT NULL, id_asset_type_snapshot INT NULL, nama_jenis_snapshot VARCHAR(100) NULL;
END;
IF OBJECT_ID('project_sistem_magang_test.maintenance_checklist_unit', 'U') IS NULL
BEGIN
  CREATE TABLE project_sistem_magang_test.maintenance_checklist_unit (
    id_checklist_unit INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    id_asset_type INT NOT NULL,
    nama_unit VARCHAR(100) NOT NULL,
    urutan INT NOT NULL CONSTRAINT DF_maintenance_checklist_unit_urutan DEFAULT 0,
    is_active BIT NOT NULL CONSTRAINT DF_maintenance_checklist_unit_active DEFAULT 1,
    created_at DATETIME NULL, updated_at DATETIME NULL,
    CONSTRAINT FK_maintenance_checklist_unit_type FOREIGN KEY (id_asset_type) REFERENCES project_sistem_magang_test.maintenance_asset_type(id_asset_type),
    CONSTRAINT UQ_maintenance_checklist_unit_type_name UNIQUE (id_asset_type, nama_unit)
  );
  CREATE INDEX IX_maintenance_checklist_unit_type_active_order ON project_sistem_magang_test.maintenance_checklist_unit(id_asset_type, is_active, urutan);
END;
IF COL_LENGTH('project_sistem_magang_test.maintenance_checklist_item', 'id_checklist_unit') IS NULL
  ALTER TABLE project_sistem_magang_test.maintenance_checklist_item ADD id_checklist_unit INT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_maintenance_checklist_item_unit')
  ALTER TABLE project_sistem_magang_test.maintenance_checklist_item ADD CONSTRAINT FK_maintenance_checklist_item_unit FOREIGN KEY (id_checklist_unit) REFERENCES project_sistem_magang_test.maintenance_checklist_unit(id_checklist_unit);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_maintenance_checklist_item_unit_active_order' AND object_id = OBJECT_ID('project_sistem_magang_test.maintenance_checklist_item'))
  CREATE INDEX IX_maintenance_checklist_item_unit_active_order ON project_sistem_magang_test.maintenance_checklist_item(id_checklist_unit, is_active, urutan);
/* Preserve existing master items by giving each category its own default unit. */
INSERT INTO project_sistem_magang_test.maintenance_checklist_unit (id_asset_type, nama_unit, urutan, is_active, created_at, updated_at)
SELECT DISTINCT i.id_asset_type, 'Umum', 0, 1, GETDATE(), GETDATE()
FROM project_sistem_magang_test.maintenance_checklist_item i
WHERE NOT EXISTS (SELECT 1 FROM project_sistem_magang_test.maintenance_checklist_unit u WHERE u.id_asset_type = i.id_asset_type AND u.nama_unit = 'Umum');
UPDATE i SET id_checklist_unit = u.id_checklist_unit
FROM project_sistem_magang_test.maintenance_checklist_item i
JOIN project_sistem_magang_test.maintenance_checklist_unit u ON u.id_asset_type = i.id_asset_type AND u.nama_unit = 'Umum'
WHERE i.id_checklist_unit IS NULL;
IF COL_LENGTH('project_sistem_magang_test.ticket_checklist_result', 'id_checklist_unit_snapshot') IS NULL
  ALTER TABLE project_sistem_magang_test.ticket_checklist_result ADD id_checklist_unit_snapshot INT NULL, nama_unit_snapshot VARCHAR(100) NULL, urutan_unit_snapshot INT NULL;
/* id_item remains populated for legacy uniqueness. New snapshot rows use their new
   master item id, so the legacy FK must not reject that independent identifier. */
DECLARE @legacyChecklistFk sysname;
SELECT @legacyChecklistFk = fk.name FROM sys.foreign_keys fk
JOIN sys.tables t ON fk.parent_object_id = t.object_id
JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE s.name = 'project_sistem_magang_test' AND t.name = 'ticket_checklist_result'
  AND OBJECT_NAME(fk.referenced_object_id) = 'checklist_template';
IF @legacyChecklistFk IS NOT NULL EXEC('ALTER TABLE project_sistem_magang_test.ticket_checklist_result DROP CONSTRAINT [' + @legacyChecklistFk + ']');

/* Preventive workflow uses the explicit status "Menunggu Approval User".
   Legacy database columns were NVARCHAR(17), which truncates that value. */
IF EXISTS (
  SELECT 1
  FROM sys.columns c
  JOIN sys.tables t ON t.object_id = c.object_id
  JOIN sys.schemas s ON s.schema_id = t.schema_id
  WHERE s.name = 'project_sistem_magang_test'
    AND t.name = 'assignment_ticket'
    AND c.name = 'status_pengerjaan'
    AND c.max_length < 100
)
  ALTER TABLE project_sistem_magang_test.assignment_ticket
    ALTER COLUMN status_pengerjaan NVARCHAR(50) NOT NULL;

IF EXISTS (
  SELECT 1
  FROM sys.columns c
  JOIN sys.tables t ON t.object_id = c.object_id
  JOIN sys.schemas s ON s.schema_id = t.schema_id
  WHERE s.name = 'project_sistem_magang_test'
    AND t.name = 'list_ticket'
    AND c.name = 'status'
    AND c.max_length < 100
)
  ALTER TABLE project_sistem_magang_test.list_ticket
    ALTER COLUMN status NVARCHAR(50) NOT NULL;
