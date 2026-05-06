import Database from 'better-sqlite3';
import { DocGia, CreateDocGiaInput, UpdateDocGiaInput, DeleteResult, TrangThaiPhieu } from '../types';
import { removeDiacritics } from '../utils/diacritics';

export class DocGiaController {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  listReaders(): DocGia[] {
    const rows = this.db.prepare('SELECT * FROM DocGia ORDER BY createdAt DESC').all() as Record<string, unknown>[];
    return rows.map(r => this.mapRowToDocGia(r));
  }

  getReaderById(maDocGia: string): DocGia | null {
    const row = this.db.prepare('SELECT * FROM DocGia WHERE maDocGia = ?').get(maDocGia) as Record<string, unknown> | undefined;
    return row ? this.mapRowToDocGia(row) : null;
  }

  searchReaders(keyword: string): DocGia[] {
    const all = this.listReaders();
    if (!keyword || keyword.trim() === '') return all;
    const kw = keyword.toLowerCase();
    const kwNorm = removeDiacritics(kw);
    return all.filter(r => {
      const fields = [r.maDocGia, r.hoTen, r.email, r.soDienThoai].map(v => String(v || ''));
      return fields.some(f =>
        f.toLowerCase().includes(kw) || removeDiacritics(f).toLowerCase().includes(kwNorm)
      );
    });
  }

  createMember(data: CreateDocGiaInput): DocGia {
    if (!data.hoTen || data.hoTen.trim() === '') {
      throw new Error('hoTen là trường bắt buộc');
    }
    if (!data.email || data.email.trim() === '') {
      throw new Error('email là trường bắt buộc');
    }

    const last = this.db.prepare("SELECT maDocGia FROM DocGia WHERE maDocGia LIKE 'DG%' ORDER BY CAST(SUBSTR(maDocGia, 3) AS INTEGER) DESC LIMIT 1").get() as { maDocGia: string } | undefined;
    const nextNum = last ? parseInt(last.maDocGia.substring(2)) + 1 : 1;
    const maDocGia = 'DG' + String(nextNum).padStart(3, '0');
    const ngayHetHan = data.ngayHetHan instanceof Date
      ? data.ngayHetHan.toISOString()
      : String(data.ngayHetHan);

    this.db.prepare(`
      INSERT INTO DocGia (maDocGia, hoTen, email, soDienThoai, ngayHetHan)
      VALUES (?, ?, ?, ?, ?)
    `).run(maDocGia, data.hoTen, data.email, data.soDienThoai, ngayHetHan);

    const row = this.db.prepare('SELECT * FROM DocGia WHERE maDocGia = ?').get(maDocGia) as Record<string, unknown>;

    return this.mapRowToDocGia(row);
  }

  updateMember(maDocGia: string, data: UpdateDocGiaInput): DocGia {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (data.hoTen !== undefined) {
      setClauses.push('hoTen = ?');
      values.push(data.hoTen);
    }
    if (data.email !== undefined) {
      setClauses.push('email = ?');
      values.push(data.email);
    }
    if (data.soDienThoai !== undefined) {
      setClauses.push('soDienThoai = ?');
      values.push(data.soDienThoai);
    }
    if (data.ngayHetHan !== undefined) {
      const ngayHetHan = data.ngayHetHan instanceof Date
        ? data.ngayHetHan.toISOString()
        : String(data.ngayHetHan);
      setClauses.push('ngayHetHan = ?');
      values.push(ngayHetHan);
    }

    setClauses.push("updatedAt = datetime('now')");
    values.push(maDocGia);

    this.db.prepare(`
      UPDATE DocGia SET ${setClauses.join(', ')} WHERE maDocGia = ?
    `).run(...values);

    const row = this.db.prepare('SELECT * FROM DocGia WHERE maDocGia = ?').get(maDocGia) as Record<string, unknown>;

    return this.mapRowToDocGia(row);
  }

  deleteMember(maDocGia: string): DeleteResult {
    if (this.hasActiveLoans(maDocGia)) {
      return { success: false, message: 'Không thể xóa độc giả đang có sách mượn' };
    }

    // Delete returned loans first to satisfy FK constraint
    this.db.prepare('DELETE FROM PhieuMuon WHERE maDocGia = ? AND trangThai = ?').run(maDocGia, TrangThaiPhieu.DA_TRA);
    this.db.prepare('DELETE FROM DocGia WHERE maDocGia = ?').run(maDocGia);
    return { success: true };
  }

  hasActiveLoans(maDocGia: string): boolean {
    const row = this.db.prepare(
      'SELECT COUNT(*) as count FROM PhieuMuon WHERE maDocGia = ? AND trangThai = ?'
    ).get(maDocGia, TrangThaiPhieu.DANG_MUON) as { count: number };

    return row.count > 0;
  }

  private mapRowToDocGia(row: Record<string, unknown>): DocGia {
    return {
      maDocGia: row.maDocGia as string,
      hoTen: row.hoTen as string,
      email: row.email as string,
      soDienThoai: row.soDienThoai as string,
      ngayHetHan: new Date(row.ngayHetHan as string),
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };
  }
}
