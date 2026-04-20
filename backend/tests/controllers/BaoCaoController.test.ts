import { BaoCaoController } from '../../controllers/BaoCaoController';
import { initializeDatabase } from '../../database';
import { TrangThaiPhieu, TinhTrangSach } from '../../types';
import Database from 'better-sqlite3';

describe('BaoCaoController', () => {
  let db: Database.Database;
  let controller: BaoCaoController;

  function insertDocGia(maDocGia: string) {
    db.prepare(`
      INSERT INTO DocGia (maDocGia, hoTen, email, soDienThoai, ngayHetHan)
      VALUES (?, 'Test Reader', ?, '0901234567', '2099-12-31')
    `).run(maDocGia, `${maDocGia}@test.com`);
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
    controller = new BaoCaoController(db);
  });

  afterEach(() => {
    db.close();
  });

  // === Task 11.1: getOverdueLoans ===
  describe('getOverdueLoans', () => {
    it('should return empty array when no loans exist', () => {
      const result = controller.getOverdueLoans();
      expect(result).toEqual([]);
    });

    it('should return empty array when no overdue loans exist', () => {
      insertDocGia('DG001');
      insertSach('S001', 'DA_MUON');
      // hanTra is in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      insertPhieuMuon('PM001', 'DG001', 'S001', {
        hanTra: futureDate.toISOString().split('T')[0],
      });

      const result = controller.getOverdueLoans();
      expect(result).toEqual([]);
    });

    it('should return overdue loans with trangThai DANG_MUON and hanTra in the past', () => {
      insertDocGia('DG001');
      insertSach('S001', 'DA_MUON');
      // hanTra is in the past
      insertPhieuMuon('PM001', 'DG001', 'S001', {
        hanTra: '2020-01-01',
      });

      const result = controller.getOverdueLoans();
      expect(result).toHaveLength(1);
      expect(result[0].maPhieu).toBe('PM001');
      expect(result[0].trangThai).toBe(TrangThaiPhieu.DANG_MUON);
    });

    it('should not return loans that are already returned (DA_TRA)', () => {
      insertDocGia('DG001');
      insertSach('S001');
      // Overdue but already returned
      insertPhieuMuon('PM001', 'DG001', 'S001', {
        hanTra: '2020-01-01',
        trangThai: 'DA_TRA',
        ngayTraThucTe: '2020-01-05',
        tienPhat: 20000,
      });

      const result = controller.getOverdueLoans();
      expect(result).toEqual([]);
    });

    it('should return multiple overdue loans', () => {
      insertDocGia('DG001');
      insertDocGia('DG002');
      insertSach('S001', 'DA_MUON');
      insertSach('S002', 'DA_MUON');
      insertSach('S003', 'DA_MUON');

      insertPhieuMuon('PM001', 'DG001', 'S001', { hanTra: '2020-01-01' });
      insertPhieuMuon('PM002', 'DG002', 'S002', { hanTra: '2020-06-15' });
      // This one is not overdue (future date)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      insertPhieuMuon('PM003', 'DG001', 'S003', {
        hanTra: futureDate.toISOString().split('T')[0],
      });

      const result = controller.getOverdueLoans();
      expect(result).toHaveLength(2);
      const maPhieus = result.map((r) => r.maPhieu);
      expect(maPhieus).toContain('PM001');
      expect(maPhieus).toContain('PM002');
    });

    it('should return correct PhieuMuon fields', () => {
      insertDocGia('DG001');
      insertSach('S001', 'DA_MUON');
      insertPhieuMuon('PM001', 'DG001', 'S001', {
        ngayMuon: '2019-12-01',
        hanTra: '2019-12-15',
        tienPhat: 0,
      });

      const result = controller.getOverdueLoans();
      expect(result).toHaveLength(1);
      const loan = result[0];
      expect(loan.maPhieu).toBe('PM001');
      expect(loan.maDocGia).toBe('DG001');
      expect(loan.maSach).toBe('S001');
      expect(loan.ngayMuon).toBeInstanceOf(Date);
      expect(loan.hanTra).toBeInstanceOf(Date);
      expect(loan.ngayTraThucTe).toBeNull();
      expect(loan.trangThai).toBe(TrangThaiPhieu.DANG_MUON);
      expect(loan.tienPhat).toBe(0);
    });
  });

  // === Task 11.1: getInventoryStatus ===
  describe('getInventoryStatus', () => {
    it('should return all zeros when no books exist', () => {
      const result = controller.getInventoryStatus();
      expect(result).toEqual({
        sanSang: 0,
        daMuon: 0,
        baoTri: 0,
        mat: 0,
        tongCong: 0,
      });
    });

    it('should count books by tinhTrang correctly', () => {
      insertSach('S001', 'SAN_SANG');
      insertSach('S002', 'SAN_SANG');
      insertSach('S003', 'DA_MUON');
      insertSach('S004', 'BAO_TRI');
      insertSach('S005', 'MAT');

      const result = controller.getInventoryStatus();
      expect(result.sanSang).toBe(2);
      expect(result.daMuon).toBe(1);
      expect(result.baoTri).toBe(1);
      expect(result.mat).toBe(1);
      expect(result.tongCong).toBe(5);
    });

    it('should return correct tongCong as sum of all statuses', () => {
      insertSach('S001', 'SAN_SANG');
      insertSach('S002', 'DA_MUON');
      insertSach('S003', 'DA_MUON');

      const result = controller.getInventoryStatus();
      expect(result.tongCong).toBe(result.sanSang + result.daMuon + result.baoTri + result.mat);
      expect(result.tongCong).toBe(3);
    });

    it('should handle only one status type', () => {
      insertSach('S001', 'BAO_TRI');
      insertSach('S002', 'BAO_TRI');
      insertSach('S003', 'BAO_TRI');

      const result = controller.getInventoryStatus();
      expect(result.sanSang).toBe(0);
      expect(result.daMuon).toBe(0);
      expect(result.baoTri).toBe(3);
      expect(result.mat).toBe(0);
      expect(result.tongCong).toBe(3);
    });

    it('should handle all four status types present', () => {
      insertSach('S001', 'SAN_SANG');
      insertSach('S002', 'DA_MUON');
      insertSach('S003', 'BAO_TRI');
      insertSach('S004', 'MAT');

      const result = controller.getInventoryStatus();
      expect(result.sanSang).toBe(1);
      expect(result.daMuon).toBe(1);
      expect(result.baoTri).toBe(1);
      expect(result.mat).toBe(1);
      expect(result.tongCong).toBe(4);
    });
  });
});
