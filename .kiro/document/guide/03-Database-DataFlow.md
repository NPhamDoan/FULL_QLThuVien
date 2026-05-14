# Phần 3: Database & Data Flow

**Mục tiêu:** Hiểu schema DB, enum, và cách dữ liệu chạy qua các tầng.

---

## 3.1. Database schema

File: `backend/database.ts`. Chỉ có **4 bảng**:

### DocGia — Độc giả

```sql
CREATE TABLE DocGia (
  maDocGia    TEXT PRIMARY KEY,       -- 'DG001', 'DG002'
  hoTen       TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  soDienThoai TEXT NOT NULL,
  ngayHetHan  TEXT NOT NULL,           -- ngày hết hạn thẻ
  createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Sach — Sách

```sql
CREATE TABLE Sach (
  maSach    TEXT PRIMARY KEY,          -- 'S001', 'S002'
  tieuDe    TEXT NOT NULL,
  tacGia    TEXT NOT NULL,
  soBanSao  INTEGER NOT NULL DEFAULT 1 CHECK (soBanSao >= 0),
  soMat     INTEGER NOT NULL DEFAULT 0 CHECK (soMat >= 0),
  soBaoTri  INTEGER NOT NULL DEFAULT 0 CHECK (soBaoTri >= 0),
  ...
);
```

**Counters thay cho enum tinhTrang (đã bỏ):**
- `soBanSao`: tổng số bản nhập
- `soMat`: số bản mất vĩnh viễn
- `soBaoTri`: số bản đang bảo trì
- `soDangMuon` (derived): `COUNT(PhieuMuon WHERE maSach=? AND trangThai='DANG_MUON')`
- `soKhaDung` (derived): `soBanSao - soMat - soBaoTri - soDangMuon`

1 đầu sách có thể có N bản sao. Ví dụ: S001 `soBanSao=5`, `soMat=1`, `soBaoTri=0`, 2 đang mượn → `soKhaDung=2`.

### PhieuMuon — Phiếu mượn

```sql
CREATE TABLE PhieuMuon (
  maPhieu       TEXT PRIMARY KEY,      -- 'PM001', 'PM002'
  maDocGia      TEXT NOT NULL,
  maSach        TEXT NOT NULL,
  ngayMuon      TEXT NOT NULL,
  hanTra        TEXT NOT NULL,          -- ngayMuon + 14 ngày
  ngayTraThucTe TEXT,                   -- NULL nếu chưa trả
  trangThai     TEXT NOT NULL DEFAULT 'DANG_MUON'
    CHECK (trangThai IN ('DANG_MUON', 'DA_TRA')),
  tienPhat      REAL NOT NULL DEFAULT 0,
  ...
  FOREIGN KEY (maDocGia) REFERENCES DocGia(maDocGia),
  FOREIGN KEY (maSach) REFERENCES Sach(maSach)
);
```

### TaiKhoan — Tài khoản đăng nhập

```sql
CREATE TABLE TaiKhoan (
  maTaiKhoan  TEXT PRIMARY KEY,         -- 'TK001', 'TK002'
  tenDangNhap TEXT NOT NULL UNIQUE,
  matKhau     TEXT NOT NULL,             -- bcrypt hash
  vaiTro      TEXT NOT NULL DEFAULT 'THU_THU'
    CHECK (vaiTro IN ('THU_THU', 'QUAN_TRI_VIEN')),
  trangThai   TEXT NOT NULL DEFAULT 'HOAT_DONG'
    CHECK (trangThai IN ('HOAT_DONG', 'BI_KHOA')),
  ...
);
```

### Quan hệ giữa các bảng

```
DocGia (1) ──────< (N) PhieuMuon (N) >────── (1) Sach
                        │
                        │ ngayMuon, hanTra, tienPhat
                        │ trangThai: DANG_MUON | DA_TRA

TaiKhoan (độc lập, không có FK)
```

Một độc giả có thể có nhiều phiếu mượn. Một cuốn sách có thể xuất hiện trong nhiều phiếu (nhưng chỉ 1 phiếu đang mượn tại 1 thời điểm).

### Indexes

```sql
CREATE INDEX idx_sach_tieuDe ON Sach(tieuDe);
CREATE INDEX idx_sach_tacGia ON Sach(tacGia);
CREATE INDEX idx_phieumuon_maDocGia ON PhieuMuon(maDocGia);
CREATE INDEX idx_phieumuon_maSach ON PhieuMuon(maSach);
CREATE INDEX idx_phieumuon_trangThai ON PhieuMuon(trangThai);
```

Tăng tốc tìm kiếm và JOIN.

## 3.2. Enums

Định nghĩa 1 chỗ duy nhất — `backend/types/index.ts`:

```ts
export enum TrangThaiPhieu {
  DANG_MUON = "DANG_MUON",
  DA_TRA    = "DA_TRA",
}

export enum VaiTro {
  THU_THU        = "THU_THU",         // Thủ thư (user thường)
  QUAN_TRI_VIEN  = "QUAN_TRI_VIEN",   // Admin
}

export enum TrangThaiTaiKhoan {
  HOAT_DONG = "HOAT_DONG",   // Đang hoạt động
  BI_KHOA   = "BI_KHOA",      // Bị khóa
}
```

**Note:** `TinhTrangSach` enum đã bỏ (Cách A refactor). Sach giờ dùng counters `soBanSao/soMat/soBaoTri`.

**Frontend mirror** trong `frontend/src/constants.ts` (do FE/BE không share code):

```ts
export const VaiTro = { THU_THU: 'THU_THU', QUAN_TRI_VIEN: 'QUAN_TRI_VIEN' } as const;
// ... tương tự
```

**Quy tắc quan trọng:** Không bao giờ viết hardcode string như `'DANG_MUON'` trong code. Luôn dùng `TrangThaiPhieu.DANG_MUON`. Đổi tên enum → compiler báo lỗi tất cả chỗ dùng.

## 3.3. Vòng đời 1 phiếu mượn

```
Tạo phiếu (createLoan)                Trả sách (returnBook)
 │                                     │
 │ - Check soKhaDung > 0                │ - Nếu daMatSach: soMat += 1
 │ - INSERT PhieuMuon (DANG_MUON)       │ - UPDATE PhieuMuon = DA_TRA
 │   (KHÔNG update Sach counter)        │   (KHÔNG update Sach counter)
 │                                     │
 ↓                                     ↓
PhieuMuon.trangThai                 PhieuMuon.trangThai
  DANG_MUON ───────────────────────→ DA_TRA
     │
     │ gia hạn +7 ngày (extendLoan)
     ↓
  DANG_MUON (hanTra mới)
```

Sach availability **tự động derive** từ:
- `soBanSao - soMat - soBaoTri - COUNT(PhieuMuon WHERE DANG_MUON)`

Không cần update Sach khi mượn/trả (chỉ update khi đánh dấu mất hoặc edit counter tay).

**Công thức tính phạt:**
```
tienPhat = max(0, (ngayTraThucTe - hanTra) ngày) × 5000 VNĐ
         + phiMat (nếu đánh dấu sách bị mất)
```

Nếu trả đúng hạn → `tienPhat = 0`.
Nếu trả trễ 3 ngày + không mất → `tienPhat = 3 × 5000 = 15,000 VNĐ`.
Nếu trả đúng hạn nhưng mất → `tienPhat = phiMat` (thủ thư nhập).

## 3.4. Data flow: Mượn sách (end-to-end)

Ví dụ user click "Xác nhận mượn" trên trang `BorrowPage`:

### Bước 1: Frontend gọi API

`frontend/src/pages/BorrowPage.tsx`:
```tsx
await loanApi.create(selectedReader.maDocGia, selectedBook.maSach);
```

`frontend/src/services/api.ts`:
```ts
loanApi.create = (maDocGia, maSach) =>
  api.post('/loans', { maDocGia, maSach });
// axios tự gắn Authorization: Bearer {maTaiKhoan} qua interceptor
```

### Bước 2: Vite proxy (chỉ dev mode)

Dev: request vào `http://localhost:5173/api/loans` → Vite rewrite bỏ `/api` → forward sang `http://localhost:3000/loans`.

Production: gọi thẳng `/loans` (cùng origin vì chỉ có Express).

### Bước 3: Express route nhận

`backend/routes/loanRoutes.ts`:
```ts
router.post('/', (req, res) => {
  const { maDocGia, maSach } = req.body;

  // Validate
  const v = controller.validateMember(maDocGia);
  if (!v.valid) return res.status(400).json({ error: v.message });

  const b = controller.checkBookAvailability(maSach);
  if (!b.available) return res.status(400).json({ error: b.message });

  // Tạo phiếu
  const loan = controller.createLoan(maDocGia, maSach);
  res.status(201).json(loan);
});
```

### Bước 4: Controller query DB (transaction)

`backend/controllers/PhieuMuonController.ts`:
```ts
createLoan(maDocGia, maSach) {
  const tx = this.db.transaction(() => {
    // Re-check availability inside tx (race-safe)
    const book = db.prepare('SELECT soBanSao, soMat, soBaoTri FROM Sach WHERE maSach = ?').get(maSach);
    const soDangMuon = db.prepare('SELECT COUNT(*) FROM PhieuMuon WHERE maSach=? AND trangThai=?').get(maSach, 'DANG_MUON');
    if (book.soBanSao - book.soMat - book.soBaoTri - soDangMuon <= 0) {
      throw new Error('Hết bản khả dụng');
    }

    // Sinh mã tuần tự: PM001, PM002, ...
    const maPhieu = 'PM' + String(nextNum).padStart(3, '0');

    // INSERT phiếu mượn (không update Sach)
    db.prepare(`INSERT INTO PhieuMuon ...`).run(...);

    return findLoanByCode(maPhieu);
  });
  return tx();
}
```

**Transaction** đảm bảo check + INSERT atomic. Không còn UPDATE Sach vì availability derive từ counters + PhieuMuon.

### Bước 5: Response về frontend

```json
{
  "maPhieu": "PM006",
  "maDocGia": "DG001",
  "maSach": "S005",
  "ngayMuon": "2026-05-06T00:00:00.000Z",
  "hanTra": "2026-05-20T00:00:00.000Z",
  "trangThai": "DANG_MUON",
  "tienPhat": 0
}
```

Frontend hiển thị "Tạo phiếu thành công" + thông tin phiếu.

## 3.5. Seed data

File `backend/seed.ts`. Khi DB trống, `backend/index.ts` tự chạy seed:

```ts
// index.ts
const row = db.prepare('SELECT COUNT(*) as count FROM TaiKhoan').get();
if (row.count === 0) {
  seedDatabase(db);   // Tạo data mẫu
}
```

Seed tạo:
- 2 tài khoản: `thuthu/123456` (THU_THU), `admin/123456` (QUAN_TRI_VIEN)
- 22 độc giả: DG001-DG022
- 25 sách: S001-S025
- 5 phiếu mượn: PM001-PM005 (gồm cả quá hạn, đã trả, đang mượn)

Nếu muốn reset data: xóa `backend/Database/dev.db*` → restart server → tự seed lại.

## 3.6. ID generation

Mã tuần tự 3 chữ số: `S001`, `DG001`, `PM001`, `TK001`.

Logic trong controller (ví dụ `SachController.createBook`):

```ts
const last = this.db.prepare(
  "SELECT maSach FROM Sach WHERE maSach LIKE 'S%' ORDER BY CAST(SUBSTR(maSach, 2) AS INTEGER) DESC LIMIT 1"
).get();
const nextNum = last ? parseInt(last.maSach.substring(1)) + 1 : 1;
const maSach = 'S' + String(nextNum).padStart(3, '0');
```

**Note:** Query lấy MAX ID hiện tại, không đếm record. Xóa bớt giữa chừng vẫn an toàn (không đụng lại ID cũ).

## 3.7. SQLite đặc thù

**File-based:** Không cần server. Cả DB nằm trong `backend/Database/dev.db`.

**WAL mode:** `db.pragma('journal_mode = WAL')` — nhiều connection đọc song song, 1 ghi. Tạo 2 file phụ: `dev.db-shm`, `dev.db-wal`.

**Foreign keys:** Mặc định SQLite **tắt** FK. Phải bật bằng `db.pragma('foreign_keys = ON')` mỗi connection (xem `database.ts`).

**Sync driver:** `better-sqlite3` là sync (không cần `await`). Nhanh hơn `sqlite3` async.

```ts
// Sync — không cần async/await
const row = db.prepare('SELECT * FROM Sach WHERE maSach = ?').get('S001');
```

---

## Tóm tắt phần 3

- 4 bảng: DocGia, Sach, PhieuMuon, TaiKhoan
- 3 enum chính: TrangThaiPhieu, VaiTro, TrangThaiTaiKhoan (đã bỏ TinhTrangSach)
- Sach dùng counters (soBanSao, soMat, soBaoTri) thay cho tinhTrang enum
- soKhaDung = soBanSao - soMat - soBaoTri - soDangMuon (tính runtime, không lưu DB)
- Không hardcode string — luôn dùng enum
- Flow mượn sách: FE → axios → Vite proxy (dev) → Express → Controller (transaction) → SQLite
- ID tuần tự 3 chữ số, query MAX hiện tại + 1
- DB trống → auto-seed khi server start

**Phần tiếp theo (4):** Backend deep-dive — Controllers, routes, middleware.
