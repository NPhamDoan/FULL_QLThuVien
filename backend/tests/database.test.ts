import { initializeDatabase, getDatabase } from '../database';
import Database from 'better-sqlite3';

describe('Database Initialization', () => {
  let db: Database.Database;

  afterEach(() => {
    if (db) {
      db.close();
    }
  });

  it('should create an in-memory database', () => {
    db = initializeDatabase(':memory:');
    expect(db).toBeDefined();
    expect(db.open).toBe(true);
  });

  it('should enable foreign keys', () => {
    db = initializeDatabase(':memory:');
    const result = db.pragma('foreign_keys');
    expect(result).toEqual([{ foreign_keys: 1 }]);
  });

  it('should create DocGia, Sach, PhieuMuon, TaiKhoan tables', () => {
    db = initializeDatabase(':memory:');
    for (const t of ['DocGia', 'Sach', 'PhieuMuon', 'TaiKhoan']) {
      const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).all(t);
      expect(tables).toHaveLength(1);
    }
  });

  it('should enforce CHECK constraints on Sach counters (>= 0)', () => {
    db = initializeDatabase(':memory:');
    expect(() => {
      db.prepare("INSERT INTO Sach (maSach, tieuDe, tacGia, soBanSao) VALUES ('S001', 'Test', 'Author', -1)").run();
    }).toThrow();
  });

  it('should enforce CHECK constraint on PhieuMuon.trangThai', () => {
    db = initializeDatabase(':memory:');
    db.prepare("INSERT INTO DocGia (maDocGia, hoTen, email, soDienThoai, ngayHetHan) VALUES ('DG001', 'Test', 'test@test.com', '0123456789', '2025-12-31')").run();
    db.prepare("INSERT INTO Sach (maSach, tieuDe, tacGia) VALUES ('S001', 'Test Book', 'Author')").run();
    expect(() => {
      db.prepare("INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai) VALUES ('PM001', 'DG001', 'S001', '2025-01-01', '2025-01-15', 'INVALID')").run();
    }).toThrow();
  });

  it('should enforce CHECK constraint on TaiKhoan.vaiTro', () => {
    db = initializeDatabase(':memory:');
    expect(() => {
      db.prepare("INSERT INTO TaiKhoan (maTaiKhoan, tenDangNhap, matKhau, vaiTro) VALUES ('TK001', 'admin', 'pass', 'INVALID')").run();
    }).toThrow();
  });

  it('should enforce foreign key on PhieuMuon.maDocGia', () => {
    db = initializeDatabase(':memory:');
    db.prepare("INSERT INTO Sach (maSach, tieuDe, tacGia) VALUES ('S001', 'Test', 'Author')").run();
    expect(() => {
      db.prepare("INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra) VALUES ('PM001', 'NONEXISTENT', 'S001', '2025-01-01', '2025-01-15')").run();
    }).toThrow();
  });

  it('should set default soBanSao to 1, soMat to 0, soBaoTri to 0 for new Sach', () => {
    db = initializeDatabase(':memory:');
    db.prepare("INSERT INTO Sach (maSach, tieuDe, tacGia) VALUES ('S001', 'Test Book', 'Author')").run();
    const sach = db.prepare("SELECT soBanSao, soMat, soBaoTri FROM Sach WHERE maSach = 'S001'").get() as { soBanSao: number; soMat: number; soBaoTri: number };
    expect(sach.soBanSao).toBe(1);
    expect(sach.soMat).toBe(0);
    expect(sach.soBaoTri).toBe(0);
  });

  it('should set default trangThai to DANG_MUON for new PhieuMuon', () => {
    db = initializeDatabase(':memory:');
    db.prepare("INSERT INTO DocGia (maDocGia, hoTen, email, soDienThoai, ngayHetHan) VALUES ('DG001', 'Test', 'test@test.com', '0123456789', '2025-12-31')").run();
    db.prepare("INSERT INTO Sach (maSach, tieuDe, tacGia) VALUES ('S001', 'Test Book', 'Author')").run();
    db.prepare("INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra) VALUES ('PM001', 'DG001', 'S001', '2025-01-01', '2025-01-15')").run();
    const phieu = db.prepare("SELECT trangThai FROM PhieuMuon WHERE maPhieu = 'PM001'").get() as { trangThai: string };
    expect(phieu.trangThai).toBe('DANG_MUON');
  });

  it('should return the singleton instance via getDatabase()', () => {
    db = initializeDatabase(':memory:');
    const dbInstance = getDatabase();
    expect(dbInstance).toBe(db);
  });
});
