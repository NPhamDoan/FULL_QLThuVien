import { BaoCaoController } from '../../controllers/BaoCaoController';
import { initializeDatabase } from '../../database';
import { TrangThaiPhieu } from '../../types';
import Database from 'better-sqlite3';

describe('BaoCaoController', () => {
  let db: Database.Database;
  let controller: BaoCaoController;

  function insertDocGia(maDocGia: string) {
    db.prepare(`
      INSERT INTO DocGia (maDocGia, hoTen, email, soDienThoai, ngayHetHan)
      VALUES (?, 'R', ?, '0901', '2099-12-31')
    `).run(maDocGia, `${maDocGia}@t.com`);
  }

  function insertSach(maSach: string, soBanSao: number = 1, soMat: number = 0, soBaoTri: number = 0) {
    db.prepare(`
      INSERT INTO Sach (maSach, tieuDe, tacGia, soBanSao, soMat, soBaoTri)
      VALUES (?, 'T', 'A', ?, ?, ?)
    `).run(maSach, soBanSao, soMat, soBaoTri);
  }

  function insertPhieuMuon(
    maPhieu: string,
    maDocGia: string,
    maSach: string,
    opts: { hanTra?: string; trangThai?: string; ngayTraThucTe?: string | null } = {}
  ) {
    db.prepare(`
      INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, ngayTraThucTe, tienPhat)
      VALUES (?, ?, ?, '2025-01-01', ?, ?, ?, 0)
    `).run(
      maPhieu, maDocGia, maSach,
      opts.hanTra ?? '2025-01-15',
      opts.trangThai ?? 'DANG_MUON',
      opts.ngayTraThucTe ?? null,
    );
  }

  beforeEach(() => {
    db = initializeDatabase(':memory:');
    controller = new BaoCaoController(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('getOverdueLoans', () => {
    it('should return empty array when no loans exist', () => {
      expect(controller.getOverdueLoans()).toEqual([]);
    });

    it('should return overdue loans (DANG_MUON + hanTra < today)', () => {
      insertDocGia('DG001');
      insertSach('S001');
      insertPhieuMuon('PM001', 'DG001', 'S001', { hanTra: '2020-01-01' });

      const result = controller.getOverdueLoans();
      expect(result).toHaveLength(1);
      expect(result[0].maPhieu).toBe('PM001');
      expect(result[0].trangThai).toBe(TrangThaiPhieu.DANG_MUON);
    });

    it('should not return DA_TRA loans', () => {
      insertDocGia('DG001');
      insertSach('S001');
      insertPhieuMuon('PM001', 'DG001', 'S001', {
        hanTra: '2020-01-01', trangThai: 'DA_TRA', ngayTraThucTe: '2020-01-05',
      });
      expect(controller.getOverdueLoans()).toEqual([]);
    });

    it('should not return future loans', () => {
      insertDocGia('DG001');
      insertSach('S001');
      const future = new Date();
      future.setDate(future.getDate() + 7);
      insertPhieuMuon('PM001', 'DG001', 'S001', { hanTra: future.toISOString().split('T')[0] });
      expect(controller.getOverdueLoans()).toEqual([]);
    });
  });

  describe('getInventoryStatus', () => {
    it('should return all zeros when no books exist', () => {
      const result = controller.getInventoryStatus();
      expect(result).toEqual({
        soDauSach: 0,
        soBanSao: 0,
        soKhaDung: 0,
        soDangMuon: 0,
        soBaoTri: 0,
        soMat: 0,
      });
    });

    it('should count đầu sách as number of rows, bản sao as sum of soBanSao', () => {
      insertSach('S001', 3);
      insertSach('S002', 2);
      insertSach('S003', 1);

      const result = controller.getInventoryStatus();
      expect(result.soDauSach).toBe(3);
      expect(result.soBanSao).toBe(6);
      expect(result.soKhaDung).toBe(6);
      expect(result.soDangMuon).toBe(0);
      expect(result.soBaoTri).toBe(0);
      expect(result.soMat).toBe(0);
    });

    it('should subtract soMat, soBaoTri, soDangMuon from soKhaDung', () => {
      insertSach('S001', 5, 1, 1); // 5 - 1 mất - 1 bảo trì = 3 potential
      insertDocGia('DG001');
      insertPhieuMuon('PM001', 'DG001', 'S001');  // 1 đang mượn → khả dụng = 2

      const result = controller.getInventoryStatus();
      expect(result.soDauSach).toBe(1);
      expect(result.soBanSao).toBe(5);
      expect(result.soMat).toBe(1);
      expect(result.soBaoTri).toBe(1);
      expect(result.soDangMuon).toBe(1);
      expect(result.soKhaDung).toBe(2);
    });

    it('should only count DANG_MUON loans, not DA_TRA', () => {
      insertSach('S001', 2);
      insertDocGia('DG001');
      insertPhieuMuon('PM001', 'DG001', 'S001');
      insertPhieuMuon('PM002', 'DG001', 'S001', {
        trangThai: 'DA_TRA', ngayTraThucTe: '2025-01-10',
      });

      const result = controller.getInventoryStatus();
      expect(result.soDangMuon).toBe(1);
    });
  });
});
