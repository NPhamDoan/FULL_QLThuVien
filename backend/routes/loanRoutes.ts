import { Router, Request, Response } from 'express';
import { PhieuMuonController } from '../controllers/PhieuMuonController';

export function createLoanRoutes(controller: PhieuMuonController): Router {
  const router = Router();

  // GET /loans - Danh sách phiếu đang mượn
  router.get('/', (req: Request, res: Response) => {
    try {
      const loans = controller.getActiveLoans();
      res.json(loans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /loans - Tạo phiếu mượn
  router.post('/', (req: Request, res: Response) => {
    try {
      const { maDocGia, maSach } = req.body;
      if (!maDocGia || !maSach) {
        res.status(400).json({ error: 'maDocGia và maSach là bắt buộc' });
        return;
      }

      const memberValidation = controller.validateMember(maDocGia);
      if (!memberValidation.valid) {
        res.status(400).json({ error: memberValidation.message });
        return;
      }

      const bookStatus = controller.checkBookAvailability(maSach);
      if (!bookStatus.available) {
        res.status(400).json({ error: bookStatus.message });
        return;
      }

      const loan = controller.createLoan(maDocGia, maSach);
      res.status(201).json(loan);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /loans/:id
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const loan = controller.findLoanByCode(req.params.id as string);
      if (!loan) {
        res.status(404).json({ error: 'Không tìm thấy phiếu mượn' });
        return;
      }
      res.json(loan);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /loans/:id/return - Trả sách
  router.post('/:id/return', (req: Request, res: Response) => {
    try {
      const result = controller.returnBook(req.params.id as string);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /loans/:id/extend - Gia hạn
  router.post('/:id/extend', (req: Request, res: Response) => {
    try {
      const loan = controller.extendLoan(req.params.id as string);
      res.json(loan);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
