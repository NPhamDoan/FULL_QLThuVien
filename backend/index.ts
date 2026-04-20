import 'dotenv/config';
import express from 'express';
import path from 'path';
import { initializeDatabase } from './database';
import { TaiKhoanController } from './controllers/TaiKhoanController';
import { DocGiaController } from './controllers/DocGiaController';
import { SachController } from './controllers/SachController';
import { TraCuuHeThongController } from './controllers/TraCuuHeThongController';
import { PhieuMuonController } from './controllers/PhieuMuonController';
import { BaoCaoController } from './controllers/BaoCaoController';
import { createAuthRoutes } from './routes/authRoutes';
import { createReaderRoutes } from './routes/readerRoutes';
import { createBookRoutes } from './routes/bookRoutes';
import { createLoanRoutes } from './routes/loanRoutes';
import { createReportRoutes } from './routes/reportRoutes';
import { requestLogger, errorLogger } from './middleware/logger';

const app = express();
app.use(express.json());
app.use(requestLogger);

// Initialize database and controllers
const db = initializeDatabase();
const taiKhoanController = new TaiKhoanController(db);
const docGiaController = new DocGiaController(db);
const sachController = new SachController(db);
const searchController = new TraCuuHeThongController(db);
const phieuMuonController = new PhieuMuonController(db);
const baoCaoController = new BaoCaoController(db);

// API routes
app.use('/auth', createAuthRoutes(taiKhoanController));
app.use('/readers', createReaderRoutes(docGiaController));
app.use('/books', createBookRoutes(sachController, searchController));
app.use('/loans', createLoanRoutes(phieuMuonController));
app.use('/reports', createReportRoutes(baoCaoController));

// Error logging (after API routes)
app.use(errorLogger);

// Production: serve frontend static files
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// SPA fallback: any non-API route serves index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
