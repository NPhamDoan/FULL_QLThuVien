import Database from 'better-sqlite3';
import {
  Sach,
  SachWithAvailability,
  CreateSachInput,
  UpdateSachInput,
  DeleteResult,
  TrangThaiPhieu,
} from '../types';
import { filterByKeyword, matchesAny } from '../utils/diacritics';

export class SachController {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  listBooks(): SachWithAvailability[] {
    const rows = this.db.prepare('SELECT * FROM Sach ORDER BY createdAt DESC').all() as Record<string, unknown>[];
    return rows.map(r => this.mapRowToSachWithAvailability(r));
  }

  getBookById(maSach: string): SachWithAvailability | null {
    const row = this.db.prepare('SELECT * FROM Sach WHERE maSach = ?').get(maSach) as Record<string, unknown> | undefined;
    return row ? this.mapRowToSachWithAvailability(row) : null;
  }

  searchBooks(keyword: string, onlyAvailable?: boolean): SachWithAvailability[] {
    const all = this.listBooks();
    let filtered = filterByKeyword(all, keyword, b => [b.maSach, b.tieuDe, b.tacGia]);
    if (onlyAvailable) {
      filtered = filtered.filter(b => b.soKhaDung > 0);
    }
    return filtered;
  }

  createBook(data: CreateSachInput): Sach {
    if (!data.tieuDe || data.tieuDe.trim() === '') {
      throw new Error('tieuDe là trường bắt buộc');
    }
    if (!data.tacGia || data.tacGia.trim() === '') {
      throw new Error('tacGia là trường bắt buộc');
    }
    const soBanSao = data.soBanSao ?? 1;
    if (soBanSao < 1) {
      throw new Error('soBanSao phải >= 1');
    }

    const last = this.db.prepare("SELECT maSach FROM Sach WHERE maSach LIKE 'S%' ORDER BY CAST(SUBSTR(maSach, 2) AS INTEGER) DESC LIMIT 1").get() as { maSach: string } | undefined;
    const nextNum = last ? parseInt(last.maSach.substring(1)) + 1 : 1;
    const maSach = 'S' + String(nextNum).padStart(3, '0');

    this.db.prepare(`
      INSERT INTO Sach (maSach, tieuDe, tacGia, soBanSao)
      VALUES (?, ?, ?, ?)
    `).run(maSach, data.tieuDe, data.tacGia, soBanSao);

    const row = this.db.prepare('SELECT * FROM Sach WHERE maSach = ?').get(maSach) as Record<string, unknown>;
    return this.mapRowToSach(row);
  }

  updateBook(maSach: string, data: UpdateSachInput): Sach {
    const current = this.db.prepare('SELECT * FROM Sach WHERE maSach = ?').get(maSach) as Record<string, unknown> | undefined;
    if (!current) throw new Error('Sách không tồn tại');

    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (data.tieuDe !== undefined) {
      setClauses.push('tieuDe = ?');
      values.push(data.tieuDe);
    }
    if (data.tacGia !== undefined) {
      setClauses.push('tacGia = ?');
      values.push(data.tacGia);
    }

    // Compute new counter values (for validation)
    const newSoBanSao = data.soBanSao ?? (current.soBanSao as number);
    const newSoMat = data.soMat ?? (current.soMat as number);
    const newSoBaoTri = data.soBaoTri ?? (current.soBaoTri as number);
    const soDangMuon = this.getActiveLoanCount(maSach);

    if (newSoBanSao < newSoMat + newSoBaoTri + soDangMuon) {
      throw new Error(
        `soBanSao (${newSoBanSao}) không được nhỏ hơn tổng (mất ${newSoMat} + bảo trì ${newSoBaoTri} + đang mượn ${soDangMuon} = ${newSoMat + newSoBaoTri + soDangMuon})`
      );
    }
    if (newSoBanSao < 0 || newSoMat < 0 || newSoBaoTri < 0) {
      throw new Error('Số lượng không được âm');
    }

    if (data.soBanSao !== undefined) { setClauses.push('soBanSao = ?'); values.push(data.soBanSao); }
    if (data.soMat !== undefined) { setClauses.push('soMat = ?'); values.push(data.soMat); }
    if (data.soBaoTri !== undefined) { setClauses.push('soBaoTri = ?'); values.push(data.soBaoTri); }

    setClauses.push("updatedAt = datetime('now')");
    values.push(maSach);

    this.db.prepare(`UPDATE Sach SET ${setClauses.join(', ')} WHERE maSach = ?`).run(...values);

    const row = this.db.prepare('SELECT * FROM Sach WHERE maSach = ?').get(maSach) as Record<string, unknown>;
    return this.mapRowToSach(row);
  }

  deleteBook(maSach: string): DeleteResult {
    if (this.getActiveLoanCount(maSach) > 0) {
      return { success: false, message: 'Không thể xóa sách đang được mượn' };
    }

    // Delete returned loans first to satisfy FK constraint
    this.db.prepare('DELETE FROM PhieuMuon WHERE maSach = ? AND trangThai = ?').run(maSach, TrangThaiPhieu.DA_TRA);
    this.db.prepare('DELETE FROM Sach WHERE maSach = ?').run(maSach);
    return { success: true };
  }

  /** Đếm số bản đang được mượn (PhieuMuon.trangThai = DANG_MUON) */
  getActiveLoanCount(maSach: string): number {
    const row = this.db.prepare(
      'SELECT COUNT(*) as count FROM PhieuMuon WHERE maSach = ? AND trangThai = ?'
    ).get(maSach, TrangThaiPhieu.DANG_MUON) as { count: number };
    return row.count;
  }

  /** Số bản có thể mượn = soBanSao - soMat - soBaoTri - soDangMuon */
  getAvailableCount(maSach: string): number {
    const book = this.db.prepare('SELECT * FROM Sach WHERE maSach = ?').get(maSach) as Record<string, unknown> | undefined;
    if (!book) return 0;
    const soDangMuon = this.getActiveLoanCount(maSach);
    return (book.soBanSao as number) - (book.soMat as number) - (book.soBaoTri as number) - soDangMuon;
  }

  /** Tăng số bản mất (khi trả sách đánh dấu mất) */
  incrementLost(maSach: string): void {
    this.db.prepare(`UPDATE Sach SET soMat = soMat + 1, updatedAt = datetime('now') WHERE maSach = ?`).run(maSach);
  }

  private mapRowToSach(row: Record<string, unknown>): Sach {
    return {
      maSach: row.maSach as string,
      tieuDe: row.tieuDe as string,
      tacGia: row.tacGia as string,
      soBanSao: row.soBanSao as number,
      soMat: row.soMat as number,
      soBaoTri: row.soBaoTri as number,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };
  }

  private mapRowToSachWithAvailability(row: Record<string, unknown>): SachWithAvailability {
    const base = this.mapRowToSach(row);
    const soDangMuon = this.getActiveLoanCount(base.maSach);
    const soKhaDung = base.soBanSao - base.soMat - base.soBaoTri - soDangMuon;
    return { ...base, soDangMuon, soKhaDung };
  }
}
