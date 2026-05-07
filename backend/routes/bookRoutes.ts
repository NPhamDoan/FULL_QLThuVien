import { Router, Request, Response } from 'express';
import { SachController } from '../controllers/SachController';
import { TraCuuHeThongController } from '../controllers/TraCuuHeThongController';

export function createBookRoutes(
  sachController: SachController,
  searchController: TraCuuHeThongController
): Router {
  const router = Router();

  // GET /books - List all books
  router.get('/', (_req: Request, res: Response) => {
    try {
      res.json(sachController.listBooks());
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
        const onlyAvailable = tinhTrang === 'SAN_SANG' || tinhTrang === 'KHA_DUNG';
        res.json(sachController.searchBooks(keyword as string, onlyAvailable));
        return;
      }

      // Legacy single-field search
      if (maSach) {
        const result = searchController.searchByCode(maSach as string);
        res.json(result ? [result] : []);
        return;
      }
      if (tieuDe) {
        res.json(searchController.searchByTitle(tieuDe as string));
        return;
      }
      if (tacGia) {
        res.json(searchController.searchByAuthor(tacGia as string));
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
