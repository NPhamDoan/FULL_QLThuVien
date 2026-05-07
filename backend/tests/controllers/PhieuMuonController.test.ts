import { PhieuMuonController } from '../../controllers/PhieuMuonController';
import { initializeDatabase } from '../../database';
import { TrangThaiPhieu } from '../../types';
import Database from 'better-sqlite3';

describe('PhieuMuonController', () => {
  let db: Database.Database;
  let controller: PhieuMuonController;

  const futureDate = '2099-12-31';
  const pastDate = '2020-01-01';

  function insertDocGia(maDocGia: string, ngayHetHan: string = futureDate) {
    db.prepare(`
      INSERT INTO DocGia (maDocGia, hoTen, email, soDienThoai, ngayHetHan)
      VALUES (?, 'Test Reader', ?, '0901234567', ?)
    `).run(maDocGia, `${maDocGia}@test.com`, ngayHetHan);
  }

  function insertSach(maSach: string, soBanSao: number = 1, soMat: number = 0, soBaoTri: number = 0) {
    db.prepare(`
      INSERT INTO Sach (maSach, tieuDe, tacGia, soBanSao, soMat, soBaoTri)
      VALUES (?, 'Test Book', 'Test Author', ?, ?, ?)
    `).run(maSach, soBanSao, soMat, soBaoTri);
  }

  function insertPhieuMuon(
    maPhieu: string,
    maDocGia: string,
    maSach: string,
    opts: { ngayMuon?: string; hanTra?: string; trangThai?: string; ngayTraThucTe?: string | null; tienPhat?: number } = {}
  ) {
    db.prepare(`
      INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, ngayTraThucTe, tienPhat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      maPhieu, maDocGia, maSach,
      opts.ngayMuon ?? '2025-01-01',
      opts.hanTra ?? '2025-01-15',
      opts.trangThai ?? 'DANG_MUON',
      opts.ngayTraThucTe ?? null,
      opts.tienPhat ?? 0,
    );
  }

  beforeEach(() => {
    db = initializeDatabase(':memory:');
    controller = new PhieuMuonController(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('validateMember', () => {
    it('should return valid for existing member with future expiry', () => {
      insertDocGia('DG001', futureDate);
      expect(controller.validateMember('DG001').valid).toBe(true);
    });

    it('should return invalid for non-existent member', () => {
      const result = controller.validateMember('DG_NONE');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Mã độc giả không tồn tại');
    });

    it('should return invalid for expired member', () => {
      insertDocGia('DG002', pastDate);
      const result = controller.validateMember('DG002');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Thẻ độc giả đã hết hạn');
    });
  });

  describe('checkBookAvailability', () => {
    it('should return available when soKhaDung > 0', () => {
      insertSach('S001', 3);
      const result = controller.checkBookAvailability('S001');
      expect(result.available).toBe(true);
      expect(result.soKhaDung).toBe(3);
    });

    it('should return unavailable for non-existent book', () => {
      const result = controller.checkBookAvailability('S_NONE');
      expect(result.available).toBe(false);
      expect(result.message).toBe('Mã sách không tồn tại');
    });

    it('should return unavailable when soBanSao - soMat - soBaoTri - soDangMuon <= 0', () => {
      insertSach('S002', 1, 1, 0); // 1 copy but 1 lost = 0 available
      const result = controller.checkBookAvailability('S002');
      expect(result.available).toBe(false);
      expect(result.soKhaDung).toBe(0);
    });

    it('should account for active loans', () => {
      insertSach('S003', 2);
      insertDocGia('DG001');
      insertPhieuMuon('PM001', 'DG001', 'S003');
      insertPhieuMuon('PM002', 'DG001', 'S003');

      const result = controller.checkBookAvailability('S003');
      expect(result.available).toBe(false);
      expect(result.soKhaDung).toBe(0);
    });
  });

  describe('createLoan', () => {
    beforeEach(() => {
      insertDocGia('DG001');
      insertSach('S001', 2);
    });

    it('should create a loan with auto-generated maPhieu', () => {
      const loan = controller.createLoan('DG001', 'S001');
      expect(loan.maPhieu).toMatch(/^PM\d+$/);
      expect(loan.trangThai).toBe(TrangThaiPhieu.DANG_MUON);
      expect(loan.tienPhat).toBe(0);
      expect(loan.ngayTraThucTe).toBeNull();
    });

    it('should set hanTra to 14 days from today', () => {
      const loan = controller.createLoan('DG001', 'S001');
      const expected = new Date();
      expected.setDate(expected.getDate() + 14);
      expect(loan.hanTra.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
    });

    it('should NOT update Sach.soBanSao (availability is derived)', () => {
      controller.createLoan('DG001', 'S001');
      const row = db.prepare('SELECT soBanSao FROM Sach WHERE maSach = ?').get('S001') as { soBanSao: number };
      expect(row.soBanSao).toBe(2);
    });

    it('should throw when no copies available', () => {
      insertSach('S002', 1, 1, 0); // soBanSao=1 but soMat=1 → 0 available
      expect(() => controller.createLoan('DG001', 'S002')).toThrow(/Hết bản/);
    });

    it('should throw when book does not exist', () => {
      expect(() => controller.createLoan('DG001', 'S_NONE')).toThrow(/không tồn tại/);
    });
  });

  describe('calculateFine', () => {
    it('should return 0 when returned on time', () => {
      expect(controller.calculateFine(new Date('2025-01-15'), new Date('2025-01-15'))).toBe(0);
    });

    it('should return 0 when returned early', () => {
      expect(controller.calculateFine(new Date('2025-01-15'), new Date('2025-01-10'))).toBe(0);
    });

    it('should calculate 5000 per day overdue', () => {
      expect(controller.calculateFine(new Date('2025-01-15'), new Date('2025-01-16'))).toBe(5000);
      expect(controller.calculateFine(new Date('2025-01-15'), new Date('2025-01-20'))).toBe(25000);
    });
  });

  describe('returnBook', () => {
    beforeEach(() => {
      insertDocGia('DG001');
      insertSach('S001', 2);
    });

    it('should return book successfully', () => {
      insertPhieuMuon('PM001', 'DG001', 'S001');
      const result = controller.returnBook('PM001');
      expect(result.success).toBe(true);
      expect(result.daMatSach).toBeFalsy();
    });

    it('should update loan status to DA_TRA', () => {
      insertPhieuMuon('PM001', 'DG001', 'S001');
      controller.returnBook('PM001');
      const row = db.prepare('SELECT trangThai FROM PhieuMuon WHERE maPhieu = ?').get('PM001') as { trangThai: string };
      expect(row.trangThai).toBe('DA_TRA');
    });

    it('should NOT touch Sach.soBanSao on normal return', () => {
      insertPhieuMuon('PM001', 'DG001', 'S001');
      controller.returnBook('PM001');
      const book = db.prepare('SELECT soBanSao, soMat FROM Sach WHERE maSach = ?').get('S001') as { soBanSao: number; soMat: number };
      expect(book.soBanSao).toBe(2);
      expect(book.soMat).toBe(0);
    });

    it('should increment soMat when daMatSach=true', () => {
      const futureHan = new Date();
      futureHan.setDate(futureHan.getDate() + 7);
      insertPhieuMuon('PM001', 'DG001', 'S001', { hanTra: futureHan.toISOString().split('T')[0] });
      const result = controller.returnBook('PM001', { daMatSach: true, phiMat: 100000 });
      expect(result.daMatSach).toBe(true);
      expect(result.tienPhat).toBe(100000);
      const book = db.prepare('SELECT soMat FROM Sach WHERE maSach = ?').get('S001') as { soMat: number };
      expect(book.soMat).toBe(1);
    });

    it('should combine fine and phiMat in tienPhat', () => {
      const pastHan = new Date();
      pastHan.setDate(pastHan.getDate() - 3);
      insertPhieuMuon('PM001', 'DG001', 'S001', { hanTra: pastHan.toISOString().split('T')[0] });
      const result = controller.returnBook('PM001', { daMatSach: true, phiMat: 50000 });
      // 3 days overdue × 5000 + 50000 phiMat
      expect(result.tienPhat).toBeGreaterThanOrEqual(50000 + 15000);
    });

    it('should fail for non-existent loan', () => {
      const result = controller.returnBook('PM_NONE');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy phiếu mượn');
    });

    it('should fail for already returned loan', () => {
      insertPhieuMuon('PM001', 'DG001', 'S001', { trangThai: 'DA_TRA', ngayTraThucTe: '2025-01-10' });
      const result = controller.returnBook('PM001');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Phiếu mượn này đã được trả trước đó');
    });
  });

  describe('extendLoan', () => {
    beforeEach(() => {
      insertDocGia('DG001');
      insertSach('S001', 1);
    });

    it('should extend hanTra by 7 days', () => {
      insertPhieuMuon('PM001', 'DG001', 'S001', { hanTra: '2025-01-15' });
      const result = controller.extendLoan('PM001');
      expect(result.hanTra.toISOString().split('T')[0]).toBe('2025-01-22');
    });

    it('should throw for non-existent loan', () => {
      expect(() => controller.extendLoan('PM_NONE')).toThrow('Không tìm thấy phiếu mượn');
    });

    it('should throw for already returned loan', () => {
      insertPhieuMuon('PM001', 'DG001', 'S001', { trangThai: 'DA_TRA', ngayTraThucTe: '2025-01-10' });
      expect(() => controller.extendLoan('PM001')).toThrow('Phiếu mượn đã hoàn tất, không thể gia hạn');
    });
  });
});
