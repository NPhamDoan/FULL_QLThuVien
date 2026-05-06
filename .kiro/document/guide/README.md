# Hướng dẫn đọc source code QLThuVien

Bộ tài liệu chia 6 phần từ cơ bản → nâng cao. Đọc theo thứ tự nếu mới tiếp cận, hoặc tra cứu phần cụ thể khi cần.

## Lộ trình đọc

### 🟢 Level 1 — Cơ bản (đọc trước tiên)

**[01. Tổng quan hệ thống](./01-Tong-Quan.md)** — 10 phút
- App làm gì
- Kiến trúc 3 tầng: React + Express + SQLite
- Dev mode vs Production mode
- Flow request cơ bản
- 5 file quan trọng nhất

**[02. Cấu trúc thư mục](./02-Cau-Truc-Folder.md)** — 10 phút
- Folder backend/frontend có gì
- Phân chia trách nhiệm routes/controllers/database
- Quy ước đặt tên (Vietnamese)
- **Bảng "muốn sửa X vào đâu"** — tra cứu nhanh

### 🟡 Level 2 — Data & Logic

**[03. Database & Data Flow](./03-Database-DataFlow.md)** — 15 phút
- Schema 4 bảng: DocGia, Sach, PhieuMuon, TaiKhoan
- 4 enum chính
- Vòng đời 1 phiếu mượn
- End-to-end flow mượn sách
- ID generation, SQLite đặc thù

### 🔴 Level 3 — Deep dive

**[04. Backend deep-dive](./04-Backend-Deep-Dive.md)** — 15 phút
- Controllers & routes chi tiết
- Authentication flow (không có session)
- Transactions, middleware, logging
- Diacritics search

**[05. Frontend deep-dive](./05-Frontend-Deep-Dive.md)** — 15 phút
- Routing lồng ProtectedRoute + MainLayout
- AuthContext, localStorage
- API client pattern
- Ant Design theme
- Vite proxy

### 🛠️ Level 4 — Thực hành

**[06. Debug & Deploy](./06-Debug-Deploy.md)** — 15 phút
- Workflow debug: phân tầng bug
- Common bugs & cách fix
- Query DB trực tiếp
- Reset DB, build, deploy Render
- Checklist trước commit

---

## Tóm tắt siêu ngắn

**Kiến trúc:**
```
React SPA (5173) → Axios → Express (3000) → SQLite
         (dev proxy /api)              (file .db)
```

**3 use case chính:** Mượn, Trả, Gia hạn — tất cả trong `PhieuMuonController.ts`.

**Tìm bug ở đâu:**
- UI sai → `frontend/src/pages/`
- API sai → `backend/routes/` hoặc `backend/controllers/`
- Data sai → xem `backend/Database/dev.db` bằng DB Browser

**Reset khi rối:** Xóa `backend/Database/dev.db*` → restart → tự seed lại.

---

## Tài liệu tham khảo khác

- `.kiro/document/BaoCao_PhanTich_ThietKe.md` — Báo cáo phân tích thiết kế (Mermaid)
- `.kiro/document/BaoCao_PhanTich_ThietKe_PlantUML.md` — Báo cáo (PlantUML)
- `.kiro/document/BaoCao_3UC_Mermaid.md` — Rút gọn chỉ 3 UC chính
- `.kiro/steering/project-blueprint.md` — Tech stack chi tiết
