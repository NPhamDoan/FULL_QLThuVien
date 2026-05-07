import { Router, Request, Response } from 'express';
import { TaiKhoanController } from '../controllers/TaiKhoanController';
import { VaiTro } from '../types';

function getAdminCheck(controller: TaiKhoanController, req: Request): boolean {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const maTaiKhoan = auth.replace('Bearer ', '');
  return controller.checkRole(maTaiKhoan, VaiTro.QUAN_TRI_VIEN);
}

export function createAuthRoutes(controller: TaiKhoanController): Router {
  const router = Router();

  // POST /auth/login
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { tenDangNhap, matKhau } = req.body;
      if (!tenDangNhap || !matKhau) {
        res.status(400).json({ error: 'tenDangNhap và matKhau là bắt buộc' });
        return;
      }
      const result = await controller.login(tenDangNhap, matKhau);
      if (result.success && result.taiKhoan) {
        res.json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      res.status(500).json({ error: 'Lỗi hệ thống' });
    }
  });

  // POST /auth/logout
  router.post('/logout', async (req: Request, res: Response) => {
    try {
      const { maTaiKhoan } = req.body;
      if (!maTaiKhoan) {
        res.status(400).json({ error: 'maTaiKhoan là bắt buộc' });
        return;
      }
      await controller.logout(maTaiKhoan);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi hệ thống' });
    }
  });

  // GET /auth/accounts - List all accounts (admin only)
  router.get('/accounts', (req: Request, res: Response) => {
    if (!getAdminCheck(controller, req)) {
      res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền truy cập' });
      return;
    }
    try {
      const data = controller.listAccounts();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi hệ thống' });
    }
  });

  // POST /auth/accounts - Create account (admin only)
  router.post('/accounts', async (req: Request, res: Response) => {
    if (!getAdminCheck(controller, req)) {
      res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền truy cập' });
      return;
    }
    try {
      const { tenDangNhap, matKhau, vaiTro } = req.body;
      if (!tenDangNhap || !matKhau || !vaiTro) {
        res.status(400).json({ error: 'tenDangNhap, matKhau và vaiTro là bắt buộc' });
        return;
      }
      const result = await controller.createAccount(tenDangNhap, matKhau, vaiTro);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ error: 'Lỗi hệ thống' });
    }
  });

  // PUT /auth/accounts/:id/status - Update account status
  router.put('/accounts/:id/status', (req: Request, res: Response) => {
    if (!getAdminCheck(controller, req)) {
      res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền truy cập' });
      return;
    }
    try {
      const { trangThai } = req.body;
      if (!trangThai) {
        res.status(400).json({ error: 'trangThai là bắt buộc' });
        return;
      }
      const result = controller.updateStatus(req.params.id as string, trangThai);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ error: 'Lỗi hệ thống' });
    }
  });

  // PUT /auth/accounts/:id/password - Reset password
  router.put('/accounts/:id/password', async (req: Request, res: Response) => {
    if (!getAdminCheck(controller, req)) {
      res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền truy cập' });
      return;
    }
    try {
      const { matKhau } = req.body;
      if (!matKhau) {
        res.status(400).json({ error: 'matKhau là bắt buộc' });
        return;
      }
      const result = await controller.resetPassword(req.params.id as string, matKhau);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ error: 'Lỗi hệ thống' });
    }
  });

  // DELETE /auth/accounts/:id - Delete account
  router.delete('/accounts/:id', (req: Request, res: Response) => {
    if (!getAdminCheck(controller, req)) {
      res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền truy cập' });
      return;
    }
    try {
      const result = controller.deleteAccount(req.params.id as string);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ error: 'Lỗi hệ thống' });
    }
  });

  return router;
}
