# QLThuVien - Project Blueprint

Hệ thống Quản lý Thư viện (Library Management System) - ứng dụng web full-stack hỗ trợ thủ thư quản lý sách, mượn/trả sách, tra cứu, thống kê, quản lý tài khoản và sao lưu dữ liệu.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript, Ant Design 6, React Router 7, Axios, Vite |
| Backend | Node.js + TypeScript, Express.js, dotenv |
| Database | SQLite via better-sqlite3 (raw SQL, no ORM) |
| Auth | bcrypt (password hashing), stateless Bearer token (no session middleware) |
| Testing | Jest + fast-check (property-based testing) |

## Architecture

```
Frontend (React SPA)  →  Axios (/api proxy in dev)  →  Express API (port 3000)  →  SQLite
```

- Layered architecture: Routes → Controllers → Database (raw SQL)
- Frontend served as static files from backend in production
- Vite dev proxy: `/api/*` → `http://localhost:3000/*`
- Production: Single Express server serves both API and static frontend from `frontend/dist/`
- Auto-backup scheduler runs only when `NODE_ENV=production`

## Project Structure

```
backend/
├── index.ts              # Express app entry: init DB, auto-seed, backup scheduler, mount routes
├── database.ts           # SQLite init (auto-creates Database/ folder), schema, indexes
├── seed.ts               # Test data (2 accounts, 22 readers, 25 books, 5 loans) - exports seedDatabase()
├── backup.ts             # Auto-backup scheduler + helpers (listBackups, createBackup, BACKUP_DIR)
├── .env                  # Environment config (LOG_LEVEL, NODE_ENV)
├── .env.sample           # Environment template
├── types/index.ts        # All enums, interfaces, DTOs (single source of truth for BE)
├── middleware/
│   └── logger.ts         # Request logging (LOG_LEVEL: debug|info|error|off), masks password
├── utils/
│   └── diacritics.ts     # removeDiacritics() - Vietnamese fuzzy search
├── controllers/          # Business logic (6 controllers, DI via constructor)
│   ├── TaiKhoanController.ts    # Login/logout, role check, CRUD accounts (admin)
│   ├── DocGiaController.ts      # Reader CRUD + listReaders, searchReaders, getReaderById
│   ├── SachController.ts        # Book CRUD + listBooks, searchBooks(keyword, tinhTrang?)
│   ├── PhieuMuonController.ts   # Loan operations (borrow/return/extend, sequential ID)
│   ├── TraCuuHeThongController.ts # Book search by title/author/code (legacy)
│   └── BaoCaoController.ts      # Reports (overdue, inventory)
├── routes/               # Express route modules (thin wrappers, call controllers)
│   ├── authRoutes.ts     # /auth/login, /logout, /accounts (admin-only CRUD)
│   ├── readerRoutes.ts   # CRUD + GET /readers/search?keyword= (diacritics-aware)
│   ├── bookRoutes.ts     # CRUD + GET /books/search?keyword= (diacritics-aware)
│   ├── loanRoutes.ts     # GET/POST /loans, POST /loans/:id/return, /extend
│   ├── reportRoutes.ts   # GET /reports/overdue, /reports/inventory
│   └── backupRoutes.ts   # GET /backups, POST /backups/create, GET /backups/download/:name (admin)
├── tests/                # All test files (126 tests)
│   ├── setup.test.ts
│   ├── database.test.ts
│   ├── controllers/      # 6 controller test files
├── Database/             # Runtime only (gitignored): dev.db + WAL/SHM
├── backups/              # Runtime only (gitignored): backup_*.db (auto-created)
├── dist/                 # TypeScript output (gitignored)
├── jest.config.ts        # Jest config (roots: tests/)
├── package.json
└── tsconfig.json

frontend/src/
├── App.tsx               # Router + Ant Design theme (primary: #0F766E, locale: viVN)
├── main.tsx              # React entry
├── constants.ts          # Mirror enums from backend (VaiTro, TinhTrangSach, ...)
├── contexts/AuthContext.tsx  # Auth state, localStorage key 'lms_user'
├── components/
│   ├── ProtectedRoute.tsx  # Auth guard with optional requiredRole
│   └── LoanSearchTable.tsx # Shared search table for Return/Extend (with InfoItem, isOverdue, estimateFine)
├── layouts/MainLayout.tsx   # Sidebar (3 groups, role-aware) + header (title only)
├── pages/
│   ├── LoginPage.tsx     # Login form with PTIT logo illustration
│   ├── DashboardPage.tsx # Overview cards + tabs (loans, overdue, inventory)
│   ├── BorrowPage.tsx    # 3-step: search reader table → search book table → confirm
│   ├── ReturnPage.tsx    # Uses LoanSearchTable → confirm return with fine display
│   ├── ExtendPage.tsx    # Uses LoanSearchTable → confirm extend +7 days
│   ├── ReadersPage.tsx   # Reader CRUD table + search bar + modal
│   ├── BooksPage.tsx     # Book CRUD table + search + tinhTrang edit dropdown
│   ├── AccountsPage.tsx  # Admin-only: list + create/lock/reset password/delete
│   └── BackupsPage.tsx   # Admin-only: list backups + create now + download
└── services/api.ts       # Axios instance + all API methods + auth interceptor
```

## Sidebar Menu Structure

```
MENU CHÍNH:            Mượn sách, Trả sách, Gia hạn
QUẢN LÝ:               Sách, Độc giả, Tài khoản (Admin), Sao lưu (Admin)
BÁO CÁO & THỐNG KÊ:    Tổng quan (route: /)
```

Admin-only items use `vaiTro === VaiTro.QUAN_TRI_VIEN` check in MainLayout.

## Database Schema

4 tables with foreign keys enabled, WAL mode:

```sql
DocGia (maDocGia PK, hoTen, email UNIQUE, soDienThoai, ngayHetHan, timestamps)
Sach (maSach PK, tieuDe, tacGia, tinhTrang CHECK(SAN_SANG|DA_MUON|BAO_TRI|MAT), timestamps)
PhieuMuon (maPhieu PK, maDocGia FK→DocGia, maSach FK→Sach, ngayMuon, hanTra, ngayTraThucTe, trangThai CHECK(DANG_MUON|DA_TRA), tienPhat, timestamps)
TaiKhoan (maTaiKhoan PK, tenDangNhap UNIQUE, matKhau, vaiTro CHECK(THU_THU|QUAN_TRI_VIEN), trangThai CHECK(HOAT_DONG|BI_KHOA), timestamps)
```

Indexes: tieuDe, tacGia, PhieuMuon(maDocGia), PhieuMuon(maSach), PhieuMuon(trangThai)

## Enums (backend/types/index.ts + frontend/src/constants.ts mirror)

| Enum | Values |
|------|--------|
| TinhTrangSach | SAN_SANG, DA_MUON, BAO_TRI, MAT |
| TrangThaiPhieu | DANG_MUON, DA_TRA |
| VaiTro | THU_THU, QUAN_TRI_VIEN |
| TrangThaiTaiKhoan | HOAT_DONG, BI_KHOA |

**Rule:** Never hardcode enum strings in code/SQL. Always use `TinhTrangSach.SAN_SANG` etc. Frontend has mirror constants in `constants.ts`.

## API Endpoints

### Auth & Accounts
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /auth/login | Login (tenDangNhap, matKhau) | Public |
| POST | /auth/logout | Logout (maTaiKhoan) | Public |
| GET | /auth/accounts | List all accounts | Admin |
| POST | /auth/accounts | Create account (tenDangNhap, matKhau, vaiTro) | Admin |
| PUT | /auth/accounts/:id/status | Lock/unlock (trangThai) | Admin |
| PUT | /auth/accounts/:id/password | Reset password (matKhau) | Admin |
| DELETE | /auth/accounts/:id | Delete account | Admin |

### Readers
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /readers | List all readers | All |
| GET | /readers/search | Search (?keyword - diacritics-aware) | All |
| GET | /readers/:id | Get by ID | All |
| POST | /readers | Create | All |
| PUT | /readers/:id | Update | All |
| DELETE | /readers/:id | Delete (fails if active loans) | All |

### Books
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /books | List all books | All |
| GET | /books/search | Search (?keyword or ?tieuDe/?tacGia/?maSach + optional ?tinhTrang) | All |
| POST | /books | Create | All |
| PUT | /books/:id | Update | All |
| DELETE | /books/:id | Delete (fails if on loan) | All |

### Loans
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /loans | List active loans (?search, ?searchType=all\|docgia\|sach\|maphieu) | All |
| POST | /loans | Create loan (maDocGia, maSach) | All |
| GET | /loans/:id | Get by ID | All |
| POST | /loans/:id/return | Return book (auto-calculates fine) | All |
| POST | /loans/:id/extend | Extend loan (+7 days) | All |

### Reports
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /reports/overdue | Overdue loans report | All |
| GET | /reports/inventory | Book inventory by status | All |

### Backups (Admin only)
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /backups | List backup files (name, size, mtime) | Admin |
| POST | /backups/create | Create backup immediately | Admin |
| GET | /backups/download/:name | Download .db file (path-traversal protected) | Admin |

## Authentication & Authorization

1. POST /auth/login → bcrypt verify → return user info (no server session)
2. Frontend stores `{ maTaiKhoan, tenDangNhap, vaiTro }` in localStorage key `lms_user`
3. Axios interceptor auto-attaches `Authorization: Bearer {maTaiKhoan}` to all requests
4. Most API routes are public; admin-only routes (/auth/accounts/*, /backups/*) validate role via `controller.kiemTraQuyen(maTaiKhoan, VaiTro.QUAN_TRI_VIEN)` inline
5. Frontend has 3 layers of admin guard:
   - Menu: admin items hidden for non-admin in `MainLayout.tsx`
   - Route: `<ProtectedRoute requiredRole={VaiTro.QUAN_TRI_VIEN} />` wraps admin routes in `App.tsx`
   - Backend: 403 Forbidden if not admin

**Note:** This is simple token-based auth (maTaiKhoan as Bearer token). Not JWT — token is not signed and doesn't expire. Acceptable for internal library app.

## Business Rules

- Loan duration: 14 days default
- Extension: +7 days from current hanTra
- Fine: 5,000 VND per overdue day (`max(0, ngayTra - hanTra) × 5000`)
- Reader deletion blocked if active loans exist
- Book deletion blocked if currently on loan
- Book status auto-updates: SAN_SANG → DA_MUON on borrow, DA_MUON → SAN_SANG on return
- Loan creation and return use database transactions (atomic)
- Search supports Vietnamese diacritics removal for fuzzy matching (shared utils/diacritics.ts)
- Admin-only actions: account CRUD, backup operations
- Password hashing: bcrypt with 10 rounds

## ID Generation

Sequential 3-digit IDs, consistent with seed data:

| Entity | Format | Example | Logic |
|--------|--------|---------|-------|
| Sach | `S001`, `S002`, ... | `SELECT ... ORDER BY CAST(SUBSTR(maSach, 2) AS INTEGER) DESC LIMIT 1` |
| DocGia | `DG001`, `DG002`, ... | `ORDER BY CAST(SUBSTR(maDocGia, 3) AS INTEGER) DESC` |
| PhieuMuon | `PM001`, `PM002`, ... | `ORDER BY CAST(SUBSTR(maPhieu, 3) AS INTEGER) DESC` |
| TaiKhoan | `TK001`, `TK002`, ... | `ORDER BY maTaiKhoan DESC` |

Logic: query MAX existing ID, +1, pad to 3 digits. Safe for deletions (never reuses IDs).

## Auto-Backup System

File: `backend/backup.ts`

- Runs only when `NODE_ENV=production` (skipped in dev)
- First backup: 1 minute after server start
- Then: every 24 hours
- Output: `backend/backups/backup_YYYY-MM-DDTHH-mm-ss.db`
- Retention: keeps 7 latest, deletes older
- Uses SQLite online backup API (`db.backup()`) - safe while app is running
- Tunable constants in backup.ts: `BACKUP_INTERVAL_MS`, `MAX_BACKUPS`

Admin downloads backups via `/backups` page. On Render free tier, disk wipes on redeploy (persistent disk is paid).

## Dev Commands

```bash
# Root (convenience)
./start.bat              # Install + dev:all (Windows); start.sh for Linux/Mac
./build.bat              # Install + build for production
./deploy.bat             # Build + create Deploy/ folder (portable)

# Backend
cd backend && npm run dev          # Start backend (LOG_LEVEL from .env)
cd backend && npm run dev:debug    # Start with LOG_LEVEL=debug
cd backend && npm run dev:quiet    # Start with LOG_LEVEL=off
cd backend && npm run dev:all      # Concurrently run BE (3000) + FE (5173)
cd backend && npm run seed         # Seed test data manually
cd backend && npm test             # Run Jest tests (126 tests)

# Frontend
cd frontend && npm run dev         # Start Vite dev server (proxy to :3000)

# Production
cd backend && npm run build        # Build BE (tsc) + FE (vite build)
cd backend && npm start            # Serve built app (node dist/index.js)
```

## Test Accounts (auto-seeded)

| Role | Username | Password |
|------|----------|----------|
| Thủ thư (Librarian) | thuthu | 123456 |
| Quản trị viên (Admin) | admin | 123456 |

Auto-seed runs at startup when TaiKhoan table is empty (see `index.ts`).

## Vietnamese Naming Convention

Dự án sử dụng tiếng Việt không dấu cho tên entities, fields, UI labels:
- DocGia = Reader, Sach = Book, PhieuMuon = Loan, TaiKhoan = Account
- hoTen = full name, tieuDe = title, tacGia = author, tinhTrang = status
- ngayMuon = borrow date, hanTra = due date, tienPhat = fine amount
- Thủ thư = Librarian, Quản trị viên = Admin, Sao lưu = Backup

## Key Patterns

### Backend
- Controllers receive `Database` instance via constructor injection
- Routes are thin wrappers: parse request → call controller method → format response (never query DB directly)
- All SQL queries are raw (no ORM) using `db.prepare().run/get/all()`
- Transactions via `db.transaction()` for: createLoan, returnBook
- Enum values parameterized in SQL (`WHERE trangThai = ?` + `TrangThaiPhieu.DANG_MUON`), never hardcoded strings
- Error handling: controllers return `{ success, error?, data? }` pattern; routes wrap in try/catch with 4xx/5xx status
- Request logging: middleware/logger.ts with LOG_LEVEL env control, auto-masks `matKhau` in body
- Diacritics: shared utils/diacritics.ts used by search in DocGia, Sach, TraCuuHeThong

### Frontend
- All API calls go through `services/api.ts` (grouped: authApi, bookApi, readerApi, loanApi, reportApi, accountApi, backupApi)
- Axios interceptor auto-adds Authorization header from localStorage
- Frontend uses Ant Design components (Table, Form, Modal, Card, Tabs)
- `LoanSearchTable` is shared between Return/Extend pages (exports InfoItem, isOverdue, estimateFine helpers)
- BorrowPage: wizard pattern (search reader → search book → confirm)
- Return/Extend pages: 3-phase pattern (search → confirm → result) with reset via `key` prop
- BooksPage: edit modal includes tinhTrang dropdown (SAN_SANG/BAO_TRI/MAT, DA_MUON disabled)
- ReadersPage: search bar (keyword search, diacritics-aware) + CRUD modal with DatePicker for ngayHetHan
- AccountsPage / BackupsPage: admin-only, visible in menu only for QUAN_TRI_VIEN
- Enums imported from `constants.ts` (never hardcode role/status strings)

## Build & Deploy

### Local build
- `build.bat/build.sh` installs deps + runs `tsc` for BE and `vite build` for FE
- Output: `backend/dist/` (JS) + `frontend/dist/` (HTML/JS/CSS)

### Portable Deploy folder
- `deploy.bat/deploy.sh` runs `scripts/deploy.js`
- Creates `Deploy/` with `backend/dist/`, `frontend/dist/`, production `package.json`, `start.bat/start.sh`
- End-user runs `start.bat` → auto installs prod deps, starts server on port 3000
- Uses `node --no-deprecation` to suppress Express url.parse() warning

### Render deployment
- Build Command: `cd backend && npm install && cd ../frontend && npm install && npm run build && cd ../backend && npm run build`
- Start Command: `cd backend && node dist/index.js`
- Env vars: `NODE_ENV=production` (enables backup scheduler), `LOG_LEVEL=info`
- Render auto-sets `PORT` env var → Express listens there; LB proxies HTTPS 443 → container PORT
- `better-sqlite3` auto-creates `Database/` folder on first run, auto-seeds if empty
- Free tier disk wipes on redeploy (backups too); use Persistent Disk ($1/mo) for persistence

## Documents

`.kiro/document/` contains:
- `BaoCao_PhanTich_ThietKe.md` — BRD full (4 UCs: Mượn, Trả, Gia hạn, Quản lý tài khoản) with Mermaid diagrams
- `BaoCao_PhanTich_ThietKe_PlantUML.md` — Same as above but with PlantUML diagrams
- `BaoCao_3UC_Mermaid.md` — Trimmed to 3 core UCs (Mượn, Trả, Gia hạn) with Mermaid
- `BaoCao_3UC_PlantUML.md` — Same 3 UCs with PlantUML
- `guide/` — 6-part codebase walkthrough (README.md → 01 → 06) from beginner to advanced:
  - 01-Tong-Quan.md — System overview
  - 02-Cau-Truc-Folder.md — Folder structure + lookup table
  - 03-Database-DataFlow.md — Schema + data flow
  - 04-Backend-Deep-Dive.md — Controllers, routes, auth, backup scheduler
  - 05-Frontend-Deep-Dive.md — Routing, state, API client
  - 06-Debug-Deploy.md — Debug workflow, restore, deploy to Render
