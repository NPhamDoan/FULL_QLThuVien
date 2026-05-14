# PlantUML Diagrams

Mở file `.puml` bằng PlantUML plugin (VS Code: "PlantUML" by jebbs) để preview.

## Danh sách diagrams

| # | File | Loại | Mô tả |
|---|------|------|--------|
| 01 | `01-use-case.puml` | Use Case | Tổng quan actors + use cases |
| 02 | `02-sequence-muon-sach.puml` | Sequence | Flow mượn sách (3 bước) |
| 03 | `03-sequence-tra-sach.puml` | Sequence | Flow trả sách (+ đánh dấu mất) |
| 04 | `04-sequence-gia-han.puml` | Sequence | Flow gia hạn +7 ngày |
| 05 | `05-sequence-quan-ly-tai-khoan.puml` | Sequence | CRUD tài khoản (admin) |
| 06 | `06-class-diagram.puml` | Class | 4 entities + methods |
| 07 | `07-enums.puml` | Class | Enum values (TrangThaiPhieu, VaiTro, TrangThaiTaiKhoan) |
| 08 | `08-er-diagram.puml` | ER | Quan hệ DB (DocGia, Sach, PhieuMuon, TaiKhoan) |
| 09 | `09-state-phieu-muon.puml` | State | Vòng đời phiếu mượn |
| 10 | `10-component-architecture.puml` | Component | Frontend → Backend → DB layers |
| 11 | `11-auth-flow.puml` | Sequence | Login + authenticated request + logout |
| 12 | `12-deployment.puml` | Deployment | Dev vs Production (Render) |

## Preview

- **VS Code**: Cài extension "PlantUML" → mở file `.puml` → `Alt+D` để preview
- **Online**: Copy nội dung vào https://www.plantuml.com/plantuml/uml/
- **Export PNG**: Trong VS Code, `Ctrl+Shift+P` → "PlantUML: Export Current Diagram"
