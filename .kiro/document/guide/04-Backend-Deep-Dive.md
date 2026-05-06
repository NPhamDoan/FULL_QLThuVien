# Phần 4: Backend deep-dive

**Mục tiêu:** Hiểu chi tiết controllers, routes, middleware, authentication để debug backend.

---

## 4.1. Entry point: index.ts

`backend/index.ts` — nơi mọi thứ bắt đầu:

```ts
// 1. Khởi tạo DB (tạo thư mục, tạo schema, bật WAL + FK)
const db = initializeDatabase();

// 2. Auto-seed nếu trống
const row = db.prepare('SELECT COUNT(*) as count FROM TaiKhoan').get();
if (row.count === 0) seedDatabase(db);

// 3. Khởi động backup scheduler (chỉ chạy khi NODE_ENV=production)
startBackupScheduler(db);

// 4. Tạo các controller, inject db
const taiKhoanController = new TaiKhoanController(db);
const docGiaController = new DocGiaController(db);
// ... 6 controllers

// 5. Mount routes
app.use('/auth', createAuthRoutes(taiKhoanController));
app.use('/readers', createReaderRoutes(docGiaController));
app.use('/books', createBookRoutes(sachController, searchController));
app.use('/loans', createLoanRoutes(phieuMuonController));
app.use('/reports', createReportRoutes(baoCaoController));
app.use('/backups', createBackupRoutes(taiKhoanController, db));

// 6. Serve frontend static (production)
app.use(express.static(frontendDist));
app.get('*', (_req, res) => res.sendFile(index.html));

// 7. Listen
app.listen(process.env.PORT || 3000, ...);
```

**Thứ tự quan trọng:** middleware `requestLogger` phải đặt **trước** routes. `errorLogger` đặt **sau** routes.

## 4.2. Dependency injection pattern

Controllers nhận `db` qua constructor — dễ test (pass mock db) và không chia sẻ state toàn cục:

```ts
export class SachController {
  private db: Database.Database;
  constructor(db: Database.Database) {
    this.db = db;
  }
  // ...
}
```

Route factory cũng tương tự:

```ts
export function createBookRoutes(sachController: SachController, ...): Router {
  const router = Router();
  router.get('/', (req, res) => { ... });
  return router;
}
```

Lợi ích: test có thể tạo `new SachController(mockDb)`, không cần env thật.

## 4.3. Controllers — Business logic

6 controllers, mỗi cái phụ trách 1 domain:

### TaiKhoanController
- `dangNhap(tenDangNhap, matKhau)` — verify bcrypt, return taiKhoan hoặc error code
- `kiemTraQuyen(maTaiKhoan, vaiTro)` — check user có role không
- CRUD tài khoản (admin only): `danhSachTaiKhoan`, `taoTaiKhoan`, `capNhatTrangThai`, `doiMatKhau`, `xoaTaiKhoan`

### DocGiaController
- `listReaders()`, `getReaderById(id)`, `searchReaders(keyword)` — list/query
- `createMember(data)` — tạo (auto-gen maDocGia tuần tự)
- `updateMember(id, data)`, `deleteMember(id)` — update/xóa
- `hasActiveLoans(maDocGia)` — check trước khi xóa
- Diacritics-aware search: gọi `removeDiacritics()` để so sánh

### SachController
- `listBooks()`, `searchBooks(keyword, tinhTrang?)` — list/query
- `createBook`, `updateBook`, `deleteBook` — CRUD
- `isBookOnLoan(maSach)` — check trước khi xóa

### PhieuMuonController
**Quan trọng nhất** — chứa 3 use case chính:
- `getActiveLoans()`, `searchActiveLoans(keyword, searchType)` — list phiếu đang mượn
- `validateMember(maDocGia)` — check thẻ tồn tại + chưa hết hạn
- `checkBookAvailability(maSach)` — check sách = SAN_SANG
- `createLoan(maDocGia, maSach)` — tạo phiếu (transaction)
- `calculateFine(hanTra, ngayTra)` — công thức tính phạt
- `returnBook(maPhieu)` — trả sách (transaction)
- `extendLoan(maPhieu)` — gia hạn +7 ngày

### TraCuuHeThongController
Legacy search theo từng field (tieuDe/tacGia/maSach). Dùng khi gọi `/books/search?tieuDe=xxx`.

### BaoCaoController
- `getOverdueLoans()` — phiếu DANG_MUON có hanTra < hôm nay
- `getInventoryStatus()` — đếm sách theo tinhTrang

## 4.4. Routes — Thin wrapper

Routes **chỉ** làm 3 việc:
1. Parse request (body, query, params)
2. Gọi method controller
3. Format response (status code + JSON)

Ví dụ:

```ts
// loanRoutes.ts
router.post('/:id/return', (req, res) => {
  try {
    const result = controller.returnBook(req.params.id as string);
    if (result.success) res.json(result);
    else res.status(400).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

**Không được:**
- Query DB trực tiếp trong route
- Validate business logic trong route (trừ validate parameter cơ bản)

**Error handling pattern** — mọi route đều có try/catch, trả về `{ error: message }`.

## 4.5. Middleware: Request logger

`backend/middleware/logger.ts`. Log theo `LOG_LEVEL` env:

| LOG_LEVEL | Hành vi |
|-----------|---------|
| `debug` | Log mọi request + body POST/PUT |
| `info` (default) | Log mọi request |
| `error` | Chỉ log 4xx/5xx |
| `off` | Tắt log |

Output dạng:
```
14:23:15 POST   /loans 201 45ms
14:23:20 GET    /books 200 12ms
14:23:25 POST   /auth/login 401 8ms
  body: {"tenDangNhap":"admin","matKhau":"***"}
```

Password tự động bị masked thành `***` (xem code trong `logger.ts`).

**Đổi LOG_LEVEL tạm thời:**
```bash
cd backend && LOG_LEVEL=debug npm run dev    # Linux/Mac
cd backend && set LOG_LEVEL=debug && npm run dev    # Windows CMD
```

Hoặc dùng script sẵn: `npm run dev:debug`, `npm run dev:quiet`.

## 4.6. Authentication flow

**Không có session middleware** — stateless, dựa vào header.

### Login

```
POST /auth/login  { tenDangNhap, matKhau }
  ↓
TaiKhoanController.dangNhap()
  ├─ SELECT * FROM TaiKhoan WHERE tenDangNhap = ?
  ├─ bcrypt.compare(matKhau, row.matKhau)
  └─ Check trangThai !== BI_KHOA
  ↓
Response: { success: true, taiKhoan: {...} }
  ↓
Frontend: localStorage.setItem('lms_user', userInfo)
```

### Authenticated requests

Frontend axios interceptor tự gắn header `Authorization: Bearer {maTaiKhoan}`:

```ts
// services/api.ts
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('lms_user'));
  if (user?.maTaiKhoan) config.headers.Authorization = `Bearer ${user.maTaiKhoan}`;
  return config;
});
```

**Backend KHÔNG verify token cho mọi request.** Chỉ check ở route cần admin:

```ts
// authRoutes.ts
function getAdminCheck(controller, req) {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const maTaiKhoan = auth.replace('Bearer ', '');
  return controller.kiemTraQuyen(maTaiKhoan, VaiTro.QUAN_TRI_VIEN);
}

router.get('/accounts', (req, res) => {
  if (!getAdminCheck(controller, req)) {
    return res.status(403).json({ error: 'Chỉ admin' });
  }
  // ...
});
```

**Đây là design đơn giản (không phải best practice):**
- Không có JWT signature → client có thể giả mạo maTaiKhoan
- OK cho app nội bộ thư viện, không OK cho public

## 4.7. Transactions

Chỉ 2 chỗ dùng transaction — đảm bảo atomic:

### Tạo phiếu mượn
```ts
const tx = this.db.transaction(() => {
  INSERT INTO PhieuMuon ...
  UPDATE Sach SET tinhTrang = 'DA_MUON' ...
});
tx();
```

Nếu UPDATE sách fail → INSERT phiếu rollback.

### Trả sách
```ts
const tx = this.db.transaction(() => {
  UPDATE PhieuMuon SET trangThai = 'DA_TRA', tienPhat = ?, ngayTraThucTe = ? ...
  UPDATE Sach SET tinhTrang = 'SAN_SANG' ...
});
tx();
```

Không được thiếu transaction ở đây — nếu fail giữa chừng, trạng thái DB sẽ lệch.

## 4.8. Diacritics search

File `backend/utils/diacritics.ts`:

```ts
export function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')                      // Tách dấu: "Nguyễn" → "Nguyê\u0303n"
    .replace(/[\u0300-\u036f]/g, '')       // Xóa combining marks
    .replace(/đ/g, 'd').replace(/Đ/g, 'D'); // 'đ' không phải NFD
}
```

Controller dùng:

```ts
// SachController.searchBooks
searchBooks(keyword, tinhTrang?) {
  const all = this.listBooks();
  const kw = keyword.toLowerCase();
  const kwNorm = removeDiacritics(kw);
  return all.filter(b => {
    const fields = [b.maSach, b.tieuDe, b.tacGia];
    return fields.some(f =>
      f.toLowerCase().includes(kw) ||
      removeDiacritics(f.toLowerCase()).includes(kwNorm)
    );
  });
}
```

User gõ "tieng viet" → match "Tiếng Việt". Gõ "lap trinh" → match "Lập trình".

**Hạn chế:** Load toàn bộ data rồi filter trong JS. Với 25-100 records thì OK, với 10,000+ cần FULLTEXT index.

## 4.9. Tests

`backend/tests/` có 8 test file, 126 test cases. Chạy:

```bash
cd backend && npm test
```

Dùng Jest + `fast-check` cho property-based testing. Ví dụ:

```ts
// PhieuMuonController.test.ts
fc.assert(fc.property(fc.integer({ min: 1, max: 100 }), (daysLate) => {
  const fine = controller.calculateFine(hanTra, ngayTra);
  expect(fine).toBe(daysLate * 5000);
}));
```

Property-based = test với nhiều input random thỏa điều kiện, không chỉ vài case cố định.

## 4.10. Auto-backup (production only)

File `backend/backup.ts` — scheduler chạy trong Node process.

### Kích hoạt

```ts
// index.ts
startBackupScheduler(db);
```

Bên trong check:
```ts
if (process.env.NODE_ENV !== 'production') {
  console.log('[backup] Skip scheduler (NODE_ENV !== production)');
  return;
}
```

- Dev local: không có `NODE_ENV` → skip
- Render: tự set `NODE_ENV=production` → chạy

### Logic

- **Lần đầu:** sau 1 phút từ lúc server start
- **Định kỳ:** mỗi 24 giờ
- **Rotate:** giữ 7 bản mới nhất, xóa bản cũ
- **Output:** `backend/backups/backup_YYYY-MM-DDTHH-mm-ss.db`

Tham số chỉnh trong file:
```ts
const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;  // 24 giờ
const MAX_BACKUPS = 7;                            // giữ 7 bản
```

### API endpoints (admin only)

Route `backend/routes/backupRoutes.ts`:

| Method | Path | Mô tả |
|--------|------|-------|
| GET | /backups | List backup files (name, size, mtime) |
| POST | /backups/create | Tạo backup ngay lập tức |
| GET | /backups/download/:name | Download file |

Mỗi route check `Authorization: Bearer {maTaiKhoan}` → verify admin. Download route có path traversal check (`startsWith('backup_')`, không chứa `/` hoặc `\`).

### SQLite online backup

Dùng API `db.backup(targetPath)` của `better-sqlite3`. Khác với copy file thường:
- Không block app (app vẫn query được khi backup)
- Consistent snapshot (không dính half-written transaction)
- Handle WAL mode đúng cách

**Tuyệt đối không** `fs.copyFileSync('dev.db', 'backup.db')` khi app đang chạy — có thể corrupt.

### Render free tier

Disk của Render free **wipe mỗi redeploy**. Backup lưu chung disk nên cũng mất.

Options:
- **Chấp nhận:** backup chỉ protect crash/restart, không protect redeploy
- **Render Persistent Disk (~$1/tháng):** mount `/opt/render/project/src/backend/backups`
- **Upload cloud:** sửa `backup.ts` thêm upload S3/Dropbox sau `createBackup()`

---

## Tóm tắt phần 4

- `index.ts` khởi tạo DB → seed → backup scheduler → controllers → routes → listen
- Controllers nhận db qua constructor (DI), routes là thin wrapper
- Auth đơn giản: Bearer {maTaiKhoan}, check trong route cần admin
- Transaction dùng ở: createLoan, returnBook
- Diacritics search load tất cả rồi filter JS — OK cho data nhỏ
- LOG_LEVEL env điều khiển logging
- Auto-backup mỗi 24h khi production, giữ 7 bản, admin download qua UI

**Phần tiếp theo (5):** Frontend deep-dive — React, routing, state.
