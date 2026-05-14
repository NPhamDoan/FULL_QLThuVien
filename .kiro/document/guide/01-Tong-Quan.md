# Phần 1: Tổng quan hệ thống

**Mục tiêu:** Sau phần này bạn sẽ hiểu app này là gì, chạy thế nào, và các thành phần chính.

---

## 1.1. App làm gì?

**QLThuVien** = Quản lý Thư viện. Web app cho thủ thư thao tác 3 nghiệp vụ chính:

- **Mượn sách**: Thủ thư tạo phiếu mượn (chọn độc giả + sách → xác nhận)
- **Trả sách**: Thủ thư chọn phiếu đang mượn → xác nhận trả (app tự tính phạt nếu quá hạn)
- **Gia hạn**: Thủ thư chọn phiếu → xác nhận gia hạn +7 ngày

Ngoài ra còn: CRUD sách/độc giả, báo cáo tổng quan, quản lý tài khoản (chỉ admin).

## 1.2. Kiến trúc cao cấp (High-level)

```
┌──────────────┐    HTTP    ┌──────────────┐    SQL     ┌──────────────┐
│   Frontend   │ ─────────> │   Backend    │ ─────────> │   SQLite DB  │
│  (React SPA) │ <───────── │  (Express)   │ <───────── │  (file .db)  │
└──────────────┘            └──────────────┘            └──────────────┘
   port 5173                   port 3000                 backend/Database/dev.db
   (chỉ khi dev)                                         
```

Có 3 tầng rõ ràng:

1. **Frontend** — React 19 + TypeScript + Ant Design + Vite
2. **Backend** — Node.js + Express + TypeScript
3. **Database** — SQLite (1 file `.db`, không cần server riêng)

## 1.3. Dev mode vs Production mode

Đây là điểm dễ rối nhất. Nhớ phân biệt:

### Dev mode (`pnpm run dev:all` từ `backend/`)

Chạy **2 server song song:**
- Backend Express listen port **3000**
- Frontend Vite dev server listen port **5173**

User truy cập `http://localhost:5173` (Vite). Khi frontend gọi `/api/books`, Vite **proxy** request đó sang `http://localhost:3000/books`.

Lợi ích: hot reload khi sửa code frontend.

### Production mode (Deploy lên Render hoặc chạy `node backend/dist/index.js`)

Chỉ **1 server:**
- Express listen port `process.env.PORT` (Render cấp) hoặc 3000 (local)

Express **vừa** serve API, **vừa** serve static files từ `frontend/dist/` (build sẵn). Không có Vite chạy.

```
User → Express :PORT
         ├─ /api/books       → JSON from controllers
         ├─ /assets/main.js  → static file from frontend/dist/
         └─ /login, /books   → trả index.html (SPA - React Router xử lý)
```

## 1.4. Flow request cơ bản

Ví dụ: user mượn sách, click "Xác nhận mượn":

```
1. Frontend (BorrowPage.tsx)
   └─ loanApi.create(maDocGia, maSach)
         └─ axios.post('/api/loans', { maDocGia, maSach })

2. Backend (loanRoutes.ts → POST /loans)
   └─ validateMember() + checkBookAvailability()
   └─ controller.createLoan(maDocGia, maSach)

3. Controller (PhieuMuonController.createLoan)
   └─ db.transaction(() => {
         INSERT INTO PhieuMuon ...
         UPDATE Sach SET tinhTrang = 'DA_MUON' ...
      })

4. Response JSON về frontend
5. Frontend hiển thị "Tạo phiếu thành công"
```

Tất cả API khác đi theo pattern tương tự: **Page → api.ts → Route → Controller → DB**.

## 1.5. Stack công nghệ

| Layer | Công nghệ | Vai trò |
|-------|-----------|---------|
| UI | React 19 + Ant Design | Component library, form, table |
| Routing FE | React Router 7 | SPA navigation |
| HTTP FE | Axios | Gọi API, interceptor gắn auth header |
| Build FE | Vite | Dev server + bundler |
| Server | Express | HTTP routing, middleware |
| DB | better-sqlite3 | Sync SQLite driver (nhanh hơn `sqlite3`) |
| Auth | bcrypt | Hash mật khẩu (không có session) |
| Test | Jest + fast-check | Unit test + property-based test |
| Language | TypeScript (cả FE & BE) | Type safety |

## 1.6. File quan trọng nhất cần nhớ

Chỉ cần nhớ 5 file chính:

**Backend:**
- `backend/index.ts` — Entry point, mount routes, auto-seed nếu DB trống
- `backend/database.ts` — Schema SQL, khởi tạo SQLite
- `backend/types/index.ts` — Tất cả enum, interface, DTO

**Frontend:**
- `frontend/src/App.tsx` — Routes + theme Ant Design
- `frontend/src/services/api.ts` — Tất cả API endpoint (dễ tìm URL)

---

## Tóm tắt phần 1

- App full-stack: React (FE) + Express (BE) + SQLite (DB)
- Dev: 2 port (5173 + 3000). Production: 1 port (Express serve cả API + static)
- Flow: Page component → api.ts → Express route → Controller → DB
- Muốn tìm API: xem `frontend/src/services/api.ts` hoặc `backend/routes/`

**Phần tiếp theo (2):** Cấu trúc thư mục chi tiết — biết file nằm ở đâu.
