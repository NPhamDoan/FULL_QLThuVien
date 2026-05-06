# Phần 2: Cấu trúc thư mục

**Mục tiêu:** Biết file nào nằm ở đâu, trách nhiệm của từng folder.

---

## 2.1. Cấu trúc tổng thể

```
FULL_QLThuVien/
├── backend/                    ← Server (Node.js + Express)
├── frontend/                   ← Client (React SPA)
├── scripts/
│   └── deploy.js              ← Script tạo Deploy folder
├── .kiro/document/            ← Tài liệu dự án
├── start.bat / start.sh       ← Chạy dev mode
├── build.bat / build.sh       ← Build production
├── deploy.bat / deploy.sh     ← Tạo Deploy folder portable
└── README.md
```

Chỉ có 2 folder quan trọng cần hiểu sâu: `backend/` và `frontend/`.

## 2.2. Backend structure

```
backend/
├── index.ts                   ← Entry: mount routes, auto-seed, listen port
├── database.ts                ← Khởi tạo SQLite + schema (CREATE TABLE)
├── seed.ts                    ← Dữ liệu test (2 accounts, 22 readers, 25 books)
├── backup.ts                  ← Scheduler auto-backup (production only)
│
├── types/index.ts             ← Enum + Interface + DTO (dùng toàn backend)
│
├── controllers/               ← Business logic (class, inject db qua constructor)
│   ├── TaiKhoanController.ts       # Đăng nhập, CRUD tài khoản
│   ├── DocGiaController.ts         # CRUD + search độc giả
│   ├── SachController.ts           # CRUD + search sách
│   ├── PhieuMuonController.ts      # Tạo/trả/gia hạn phiếu mượn
│   ├── TraCuuHeThongController.ts  # Search sách theo từng field
│   └── BaoCaoController.ts         # Báo cáo quá hạn + tồn kho
│
├── routes/                    ← Express router, parse req → gọi controller
│   ├── authRoutes.ts          # /auth/*  (login, logout, CRUD tài khoản)
│   ├── readerRoutes.ts        # /readers/*
│   ├── bookRoutes.ts          # /books/*
│   ├── loanRoutes.ts          # /loans/*
│   ├── reportRoutes.ts        # /reports/*
│   └── backupRoutes.ts        # /backups/*  (admin: list/create/download)
│
├── middleware/
│   └── logger.ts              ← Log mọi API request (LOG_LEVEL env)
│
├── utils/
│   └── diacritics.ts          ← Bỏ dấu tiếng Việt (cho search)
│
├── tests/                     ← Jest test (126 tests)
│   ├── controllers/           # Mỗi controller 1 file test
│   ├── database.test.ts
│   └── setup.test.ts
│
├── Database/                  ← Runtime (không commit)
│   └── dev.db                 ← File SQLite
│
├── backups/                   ← Runtime (không commit)
│   └── backup_*.db            ← File backup tự động (production)
│
└── dist/                      ← Output TypeScript compile (không commit)
```

### Phân chia trách nhiệm

| Layer | Trách nhiệm |
|-------|-------------|
| `routes/` | Parse request (body, query, params), gọi controller, format response |
| `controllers/` | Business logic, validation nghiệp vụ, query DB |
| `database.ts` | Định nghĩa schema, indexes |
| `utils/` | Helper thuần (không phụ thuộc DB hay Express) |
| `middleware/` | Logic cross-cutting (log, auth sau này) |

**Route KHÔNG được query DB trực tiếp.** Luôn qua controller.

## 2.3. Frontend structure

```
frontend/
├── index.html                 ← Entry HTML (Vite inject script)
├── vite.config.ts             ← Cấu hình Vite (proxy /api → :3000)
├── package.json
│
├── public/
│   └── favicon.svg            ← Asset copy nguyên xi
│
└── src/
    ├── main.tsx               ← React entry: render <App />
    ├── App.tsx                ← Routes + theme Ant Design
    ├── index.css              ← Global CSS
    ├── constants.ts           ← Mirror enum từ backend (VaiTro, TinhTrangSach...)
    │
    ├── contexts/
    │   └── AuthContext.tsx    ← State user, login/logout, localStorage
    │
    ├── components/            ← Component tái sử dụng
    │   ├── ProtectedRoute.tsx # Guard route (check login + role)
    │   └── LoanSearchTable.tsx # Bảng search phiếu (dùng chung Return/Extend)
    │
    ├── layouts/
    │   └── MainLayout.tsx     ← Sidebar + Header + <Outlet />
    │
    ├── pages/                 ← Mỗi page = 1 route
    │   ├── LoginPage.tsx
    │   ├── DashboardPage.tsx  # /
    │   ├── BorrowPage.tsx     # /borrow
    │   ├── ReturnPage.tsx     # /return
    │   ├── ExtendPage.tsx     # /extend
    │   ├── BooksPage.tsx      # /books
    │   ├── ReadersPage.tsx    # /readers
    │   ├── AccountsPage.tsx   # /accounts (admin only)
    │   └── BackupsPage.tsx    # /backups  (admin only)
    │
    └── services/
        └── api.ts             ← Axios instance + tất cả API methods
```

### Phân chia trách nhiệm

| Folder | Trách nhiệm |
|--------|-------------|
| `pages/` | Một page = một route. Render UI, gọi API qua `services/api.ts` |
| `components/` | UI reusable (không gắn route cụ thể) |
| `layouts/` | Khung chung (sidebar + header) bao các page |
| `contexts/` | Global state qua React Context |
| `services/` | Lớp gọi API, không chứa UI |
| `constants.ts` | Enum mirror từ backend để tránh magic string |

## 2.4. Quy ước đặt tên

**Entities/fields dùng tiếng Việt không dấu** (đồng bộ BE-FE-DB):

| Tiếng Việt | Ý nghĩa |
|------------|---------|
| `DocGia` | Độc giả (Reader) |
| `Sach` | Sách (Book) |
| `PhieuMuon` | Phiếu mượn (Loan) |
| `TaiKhoan` | Tài khoản (Account) |
| `hoTen` | Họ tên |
| `tieuDe` | Tiêu đề |
| `tacGia` | Tác giả |
| `tinhTrang` | Tình trạng (sách) |
| `trangThai` | Trạng thái (phiếu, tài khoản) |
| `ngayMuon` | Ngày mượn |
| `hanTra` | Hạn trả |
| `tienPhat` | Tiền phạt |

**File naming:**
- Controllers/Routes: PascalCase + suffix (`PhieuMuonController.ts`, `loanRoutes.ts`)
- Pages: PascalCase + "Page" (`BorrowPage.tsx`)
- Utils: camelCase (`diacritics.ts`)

## 2.5. Tìm nhanh "tôi muốn sửa X thì vào đâu?"

| Tôi muốn | File cần xem |
|----------|--------------|
| Sửa schema DB | `backend/database.ts` |
| Thêm dữ liệu mẫu | `backend/seed.ts` |
| Sửa logic mượn sách | `backend/controllers/PhieuMuonController.ts` |
| Thêm API endpoint | Tạo/sửa file trong `backend/routes/` |
| Sửa lịch/số lượng backup | `backend/backup.ts` (BACKUP_INTERVAL_MS, MAX_BACKUPS) |
| Đổi UI trang mượn | `frontend/src/pages/BorrowPage.tsx` |
| Thêm menu sidebar | `frontend/src/layouts/MainLayout.tsx` |
| Sửa API client | `frontend/src/services/api.ts` |
| Thêm route mới | `frontend/src/App.tsx` |
| Đổi màu theme | `frontend/src/App.tsx` (ConfigProvider token) |
| Đổi tên enum | `backend/types/index.ts` + `frontend/src/constants.ts` |

## 2.6. File KHÔNG cần động tới

- `backend/dist/` — output build, auto-generate
- `backend/node_modules/`, `frontend/node_modules/` — dependencies
- `backend/Database/dev.db*` — DB runtime (xóa thì seed lại tự chạy)
- `Deploy/` — output deploy, auto-generate
- `.git/`

---

## Tóm tắt phần 2

- Backend có 3 layer: routes → controllers → database
- Frontend có pages (1 page/route) + components tái sử dụng + services gọi API
- Tiếng Việt không dấu cho tất cả entity/field để đồng bộ
- Có bảng "muốn sửa X vào đâu" ở 2.5 — dùng khi cần lookup nhanh

**Phần tiếp theo (3):** Database & Data Flow — hiểu schema và dữ liệu chạy qua các tầng.
