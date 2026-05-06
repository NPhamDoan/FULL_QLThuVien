import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 giờ
const MAX_BACKUPS = 7; // giữ 7 bản gần nhất

/**
 * Liệt kê các file backup (sorted mới nhất trước).
 */
export function listBackups(): { name: string; size: number; mtime: Date }[] {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
    .map(f => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      return { name: f, size: stat.size, mtime: stat.mtime };
    })
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}

/**
 * Tạo 1 backup ngay lập tức. Safe khi app đang chạy (dùng SQLite online backup API).
 */
export async function createBackup(db: Database.Database): Promise<string> {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}.db`);

  await db.backup(backupPath);
  return backupPath;
}

/**
 * Xóa backup cũ, chỉ giữ MAX_BACKUPS bản gần nhất.
 */
function rotateBackups(): void {
  if (!fs.existsSync(BACKUP_DIR)) return;

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  // Xóa bản dư
  for (const file of files.slice(MAX_BACKUPS)) {
    fs.unlinkSync(file.path);
    console.log(`[backup] Xóa backup cũ: ${file.name}`);
  }
}

/**
 * Khởi động lịch backup tự động.
 * CHỈ chạy khi NODE_ENV=production.
 */
export function startBackupScheduler(db: Database.Database): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[backup] Skip scheduler (NODE_ENV !== production)');
    return;
  }

  console.log(`[backup] Scheduler ON: mỗi ${BACKUP_INTERVAL_MS / 3600000}h, giữ ${MAX_BACKUPS} bản`);

  // Chạy lần đầu sau 1 phút (tránh chạy ngay lúc startup)
  setTimeout(async () => {
    try {
      const p = await createBackup(db);
      const sizeKB = (fs.statSync(p).size / 1024).toFixed(1);
      console.log(`[backup] Tạo backup: ${path.basename(p)} (${sizeKB} KB)`);
      rotateBackups();
    } catch (err) {
      console.error('[backup] Lỗi:', err);
    }
  }, 60 * 1000);

  // Rồi chạy định kỳ mỗi 24h
  setInterval(async () => {
    try {
      const p = await createBackup(db);
      const sizeKB = (fs.statSync(p).size / 1024).toFixed(1);
      console.log(`[backup] Tạo backup: ${path.basename(p)} (${sizeKB} KB)`);
      rotateBackups();
    } catch (err) {
      console.error('[backup] Lỗi:', err);
    }
  }, BACKUP_INTERVAL_MS);
}
