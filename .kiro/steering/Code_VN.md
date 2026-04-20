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

