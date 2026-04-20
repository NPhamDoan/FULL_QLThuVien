# QLThuVien - Project Blueprint

Hệ thống Quản lý Thư viện (Library Management System) - ứng dụng web full-stack hỗ trợ thủ thư quản lý sách, mượn/trả sách, tra cứu và thống kê.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript, Ant Design 6, React Router 7, Axios, Vite |
| Backend | Node.js + TypeScript, Express.js, dotenv |
| Database | SQLite via better-sqlite3 (raw SQL, no ORM) |
| Auth | bcrypt (password hashing), login/logout only (no session middleware) |
| Testing | Jest + fast-check (property-based testing) |

## Architecture

```
Frontend (React SPA)  →  Axios (/api proxy in dev)  →  Express API (port 3000)  →  SQLite
```

- Layered architecture: Routes → Controllers → Database (raw SQL)
- Frontend served as static files from backend in production
- Vite dev proxy: `/api/*` → `http://localhost:3000/*`

## Project Structure

```
backend/
├── index.ts              # Express app entry, mounts all routes + middleware
├── database.ts           # SQLite init, schema creation, indexes
├── seed.ts               # Test data (2 accounts, 22 readers, 25 books, 5 loans)
├── .env                  # Environment config (LOG_LEVEL)
├── .env.sample           # Environment template
├── types/index.ts        # All enums, interfaces, DTOs
├── middleware/
│   └── logger.ts         # Request logging (LOG_LEVEL: debug|info|error|off)
├── utils/
│   └── diacritics.ts     # removeDiacritics() - Vietnamese fuzzy search
├── controllers/          # Business logic (6 controllers)
│   ├── TaiKhoanController.ts    # Login/logout, role check
│   ├── DocGiaController.ts      # Reader CRUD
│   ├── SachController.ts        # Book CRUD
│   ├── PhieuMuonController.ts   # Loan operations (borrow/return/extend)
│   ├── TraCuuHeThongController.ts # Book search (diacritics-aware)
│   └── BaoCaoController.ts      # Reports (overdue, inventory)
├── routes/               # Express route modules
│   ├── authRoutes.ts     # POST /auth/login, /auth/logout (no session middleware)
│   ├── readerRoutes.ts   # CRUD + GET /readers/search?keyword= (diacritics-aware)
│   ├── bookRoutes.ts     # CRUD + GET /books/search?keyword= (diacritics-aware)
│   ├── loanRoutes.ts     # GET/POST /loans, POST /loans/:id/return, /extend
│   └── reportRoutes.ts   # GET /reports/overdue, /reports/inventory
├── tests/                # All test files (centralized)
│   ├── setup.test.ts
│   ├── database.test.ts
│   ├── controllers/      # 6 controller test files
├── jest.config.ts        # Jest config (roots: tests/)
├── package.json
└── tsconfig.json

frontend/src/
├── App.tsx               # Router + Ant Design theme (primary: #0F766E, locale: viVN)
├── main.tsx              # React entry
├── contexts/AuthContext.tsx  # Auth state, localStorage persistence
├── components/ProtectedRoute.tsx  # Auth guard
├── layouts/MainLayout.tsx   # Sidebar (3 groups) + header (title only)
├── pages/
│   ├── LoginPage.tsx     # Login form
│   ├── DashboardPage.tsx # Overview cards + tabs (loans, overdue, inventory)
│   ├── BorrowPage.tsx    # 3-step: search reader table → search book table → confirm
│   ├── ReturnPage.tsx    # Search loans (dropdown filter) → confirm return
│   ├── ExtendPage.tsx    # Search loans (dropdown filter) → confirm extend +7 days
│   ├── ReadersPage.tsx   # Reader CRUD table + search bar + modal
│   └── BooksPage.tsx     # Book CRUD table + search + tinhTrang edit dropdown
└── services/api.ts       # Axios instance + all API methods (incl. reader/book search)
```

## Sidebar Menu Structure

```
MENU CHÍNH:     Mượn sách, Trả sách, Gia hạn
QUẢN LÝ:        Sách, Độc giả
BÁO CÁO & THỐNG KÊ: Tổng quan (route: /)
```

## Database Schema

4 tables with foreign keys enabled, WAL mode:

```sql
DocGia (maDocGia PK, hoTen, email UNIQUE, soDienThoai, ngayHetHan, timestamps)
Sach (maSach PK, tieuDe, tacGia, tinhTrang CHECK(SAN_SANG|DA_MUON|BAO_TRI|MAT), timestamps)
PhieuMuon (maPhieu PK, maDocGia FK→DocGia, maSach FK→Sach, ngayMuon, hanTra, ngayTraThucTe, trangThai CHECK(DANG_MUON|DA_TRA), tienPhat, timestamps)
TaiKhoan (maTaiKhoan PK, tenDangNhap UNIQUE, matKhau, vaiTro CHECK(THU_THU|QUAN_TRI_VIEN), trangThai CHECK(HOAT_DONG|BI_KHOA), timestamps)
```

Indexes: tieuDe, tacGia, PhieuMuon(maDocGia), PhieuMuon(maSach), PhieuMuon(trangThai)

## Enums (backend/types/index.ts)

| Enum | Values |
|------|--------|
| TinhTrangSach | SAN_SANG, DA_MUON, BAO_TRI, MAT |
| TrangThaiPhieu | DANG_MUON, DA_TRA |
| VaiTro | THU_THU, QUAN_TRI_VIEN |
| TrangThaiTaiKhoan | HOAT_DONG, BI_KHOA |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | Login (tenDangNhap, matKhau) |
| POST | /auth/logout | Logout (maTaiKhoan) |
| GET | /readers | List all readers |
| GET | /readers/search | Search readers (?keyword - diacritics-aware) |
| GET | /readers/:id | Get reader by ID |
| POST | /readers | Create reader |
| PUT | /readers/:id | Update reader |
| DELETE | /readers/:id | Delete reader (fails if active loans) |
| GET | /books | List all books |
| GET | /books/search | Search books (?keyword or ?tieuDe/?tacGia/?maSach - diacritics-aware) |
| POST | /books | Create book |
| PUT | /books/:id | Update book |
| DELETE | /books/:id | Delete book (fails if on loan) |
| GET | /loans | List active loans (?search, ?searchType) |
| POST | /loans | Create loan (maDocGia, maSach) |
| GET | /loans/:id | Get loan by ID |
| POST | /loans/:id/return | Return book (auto-calculates fine) |
| POST | /loans/:id/extend | Extend loan (+7 days) |
| GET | /reports/overdue | Overdue loans report |
| GET | /reports/inventory | Book inventory by status |

## Authentication Flow

1. POST /auth/login → bcrypt verify → return user info (no server session)
2. Frontend stores `{ maTaiKhoan, tenDangNhap, vaiTro }` in localStorage key `lms_user`
3. Axios interceptor auto-attaches `Authorization: Bearer {maTaiKhoan}` to all requests
4. All API routes are public (no server-side auth middleware)

## Business Rules

- Loan duration: 14 days default
- Extension: +7 days from current hanTra
- Fine: 5,000 VND per overdue day
- Reader deletion blocked if active loans exist
- Book deletion blocked if currently on loan
- Book status auto-updates: SAN_SANG → DA_MUON on borrow, DA_MUON → SAN_SANG on return
- Loan creation uses database transaction (atomic)
- Search supports Vietnamese diacritics removal for fuzzy matching (shared utils/diacritics.ts)

## Dev Commands

```bash
# Backend
cd backend && npm run dev          # Start backend (LOG_LEVEL from .env)
cd backend && npm run dev:debug    # Start with LOG_LEVEL=debug
cd backend && npm run dev:quiet    # Start with LOG_LEVEL=off
cd backend && npm run seed         # Seed test data
cd backend && npm test             # Run Jest tests

# Frontend
cd frontend && npm run dev         # Start Vite dev server (proxy to :3000)

# Both
cd backend && npm run dev:all      # Concurrently run BE + FE

# Build & Production
cd backend && npm run build        # Build BE (tsc) + FE (vite build)
cd backend && npm start            # Serve built app (node dist/index.js)
```

## Test Accounts

| Role | Username | Password |
|------|----------|----------|
| Thủ thư (Librarian) | thuthu | 123456 |
| Quản trị viên (Admin) | admin | 123456 |

## Vietnamese Naming Convention

Dự án sử dụng tiếng Việt cho tên entities, fields, UI labels:
- DocGia = Reader, Sach = Book, PhieuMuon = Loan, TaiKhoan = Account
- hoTen = full name, tieuDe = title, tacGia = author, tinhTrang = status
- ngayMuon = borrow date, hanTra = due date, tienPhat = fine amount
- Thủ thư = Librarian, Quản trị viên = Admin

## Key Patterns

- Controllers receive `Database` instance via constructor injection
- All SQL queries are raw (no ORM) using `db.prepare().run/get/all()`
- Transactions via `db.transaction()`
- Frontend uses Ant Design components (Table, Form, Modal, Card, Tabs)
- BorrowPage: search table pattern (search → table → select) for both reader and book steps
- ReturnPage: dropdown filter + search table for loan lookup
- ExtendPage: dropdown filter + search table for loan lookup (same as ReturnPage)
- BooksPage: edit modal includes tinhTrang dropdown (SAN_SANG/BAO_TRI/MAT, DA_MUON disabled)
- ReadersPage: search bar (keyword search, diacritics-aware) + CRUD modal with DatePicker for ngayHetHan
- Error handling: controllers return `{ success, error?, data? }` pattern
- Request logging: middleware/logger.ts with LOG_LEVEL env control
- Diacritics: shared utils/diacritics.ts used by reader search, book search, TraCuuHeThongController

## Documents

`.kiro/document/` contains:
- `BaoCao_PhanTich_ThietKe.txt` - BRD (PlantUML diagrams)
- `BaoCao_PhanTich_ThietKe.md` - BRD (Mermaid diagrams, previewable)
