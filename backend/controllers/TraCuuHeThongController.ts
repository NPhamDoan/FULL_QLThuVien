import Database from 'better-sqlite3';
import { Sach } from '../types';
import { filterByKeyword } from '../utils/diacritics';

export class TraCuuHeThongController {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  searchByTitle(keyword: string): Sach[] {
    const allBooks = this.db.prepare('SELECT * FROM Sach').all() as Record<string, unknown>[];
    return filterByKeyword(allBooks, keyword, r => [r.tieuDe as string])
      .map(row => this.mapRowToSach(row));
  }

  searchByAuthor(keyword: string): Sach[] {
    const allBooks = this.db.prepare('SELECT * FROM Sach').all() as Record<string, unknown>[];
    return filterByKeyword(allBooks, keyword, r => [r.tacGia as string])
      .map(row => this.mapRowToSach(row));
  }

  searchByCode(maSach: string): Sach | null {
    const row = this.db.prepare(
      'SELECT * FROM Sach WHERE maSach = ?'
    ).get(maSach) as Record<string, unknown> | undefined;

    if (!row) return null;
    return this.mapRowToSach(row);
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
}
