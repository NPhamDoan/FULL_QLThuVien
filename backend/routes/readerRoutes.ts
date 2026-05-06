import { Router, Request, Response } from 'express';
import { DocGiaController } from '../controllers/DocGiaController';

export function createReaderRoutes(controller: DocGiaController): Router {
  const router = Router();

  // GET /readers - List all readers
  router.get('/', (_req: Request, res: Response) => {
    try {
      res.json(controller.listReaders());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /readers/search - Search readers by keyword (diacritics-aware)
  router.get('/search', (req: Request, res: Response) => {
    try {
      const { keyword } = req.query;
      res.json(controller.searchReaders((keyword as string) || ''));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /readers/:id
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const reader = controller.getReaderById(req.params.id as string);
      if (!reader) {
        res.status(404).json({ error: 'Không tìm thấy độc giả' });
        return;
      }
      res.json(reader);
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
