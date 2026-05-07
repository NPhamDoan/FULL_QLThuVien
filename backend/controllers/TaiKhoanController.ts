import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { LoginResult, LoginError, TaiKhoan, VaiTro, TrangThaiTaiKhoan } from '../types';

export class TaiKhoanController {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  async login(tenDangNhap: string, matKhau: string): Promise<LoginResult> {
    const row = this.db.prepare(
      'SELECT * FROM TaiKhoan WHERE tenDangNhap = ?'
    ).get(tenDangNhap) as Record<string, unknown> | undefined;

    if (!row) {
      return { success: false, error: LoginError.USER_NOT_FOUND };
    }

    const passwordMatch = await bcrypt.compare(matKhau, row.matKhau as string);
    if (!passwordMatch) {
      return { success: false, error: LoginError.WRONG_PASSWORD };
    }

    if (row.trangThai === TrangThaiTaiKhoan.BI_KHOA) {
      return { success: false, error: LoginError.ACCOUNT_LOCKED };
    }

    const taiKhoan: TaiKhoan = {
      maTaiKhoan: row.maTaiKhoan as string,
      tenDangNhap: row.tenDangNhap as string,
      matKhau: row.matKhau as string,
      vaiTro: row.vaiTro as VaiTro,
      trangThai: row.trangThai as TrangThaiTaiKhoan,
      createdAt: new Date(row.createdAt as string),
      updatedAt: new Date(row.updatedAt as string),
    };

    return { success: true, taiKhoan };
  }

  async logout(_maTaiKhoan: string): Promise<void> {
    // No-op: session management handled at middleware level
  }

  checkRole(maTaiKhoan: string, vaiTro: string): boolean {
    const row = this.db.prepare(
      'SELECT vaiTro FROM TaiKhoan WHERE maTaiKhoan = ?'
    ).get(maTaiKhoan) as { vaiTro: string } | undefined;

    if (!row) {
      return false;
    }

    return row.vaiTro === vaiTro;
  }

  // === User Management (Admin only) ===

  listAccounts() {
    return this.db.prepare(
      'SELECT maTaiKhoan, tenDangNhap, vaiTro, trangThai, createdAt, updatedAt FROM TaiKhoan ORDER BY createdAt DESC'
    ).all();
  }

  async createAccount(tenDangNhap: string, matKhau: string, vaiTro: VaiTro) {
    const existing = this.db.prepare('SELECT maTaiKhoan FROM TaiKhoan WHERE tenDangNhap = ?').get(tenDangNhap);
    if (existing) {
      return { success: false, error: 'Tên đăng nhập đã tồn tại' };
    }

    // Generate next ID
    const last = this.db.prepare("SELECT maTaiKhoan FROM TaiKhoan ORDER BY maTaiKhoan DESC LIMIT 1").get() as { maTaiKhoan: string } | undefined;
    const nextNum = last ? parseInt(last.maTaiKhoan.replace('TK', '')) + 1 : 1;
    const maTaiKhoan = `TK${String(nextNum).padStart(3, '0')}`;

    const hashedPass = await bcrypt.hash(matKhau, 10);
    this.db.prepare(
      'INSERT INTO TaiKhoan (maTaiKhoan, tenDangNhap, matKhau, vaiTro, trangThai) VALUES (?, ?, ?, ?, ?)'
    ).run(maTaiKhoan, tenDangNhap, hashedPass, vaiTro, TrangThaiTaiKhoan.HOAT_DONG);

    return { success: true, maTaiKhoan };
  }

  updateStatus(maTaiKhoan: string, trangThai: TrangThaiTaiKhoan) {
    const row = this.db.prepare('SELECT maTaiKhoan FROM TaiKhoan WHERE maTaiKhoan = ?').get(maTaiKhoan);
    if (!row) {
      return { success: false, error: 'Tài khoản không tồn tại' };
    }
    this.db.prepare(
      "UPDATE TaiKhoan SET trangThai = ?, updatedAt = datetime('now') WHERE maTaiKhoan = ?"
    ).run(trangThai, maTaiKhoan);
    return { success: true };
  }

  async resetPassword(maTaiKhoan: string, matKhauMoi: string) {
    const row = this.db.prepare('SELECT maTaiKhoan FROM TaiKhoan WHERE maTaiKhoan = ?').get(maTaiKhoan);
    if (!row) {
      return { success: false, error: 'Tài khoản không tồn tại' };
    }
    const hashedPass = await bcrypt.hash(matKhauMoi, 10);
    this.db.prepare(
      "UPDATE TaiKhoan SET matKhau = ?, updatedAt = datetime('now') WHERE maTaiKhoan = ?"
    ).run(hashedPass, maTaiKhoan);
    return { success: true };
  }

  deleteAccount(maTaiKhoan: string) {
    const row = this.db.prepare('SELECT maTaiKhoan FROM TaiKhoan WHERE maTaiKhoan = ?').get(maTaiKhoan);
    if (!row) {
      return { success: false, error: 'Tài khoản không tồn tại' };
    }
    this.db.prepare('DELETE FROM TaiKhoan WHERE maTaiKhoan = ?').run(maTaiKhoan);
    return { success: true };
  }
}
