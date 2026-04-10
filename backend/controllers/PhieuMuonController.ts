import Database from 'better-sqlite3';
import {
  PhieuMuon,
  ValidationResult,
  BookStatus,
  ReturnResult,
  TinhTrangSach,
  TrangThaiPhieu,
} from '../types';

export class PhieuMuonController {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // === Active loans list ===

  getActiveLoans(): PhieuMuon[] {
    const rows = this.db.prepare(
      "SELECT * FROM PhieuMuon WHERE trangThai = 'DANG_MUON' ORDER BY ngayMuon DESC"
    ).all() as Record<string, unknown>[];
    return rows.map((r) => this.mapRowToPhieuMuon(r));
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
    const row = this.db.prepare(
      'SELECT maSach, tinhTrang FROM Sach WHERE maSach = ?'
    ).get(maSach) as { maSach: string; tinhTrang: string } | undefined;

    if (!row) {
      return { available: false, tinhTrang: TinhTrangSach.SAN_SANG, message: 'Mã sách không tồn tại' };
    }

    if (row.tinhTrang !== TinhTrangSach.SAN_SANG) {
      return { available: false, tinhTrang: row.tinhTrang as TinhTrangSach, message: 'Sách không khả dụng' };
    }

    return { available: true, tinhTrang: TinhTrangSach.SAN_SANG };
  }

  // === Task 7.3: createLoan ===

  createLoan(maDocGia: string, maSach: string): PhieuMuon {
    const createLoanTx = this.db.transaction(() => {
      const maPhieu = 'PM' + Date.now();
      const ngayMuon = new Date().toISOString().split('T')[0];
      const hanTraDate = new Date();
      hanTraDate.setDate(hanTraDate.getDate() + 14);
      const hanTra = hanTraDate.toISOString().split('T')[0];

      this.db.prepare(`
        INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, tienPhat)
        VALUES (?, ?, ?, ?, ?, 'DANG_MUON', 0)
      `).run(maPhieu, maDocGia, maSach, ngayMuon, hanTra);

      this.db.prepare(`
        UPDATE Sach SET tinhTrang = 'DA_MUON', updatedAt = datetime('now') WHERE maSach = ?
      `).run(maSach);

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
      "SELECT * FROM PhieuMuon WHERE maSach = ? AND trangThai = 'DANG_MUON'"
    ).get(maSach) as Record<string, unknown> | undefined;

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

  returnBook(maPhieu: string): ReturnResult {
    const returnBookTx = this.db.transaction(() => {
      const loan = this.findLoanByCode(maPhieu);

      if (!loan) {
        return { success: false, tienPhat: 0, ngayTraThucTe: new Date(), message: 'Không tìm thấy phiếu mượn' };
      }

      if (loan.trangThai !== TrangThaiPhieu.DANG_MUON) {
        return { success: false, tienPhat: 0, ngayTraThucTe: new Date(), message: 'Phiếu mượn này đã được trả trước đó' };
      }

      const ngayTraThucTe = new Date();
      const tienPhat = this.calculateFine(loan.hanTra, ngayTraThucTe);
      const ngayTraStr = ngayTraThucTe.toISOString().split('T')[0];

      this.db.prepare(`
        UPDATE PhieuMuon SET trangThai = 'DA_TRA', ngayTraThucTe = ?, tienPhat = ?, updatedAt = datetime('now')
        WHERE maPhieu = ?
      `).run(ngayTraStr, tienPhat, maPhieu);

      this.db.prepare(`
        UPDATE Sach SET tinhTrang = 'SAN_SANG', updatedAt = datetime('now') WHERE maSach = ?
      `).run(loan.maSach);

      return { success: true, tienPhat, ngayTraThucTe };
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
