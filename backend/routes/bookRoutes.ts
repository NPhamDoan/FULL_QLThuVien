import { Router, Request, Response } from 'express';
import { SachController } from '../controllers/SachController';
import { TraCuuHeThongController } from '../controllers/TraCuuHeThongController';
import { removeDiacritics } from '../utils/diacritics';

export function createBookRoutes(
  sachController: SachController,
  searchController: TraCuuHeThongController
): Router {
  const router = Router();

  // GET /books - List all books
  router.get('/', (req: Request, res: Response) => {
    try {
      const rows = (sachController as any).db.prepare('SELECT * FROM Sach ORDER BY createdAt DESC').all();
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /books/search
  router.get('/search', (req: Request, res: Response) => {
    try {
      const { tieuDe, tacGia, maSach, keyword, tinhTrang } = req.query;

      // Unified keyword search across all fields (diacritics-aware)
      if (keyword) {
        const kw = (keyword as string).toLowerCase();
        const kwNorm = removeDiacritics(kw);
        let rows = (sachController as any).db.prepare('SELECT * FROM Sach ORDER BY createdAt DESC').all() as Record<string, unknown>[];
        rows = rows.filter((r) => {
          const fields = [r.maSach, r.tieuDe, r.tacGia].map(v => String(v || ''));
          return fields.some(f =>
            f.toLowerCase().includes(kw) || removeDiacritics(f).toLowerCase().includes(kwNorm)
          );
        });
        if (tinhTrang) {
          rows = rows.filter(r => r.tinhTrang === tinhTrang);
        }
        res.json(rows);
        return;
      }

      // Legacy single-field search
      if (maSach) {
        const result = searchController.searchByCode(maSach as string);
        res.json(result ? [result] : []);
        return;
      }
      if (tieuDe) {
        const results = searchController.searchByTitle(tieuDe as string);
        res.json(results);
        return;
      }
      if (tacGia) {
        const results = searchController.searchByAuthor(tacGia as string);
        res.json(results);
        return;
      }
      res.status(400).json({ error: 'Cần ít nhất một tham số tìm kiếm: tieuDe, tacGia, hoặc maSach' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /books
  router.post('/', (req: Request, res: Response) => {
    try {
      const result = sachController.createBook(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // PUT /books/:id
  router.put('/:id', (req: Request, res: Response) => {
    try {
      const result = sachController.updateBook(req.params.id as string, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE /books/:id
  router.delete('/:id', (req: Request, res: Response) => {
    try {
      const result = sachController.deleteBook(req.params.id as string);
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
