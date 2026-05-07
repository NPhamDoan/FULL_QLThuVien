import Database from 'better-sqlite3';
import {
  PhieuMuon,
  ValidationResult,
  BookStatus,
  ReturnResult,
  TrangThaiPhieu,
} from '../types';

export class PhieuMuonController {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // === Active loans list ===

  getActiveLoans(): (PhieuMuon & { tenDocGia?: string; tenSach?: string })[] {
    const rows = this.db.prepare(`
      SELECT pm.*, dg.hoTen AS tenDocGia, s.tieuDe AS tenSach
      FROM PhieuMuon pm
      LEFT JOIN DocGia dg ON pm.maDocGia = dg.maDocGia
      LEFT JOIN Sach s ON pm.maSach = s.maSach
      WHERE pm.trangThai = ?
      ORDER BY pm.ngayMuon DESC
    `).all(TrangThaiPhieu.DANG_MUON) as Record<string, unknown>[];
    return rows.map((r) => ({
      ...this.mapRowToPhieuMuon(r),
      tenDocGia: r.tenDocGia as string | undefined,
      tenSach: r.tenSach as string | undefined,
    }));
  }

  searchActiveLoans(keyword: string, searchType: string = 'all'): (PhieuMuon & { tenDocGia?: string; tenSach?: string })[] {
    const like = `%${keyword}%`;
    let whereClause: string;
    let params: string[];

    switch (searchType) {
      case 'docgia':
        whereClause = 'AND (dg.hoTen LIKE ?)';
        params = [like];
        break;
      case 'sach':
        whereClause = 'AND (s.tieuDe LIKE ?)';
        params = [like];
        break;
      case 'maphieu':
        whereClause = 'AND (pm.maPhieu LIKE ?)';
        params = [like];
        break;
      default:
        whereClause = 'AND (dg.hoTen LIKE ? OR s.tieuDe LIKE ? OR pm.maPhieu LIKE ? OR pm.maDocGia LIKE ? OR pm.maSach LIKE ?)';
        params = [like, like, like, like, like];
        break;
    }

    const rows = this.db.prepare(`
      SELECT pm.*, dg.hoTen AS tenDocGia, s.tieuDe AS tenSach
      FROM PhieuMuon pm
      LEFT JOIN DocGia dg ON pm.maDocGia = dg.maDocGia
      LEFT JOIN Sach s ON pm.maSach = s.maSach
      WHERE pm.trangThai = ?
        ${whereClause}
      ORDER BY pm.ngayMuon DESC
    `).all(TrangThaiPhieu.DANG_MUON, ...params) as Record<string, unknown>[];
    return rows.map((r) => ({
      ...this.mapRowToPhieuMuon(r),
      tenDocGia: r.tenDocGia as string | undefined,
      tenSach: r.tenSach as string | undefined,
    }));
  }

  // === Task 7.1: Validation functions ===

  validateMember(maDocGia: string): ValidationResult {
    const row = this.db.prepare(
      'SELECT maDocGia, ngayHetHan FROM DocGia WHERE maDocGia = ?'
    ).get(maDocGia) as { maDocGia: string; ngayHetHan: string } | undefined;

    if (!row) {
      return { valid: false, message: 'Mã độc giả không tồn tại' };
    }

    const today = new Date().toISOString().split('T')[0];
    if (row.ngayHetHan < today) {
      return { valid: false, message: `Thẻ độc giả đã hết hạn từ ngày: ${row.ngayHetHan}` };
    }

    return { valid: true };
  }

  checkBookAvailability(maSach: string): BookStatus {
    const book = this.db.prepare(
      'SELECT soBanSao, soMat, soBaoTri FROM Sach WHERE maSach = ?'
    ).get(maSach) as { soBanSao: number; soMat: number; soBaoTri: number } | undefined;

    if (!book) {
      return { available: false, soKhaDung: 0, message: 'Mã sách không tồn tại' };
    }

    const soDangMuon = (this.db.prepare(
      'SELECT COUNT(*) as count FROM PhieuMuon WHERE maSach = ? AND trangThai = ?'
    ).get(maSach, TrangThaiPhieu.DANG_MUON) as { count: number }).count;

    const soKhaDung = book.soBanSao - book.soMat - book.soBaoTri - soDangMuon;

    if (soKhaDung <= 0) {
      return { available: false, soKhaDung, message: 'Hết bản khả dụng để mượn' };
    }

    return { available: true, soKhaDung };
  }

  // === Task 7.3: createLoan ===

  createLoan(maDocGia: string, maSach: string): PhieuMuon {
    const createLoanTx = this.db.transaction(() => {
      // Re-check availability inside transaction (race-condition safe)
      const book = this.db.prepare('SELECT soBanSao, soMat, soBaoTri FROM Sach WHERE maSach = ?').get(maSach) as { soBanSao: number; soMat: number; soBaoTri: number } | undefined;
      if (!book) throw new Error('Mã sách không tồn tại');
      const soDangMuon = (this.db.prepare('SELECT COUNT(*) as count FROM PhieuMuon WHERE maSach = ? AND trangThai = ?').get(maSach, TrangThaiPhieu.DANG_MUON) as { count: number }).count;
      if (book.soBanSao - book.soMat - book.soBaoTri - soDangMuon <= 0) {
        throw new Error('Hết bản khả dụng để mượn');
      }

      const last = this.db.prepare("SELECT maPhieu FROM PhieuMuon WHERE maPhieu LIKE 'PM%' ORDER BY CAST(SUBSTR(maPhieu, 3) AS INTEGER) DESC LIMIT 1").get() as { maPhieu: string } | undefined;
      const nextNum = last ? parseInt(last.maPhieu.substring(2)) + 1 : 1;
      const maPhieu = 'PM' + String(nextNum).padStart(3, '0');
      const ngayMuon = new Date().toISOString().split('T')[0];
      const hanTraDate = new Date();
      hanTraDate.setDate(hanTraDate.getDate() + 14);
      const hanTra = hanTraDate.toISOString().split('T')[0];

      this.db.prepare(`
        INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, tienPhat)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `).run(maPhieu, maDocGia, maSach, ngayMuon, hanTra, TrangThaiPhieu.DANG_MUON);

      // KHÔNG update Sach nữa - availability tự derive từ counters + PhieuMuon

      const row = this.db.prepare('SELECT * FROM PhieuMuon WHERE maPhieu = ?').get(maPhieu) as Record<string, unknown>;
      return this.mapRowToPhieuMuon(row);
    });

    return createLoanTx();
  }

  // === Task 8.1: findLoan ===

  findLoanByCode(maPhieu: string): PhieuMuon | null {
    const row = this.db.prepare(
      'SELECT * FROM PhieuMuon WHERE maPhieu = ?'
    ).get(maPhieu) as Record<string, unknown> | undefined;

    if (!row) return null;
    return this.mapRowToPhieuMuon(row);
  }

  findLoanByBook(maSach: string): PhieuMuon | null {
    const row = this.db.prepare(
      'SELECT * FROM PhieuMuon WHERE maSach = ? AND trangThai = ?'
    ).get(maSach, TrangThaiPhieu.DANG_MUON) as Record<string, unknown> | undefined;

    if (!row) return null;
    return this.mapRowToPhieuMuon(row);
  }

  // === Task 8.3: calculateFine ===

  calculateFine(hanTra: Date, ngayTraThucTe: Date): number {
    if (ngayTraThucTe > hanTra) {
      const diffMs = ngayTraThucTe.getTime() - hanTra.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays * 5000;
    }
    return 0;
  }

  // === Task 8.5: returnBook ===

  returnBook(maPhieu: string, options: { daMatSach?: boolean; phiMat?: number } = {}): ReturnResult {
    const returnBookTx = this.db.transaction(() => {
      const loan = this.findLoanByCode(maPhieu);

      if (!loan) {
        return { success: false, tienPhat: 0, ngayTraThucTe: new Date(), message: 'Không tìm thấy phiếu mượn' };
      }

      if (loan.trangThai !== TrangThaiPhieu.DANG_MUON) {
        return { success: false, tienPhat: 0, ngayTraThucTe: new Date(), message: 'Phiếu mượn này đã được trả trước đó' };
      }

      const ngayTraThucTe = new Date();
      const finePhatTre = this.calculateFine(loan.hanTra, ngayTraThucTe);
      const phiMat = options.daMatSach ? (options.phiMat ?? 0) : 0;
      const tienPhat = finePhatTre + phiMat;
      const ngayTraStr = ngayTraThucTe.toISOString().split('T')[0];

      this.db.prepare(`
        UPDATE PhieuMuon SET trangThai = ?, ngayTraThucTe = ?, tienPhat = ?, updatedAt = datetime('now')
        WHERE maPhieu = ?
      `).run(TrangThaiPhieu.DA_TRA, ngayTraStr, tienPhat, maPhieu);

      // Nếu sách bị mất, tăng counter soMat
      if (options.daMatSach) {
        this.db.prepare(
          `UPDATE Sach SET soMat = soMat + 1, updatedAt = datetime('now') WHERE maSach = ?`
        ).run(loan.maSach);
      }

      return { success: true, tienPhat, ngayTraThucTe, daMatSach: options.daMatSach };
    });

    return returnBookTx();
  }

  // === Task 9.1: extendLoan ===

  extendLoan(maPhieu: string): PhieuMuon {
    const loan = this.findLoanByCode(maPhieu);

    if (!loan) {
      throw new Error('Không tìm thấy phiếu mượn');
    }

    if (loan.trangThai !== TrangThaiPhieu.DANG_MUON) {
      throw new Error('Phiếu mượn đã hoàn tất, không thể gia hạn');
    }

    const newHanTra = new Date(loan.hanTra);
    newHanTra.setDate(newHanTra.getDate() + 7);
    const newHanTraStr = newHanTra.toISOString().split('T')[0];

    this.db.prepare(`
      UPDATE PhieuMuon SET hanTra = ?, updatedAt = datetime('now') WHERE maPhieu = ?
    `).run(newHanTraStr, maPhieu);

    return this.findLoanByCode(maPhieu)!;
  }

  // === Helper ===

  private mapRowToPhieuMuon(row: Record<string, unknown>): PhieuMuon {
    return {
      maPhieu: row.maPhieu as string,
      maDocGia: row.maDocGia as string,
      maSach: row.maSach as string,
      ngayMuon: new Date(row.ngayMuon as string),
      hanTra: new Date(row.hanTra as string),
      ngayTraThucTe: row.ngayTraThucTe ? new Date(row.ngayTraThucTe as string) : null,
      trangThai: row.trangThai as TrangThaiPhieu,
      tienPhat: row.tienPhat as number,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };
  }
}
