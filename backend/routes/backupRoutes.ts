import { Router, Request, Response } from 'express';
import path from 'path';
import Database from 'better-sqlite3';
import { TaiKhoanController } from '../controllers/TaiKhoanController';
import { VaiTro } from '../types';
import { BACKUP_DIR, listBackups, createBackup } from '../backup';

function isAdmin(controller: TaiKhoanController, req: Request): boolean {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const maTaiKhoan = auth.replace('Bearer ', '');
  return controller.kiemTraQuyen(maTaiKhoan, VaiTro.QUAN_TRI_VIEN);
}

export function createBackupRoutes(
  taiKhoanController: TaiKhoanController,
  db: Database.Database
): Router {
  const router = Router();

  // GET /backups - List all backups (admin only)
  router.get('/', (req: Request, res: Response) => {
    if (!isAdmin(taiKhoanController, req)) {
      res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền' });
      return;
    }
    try {
      res.json({ success: true, data: listBackups() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /backups/create - Tạo backup ngay (admin only)
  router.post('/create', async (req: Request, res: Response) => {
    if (!isAdmin(taiKhoanController, req)) {
      res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền' });
      return;
    }
    try {
      const backupPath = await createBackup(db);
      res.json({ success: true, name: path.basename(backupPath) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /backups/download/:name - Download file backup (admin only)
  router.get('/download/:name', (req: Request, res: Response) => {
    if (!isAdmin(taiKhoanController, req)) {
      res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền' });
      return;
    }

    const filename = req.params.name as string;
    // Prevent path traversal
    if (!filename.startsWith('backup_') || !filename.endsWith('.db') || filename.includes('/') || filename.includes('\\')) {
      res.status(400).json({ error: 'Tên file không hợp lệ' });
      return;
    }

    const filePath = path.join(BACKUP_DIR, filename);
    res.download(filePath, filename, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: 'Không tìm thấy file' });
      }
    });
  });

  return router;
}
