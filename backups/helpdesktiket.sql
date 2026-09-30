-- DROP SCHEMA project_sistem_magang_test;

CREATE SCHEMA project_sistem_magang_test;
-- master.project_sistem_magang_test.asset_department_history definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.asset_department_history;

CREATE TABLE master.project_sistem_magang_test.asset_department_history (
	id int IDENTITY(4,1) NOT NULL,
	kode_asset nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	id_departemen_lama int DEFAULT NULL NULL,
	nama_departemen_lama nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	id_departemen_baru int DEFAULT NULL NULL,
	nama_departemen_baru nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	keterangan nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	tanggal_pindah datetime2(0) DEFAULT getdate() NOT NULL,
	CONSTRAINT PK_asset_department_history_id PRIMARY KEY (id)
);
 CREATE NONCLUSTERED INDEX idx_asset_department_history_kode ON master.project_sistem_magang_test.asset_department_history (  kode_asset ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.asset_hardware definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.asset_hardware;

CREATE TABLE master.project_sistem_magang_test.asset_hardware (
	id int IDENTITY(1388,1) NOT NULL,
	kode_asset nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	komponen nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	spesifikasi nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	keterangan nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	created_at datetime2(0) DEFAULT getdate() NULL,
	updated_at datetime2(0) DEFAULT getdate() NULL,
	CONSTRAINT PK_asset_hardware_id PRIMARY KEY (id)
);
 CREATE NONCLUSTERED INDEX idx_hardware_kode ON master.project_sistem_magang_test.asset_hardware (  kode_asset ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.asset_hardware_detail definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.asset_hardware_detail;

CREATE TABLE master.project_sistem_magang_test.asset_hardware_detail (
	kode_asset nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	serial_no_pc nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	mobo_type nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	kelas nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	processor nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	hdd_size nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	hdd_model nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	hdd_serial_no nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	memory_size nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	memory_type nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	display nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	updated_at datetime DEFAULT getdate() NOT NULL,
	CONSTRAINT PK_asset_hardware_detail_kode_asset PRIMARY KEY (kode_asset)
);


-- master.project_sistem_magang_test.asset_history definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.asset_history;

CREATE TABLE master.project_sistem_magang_test.asset_history (
	id int IDENTITY(1,1) NOT NULL,
	kode_asset nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	tanggal date NOT NULL,
	jenis_aktivitas nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	deskripsi nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	dilakukan_oleh nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	created_at datetime2(0) DEFAULT getdate() NULL,
	CONSTRAINT PK_asset_history_id PRIMARY KEY (id)
);
 CREATE NONCLUSTERED INDEX idx_history_kode ON master.project_sistem_magang_test.asset_history (  kode_asset ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.asset_holder_history definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.asset_holder_history;

CREATE TABLE master.project_sistem_magang_test.asset_holder_history (
	id int IDENTITY(2,1) NOT NULL,
	kode_asset nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	nik_lama nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	nama_lama nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	nik_baru nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	nama_baru nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	keterangan nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	tanggal_pindah datetime2(0) DEFAULT getdate() NOT NULL,
	CONSTRAINT PK_asset_holder_history_id PRIMARY KEY (id)
);
 CREATE NONCLUSTERED INDEX kode_asset ON master.project_sistem_magang_test.asset_holder_history (  kode_asset ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.asset_software definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.asset_software;

CREATE TABLE master.project_sistem_magang_test.asset_software (
	id int IDENTITY(253,1) NOT NULL,
	kode_asset nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	nama_software nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	versi nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	lisensi nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	tanggal_install date DEFAULT NULL NULL,
	keterangan nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	created_at datetime2(0) DEFAULT getdate() NULL,
	updated_at datetime2(0) DEFAULT getdate() NULL,
	CONSTRAINT PK_asset_software_id PRIMARY KEY (id)
);
 CREATE NONCLUSTERED INDEX idx_software_kode ON master.project_sistem_magang_test.asset_software (  kode_asset ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.asset_software_detail definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.asset_software_detail;

CREATE TABLE master.project_sistem_magang_test.asset_software_detail (
	kode_asset nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	operating_system nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	serial_no_os nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	ms_office nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	ms_office_sn nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	erp nvarchar(5) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'TIDAK' NULL,
	wms nvarchar(5) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'TIDAK' NULL,
	eris nvarchar(5) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'TIDAK' NULL,
	cmms nvarchar(5) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'TIDAK' NULL,
	visio nvarchar(5) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'TIDAK' NULL,
	autocad nvarchar(5) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'TIDAK' NULL,
	kaspersky nvarchar(5) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'TIDAK' NULL,
	ms_project nvarchar(5) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'TIDAK' NULL,
	acrobat nvarchar(5) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'TIDAK' NULL,
	updated_at datetime DEFAULT getdate() NOT NULL,
	CONSTRAINT PK_asset_software_detail_kode_asset PRIMARY KEY (kode_asset)
);


-- master.project_sistem_magang_test.checklist_approval definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.checklist_approval;

CREATE TABLE master.project_sistem_magang_test.checklist_approval (
	id_ticket nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	dibuat_oleh_nik nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	tanggal_dibuat datetime2(0) DEFAULT NULL NULL,
	diketahui_oleh_nik nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	tanggal_diketahui datetime2(0) DEFAULT NULL NULL,
	status_diketahui nvarchar(8) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'Menunggu' NOT NULL,
	catatan_diketahui nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	disetujui_oleh_nik nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	tanggal_disetujui datetime2(0) DEFAULT NULL NULL,
	status_disetujui nvarchar(8) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'Menunggu' NOT NULL,
	catatan_disetujui nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT PK_checklist_approval_id_ticket PRIMARY KEY (id_ticket)
);


-- master.project_sistem_magang_test.checklist_template definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.checklist_template;

CREATE TABLE master.project_sistem_magang_test.checklist_template (
	id_item int IDENTITY(27,1) NOT NULL,
	kategori_unit nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	uraian_pekerjaan nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	alat_yang_digunakan nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	penerimaan_default nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	urutan int DEFAULT 0 NULL,
	CONSTRAINT PK_checklist_template_id_item PRIMARY KEY (id_item)
);


-- master.project_sistem_magang_test.departemen definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.departemen;

CREATE TABLE master.project_sistem_magang_test.departemen (
	id_departemen int IDENTITY(28,1) NOT NULL,
	nama_departemen nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	CONSTRAINT PK_departemen_id_departemen PRIMARY KEY (id_departemen),
	CONSTRAINT departemen$nama_departemen UNIQUE (nama_departemen)
);


-- master.project_sistem_magang_test.jabatan definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.jabatan;

CREATE TABLE master.project_sistem_magang_test.jabatan (
	id_jabatan int IDENTITY(8,1) NOT NULL,
	nama_jabatan nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	CONSTRAINT PK_jabatan_id_jabatan PRIMARY KEY (id_jabatan),
	CONSTRAINT jabatan$nama_jabatan UNIQUE (nama_jabatan)
);


-- master.project_sistem_magang_test.kategori definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.kategori;

CREATE TABLE master.project_sistem_magang_test.kategori (
	id_kategori int IDENTITY(8,1) NOT NULL,
	nama_kategori nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	CONSTRAINT PK_kategori_id_kategori PRIMARY KEY (id_kategori),
	CONSTRAINT kategori$nama_kategori UNIQUE (nama_kategori)
);


-- master.project_sistem_magang_test.maintenance_asset_type definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.maintenance_asset_type;

CREATE TABLE master.project_sistem_magang_test.maintenance_asset_type (
	id_asset_type int IDENTITY(1,1) NOT NULL,
	nama_jenis varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	is_active bit DEFAULT 1 NOT NULL,
	created_at datetime NULL,
	updated_at datetime NULL,
	CONSTRAINT PK__maintena__E07FB8E788230A1F PRIMARY KEY (id_asset_type),
	CONSTRAINT UQ_maintenance_asset_type_nama UNIQUE (nama_jenis)
);


-- master.project_sistem_magang_test.schedule_asset_claim definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.schedule_asset_claim;

CREATE TABLE master.project_sistem_magang_test.schedule_asset_claim (
	id_claim int IDENTITY(15,1) NOT NULL,
	id_schedule int NOT NULL,
	kode_asset nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	id_teknisi nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	id_ticket nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	claimed_at datetime2(0) DEFAULT getdate() NULL,
	CONSTRAINT PK_schedule_asset_claim_id_claim PRIMARY KEY (id_claim),
	CONSTRAINT schedule_asset_claim$uniq_schedule_asset UNIQUE (id_schedule,kode_asset)
);


-- master.project_sistem_magang_test.ticket_checklist_result definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.ticket_checklist_result;

CREATE TABLE master.project_sistem_magang_test.ticket_checklist_result (
	id_result int IDENTITY(1975,1) NOT NULL,
	id_ticket nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	id_item int NOT NULL,
	kondisi nvarchar(2) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	kondisi_huruf nvarchar(1) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	catatan nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	checked_at datetime2(0) DEFAULT NULL NULL,
	snapshot_uraian varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	snapshot_alat_metode varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	snapshot_kriteria_hasil varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	snapshot_urutan int NULL,
	id_asset_type_snapshot int NULL,
	nama_jenis_snapshot varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	id_checklist_unit_snapshot int NULL,
	nama_unit_snapshot varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	urutan_unit_snapshot int NULL,
	CONSTRAINT PK_ticket_checklist_result_id_result PRIMARY KEY (id_result),
	CONSTRAINT ticket_checklist_result$uniq_ticket_item UNIQUE (id_ticket,id_item)
);
 CREATE NONCLUSTERED INDEX id_item ON master.project_sistem_magang_test.ticket_checklist_result (  id_item ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.bagian_departemen definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.bagian_departemen;

CREATE TABLE master.project_sistem_magang_test.bagian_departemen (
	id_bagian int IDENTITY(17,1) NOT NULL,
	id_departemen int NOT NULL,
	nama_bagian nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	CONSTRAINT PK_bagian_departemen_id_bagian PRIMARY KEY (id_bagian),
	CONSTRAINT bagian_departemen$bagian_departemen_ibfk_1 FOREIGN KEY (id_departemen) REFERENCES master.project_sistem_magang_test.departemen(id_departemen) ON DELETE CASCADE ON UPDATE CASCADE
);
 CREATE NONCLUSTERED INDEX id_departemen ON master.project_sistem_magang_test.bagian_departemen (  id_departemen ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.karyawan definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.karyawan;

CREATE TABLE master.project_sistem_magang_test.karyawan (
	nik nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	nama nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	tanda_tangan nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	alamat nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	jenis_kelamin nvarchar(9) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	id_departemen int NOT NULL,
	id_bagian int DEFAULT NULL NULL,
	id_jabatan int NOT NULL,
	no_hp nvarchar(15) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	tanggal_masuk date DEFAULT NULL NULL,
	CONSTRAINT PK_karyawan_nik PRIMARY KEY (nik),
	CONSTRAINT karyawan$karyawan_ibfk_1 FOREIGN KEY (id_departemen) REFERENCES master.project_sistem_magang_test.departemen(id_departemen) ON UPDATE CASCADE,
	CONSTRAINT karyawan$karyawan_ibfk_2 FOREIGN KEY (id_bagian) REFERENCES master.project_sistem_magang_test.bagian_departemen(id_bagian),
	CONSTRAINT karyawan$karyawan_ibfk_3 FOREIGN KEY (id_jabatan) REFERENCES master.project_sistem_magang_test.jabatan(id_jabatan) ON UPDATE CASCADE
);
 CREATE NONCLUSTERED INDEX id_bagian ON master.project_sistem_magang_test.karyawan (  id_bagian ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX id_departemen ON master.project_sistem_magang_test.karyawan (  id_departemen ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX id_jabatan ON master.project_sistem_magang_test.karyawan (  id_jabatan ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.maintenance_checklist_item definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.maintenance_checklist_item;

CREATE TABLE master.project_sistem_magang_test.maintenance_checklist_item (
	id_maintenance_item int IDENTITY(1,1) NOT NULL,
	id_asset_type int NOT NULL,
	uraian_pemeriksaan varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	alat_metode varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	kriteria_hasil varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	urutan int DEFAULT 0 NOT NULL,
	is_active bit DEFAULT 1 NOT NULL,
	created_at datetime NULL,
	updated_at datetime NULL,
	id_checklist_unit int NULL,
	CONSTRAINT PK__maintena__EC877222E08D69C6 PRIMARY KEY (id_maintenance_item),
	CONSTRAINT FK_maintenance_checklist_item_type FOREIGN KEY (id_asset_type) REFERENCES master.project_sistem_magang_test.maintenance_asset_type(id_asset_type)
);
 CREATE NONCLUSTERED INDEX IX_maintenance_checklist_item_type_active_order ON master.project_sistem_magang_test.maintenance_checklist_item (  id_asset_type ASC  , is_active ASC  , urutan ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX IX_maintenance_checklist_item_unit_active_order ON master.project_sistem_magang_test.maintenance_checklist_item (  id_checklist_unit ASC  , is_active ASC  , urutan ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.sub_kategori definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.sub_kategori;

CREATE TABLE master.project_sistem_magang_test.sub_kategori (
	id_sub_kategori int IDENTITY(12,1) NOT NULL,
	id_kategori int NOT NULL,
	nama_sub_kategori nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	CONSTRAINT PK_sub_kategori_id_sub_kategori PRIMARY KEY (id_sub_kategori),
	CONSTRAINT sub_kategori$sub_kategori_ibfk_1 FOREIGN KEY (id_kategori) REFERENCES master.project_sistem_magang_test.kategori(id_kategori) ON DELETE CASCADE ON UPDATE CASCADE
);
 CREATE NONCLUSTERED INDEX id_kategori ON master.project_sistem_magang_test.sub_kategori (  id_kategori ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.teknisi definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.teknisi;

CREATE TABLE master.project_sistem_magang_test.teknisi (
	id_teknisi nvarchar(15) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	nik nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	id_kategori int NOT NULL,
	status nvarchar(8) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'Aktif' NOT NULL,
	jumlah_tiket_ditangani int DEFAULT 0 NOT NULL,
	CONSTRAINT PK_teknisi_id_teknisi PRIMARY KEY (id_teknisi),
	CONSTRAINT teknisi$nik UNIQUE (nik),
	CONSTRAINT teknisi$teknisi_ibfk_1 FOREIGN KEY (nik) REFERENCES master.project_sistem_magang_test.karyawan(nik) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT teknisi$teknisi_ibfk_2 FOREIGN KEY (id_kategori) REFERENCES master.project_sistem_magang_test.kategori(id_kategori) ON UPDATE CASCADE
);
 CREATE NONCLUSTERED INDEX id_kategori ON master.project_sistem_magang_test.teknisi (  id_kategori ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.[user] definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.[user];

CREATE TABLE master.project_sistem_magang_test.[user] (
	id_user int IDENTITY(46,1) NOT NULL,
	username nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	password nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	nik nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[level] nvarchar(7) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'Users' NOT NULL,
	status nvarchar(8) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'Aktif' NOT NULL,
	CONSTRAINT PK_user_id_user PRIMARY KEY (id_user),
	CONSTRAINT user$username UNIQUE (username),
	CONSTRAINT user$user_ibfk_1 FOREIGN KEY (nik) REFERENCES master.project_sistem_magang_test.karyawan(nik) ON DELETE CASCADE ON UPDATE CASCADE
);
 CREATE NONCLUSTERED INDEX nik ON master.project_sistem_magang_test.user (  nik ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.preventive_schedule definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.preventive_schedule;

CREATE TABLE master.project_sistem_magang_test.preventive_schedule (
	id_schedule int IDENTITY(44,1) NOT NULL,
	nama_schedule nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	id_departemen int NOT NULL,
	id_kategori int DEFAULT NULL NULL,
	id_sub_kategori int DEFAULT NULL NULL,
	frekuensi int NOT NULL,
	satuan nvarchar(6) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	tanggal_mulai date DEFAULT NULL NULL,
	tanggal_selesai date DEFAULT NULL NULL,
	id_teknis nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	deskripsi nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	is_active smallint DEFAULT 1 NULL,
	created_at datetime DEFAULT getdate() NOT NULL,
	updated_at datetime DEFAULT getdate() NOT NULL,
	checklist_kategori nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT PK_preventive_schedule_id_schedule PRIMARY KEY (id_schedule),
	CONSTRAINT preventive_schedule$preventive_schedule_ibfk_1 FOREIGN KEY (id_departemen) REFERENCES master.project_sistem_magang_test.departemen(id_departemen),
	CONSTRAINT preventive_schedule$preventive_schedule_ibfk_2 FOREIGN KEY (id_kategori) REFERENCES master.project_sistem_magang_test.kategori(id_kategori),
	CONSTRAINT preventive_schedule$preventive_schedule_ibfk_3 FOREIGN KEY (id_sub_kategori) REFERENCES master.project_sistem_magang_test.sub_kategori(id_sub_kategori)
);
 CREATE NONCLUSTERED INDEX id_departemen ON master.project_sistem_magang_test.preventive_schedule (  id_departemen ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX id_kategori ON master.project_sistem_magang_test.preventive_schedule (  id_kategori ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX id_sub_kategori ON master.project_sistem_magang_test.preventive_schedule (  id_sub_kategori ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.inventory definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.inventory;

CREATE TABLE master.project_sistem_magang_test.inventory (
	kode_asset nvarchar(15) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	nama_barang nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	merk_model nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	computer_name nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	it_priority nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	tahun_perolehan smallint DEFAULT NULL NULL,
	user_pemakai nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	email nvarchar(150) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	extension nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	divisi nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	gedung nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	ip_address nvarchar(45) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	id_departemen int NOT NULL,
	id_kategori int NOT NULL,
	nik_pemegang nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	status_aset nvarchar(11) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'Aktif' NOT NULL,
	foto nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	ram nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	prosesor nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	penyimpanan nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	last_maintenance date DEFAULT NULL NULL,
	next_maintenance date DEFAULT NULL NULL,
	id_preventive_schedule int DEFAULT NULL NULL,
	id_asset_type int NULL,
	CONSTRAINT PK_inventory_kode_asset PRIMARY KEY (kode_asset),
	CONSTRAINT FK_inventory_maintenance_asset_type FOREIGN KEY (id_asset_type) REFERENCES master.project_sistem_magang_test.maintenance_asset_type(id_asset_type),
	CONSTRAINT inventory$inventory_ibfk_1 FOREIGN KEY (id_departemen) REFERENCES master.project_sistem_magang_test.departemen(id_departemen) ON UPDATE CASCADE,
	CONSTRAINT inventory$inventory_ibfk_2 FOREIGN KEY (id_kategori) REFERENCES master.project_sistem_magang_test.kategori(id_kategori) ON UPDATE CASCADE,
	CONSTRAINT inventory$inventory_ibfk_3 FOREIGN KEY (nik_pemegang) REFERENCES master.project_sistem_magang_test.karyawan(nik) ON DELETE SET NULL,
	CONSTRAINT inventory$inventory_ibfk_4 FOREIGN KEY (id_preventive_schedule) REFERENCES master.project_sistem_magang_test.preventive_schedule(id_schedule) ON DELETE SET NULL
);
 CREATE NONCLUSTERED INDEX IX_inventory_asset_type ON master.project_sistem_magang_test.inventory (  id_asset_type ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX id_departemen ON master.project_sistem_magang_test.inventory (  id_departemen ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX id_kategori ON master.project_sistem_magang_test.inventory (  id_kategori ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX id_preventive_schedule ON master.project_sistem_magang_test.inventory (  id_preventive_schedule ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX nik_pemegang ON master.project_sistem_magang_test.inventory (  nik_pemegang ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.list_ticket definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.list_ticket;

CREATE TABLE master.project_sistem_magang_test.list_ticket (
	id_ticket nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	nik_pelapor nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	id_departemen int NOT NULL,
	id_kategori int DEFAULT NULL NULL,
	id_sub_kategori int DEFAULT NULL NULL,
	kode_asset nvarchar(15) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	deskripsi nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lampiran nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	tanggal_lapor datetime2(0) DEFAULT getdate() NOT NULL,
	status nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'Menunggu Approval' NOT NULL,
	prioritas nvarchar(6) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'Normal' NULL,
	deadline datetime2(0) DEFAULT NULL NULL,
	id_schedule int DEFAULT NULL NULL,
	CONSTRAINT PK_list_ticket_id_ticket PRIMARY KEY (id_ticket),
	CONSTRAINT list_ticket$fk_list_ticket_schedule FOREIGN KEY (id_schedule) REFERENCES master.project_sistem_magang_test.preventive_schedule(id_schedule),
	CONSTRAINT list_ticket$list_ticket_ibfk_1 FOREIGN KEY (nik_pelapor) REFERENCES master.project_sistem_magang_test.karyawan(nik),
	CONSTRAINT list_ticket$list_ticket_ibfk_2 FOREIGN KEY (id_departemen) REFERENCES master.project_sistem_magang_test.departemen(id_departemen) ON UPDATE CASCADE,
	CONSTRAINT list_ticket$list_ticket_ibfk_3 FOREIGN KEY (id_kategori) REFERENCES master.project_sistem_magang_test.kategori(id_kategori) ON UPDATE CASCADE,
	CONSTRAINT list_ticket$list_ticket_ibfk_4 FOREIGN KEY (id_sub_kategori) REFERENCES master.project_sistem_magang_test.sub_kategori(id_sub_kategori),
	CONSTRAINT list_ticket$list_ticket_ibfk_5 FOREIGN KEY (kode_asset) REFERENCES master.project_sistem_magang_test.inventory(kode_asset) ON DELETE SET NULL
);
 CREATE NONCLUSTERED INDEX fk_list_ticket_schedule ON master.project_sistem_magang_test.list_ticket (  id_schedule ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX id_departemen ON master.project_sistem_magang_test.list_ticket (  id_departemen ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX id_kategori ON master.project_sistem_magang_test.list_ticket (  id_kategori ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX id_sub_kategori ON master.project_sistem_magang_test.list_ticket (  id_sub_kategori ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX kode_asset ON master.project_sistem_magang_test.list_ticket (  kode_asset ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX nik_pelapor ON master.project_sistem_magang_test.list_ticket (  nik_pelapor ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.schedule_asset definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.schedule_asset;

CREATE TABLE master.project_sistem_magang_test.schedule_asset (
	id_schedule int NOT NULL,
	kode_asset nvarchar(15) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	CONSTRAINT PK_schedule_asset_id_schedule PRIMARY KEY (id_schedule,kode_asset),
	CONSTRAINT schedule_asset$schedule_asset_ibfk_1 FOREIGN KEY (id_schedule) REFERENCES master.project_sistem_magang_test.preventive_schedule(id_schedule) ON DELETE CASCADE,
	CONSTRAINT schedule_asset$schedule_asset_ibfk_2 FOREIGN KEY (kode_asset) REFERENCES master.project_sistem_magang_test.inventory(kode_asset)
);
 CREATE NONCLUSTERED INDEX kode_asset ON master.project_sistem_magang_test.schedule_asset (  kode_asset ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.ticket_chat definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.ticket_chat;

CREATE TABLE master.project_sistem_magang_test.ticket_chat (
	id_chat int IDENTITY(8,1) NOT NULL,
	id_ticket nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	sender_id nvarchar(15) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	sender_role nvarchar(7) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	sender_name nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	message nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	attachment_url nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	created_at datetime2(0) DEFAULT getdate() NULL,
	is_read smallint DEFAULT 0 NULL,
	CONSTRAINT PK_ticket_chat_id_chat PRIMARY KEY (id_chat),
	CONSTRAINT ticket_chat$ticket_chat_ibfk_1 FOREIGN KEY (id_ticket) REFERENCES master.project_sistem_magang_test.list_ticket(id_ticket) ON DELETE CASCADE
);
 CREATE NONCLUSTERED INDEX id_ticket ON master.project_sistem_magang_test.ticket_chat (  id_ticket ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.approval_ticket definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.approval_ticket;

CREATE TABLE master.project_sistem_magang_test.approval_ticket (
	id_approval int IDENTITY(58,1) NOT NULL,
	id_ticket nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	nik_admin nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	tanggal_approval datetime2(0) DEFAULT NULL NULL,
	status_approval nvarchar(17) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'Menunggu Approval' NOT NULL,
	catatan_approval nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	CONSTRAINT PK_approval_ticket_id_approval PRIMARY KEY (id_approval),
	CONSTRAINT approval_ticket$id_ticket UNIQUE (id_ticket),
	CONSTRAINT approval_ticket$approval_ticket_ibfk_1 FOREIGN KEY (id_ticket) REFERENCES master.project_sistem_magang_test.list_ticket(id_ticket) ON DELETE CASCADE,
	CONSTRAINT approval_ticket$approval_ticket_ibfk_2 FOREIGN KEY (nik_admin) REFERENCES master.project_sistem_magang_test.karyawan(nik) ON UPDATE CASCADE
);
 CREATE NONCLUSTERED INDEX nik_admin ON master.project_sistem_magang_test.approval_ticket (  nik_admin ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.assignment_ticket definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.assignment_ticket;

CREATE TABLE master.project_sistem_magang_test.assignment_ticket (
	id_assignment int IDENTITY(152,1) NOT NULL,
	id_ticket nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	id_teknisi nvarchar(15) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	tanggal_assign datetime2(0) DEFAULT getdate() NOT NULL,
	progress smallint DEFAULT 0 NULL,
	catatan_penyelesaian nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	status_pengerjaan nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'Menunggu Diproses' NOT NULL,
	tanggal_selesai datetime2(0) DEFAULT NULL NULL,
	is_paused smallint DEFAULT 0 NULL,
	paused_at datetime2(0) DEFAULT NULL NULL,
	return_reason nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	return_status nvarchar(8) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT N'None' NULL,
	user_konfirmasi smallint DEFAULT 0 NOT NULL,
	tanggal_konfirmasi_user datetime2(0) DEFAULT NULL NULL,
	admin_approve smallint DEFAULT 0 NULL,
	admin_approve_by nvarchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	admin_approve_at datetime2(0) DEFAULT NULL NULL,
	admin_konfirmasi smallint DEFAULT 0 NULL,
	tanggal_konfirmasi_admin datetime2(0) DEFAULT NULL NULL,
	CONSTRAINT PK_assignment_ticket_id_assignment PRIMARY KEY (id_assignment),
	CONSTRAINT assignment_ticket$id_ticket UNIQUE (id_ticket),
	CONSTRAINT assignment_ticket$assignment_ticket_ibfk_1 FOREIGN KEY (id_ticket) REFERENCES master.project_sistem_magang_test.list_ticket(id_ticket) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT assignment_ticket$assignment_ticket_ibfk_2 FOREIGN KEY (id_teknisi) REFERENCES master.project_sistem_magang_test.teknisi(id_teknisi)
);
 CREATE NONCLUSTERED INDEX id_teknisi ON master.project_sistem_magang_test.assignment_ticket (  id_teknisi ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
 CREATE NONCLUSTERED INDEX idx_assignment_ticket_teknisi ON master.project_sistem_magang_test.assignment_ticket (  id_teknisi ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.laporan_feedback definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.laporan_feedback;

CREATE TABLE master.project_sistem_magang_test.laporan_feedback (
	id_feedback int IDENTITY(4,1) NOT NULL,
	id_ticket nvarchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	nik_pelapor nvarchar(10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	tanggal datetime2(0) DEFAULT getdate() NOT NULL,
	feedback nvarchar(7) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	keterangan nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS DEFAULT NULL NULL,
	rating tinyint DEFAULT 5 NOT NULL,
	CONSTRAINT PK_laporan_feedback_id_feedback PRIMARY KEY (id_feedback),
	CONSTRAINT laporan_feedback$id_ticket UNIQUE (id_ticket),
	CONSTRAINT laporan_feedback$laporan_feedback_ibfk_1 FOREIGN KEY (id_ticket) REFERENCES master.project_sistem_magang_test.list_ticket(id_ticket) ON DELETE CASCADE,
	CONSTRAINT laporan_feedback$laporan_feedback_ibfk_2 FOREIGN KEY (nik_pelapor) REFERENCES master.project_sistem_magang_test.karyawan(nik) ON UPDATE CASCADE
);
 CREATE NONCLUSTERED INDEX nik_pelapor ON master.project_sistem_magang_test.laporan_feedback (  nik_pelapor ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- master.project_sistem_magang_test.ticket_progress_log definition

-- Drop table

-- DROP TABLE master.project_sistem_magang_test.ticket_progress_log;

CREATE TABLE master.project_sistem_magang_test.ticket_progress_log (
	id_log int IDENTITY(283,1) NOT NULL,
	id_assignment int NOT NULL,
	progress smallint NOT NULL,
	catatan nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	status_pengerjaan nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	created_at datetime DEFAULT getdate() NOT NULL,
	CONSTRAINT PK_ticket_progress_log_id_log PRIMARY KEY (id_log),
	CONSTRAINT ticket_progress_log$ticket_progress_log_ibfk_1 FOREIGN KEY (id_assignment) REFERENCES master.project_sistem_magang_test.assignment_ticket(id_assignment) ON DELETE CASCADE
);
 CREATE NONCLUSTERED INDEX id_assignment ON master.project_sistem_magang_test.ticket_progress_log (  id_assignment ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;


-- project_sistem_magang_test.v_dashboard_summary source

ALTER VIEW project_sistem_magang_test.v_dashboard_summary AS
SELECT 
    t.total_tiket,
    t.menunggu_approval,
    t.menunggu_assignment,
    t.on_process,
    t.solved,
    t.reject,
    f.total_feedback,
    f.feedback_positif,
    f.feedback_negatif,
    f.rata_rata_rating
FROM (
    -- Agregasi Status Tiket
    SELECT 
        COUNT(*) AS total_tiket,
        SUM(CASE WHEN status = 'Menunggu Approval' THEN 1 ELSE 0 END) AS menunggu_approval,
        SUM(CASE WHEN status = 'Menunggu Assignment' THEN 1 ELSE 0 END) AS menunggu_assignment,
        SUM(CASE WHEN status = 'On Process' THEN 1 ELSE 0 END) AS on_process,
        SUM(CASE WHEN status = 'Solved' THEN 1 ELSE 0 END) AS solved,
        SUM(CASE WHEN status = 'Reject' THEN 1 ELSE 0 END) AS reject
    FROM project_sistem_magang_test.list_ticket
) t
CROSS JOIN (
    -- Agregasi Ringkasan Feedback & Rating
    SELECT 
        COUNT(*) AS total_feedback,
        SUM(CASE WHEN feedback = 'Positif' THEN 1 ELSE 0 END) AS feedback_positif,
        SUM(CASE WHEN feedback = 'Negatif' THEN 1 ELSE 0 END) AS feedback_negatif,
        COALESCE(ROUND(AVG(CAST(rating AS DECIMAL(3,2))), 2), 0) AS rata_rata_rating
    FROM project_sistem_magang_test.laporan_feedback
) f;