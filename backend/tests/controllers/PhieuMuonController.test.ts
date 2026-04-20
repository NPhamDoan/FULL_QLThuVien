import { PhieuMuonController } from '../../controllers/PhieuMuonController';
import { initializeDatabase } from '../../database';
import { TinhTrangSach, TrangThaiPhieu } from '../../types';
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

  function insertSach(maSach: string, tinhTrang: string = 'SAN_SANG') {
    db.prepare(`
      INSERT INTO Sach (maSach, tieuDe, tacGia, tinhTrang)
      VALUES (?, 'Test Book', 'Test Author', ?)
    `).run(maSach, tinhTrang);
  }

  function insertPhieuMuon(
    maPhieu: string,
    maDocGia: string,
    maSach: string,
    opts: { ngayMuon?: string; hanTra?: string; trangThai?: string; ngayTraThucTe?: string | null; tienPhat?: number } = {}
  ) {
    const ngayMuon = opts.ngayMuon ?? '2025-01-01';
    const hanTra = opts.hanTra ?? '2025-01-15';
    const trangThai = opts.trangThai ?? 'DANG_MUON';
    const ngayTraThucTe = opts.ngayTraThucTe ?? null;
    const tienPhat = opts.tienPhat ?? 0;
    db.prepare(`
      INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, ngayTraThucTe, tienPhat)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, ngayTraThucTe, tienPhat);
  }

  beforeEach(() => {
    db = initializeDatabase(':memory:');
    controller = new PhieuMuonController(db);
  });

  afterEach(() => {
    db.close();
  });

  // === Task 7.1: validateMember ===
  describe('validateMember', () => {
    it('should return valid for existing member with future expiry', () => {
      insertDocGia('DG001', futureDate);
      const result = controller.validateMember('DG001');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
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

    it('should return valid for member expiring today', () => {
      const today = new Date().toISOString().split('T')[0];
      insertDocGia('DG003', today);
      const result = controller.validateMember('DG003');
      expect(result.valid).toBe(true);
    });
  });

  // === Task 7.1: checkBookAvailability ===
  describe('checkBookAvailability', () => {
    it('should return available for SAN_SANG book', () => {
      insertSach('S001', 'SAN_SANG');
      const result = controller.checkBookAvailability('S001');
      expect(result.available).toBe(true);
      expect(result.tinhTrang).toBe(TinhTrangSach.SAN_SANG);
    });

    it('should return unavailable for non-existent book', () => {
      const result = controller.checkBookAvailability('S_NONE');
      expect(result.available).toBe(false);
      expect(result.message).toBe('Mã sách không tồn tại');
    });

    it('should return unavailable for DA_MUON book', () => {
      insertSach('S002', 'DA_MUON');
      const result = controller.checkBookAvailability('S002');
      expect(result.available).toBe(false);
      expect(result.tinhTrang).toBe(TinhTrangSach.DA_MUON);
      expect(result.message).toBe('Sách không khả dụng');
    });

    it('should return unavailable for BAO_TRI book', () => {
      insertSach('S003', 'BAO_TRI');
      const result = controller.checkBookAvailability('S003');
      expect(result.available).toBe(false);
      expect(result.tinhTrang).toBe(TinhTrangSach.BAO_TRI);
    });

    it('should return unavailable for MAT book', () => {
      insertSach('S004', 'MAT');
      const result = controller.checkBookAvailability('S004');
      expect(result.available).toBe(false);
      expect(result.tinhTrang).toBe(TinhTrangSach.MAT);
    });
  });

  // === Task 7.3: createLoan ===
  describe('createLoan', () => {
    beforeEach(() => {
      insertDocGia('DG001');
      insertSach('S001');
    });

    it('should create a loan with auto-generated maPhieu', () => {
      const loan = controller.createLoan('DG001', 'S001');
      expect(loan.maPhieu).toMatch(/^PM\d+$/);
      expect(loan.maDocGia).toBe('DG001');
      expect(loan.maSach).toBe('S001');
      expect(loan.trangThai).toBe(TrangThaiPhieu.DANG_MUON);
      expect(loan.tienPhat).toBe(0);
      expect(loan.ngayTraThucTe).toBeNull();
    });

    it('should set ngayMuon to today', () => {
      const loan = controller.createLoan('DG001', 'S001');
      const today = new Date().toISOString().split('T')[0];
      expect(loan.ngayMuon.toISOString().split('T')[0]).toBe(today);
    });

    it('should set hanTra to 14 days from today', () => {
      const loan = controller.createLoan('DG001', 'S001');
      const expected = new Date();
      expected.setDate(expected.getDate() + 14);
      const expectedStr = expected.toISOString().split('T')[0];
      expect(loan.hanTra.toISOString().split('T')[0]).toBe(expectedStr);
    });

    it('should update book status to DA_MUON', () => {
      controller.createLoan('DG001', 'S001');
      const row = db.prepare('SELECT tinhTrang FROM Sach WHERE maSach = ?').get('S001') as { tinhTrang: string };
      expect(row.tinhTrang).toBe(TinhTrangSach.DA_MUON);
    });

    it('should persist the loan in the database', () => {
      const loan = controller.createLoan('DG001', 'S001');
      const row = db.prepare('SELECT * FROM PhieuMuon WHERE maPhieu = ?').get(loan.maPhieu);
      expect(row).toBeDefined();
    });
  });

  // === Task 8.1: findLoan ===
  describe('findLoanByCode', () => {
    it('should find an existing loan by maPhieu', () => {
      insertDocGia('DG001');
      insertSach('S001');
      insertPhieuMuon('PM001', 'DG001', 'S001');

      const loan = controller.findLoanByCode('PM001');
      expect(loan).not.toBeNull();
      expect(loan!.maPhieu).toBe('PM001');
      expect(loan!.maDocGia).toBe('DG001');
      expect(loan!.maSach).toBe('S001');
    });

    it('should return null for non-existent maPhieu', () => {
      const loan = controller.findLoanByCode('PM_NONE');
      expect(loan).toBeNull();
    });

    it('should find returned loans too', () => {
      insertDocGia('DG001');
      insertSach('S001');
      insertPhieuMuon('PM001', 'DG001', 'S001', { trangThai: 'DA_TRA', ngayTraThucTe: '2025-01-10' });

      const loan = controller.findLoanByCode('PM001');
      expect(loan).not.toBeNull();
      expect(loan!.trangThai).toBe(TrangThaiPhieu.DA_TRA);
    });
  });

  describe('findLoanByBook', () => {
    it('should find active loan by maSach', () => {
      insertDocGia('DG001');
      insertSach('S001', 'DA_MUON');
      insertPhieuMuon('PM001', 'DG001', 'S001');

      const loan = controller.findLoanByBook('S001');
      expect(loan).not.toBeNull();
      expect(loan!.maSach).toBe('S001');
      expect(loan!.trangThai).toBe(TrangThaiPhieu.DANG_MUON);
    });

    it('should return null when no active loan for book', () => {
      insertDocGia('DG001');
      insertSach('S001');
      insertPhieuMuon('PM001', 'DG001', 'S001', { trangThai: 'DA_TRA', ngayTraThucTe: '2025-01-10' });

      const loan = controller.findLoanByBook('S001');
      expect(loan).toBeNull();
    });

    it('should return null for non-existent book', () => {
      const loan = controller.findLoanByBook('S_NONE');
      expect(loan).toBeNull();
    });
  });

  // === Task 8.3: calculateFine ===
  describe('calculateFine', () => {
    it('should return 0 when returned on time', () => {
      const hanTra = new Date('2025-01-15');
      const ngayTra = new Date('2025-01-15');
      expect(controller.calculateFine(hanTra, ngayTra)).toBe(0);
    });

    it('should return 0 when returned early', () => {
      const hanTra = new Date('2025-01-15');
      const ngayTra = new Date('2025-01-10');
      expect(controller.calculateFine(hanTra, ngayTra)).toBe(0);
    });

    it('should calculate fine for 1 day overdue', () => {
      const hanTra = new Date('2025-01-15');
      const ngayTra = new Date('2025-01-16');
      expect(controller.calculateFine(hanTra, ngayTra)).toBe(5000);
    });

    it('should calculate fine for multiple days overdue', () => {
      const hanTra = new Date('2025-01-15');
      const ngayTra = new Date('2025-01-20');
      expect(controller.calculateFine(hanTra, ngayTra)).toBe(25000);
    });

    it('should use Math.ceil for partial days', () => {
      const hanTra = new Date('2025-01-15T00:00:00');
      const ngayTra = new Date('2025-01-16T01:00:00'); // 1 day + 1 hour
      // Math.ceil should round up to 2 days
      expect(controller.calculateFine(hanTra, ngayTra)).toBe(10000);
    });
  });

  // === Task 8.5: returnBook ===
  describe('returnBook', () => {
    beforeEach(() => {
      insertDocGia('DG001');
      insertSach('S001', 'DA_MUON');
    });

    it('should return book successfully', () => {
      insertPhieuMuon('PM001', 'DG001', 'S001');
      const result = controller.returnBook('PM001');
      expect(result.success).toBe(true);
      expect(result.ngayTraThucTe).toBeInstanceOf(Date);
    });

    it('should update loan status to DA_TRA', () => {
      insertPhieuMuon('PM001', 'DG001', 'S001');
      controller.returnBook('PM001');

      const row = db.prepare('SELECT trangThai FROM PhieuMuon WHERE maPhieu = ?').get('PM001') as { trangThai: string };
      expect(row.trangThai).toBe('DA_TRA');
    });

    it('should update book status to SAN_SANG', () => {
      insertPhieuMuon('PM001', 'DG001', 'S001');
      controller.returnBook('PM001');

      const row = db.prepare('SELECT tinhTrang FROM Sach WHERE maSach = ?').get('S001') as { tinhTrang: string };
      expect(row.tinhTrang).toBe('SAN_SANG');
    });

    it('should calculate fine for overdue return', () => {
      const pastHanTra = new Date();
      pastHanTra.setDate(pastHanTra.getDate() - 3);
      const hanTraStr = pastHanTra.toISOString().split('T')[0];
      insertPhieuMuon('PM001', 'DG001', 'S001', { hanTra: hanTraStr });

      const result = controller.returnBook('PM001');
      expect(result.success).toBe(true);
      expect(result.tienPhat).toBeGreaterThan(0);
    });

    it('should return tienPhat = 0 for on-time return', () => {
      const futureHanTra = new Date();
      futureHanTra.setDate(futureHanTra.getDate() + 7);
      const hanTraStr = futureHanTra.toISOString().split('T')[0];
      insertPhieuMuon('PM001', 'DG001', 'S001', { hanTra: hanTraStr });

      const result = controller.returnBook('PM001');
      expect(result.success).toBe(true);
      expect(result.tienPhat).toBe(0);
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

  // === Task 9.1: extendLoan ===
  describe('extendLoan', () => {
    beforeEach(() => {
      insertDocGia('DG001');
      insertSach('S001', 'DA_MUON');
    });

    it('should extend hanTra by 7 days', () => {
      insertPhieuMuon('PM001', 'DG001', 'S001', { hanTra: '2025-01-15' });
      const result = controller.extendLoan('PM001');
      expect(result.hanTra.toISOString().split('T')[0]).toBe('2025-01-22');
    });

    it('should keep other fields unchanged', () => {
      insertPhieuMuon('PM001', 'DG001', 'S001');
      const before = controller.findLoanByCode('PM001')!;
      const result = controller.extendLoan('PM001');

      expect(result.maPhieu).toBe(before.maPhieu);
      expect(result.maDocGia).toBe(before.maDocGia);
      expect(result.maSach).toBe(before.maSach);
      expect(result.trangThai).toBe(TrangThaiPhieu.DANG_MUON);
    });

    it('should throw for non-existent loan', () => {
      expect(() => controller.extendLoan('PM_NONE')).toThrow('Không tìm thấy phiếu mượn');
    });

    it('should throw for already returned loan', () => {
      insertPhieuMuon('PM001', 'DG001', 'S001', { trangThai: 'DA_TRA', ngayTraThucTe: '2025-01-10' });
      expect(() => controller.extendLoan('PM001')).toThrow('Phiếu mượn đã hoàn tất, không thể gia hạn');
    });

    it('should persist the new hanTra in the database', () => {
      insertPhieuMuon('PM001', 'DG001', 'S001', { hanTra: '2025-02-01' });
      controller.extendLoan('PM001');

      const row = db.prepare('SELECT hanTra FROM PhieuMuon WHERE maPhieu = ?').get('PM001') as { hanTra: string };
      expect(row.hanTra).toBe('2025-02-08');
    });
  });
});
