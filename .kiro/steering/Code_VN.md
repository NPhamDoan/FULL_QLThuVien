---
inclusion: always
---

# Quy tắc Viết Code

Hướng dẫn hành vi để giảm lỗi phổ biến khi AI viết code. Ưu tiên cẩn thận hơn tốc độ — dùng phán đoán cho việc đơn giản.

## 1. Suy nghĩ Trước khi Code

- Nêu rõ giả định. Nếu không chắc, hỏi.
- Nếu có nhiều cách hiểu, trình bày tất cả — không tự chọn im lặng.
- Nếu có cách đơn giản hơn, nói ra. Phản biện khi cần.
- Nếu có gì không rõ, dừng lại và hỏi.

## 2. Đơn giản Trước

- Không thêm tính năng, abstraction, hay cấu hình ngoài yêu cầu.
- Không xử lý lỗi cho tình huống không thể xảy ra.
- Nếu 200 dòng có thể viết 50 dòng, viết lại.
- Theo pattern có sẵn trong codebase thay vì tạo pattern mới.

## 2b. Không Duplicate

Trước khi thêm function/logic mới, PHẢI check xem đã có chưa:

- Search codebase cho logic tương tự (grep theo keyword: `removeDiacritics`, `filter`, `map`, tên entity).
- Nếu đã có function gần giống → extend/refactor function đó, không viết lại.
- Nếu 2-3 nơi có cùng pattern → extract thành util chung (ví dụ `utils/diacritics.ts`).
- Nếu không chắc logic đã có chưa → hỏi trước khi viết.

**Signals duplicate:**
- Cùng SQL query pattern (`SELECT ... WHERE trangThai = 'DANG_MUON'`) ở nhiều controller
- Cùng filter logic (lowercase + includes + removeDiacritics) ở nhiều chỗ
- Cùng interface/type với tên khác nhau (`Book` và `Sach`, `ReaderInfo` và `DocGiaDTO`)
- Helper component tương tự ở 2+ page (giống `LoanSearchTable` vs duplicate ở Return/Extend)

**Quy tắc 3 lần:**
- Lần 1: viết inline
- Lần 2: copy OK (chưa chắc pattern)
- Lần 3: BẮT BUỘC extract thành function/component/util chung

Khi extract:
- Đặt ở nơi chung nhất có thể (utils/, components/, shared/)
- Không over-generalize — chỉ abstract phần thực sự chung
- Giữ tên mô tả đúng trách nhiệm (`filterByKeyword` tốt hơn `utilFunc1`)

## 3. Thay đổi Chính xác

Khi sửa code có sẵn:
- Không "cải thiện" code, comment, hay format xung quanh.
- Không refactor thứ chưa hỏng.
- Theo style hiện tại, dù bạn muốn làm khác.
- Nếu thấy dead code không liên quan, nhắc — không xóa.

Khi thay đổi của bạn tạo ra orphan:
- Xóa import/biến/hàm mà thay đổi CỦA BẠN làm thừa.
- Không xóa dead code có sẵn trừ khi được yêu cầu.

Mỗi dòng thay đổi phải truy ngược được về yêu cầu của user.

## 4. Thực thi Hướng Mục tiêu

Chuyển task thành mục tiêu kiểm chứng được:
- "Thêm validation" → viết test cho input không hợp lệ, rồi làm pass
- "Sửa bug" → viết test tái hiện bug, rồi làm pass
- "Refactor X" → đảm bảo test pass trước và sau

Với task nhiều bước, nêu kế hoạch ngắn kèm bước kiểm chứng.

## 5. Hoàn thiện Sản phẩm

- Kết quả cuối cùng phải là **app chạy được**, không chỉ business logic + test.
- Khi tạo task list cho project mới, task đầu tiên phải là setup project infrastructure (dependencies, build config, entry points, bundler).
- Không được giả định project đã có sẵn infrastructure. Kiểm tra thực tế trước khi bỏ qua.
- Nếu design/tech doc ghi rõ platform (Electron, web, CLI...), task list phải bao gồm setup cho platform đó.
- Trước khi hoàn thành, tự hỏi: "User có thể chạy app này ngay không?" Nếu không → còn thiếu task.

## 6. Quy ước Dự án

### 6.1. Đặt tên khi mix tiếng Anh + tiếng Việt

Dự án này dùng **tiếng Việt không dấu** cho entity/domain và **tiếng Anh** cho verb/action.

**Quy tắc tách bạch qua camelCase boundary:**

✅ ĐÚNG — verb và noun tách qua camelCase:
- `createBook`, `searchReaders`, `deleteMember`, `listAccounts`
- `CreateSachInput`, `UpdateDocGiaInput`
- `mapRowToSach`, `withAvailability`
- Biến local: `soBanSaoMoi`, `hanTraCu`, `maDocGia`, `tenSach`

❌ SAI — từ Anh-Việt dính vào nhau không qua camelCase:
- `newSoBanSao` (new + So — cùng là modifier)
- `futureHanTra` (future + Han — cùng là tính từ)
- `pastNgayMuon`, `currentTrangThai`
- Suffix tiếng Anh sau noun Việt: `soBanSaoNew`, `hanTraOld`

**Fix bằng cách dùng suffix tiếng Việt:**
- `newSoBanSao` → `soBanSaoMoi`
- `futureHanTra` → `hanTraMoi`
- `pastNgayMuon` → `ngayMuonCu`

**Layer convention (tóm tắt):**

| Layer | Ngôn ngữ | Ví dụ |
|-------|----------|-------|
| DB schema (tables, columns) | Tiếng Việt | `Sach`, `hoTen`, `tinhTrang` |
| Entity interfaces + fields | Tiếng Việt | `interface Sach { tieuDe, tacGia }` |
| Enum values | Tiếng Việt | `TinhTrangSach.SAN_SANG` |
| Controller class names | Tiếng Việt | `SachController`, `PhieuMuonController` |
| Method names (verbs) | Tiếng Anh | `createBook`, `returnBook`, `login` |
| HTTP routes | Tiếng Anh | `/books`, `/loans`, `/auth/login` |
| Local variables | Theo noun gốc | `maSach`, `hanTra`, `soBanSao` |
| Biến modifier (new/old/temp) | Suffix tiếng Việt | `soBanSaoMoi`, `hanTraCu` |
| UI labels | Tiếng Việt có dấu | "Mượn sách", "Hạn trả" |

**Test:** nếu identifier có `<English><Vietnamese>` nối liền, đổi thành `<English>` riêng hoặc `<Vietnamese><Tiếng Việt Modifier>`.
