# Phần 6: Debug & Deploy

**Mục tiêu:** Biết cách tìm và fix bug nhanh, build và deploy app.

---

## 6.1. Chạy dev từ đầu

```bash
# Clone xong
./start.bat    # Windows (hoặc start.sh cho Linux/Mac)
```

Script `start.bat` tự làm:
1. `cd backend && npm install`
2. `cd ../frontend && npm install`
3. `cd ../backend && npm run dev:all` — chạy BE + FE song song

Mở `http://localhost:5173`. Tài khoản mẫu:
- `thuthu / 123456` (Thủ thư)
- `admin / 123456` (Quản trị viên)

Lần đầu: DB trống → `index.ts` tự seed 2 accounts + 22 readers + 25 books + 5 loans.

## 6.2. Workflow debug cơ bản

### Bug xảy ra → xác định tầng

**Frontend (UI sai, click không ra gì):**
- Mở DevTools (F12) → Console xem error JS
- Network tab xem request có gửi đi không, status mấy
- React DevTools xem state/props

**Backend (API trả sai data hoặc lỗi 500):**
- Xem terminal chạy `npm run dev` — log request + error stack trace
- Đổi `LOG_LEVEL=debug` để log cả body

**Database (data không đúng):**
- Mở `backend/Database/dev.db` bằng DB Browser for SQLite (miễn phí)
- Hoặc viết script JS inline query (xem 6.5)

### Debug flow ví dụ: "Trả sách không tính phạt"

1. Mở `ReturnPage.tsx` → confirm API gọi đúng `loanApi.returnBook(id)`
2. Network tab → xem response — có `tienPhat` không?
3. Backend log → xem request có đến không
4. Mở `PhieuMuonController.returnBook()` → thêm `console.log(loan.hanTra, ngayTraThucTe, tienPhat)`
5. Check công thức `calculateFine()`

## 6.3. Debug tools quan trọng

### Terminal logs

Backend chạy sẽ log:
```
14:23:15 POST   /loans 201 45ms
14:23:20 POST   /loans/PM001/return 500 12ms
  body: {}
```

Status 5xx → có error stack trace bên dưới. Đọc stack để biết file + dòng.

### Console.log strategically

Trong controller nghi vấn:
```ts
returnBook(maPhieu) {
  const loan = this.findLoanByCode(maPhieu);
  console.log('DEBUG loan:', loan);  // xem data DB trả về
  
  const ngayTraThucTe = new Date();
  const tienPhat = this.calculateFine(loan.hanTra, ngayTraThucTe);
  console.log('DEBUG fine calc:', { hanTra: loan.hanTra, ngayTra: ngayTraThucTe, tienPhat });
  // ...
}
```

Nhớ xóa log sau khi debug xong.

### TypeScript error

Build fail → đọc kỹ message:
```
src/xxx.ts:3:10 - error TS6133: 'VaiTro' is declared but its value is never read.
```

File `xxx.ts`, dòng 3, cột 10. `TS6133` = unused import. Fix: xóa import hoặc dùng nó.

Lookup error code: `TS6133`, `TS2345`... Google `typescript TS6133`.

### Jest tests

Trước khi commit, chạy:
```bash
cd backend && npm test
```

126 tests pass → tự tin controller logic OK.

Chạy 1 file cụ thể:
```bash
npx jest tests/controllers/PhieuMuonController.test.ts
```

Chạy watch mode khi sửa:
```bash
npx jest --watch
```

## 6.4. Common bugs & cách fix

### "Cannot open database because the directory does not exist"
DB path `./Database/dev.db` không tồn tại. Code `database.ts` đã tự tạo folder (dòng `fs.mkdirSync(dir, { recursive: true })`). Nếu vẫn lỗi: check `cwd` khi chạy (nên là `backend/`).

### "SQLITE_CONSTRAINT: FOREIGN KEY"
Thử xóa DocGia/Sach đang có phiếu mượn. Code có check `hasActiveLoans()` + `isBookOnLoan()` để block. Nếu vẫn lỗi, check FK pragma có bật chưa.

### "SQLITE_CONSTRAINT: CHECK"
Insert giá trị enum không hợp lệ (ví dụ `tinhTrang = 'SOMETHING_ELSE'`). DB có CHECK constraint trong schema. Luôn dùng enum từ `types/index.ts`.

### Frontend "Network Error" hoặc CORS
Dev mode: Vite proxy chưa chạy → backend chưa start port 3000. Chạy `npm run dev:all`.

### "401 Unauthorized" khi đang login
`localStorage.lms_user` bị xóa hoặc format sai. Mở console: `localStorage.getItem('lms_user')`. Nếu `null` → logout rồi login lại.

### Menu không hiện đúng
Check `user.vaiTro` trong AuthContext. User THU_THU không thấy menu Tài khoản là đúng.

### Test fail sau khi sửa controller
Đọc error Jest. Nếu là property test fail (`fast-check`), output sẽ ghi counter-example (input làm fail). Test lại logic với input đó.

## 6.5. Query DB trực tiếp

Tạo file tạm `backend/query.js`:

```js
const Database = require('better-sqlite3');
const db = new Database('./Database/dev.db');

// Xem tất cả phiếu mượn đang mượn
const loans = db.prepare(`
  SELECT pm.maPhieu, dg.hoTen, s.tieuDe, pm.hanTra
  FROM PhieuMuon pm
  JOIN DocGia dg ON pm.maDocGia = dg.maDocGia
  JOIN Sach s ON pm.maSach = s.maSach
  WHERE pm.trangThai = 'DANG_MUON'
`).all();
console.table(loans);

// Reset trạng thái 1 phiếu
// db.prepare("UPDATE PhieuMuon SET trangThai = 'DANG_MUON' WHERE maPhieu = ?").run('PM001');

db.close();
```

Chạy: `cd backend && node query.js`. Xóa file khi xong.

**Hoặc GUI:** cài [DB Browser for SQLite](https://sqlitebrowser.org/) → mở `backend/Database/dev.db` → browse/query visual.

## 6.6. Reset DB

Khi data rối:
```bash
cd backend
rm Database/dev.db*      # Linux/Mac
del Database\dev.db*     # Windows
npm run dev              # Restart → auto-seed
```

Hoặc giữ seed tay:
```bash
cd backend && npm run seed
```

## 6.6b. Restore từ backup

Nếu có file backup (download từ `/backups` trên production) và muốn restore:

```bash
cd backend/Database
# Backup DB hiện tại (phòng trường hợp)
cp dev.db dev.db.before-restore

# Replace bằng file backup
cp ~/Downloads/backup_2026-05-06T14-30-00.db dev.db

# Xóa WAL/SHM files (nếu có)
rm -f dev.db-wal dev.db-shm

# Restart server
cd .. && npm run dev
```

**Quan trọng:** phải **dừng server** trước khi replace file `.db` (tránh corrupt).

## 6.7. Build production

### Build local

```bash
./build.bat    # hoặc build.sh
```

Output:
- `backend/dist/` — JS compiled từ TS
- `frontend/dist/` — HTML/JS/CSS minified

Chạy thử:
```bash
cd backend && npm start
```

Mở `http://localhost:3000` — giờ chỉ 1 port, Express serve cả frontend + API.

### Build Deploy folder (portable)

```bash
./deploy.bat
```

Script `scripts/deploy.js` tạo thư mục `Deploy/` với:
```
Deploy/
├── backend/dist/         # JS compiled
├── frontend/dist/        # Static files
├── package.json          # Chỉ production deps
├── start.bat / start.sh  # Script tự install + chạy
└── README.txt
```

Gửi nguyên folder `Deploy/` cho người khác, họ chạy `start.bat` là chạy. Node >= 18 là đủ.

## 6.8. Deploy lên Render

### Chuẩn bị

1. Push code lên GitHub
2. Tạo `backend/.env.sample` → copy thành `.env` (Render sẽ dùng env vars)

### Render setup

Tạo **Web Service** mới:
- **Build Command:**
  ```
  cd backend && npm install && cd ../frontend && npm install && npm run build && cd ../backend && npm run build
  ```
- **Start Command:**
  ```
  cd backend && node dist/index.js
  ```
- **Environment:** Node 18+
- **Env vars:**
  - `LOG_LEVEL=info` (hoặc `debug`, `error`, `off`)
  - `NODE_ENV=production` — **quan trọng** để bật auto-backup scheduler

### Quan trọng

- Render set `process.env.PORT` tự động → Express listen port đó (code đã handle)
- Render set `NODE_ENV=production` tự động → backup scheduler sẽ chạy mỗi 24h
- SQLite file lưu trên disk của container — **mất khi redeploy**. Nếu cần persist: dùng Render Disk (paid) hoặc chuyển PostgreSQL
- Backup tự động giữ 7 bản, admin download qua `/backups` UI
- App tự seed khi DB trống → sau mỗi redeploy sẽ reset data

### Truy cập

URL dạng `https://your-app.onrender.com`. Render proxy HTTPS 443 → container PORT.

## 6.9. Checklist trước khi commit/push

- [ ] Xóa `console.log` debug
- [ ] `npm test` pass (cd backend)
- [ ] `npx tsc -b` không lỗi (cd frontend)
- [ ] Đã test flow chính (login, mượn, trả, gia hạn)
- [ ] Không commit `backend/Database/dev.db*` (đã có .gitignore)
- [ ] Không commit `.env` (chỉ `.env.sample`)

## 6.10. Scripts cheatsheet

```bash
# Backend
cd backend
npm run dev           # Chạy BE (LOG_LEVEL từ .env)
npm run dev:debug     # LOG_LEVEL=debug
npm run dev:quiet     # LOG_LEVEL=off
npm run dev:all       # BE + FE song song
npm run build         # tsc + vite build
npm run seed          # Reset data seed
npm test              # Jest
npm start             # node dist/index.js

# Frontend (ít khi chạy riêng)
cd frontend
npm run dev           # Vite dev server
npm run build         # tsc -b + vite build

# Root
./start.bat           # Install + dev
./build.bat           # Install + build
./deploy.bat          # Build + tạo Deploy folder
```

## 6.11. Khi stuck

1. **Đọc kỹ error message** — thường ghi rõ file + dòng
2. **Xem git log** — file này thay đổi gì gần đây?
3. **Bisect** — revert 1-2 commit, còn lỗi không?
4. **Reset DB** — 50% bug là do data lỗi, không phải code
5. **Tắt hết, chạy lại** — kill Node, xóa `node_modules`, `npm install` lại
6. **Test isolate** — tạo file test nhỏ reproducer, không cần toàn app

---

## Tóm tắt phần 6

- `start.bat` cho dev, `build.bat` cho prod, `deploy.bat` cho portable
- Debug: terminal log + DevTools + console.log strategic
- Reset DB: xóa `dev.db*` → restart server
- Render deploy: Express listen `process.env.PORT`, file DB sẽ mất mỗi redeploy
- Checklist trước commit: test pass, tsc OK, xóa log debug

---

# Tóm tắt toàn bộ 6 phần

| Phần | Chủ đề | Khi nào cần |
|------|--------|-------------|
| 1 | Tổng quan | Lần đầu tiếp cận app |
| 2 | Cấu trúc folder | Tìm file nằm ở đâu |
| 3 | Database & data flow | Hiểu schema, debug data |
| 4 | Backend deep-dive | Sửa controller/route/auth |
| 5 | Frontend deep-dive | Sửa UI, routing, state |
| 6 | Debug & deploy | Khi có bug hoặc deploy |

Đọc theo thứ tự 1→6 nếu mới. Quay lại phần cụ thể khi cần lookup.
