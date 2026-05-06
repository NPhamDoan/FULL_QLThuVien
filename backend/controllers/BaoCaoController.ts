import Database from 'better-sqlite3';
import { PhieuMuon, InventoryReport, TrangThaiPhieu, TinhTrangSach } from '../types';

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
    const rows = this.db.prepare(
      'SELECT tinhTrang, COUNT(*) as count FROM Sach GROUP BY tinhTrang'
    ).all() as { tinhTrang: string; count: number }[];

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.tinhTrang] = row.count;
    }

    const sanSang = counts[TinhTrangSach.SAN_SANG] ?? 0;
    const daMuon = counts[TinhTrangSach.DA_MUON] ?? 0;
    const baoTri = counts[TinhTrangSach.BAO_TRI] ?? 0;
    const mat = counts[TinhTrangSach.MAT] ?? 0;

    return {
      sanSang,
      daMuon,
      baoTri,
      mat,
      tongCong: sanSang + daMuon + baoTri + mat,
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
