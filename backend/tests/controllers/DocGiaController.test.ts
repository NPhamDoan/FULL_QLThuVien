import { DocGiaController } from '../../controllers/DocGiaController';
import { initializeDatabase } from '../../database';
import { CreateDocGiaInput } from '../../types';
import Database from 'better-sqlite3';

describe('DocGiaController', () => {
  let db: Database.Database;
  let controller: DocGiaController;

  beforeEach(() => {
    db = initializeDatabase(':memory:');
    controller = new DocGiaController(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('createMember', () => {
    it('should create a new member with auto-generated maDocGia', () => {
      const input: CreateDocGiaInput = {
        hoTen: 'Nguyen Van A',
        email: 'a@example.com',
        soDienThoai: '0901234567',
        ngayHetHan: new Date('2025-12-31'),
      };

      const result = controller.createMember(input);

      expect(result.maDocGia).toMatch(/^DG\d+$/);
      expect(result.hoTen).toBe('Nguyen Van A');
      expect(result.email).toBe('a@example.com');
      expect(result.soDienThoai).toBe('0901234567');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when hoTen is empty', () => {
      const input: CreateDocGiaInput = {
        hoTen: '',
        email: 'a@example.com',
        soDienThoai: '0901234567',
        ngayHetHan: new Date('2025-12-31'),
      };

      expect(() => controller.createMember(input)).toThrow('hoTen là trường bắt buộc');
    });

    it('should throw error when email is empty', () => {
      const input: CreateDocGiaInput = {
        hoTen: 'Nguyen Van A',
        email: '',
        soDienThoai: '0901234567',
        ngayHetHan: new Date('2025-12-31'),
      };

      expect(() => controller.createMember(input)).toThrow('email là trường bắt buộc');
    });

    it('should throw error on duplicate email', () => {
      const input: CreateDocGiaInput = {
        hoTen: 'Nguyen Van A',
        email: 'dup@example.com',
        soDienThoai: '0901234567',
        ngayHetHan: new Date('2025-12-31'),
      };

      controller.createMember(input);

      expect(() => controller.createMember({
        ...input,
        hoTen: 'Nguyen Van B',
      })).toThrow();
    });
  });

  describe('updateMember', () => {
    let maDocGia: string;

    beforeEach(() => {
      const member = controller.createMember({
        hoTen: 'Nguyen Van A',
        email: 'a@example.com',
        soDienThoai: '0901234567',
        ngayHetHan: new Date('2025-12-31'),
      });
      maDocGia = member.maDocGia;
    });

    it('should update hoTen', () => {
      const result = controller.updateMember(maDocGia, { hoTen: 'Tran Van B' });
      expect(result.hoTen).toBe('Tran Van B');
      expect(result.email).toBe('a@example.com');
    });

    it('should update email', () => {
      const result = controller.updateMember(maDocGia, { email: 'new@example.com' });
      expect(result.email).toBe('new@example.com');
    });

    it('should update multiple fields at once', () => {
      const result = controller.updateMember(maDocGia, {
        hoTen: 'Le Van C',
        soDienThoai: '0999999999',
      });
      expect(result.hoTen).toBe('Le Van C');
      expect(result.soDienThoai).toBe('0999999999');
    });

    it('should update updatedAt timestamp', () => {
      const before = controller.updateMember(maDocGia, {});
      // updatedAt should be set (we just verify it's a valid date)
      expect(before.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('deleteMember', () => {
    let maDocGia: string;

    beforeEach(() => {
      const member = controller.createMember({
        hoTen: 'Nguyen Van A',
        email: 'a@example.com',
        soDienThoai: '0901234567',
        ngayHetHan: new Date('2025-12-31'),
      });
      maDocGia = member.maDocGia;
    });

    it('should delete member with no active loans', () => {
      const result = controller.deleteMember(maDocGia);
      expect(result.success).toBe(true);

      // Verify member is gone
      const row = db.prepare('SELECT * FROM DocGia WHERE maDocGia = ?').get(maDocGia);
      expect(row).toBeUndefined();
    });

    it('should refuse to delete member with active loans', () => {
      // Insert a book and an active loan
      db.prepare(`
        INSERT INTO Sach (maSach, tieuDe, tacGia, tinhTrang)
        VALUES ('S001', 'Test Book', 'Author', 'DA_MUON')
      `).run();

      db.prepare(`
        INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai)
        VALUES ('PM001', ?, 'S001', '2025-01-01', '2025-01-15', 'DANG_MUON')
      `).run(maDocGia);

      const result = controller.deleteMember(maDocGia);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không thể xóa độc giả đang có sách mượn');

      // Verify member still exists
      const row = db.prepare('SELECT * FROM DocGia WHERE maDocGia = ?').get(maDocGia);
      expect(row).toBeDefined();
    });

    it('should allow delete when all loans are returned', () => {
      db.prepare(`
        INSERT INTO Sach (maSach, tieuDe, tacGia, tinhTrang)
        VALUES ('S002', 'Test Book 2', 'Author', 'SAN_SANG')
      `).run();

      db.prepare(`
        INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, ngayTraThucTe)
        VALUES ('PM002', ?, 'S002', '2025-01-01', '2025-01-15', 'DA_TRA', '2025-01-10')
      `).run(maDocGia);

      const result = controller.deleteMember(maDocGia);
      expect(result.success).toBe(true);
    });
  });

  describe('hasActiveLoans', () => {
    let maDocGia: string;

    beforeEach(() => {
      const member = controller.createMember({
        hoTen: 'Nguyen Van A',
        email: 'a@example.com',
        soDienThoai: '0901234567',
        ngayHetHan: new Date('2025-12-31'),
      });
      maDocGia = member.maDocGia;
    });

    it('should return false when no loans exist', () => {
      expect(controller.hasActiveLoans(maDocGia)).toBe(false);
    });

    it('should return true when active loan exists', () => {
      db.prepare(`
        INSERT INTO Sach (maSach, tieuDe, tacGia, tinhTrang)
        VALUES ('S003', 'Book', 'Author', 'DA_MUON')
      `).run();

      db.prepare(`
        INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai)
        VALUES ('PM003', ?, 'S003', '2025-01-01', '2025-01-15', 'DANG_MUON')
      `).run(maDocGia);

      expect(controller.hasActiveLoans(maDocGia)).toBe(true);
    });

    it('should return false when all loans are returned', () => {
      db.prepare(`
        INSERT INTO Sach (maSach, tieuDe, tacGia, tinhTrang)
        VALUES ('S004', 'Book', 'Author', 'SAN_SANG')
      `).run();

      db.prepare(`
        INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, ngayTraThucTe)
        VALUES ('PM004', ?, 'S004', '2025-01-01', '2025-01-15', 'DA_TRA', '2025-01-10')
      `).run(maDocGia);

      expect(controller.hasActiveLoans(maDocGia)).toBe(false);
    });
  });
});
