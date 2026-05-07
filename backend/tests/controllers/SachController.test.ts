import { SachController } from '../../controllers/SachController';
import { initializeDatabase } from '../../database';
import { CreateSachInput, TrangThaiPhieu } from '../../types';
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
    it('should create a new book with auto-generated maSach and default soBanSao=1', () => {
      const input: CreateSachInput = {
        tieuDe: 'Lập trình TypeScript',
        tacGia: 'Nguyen Van A',
      };

      const result = controller.createBook(input);

      expect(result.maSach).toMatch(/^S\d+$/);
      expect(result.tieuDe).toBe('Lập trình TypeScript');
      expect(result.tacGia).toBe('Nguyen Van A');
      expect(result.soBanSao).toBe(1);
      expect(result.soMat).toBe(0);
      expect(result.soBaoTri).toBe(0);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should accept custom soBanSao', () => {
      const result = controller.createBook({ tieuDe: 'T', tacGia: 'A', soBanSao: 5 });
      expect(result.soBanSao).toBe(5);
    });

    it('should throw error when tieuDe is empty', () => {
      expect(() => controller.createBook({ tieuDe: '', tacGia: 'Author' })).toThrow('tieuDe là trường bắt buộc');
    });

    it('should throw error when tacGia is empty', () => {
      expect(() => controller.createBook({ tieuDe: 'Book', tacGia: '' })).toThrow('tacGia là trường bắt buộc');
    });

    it('should throw error when soBanSao < 1', () => {
      expect(() => controller.createBook({ tieuDe: 'T', tacGia: 'A', soBanSao: 0 })).toThrow('soBanSao phải >= 1');
    });
  });

  describe('updateBook', () => {
    let maSach: string;

    beforeEach(() => {
      const book = controller.createBook({ tieuDe: 'Original', tacGia: 'Original', soBanSao: 3 });
      maSach = book.maSach;
    });

    it('should update tieuDe and tacGia', () => {
      const result = controller.updateBook(maSach, { tieuDe: 'New Title', tacGia: 'New Author' });
      expect(result.tieuDe).toBe('New Title');
      expect(result.tacGia).toBe('New Author');
    });

    it('should update counters', () => {
      const result = controller.updateBook(maSach, { soMat: 1, soBaoTri: 1 });
      expect(result.soMat).toBe(1);
      expect(result.soBaoTri).toBe(1);
    });

    it('should throw when counters exceed soBanSao', () => {
      expect(() => controller.updateBook(maSach, { soMat: 2, soBaoTri: 2 })).toThrow(/không được nhỏ hơn/);
    });

    it('should throw when soBanSao < sum of other counters + loans', () => {
      controller.updateBook(maSach, { soMat: 1, soBaoTri: 1 });
      // Trying to reduce soBanSao to 1 → conflict: soMat(1)+soBaoTri(1) = 2 > 1
      expect(() => controller.updateBook(maSach, { soBanSao: 1 })).toThrow(/không được nhỏ hơn/);
    });

    it('should throw when any counter is negative', () => {
      expect(() => controller.updateBook(maSach, { soMat: -1 })).toThrow('Số lượng không được âm');
    });
  });

  describe('deleteBook', () => {
    let maSach: string;

    beforeEach(() => {
      const book = controller.createBook({ tieuDe: 'Test', tacGia: 'Author' });
      maSach = book.maSach;
    });

    it('should delete book with no active loans', () => {
      const result = controller.deleteBook(maSach);
      expect(result.success).toBe(true);
      const row = db.prepare('SELECT * FROM Sach WHERE maSach = ?').get(maSach);
      expect(row).toBeUndefined();
    });

    it('should refuse to delete book with active loans', () => {
      db.prepare(`
        INSERT INTO DocGia (maDocGia, hoTen, email, soDienThoai, ngayHetHan)
        VALUES ('DG001', 'R', 'r@t.com', '0901', '2099-12-31')
      `).run();
      db.prepare(`
        INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai)
        VALUES ('PM001', 'DG001', ?, '2025-01-01', '2025-01-15', ?)
      `).run(maSach, TrangThaiPhieu.DANG_MUON);

      const result = controller.deleteBook(maSach);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không thể xóa sách đang được mượn');
    });

    it('should allow delete when book has only returned loans', () => {
      db.prepare(`
        INSERT INTO DocGia (maDocGia, hoTen, email, soDienThoai, ngayHetHan)
        VALUES ('DG001', 'R', 'r@t.com', '0901', '2099-12-31')
      `).run();
      db.prepare(`
        INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, ngayTraThucTe)
        VALUES ('PM001', 'DG001', ?, '2025-01-01', '2025-01-15', ?, '2025-01-10')
      `).run(maSach, TrangThaiPhieu.DA_TRA);

      const result = controller.deleteBook(maSach);
      expect(result.success).toBe(true);
    });
  });

  describe('getAvailableCount & getActiveLoanCount', () => {
    let maSach: string;

    beforeEach(() => {
      const book = controller.createBook({ tieuDe: 'T', tacGia: 'A', soBanSao: 5 });
      maSach = book.maSach;
      db.prepare(`
        INSERT INTO DocGia (maDocGia, hoTen, email, soDienThoai, ngayHetHan)
        VALUES ('DG001', 'R', 'r@t.com', '0901', '2099-12-31')
      `).run();
    });

    it('should return soBanSao when no loans or losses', () => {
      expect(controller.getAvailableCount(maSach)).toBe(5);
      expect(controller.getActiveLoanCount(maSach)).toBe(0);
    });

    it('should subtract active loans', () => {
      db.prepare(`
        INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai)
        VALUES ('PM001', 'DG001', ?, '2025-01-01', '2025-01-15', ?)
      `).run(maSach, TrangThaiPhieu.DANG_MUON);

      expect(controller.getActiveLoanCount(maSach)).toBe(1);
      expect(controller.getAvailableCount(maSach)).toBe(4);
    });

    it('should subtract soMat and soBaoTri', () => {
      controller.updateBook(maSach, { soMat: 1, soBaoTri: 1 });
      expect(controller.getAvailableCount(maSach)).toBe(3);
    });

    it('should return 0 for non-existent book', () => {
      expect(controller.getAvailableCount('NONEXISTENT')).toBe(0);
    });
  });

  describe('incrementLost', () => {
    it('should increment soMat by 1', () => {
      const book = controller.createBook({ tieuDe: 'T', tacGia: 'A', soBanSao: 3 });
      controller.incrementLost(book.maSach);
      const updated = controller.getBookById(book.maSach);
      expect(updated?.soMat).toBe(1);
    });
  });
});
