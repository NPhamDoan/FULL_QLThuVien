import Database from 'better-sqlite3';
import { Sach, TinhTrangSach } from '../types';
import { removeDiacritics } from '../utils/diacritics';

export class TraCuuHeThongController {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  searchByTitle(keyword: string): Sach[] {
    const allBooks = this.db.prepare('SELECT * FROM Sach').all() as Record<string, unknown>[];
    const normalizedKeyword = removeDiacritics(keyword).toLowerCase();

    return allBooks
      .filter(row => {
        const title = row.tieuDe as string;
        return title.toLowerCase().includes(keyword.toLowerCase())
          || removeDiacritics(title).toLowerCase().includes(normalizedKeyword);
      })
      .map(row => this.mapRowToSach(row));
  }

  searchByAuthor(keyword: string): Sach[] {
    const allBooks = this.db.prepare('SELECT * FROM Sach').all() as Record<string, unknown>[];
    const normalizedKeyword = removeDiacritics(keyword).toLowerCase();

    return allBooks
      .filter(row => {
        const author = row.tacGia as string;
        return author.toLowerCase().includes(keyword.toLowerCase())
          || removeDiacritics(author).toLowerCase().includes(normalizedKeyword);
      })
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
      tinhTrang: row.tinhTrang as TinhTrangSach,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };
  }
}
