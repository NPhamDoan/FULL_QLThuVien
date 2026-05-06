import Database from 'better-sqlite3';
import { Sach, CreateSachInput, UpdateSachInput, DeleteResult, TinhTrangSach, TrangThaiPhieu } from '../types';
import { removeDiacritics } from '../utils/diacritics';

export class SachController {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  listBooks(): Sach[] {
    const rows = this.db.prepare('SELECT * FROM Sach ORDER BY createdAt DESC').all() as Record<string, unknown>[];
    return rows.map(r => this.mapRowToSach(r));
  }

  searchBooks(keyword: string, tinhTrang?: string): Sach[] {
    const all = this.listBooks();
    const kw = keyword.toLowerCase();
    const kwNorm = removeDiacritics(kw);
    let filtered = all.filter(b => {
      const fields = [b.maSach, b.tieuDe, b.tacGia].map(v => String(v || ''));
      return fields.some(f =>
        f.toLowerCase().includes(kw) || removeDiacritics(f).toLowerCase().includes(kwNorm)
      );
    });
    if (tinhTrang) {
      filtered = filtered.filter(b => b.tinhTrang === tinhTrang);
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

    const last = this.db.prepare("SELECT maSach FROM Sach WHERE maSach LIKE 'S%' ORDER BY CAST(SUBSTR(maSach, 2) AS INTEGER) DESC LIMIT 1").get() as { maSach: string } | undefined;
    const nextNum = last ? parseInt(last.maSach.substring(1)) + 1 : 1;
    const maSach = 'S' + String(nextNum).padStart(3, '0');

    this.db.prepare(`
      INSERT INTO Sach (maSach, tieuDe, tacGia)
      VALUES (?, ?, ?)
    `).run(maSach, data.tieuDe, data.tacGia);

    const row = this.db.prepare('SELECT * FROM Sach WHERE maSach = ?').get(maSach) as Record<string, unknown>;

    return this.mapRowToSach(row);
  }

  updateBook(maSach: string, data: UpdateSachInput): Sach {
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
    if (data.tinhTrang !== undefined) {
      setClauses.push('tinhTrang = ?');
      values.push(data.tinhTrang);
    }

    setClauses.push("updatedAt = datetime('now')");
    values.push(maSach);

    this.db.prepare(`
      UPDATE Sach SET ${setClauses.join(', ')} WHERE maSach = ?
    `).run(...values);

    const row = this.db.prepare('SELECT * FROM Sach WHERE maSach = ?').get(maSach) as Record<string, unknown>;

    return this.mapRowToSach(row);
  }

  deleteBook(maSach: string): DeleteResult {
    if (this.isBookOnLoan(maSach)) {
      return { success: false, message: 'Không thể xóa sách đang được mượn' };
    }

    // Delete returned loans first to satisfy FK constraint
    this.db.prepare('DELETE FROM PhieuMuon WHERE maSach = ? AND trangThai = ?').run(maSach, TrangThaiPhieu.DA_TRA);
    this.db.prepare('DELETE FROM Sach WHERE maSach = ?').run(maSach);
    return { success: true };
  }

  isBookOnLoan(maSach: string): boolean {
    const row = this.db.prepare(
      'SELECT tinhTrang FROM Sach WHERE maSach = ?'
    ).get(maSach) as { tinhTrang: string } | undefined;

    if (!row) {
      return false;
    }

    return row.tinhTrang === TinhTrangSach.DA_MUON;
  }

  private mapRowToSach(row: Record<string, unknown>): Sach {
    return {
      maSach: row.maSach as string,
      tieuDe: row.tieuDe as string,
      tacGia: row.tacGia as string,
      tinhTrang: row.tinhTrang as TinhTrangSach,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };
  }
}
