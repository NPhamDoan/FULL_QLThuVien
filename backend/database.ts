import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function initializeDatabase(dbPath: string = './Database/dev.db'): Database.Database {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);

  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  // Create tables (latest schema)
  db.exec(`
    CREATE TABLE IF NOT EXISTS DocGia (
      maDocGia    TEXT PRIMARY KEY,
      hoTen       TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      soDienThoai TEXT NOT NULL,
      ngayHetHan  TEXT NOT NULL,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Sach (
      maSach    TEXT PRIMARY KEY,
      tieuDe    TEXT NOT NULL,
      tacGia    TEXT NOT NULL,
      soBanSao  INTEGER NOT NULL DEFAULT 1 CHECK (soBanSao >= 0),
      soMat     INTEGER NOT NULL DEFAULT 0 CHECK (soMat >= 0),
      soBaoTri  INTEGER NOT NULL DEFAULT 0 CHECK (soBaoTri >= 0),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS PhieuMuon (
      maPhieu       TEXT PRIMARY KEY,
      maDocGia      TEXT NOT NULL,
      maSach        TEXT NOT NULL,
      ngayMuon      TEXT NOT NULL,
      hanTra        TEXT NOT NULL,
      ngayTraThucTe TEXT,
      trangThai     TEXT NOT NULL DEFAULT 'DANG_MUON' CHECK (trangThai IN ('DANG_MUON', 'DA_TRA')),
      tienPhat      REAL NOT NULL DEFAULT 0,
      createdAt     TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt     TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (maDocGia) REFERENCES DocGia(maDocGia),
      FOREIGN KEY (maSach) REFERENCES Sach(maSach)
    );

    CREATE TABLE IF NOT EXISTS TaiKhoan (
      maTaiKhoan  TEXT PRIMARY KEY,
      tenDangNhap TEXT NOT NULL UNIQUE,
      matKhau     TEXT NOT NULL,
      vaiTro      TEXT NOT NULL DEFAULT 'THU_THU' CHECK (vaiTro IN ('THU_THU', 'QUAN_TRI_VIEN')),
      trangThai   TEXT NOT NULL DEFAULT 'HOAT_DONG' CHECK (trangThai IN ('HOAT_DONG', 'BI_KHOA')),
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sach_tieuDe ON Sach(tieuDe);
    CREATE INDEX IF NOT EXISTS idx_sach_tacGia ON Sach(tacGia);
    CREATE INDEX IF NOT EXISTS idx_phieumuon_maDocGia ON PhieuMuon(maDocGia);
    CREATE INDEX IF NOT EXISTS idx_phieumuon_maSach ON PhieuMuon(maSach);
    CREATE INDEX IF NOT EXISTS idx_phieumuon_trangThai ON PhieuMuon(trangThai);
  `);

  // Migration: if old Sach table has tinhTrang column, migrate to counters
  migrateSachTinhTrang(db);

  return db;
}

/**
 * Migration: old schema có column tinhTrang, đổi sang counters (soBanSao/soMat/soBaoTri).
 * Logic: mỗi row Sach cũ đại diện 1 cuốn → soBanSao = 1, và đánh dấu soMat/soBaoTri theo tinhTrang cũ.
 */
function migrateSachTinhTrang(database: Database.Database): void {
  const columns = database.prepare(`PRAGMA table_info(Sach)`).all() as { name: string }[];
  const hasTinhTrang = columns.some(c => c.name === 'tinhTrang');
  if (!hasTinhTrang) return;

  console.log('[migration] Sach có column tinhTrang cũ, đang migrate...');

  const migrate = database.transaction(() => {
    // Thêm cột mới nếu chưa có
    const hasSoBanSao = columns.some(c => c.name === 'soBanSao');
    const hasSoMat = columns.some(c => c.name === 'soMat');
    const hasSoBaoTri = columns.some(c => c.name === 'soBaoTri');

    if (!hasSoBanSao) database.exec(`ALTER TABLE Sach ADD COLUMN soBanSao INTEGER NOT NULL DEFAULT 1`);
    if (!hasSoMat) database.exec(`ALTER TABLE Sach ADD COLUMN soMat INTEGER NOT NULL DEFAULT 0`);
    if (!hasSoBaoTri) database.exec(`ALTER TABLE Sach ADD COLUMN soBaoTri INTEGER NOT NULL DEFAULT 0`);

    // Cập nhật counters dựa trên tinhTrang cũ
    database.exec(`UPDATE Sach SET soMat = 1, soBanSao = 1 WHERE tinhTrang = 'MAT'`);
    database.exec(`UPDATE Sach SET soBaoTri = 1, soBanSao = 1 WHERE tinhTrang = 'BAO_TRI'`);
    database.exec(`UPDATE Sach SET soBanSao = 1 WHERE tinhTrang IN ('SAN_SANG', 'DA_MUON')`);

    // Drop column tinhTrang (SQLite hỗ trợ DROP COLUMN từ v3.35+)
    try {
      database.exec(`ALTER TABLE Sach DROP COLUMN tinhTrang`);
    } catch (err) {
      console.warn('[migration] Không thể drop column tinhTrang (SQLite quá cũ?):', err);
    }
  });

  migrate();
  console.log('[migration] Sach đã migrate xong.');
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export type { Database };
