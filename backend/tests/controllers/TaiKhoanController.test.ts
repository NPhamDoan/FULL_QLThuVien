import bcrypt from 'bcrypt';
import { TaiKhoanController } from '../../controllers/TaiKhoanController';
import { initializeDatabase } from '../../database';
import { LoginError, VaiTro, TrangThaiTaiKhoan } from '../../types';
import Database from 'better-sqlite3';

describe('TaiKhoanController', () => {
  let db: Database.Database;
  let controller: TaiKhoanController;
  const SALT_ROUNDS = 10;

  beforeEach(async () => {
    db = initializeDatabase(':memory:');
    controller = new TaiKhoanController(db);

    const hashedPassword = await bcrypt.hash('correct-password', SALT_ROUNDS);
    const lockedPassword = await bcrypt.hash('locked-pass', SALT_ROUNDS);

    db.prepare(`
      INSERT INTO TaiKhoan (maTaiKhoan, tenDangNhap, matKhau, vaiTro, trangThai)
      VALUES (?, ?, ?, ?, ?)
    `).run('TK001', 'thuthu1', hashedPassword, VaiTro.THU_THU, TrangThaiTaiKhoan.HOAT_DONG);

    db.prepare(`
      INSERT INTO TaiKhoan (maTaiKhoan, tenDangNhap, matKhau, vaiTro, trangThai)
      VALUES (?, ?, ?, ?, ?)
    `).run('TK002', 'admin1', hashedPassword, VaiTro.QUAN_TRI_VIEN, TrangThaiTaiKhoan.HOAT_DONG);

    db.prepare(`
      INSERT INTO TaiKhoan (maTaiKhoan, tenDangNhap, matKhau, vaiTro, trangThai)
      VALUES (?, ?, ?, ?, ?)
    `).run('TK003', 'locked_user', lockedPassword, VaiTro.THU_THU, TrangThaiTaiKhoan.BI_KHOA);
  });

  afterEach(() => {
    db.close();
  });

  describe('dangNhap', () => {
    it('should return USER_NOT_FOUND when username does not exist', async () => {
      const result = await controller.dangNhap('nonexistent', 'any-password');
      expect(result.success).toBe(false);
      expect(result.error).toBe(LoginError.USER_NOT_FOUND);
      expect(result.taiKhoan).toBeUndefined();
    });

    it('should return WRONG_PASSWORD when password is incorrect', async () => {
      const result = await controller.dangNhap('thuthu1', 'wrong-password');
      expect(result.success).toBe(false);
      expect(result.error).toBe(LoginError.WRONG_PASSWORD);
      expect(result.taiKhoan).toBeUndefined();
    });

    it('should return ACCOUNT_LOCKED when account is locked', async () => {
      const result = await controller.dangNhap('locked_user', 'locked-pass');
      expect(result.success).toBe(false);
      expect(result.error).toBe(LoginError.ACCOUNT_LOCKED);
      expect(result.taiKhoan).toBeUndefined();
    });

    it('should return success with taiKhoan for valid THU_THU login', async () => {
      const result = await controller.dangNhap('thuthu1', 'correct-password');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.taiKhoan).toBeDefined();
      expect(result.taiKhoan!.maTaiKhoan).toBe('TK001');
      expect(result.taiKhoan!.tenDangNhap).toBe('thuthu1');
      expect(result.taiKhoan!.vaiTro).toBe(VaiTro.THU_THU);
      expect(result.taiKhoan!.trangThai).toBe(TrangThaiTaiKhoan.HOAT_DONG);
    });

    it('should return success with taiKhoan for valid QUAN_TRI_VIEN login', async () => {
      const result = await controller.dangNhap('admin1', 'correct-password');
      expect(result.success).toBe(true);
      expect(result.taiKhoan).toBeDefined();
      expect(result.taiKhoan!.maTaiKhoan).toBe('TK002');
      expect(result.taiKhoan!.vaiTro).toBe(VaiTro.QUAN_TRI_VIEN);
    });
  });

  describe('dangXuat', () => {
    it('should resolve without error (no-op)', async () => {
      await expect(controller.dangXuat('TK001')).resolves.toBeUndefined();
    });
  });

  describe('kiemTraQuyen', () => {
    it('should return true when vaiTro matches quyen', () => {
      expect(controller.kiemTraQuyen('TK001', VaiTro.THU_THU)).toBe(true);
      expect(controller.kiemTraQuyen('TK002', VaiTro.QUAN_TRI_VIEN)).toBe(true);
    });

    it('should return false when vaiTro does not match quyen', () => {
      expect(controller.kiemTraQuyen('TK001', VaiTro.QUAN_TRI_VIEN)).toBe(false);
      expect(controller.kiemTraQuyen('TK002', VaiTro.THU_THU)).toBe(false);
    });

    it('should return false when maTaiKhoan does not exist', () => {
      expect(controller.kiemTraQuyen('NONEXISTENT', VaiTro.THU_THU)).toBe(false);
    });
  });
});
