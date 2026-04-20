import { Router, Request, Response } from 'express';
import { DocGiaController } from '../controllers/DocGiaController';
import { removeDiacritics } from '../utils/diacritics';

export function createReaderRoutes(controller: DocGiaController): Router {
  const router = Router();

  // GET /readers - List all readers
  router.get('/', (req: Request, res: Response) => {
    try {
      const rows = (controller as any).db.prepare('SELECT * FROM DocGia ORDER BY createdAt DESC').all();
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /readers/search - Search readers by keyword (diacritics-aware)
  router.get('/search', (req: Request, res: Response) => {
    try {
      const { keyword } = req.query;
      const rows = (controller as any).db.prepare('SELECT * FROM DocGia ORDER BY createdAt DESC').all() as Record<string, unknown>[];
      if (!keyword || (keyword as string).trim() === '') {
        res.json(rows);
        return;
      }
      const kw = (keyword as string).toLowerCase();
      const kwNorm = removeDiacritics(kw);
      const filtered = rows.filter((r) => {
        const fields = [r.maDocGia, r.hoTen, r.email, r.soDienThoai].map(v => String(v || ''));
        return fields.some(f =>
          f.toLowerCase().includes(kw) || removeDiacritics(f).toLowerCase().includes(kwNorm)
        );
      });
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /readers/:id
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const row = (controller as any).db.prepare('SELECT * FROM DocGia WHERE maDocGia = ?').get(req.params.id);
      if (!row) {
        res.status(404).json({ error: 'Không tìm thấy độc giả' });
        return;
      }
      res.json(row);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /readers
  router.post('/', (req: Request, res: Response) => {
    try {
      const result = controller.createMember(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // PUT /readers/:id
  router.put('/:id', (req: Request, res: Response) => {
    try {
      const result = controller.updateMember(req.params.id as string, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE /readers/:id
  router.delete('/:id', (req: Request, res: Response) => {
    try {
      const result = controller.deleteMember(req.params.id as string);
      if (result.success) {
        res.json(result);
      } else {
        res.status(409).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
