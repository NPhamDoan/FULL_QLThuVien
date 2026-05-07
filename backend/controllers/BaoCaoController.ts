import Database from 'better-sqlite3';
import { PhieuMuon, InventoryReport, TrangThaiPhieu } from '../types';

export class BaoCaoController {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  getOverdueLoans(): PhieuMuon[] {
    const rows = this.db.prepare(
      "SELECT * FROM PhieuMuon WHERE trangThai = ? AND hanTra < date('now')"
    ).all(TrangThaiPhieu.DANG_MUON) as Record<string, unknown>[];

    return rows.map((row) => this.mapRowToPhieuMuon(row));
  }

  getInventoryStatus(): InventoryReport {
    const totals = this.db.prepare(
      'SELECT COUNT(*) AS soDauSach, COALESCE(SUM(soBanSao), 0) AS soBanSao, COALESCE(SUM(soMat), 0) AS soMat, COALESCE(SUM(soBaoTri), 0) AS soBaoTri FROM Sach'
    ).get() as { soDauSach: number; soBanSao: number; soMat: number; soBaoTri: number };

    const loanRow = this.db.prepare(
      'SELECT COUNT(*) AS count FROM PhieuMuon WHERE trangThai = ?'
    ).get(TrangThaiPhieu.DANG_MUON) as { count: number };

    const soDangMuon = loanRow.count;
    const soKhaDung = totals.soBanSao - totals.soMat - totals.soBaoTri - soDangMuon;

    return {
      soDauSach: totals.soDauSach,
      soBanSao: totals.soBanSao,
      soKhaDung: Math.max(0, soKhaDung),
      soDangMuon,
      soBaoTri: totals.soBaoTri,
      soMat: totals.soMat,
    };
  }

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
