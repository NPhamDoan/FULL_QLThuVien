import { SachController } from '../../controllers/SachController';
import { initializeDatabase } from '../../database';
import { CreateSachInput, TinhTrangSach } from '../../types';
import Database from 'better-sqlite3';

describe('SachController', () => {
  let db: Database.Database;
  let controller: SachController;

  beforeEach(() => {
    db = initializeDatabase(':memory:');
    controller = new SachController(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('createBook', () => {
    it('should create a new book with auto-generated maSach and default tinhTrang SAN_SANG', () => {
      const input: CreateSachInput = {
        tieuDe: 'Lập trình TypeScript',
        tacGia: 'Nguyen Van A',
      };

      const result = controller.createBook(input);

      expect(result.maSach).toMatch(/^S\d+$/);
      expect(result.tieuDe).toBe('Lập trình TypeScript');
      expect(result.tacGia).toBe('Nguyen Van A');
      expect(result.tinhTrang).toBe(TinhTrangSach.SAN_SANG);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when tieuDe is empty', () => {
      const input: CreateSachInput = { tieuDe: '', tacGia: 'Author' };
      expect(() => controller.createBook(input)).toThrow('tieuDe là trường bắt buộc');
    });

    it('should throw error when tieuDe is whitespace only', () => {
      const input: CreateSachInput = { tieuDe: '   ', tacGia: 'Author' };
      expect(() => controller.createBook(input)).toThrow('tieuDe là trường bắt buộc');
    });

    it('should throw error when tacGia is empty', () => {
      const input: CreateSachInput = { tieuDe: 'Some Book', tacGia: '' };
      expect(() => controller.createBook(input)).toThrow('tacGia là trường bắt buộc');
    });

    it('should throw error when tacGia is whitespace only', () => {
      const input: CreateSachInput = { tieuDe: 'Some Book', tacGia: '  ' };
      expect(() => controller.createBook(input)).toThrow('tacGia là trường bắt buộc');
    });
  });

  describe('updateBook', () => {
    let maSach: string;

    beforeEach(() => {
      const book = controller.createBook({ tieuDe: 'Original Title', tacGia: 'Original Author' });
      maSach = book.maSach;
    });

    it('should update tieuDe', () => {
      const result = controller.updateBook(maSach, { tieuDe: 'New Title' });
      expect(result.tieuDe).toBe('New Title');
      expect(result.tacGia).toBe('Original Author');
    });

    it('should update tacGia', () => {
      const result = controller.updateBook(maSach, { tacGia: 'New Author' });
      expect(result.tacGia).toBe('New Author');
    });

    it('should update tinhTrang', () => {
      const result = controller.updateBook(maSach, { tinhTrang: TinhTrangSach.BAO_TRI });
      expect(result.tinhTrang).toBe(TinhTrangSach.BAO_TRI);
    });

    it('should update multiple fields at once', () => {
      const result = controller.updateBook(maSach, {
        tieuDe: 'Updated Title',
        tacGia: 'Updated Author',
      });
      expect(result.tieuDe).toBe('Updated Title');
      expect(result.tacGia).toBe('Updated Author');
    });

    it('should update updatedAt timestamp', () => {
      const result = controller.updateBook(maSach, {});
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('deleteBook', () => {
    let maSach: string;

    beforeEach(() => {
      const book = controller.createBook({ tieuDe: 'Test Book', tacGia: 'Author' });
      maSach = book.maSach;
    });

    it('should delete book that is SAN_SANG', () => {
      const result = controller.deleteBook(maSach);
      expect(result.success).toBe(true);

      const row = db.prepare('SELECT * FROM Sach WHERE maSach = ?').get(maSach);
      expect(row).toBeUndefined();
    });

    it('should refuse to delete book that is DA_MUON', () => {
      db.prepare("UPDATE Sach SET tinhTrang = 'DA_MUON' WHERE maSach = ?").run(maSach);

      const result = controller.deleteBook(maSach);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không thể xóa sách đang được mượn');

      const row = db.prepare('SELECT * FROM Sach WHERE maSach = ?').get(maSach);
      expect(row).toBeDefined();
    });

    it('should allow delete when book has only returned loans', () => {
      // Create a reader for the FK
      db.prepare(`
        INSERT INTO DocGia (maDocGia, hoTen, email, soDienThoai, ngayHetHan)
        VALUES ('DG001', 'Reader', 'r@example.com', '0901234567', '2025-12-31')
      `).run();

      db.prepare(`
        INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, ngayTraThucTe)
        VALUES ('PM001', 'DG001', ?, '2025-01-01', '2025-01-15', 'DA_TRA', '2025-01-10')
      `).run(maSach);

      const result = controller.deleteBook(maSach);
      expect(result.success).toBe(true);

      const row = db.prepare('SELECT * FROM Sach WHERE maSach = ?').get(maSach);
      expect(row).toBeUndefined();
    });

    it('should allow delete when book is in BAO_TRI status', () => {
      db.prepare("UPDATE Sach SET tinhTrang = 'BAO_TRI' WHERE maSach = ?").run(maSach);

      const result = controller.deleteBook(maSach);
      expect(result.success).toBe(true);
    });
  });

  describe('isBookOnLoan', () => {
    let maSach: string;

    beforeEach(() => {
      const book = controller.createBook({ tieuDe: 'Test Book', tacGia: 'Author' });
      maSach = book.maSach;
    });

    it('should return false for SAN_SANG book', () => {
      expect(controller.isBookOnLoan(maSach)).toBe(false);
    });

    it('should return true for DA_MUON book', () => {
      db.prepare("UPDATE Sach SET tinhTrang = 'DA_MUON' WHERE maSach = ?").run(maSach);
      expect(controller.isBookOnLoan(maSach)).toBe(true);
    });

    it('should return false for non-existent book', () => {
      expect(controller.isBookOnLoan('NONEXISTENT')).toBe(false);
    });

    it('should return false for BAO_TRI book', () => {
      db.prepare("UPDATE Sach SET tinhTrang = 'BAO_TRI' WHERE maSach = ?").run(maSach);
      expect(controller.isBookOnLoan(maSach)).toBe(false);
    });
  });
});
