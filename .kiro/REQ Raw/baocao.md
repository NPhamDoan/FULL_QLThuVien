+ Hình thức trình bày trong báo cáo (file .txt UTF8):
a) Theo tài liệu hướng dẫn.
b) Trình bày lược đồ UML bằng text (plantUML/textUML)

+ Nội dung báo cáo (đảm bảo tính nhất quán, và có nguồn gốc)
1) Mô tả môi trường vận hành
	a) Diễn tả mô hình vận hành cũ (làm thủ công) bằng lời cho mỗi usecase được yêu cầu trong bài tập. Vẽ mô hình vận hành cũ bằng lược đồ cộng tác(collaboration)/giao tiếp (communication), và phân tích ưu khuyết điểm của mô hình này.
	b) Diễn tả mô hình vận hành mới có PM tham gia. Với mỗi usecase: thêm các actor và usecase hỗ trợ cho giải pháp, mô tả cho mỗi usecase bằng lược đồ tuần tự ("tt-1") diễn tả kịch bản tương tác với PM, và các lược đồ khác nếu cần (hoạt động, trạng thái).

2) Phân tích yêu cầu:
	a) Phân tích lần lượt từng usecase để xác định các đối tượng thành phần cần thiết trong phần mềm, bằng các kỹ thuật phân tích kịch bản, hoặc CRC.
	b) Cụ thể hóa các tương tác trên PM trong lược đồ "tt-1" thành các tương tác trên từng đối tượng thành phần của PM (mỗi thông điệp có thông số).
	c) Diễn tả quan hệ giữa các đối tượng thành phần của PM và actors bằng lược đồ lớp "lp-1" tổng quát (chưa có các thuộc tính và hành vi).
	d) Xác định các thuộc tính và hành vi (phương thức) cho mỗi lớp đối tượng trong "lp-1" để định nghĩa yêu cầu chi tiết cho mô hình vận hành mới có PM.

3) Thiết kế hệ thống:
	a) Diễn tả các đối tượng thành phần thành các mô đun thiết kế (Layering, segmentation, factoring), và sự phụ thuộc lẫn nhau giữa các môđun.
	b) Liên kết các lớp thiết kế thành hệ thống: Giao diện (trang web) - Xử lý (process/microservices) - Database.
	c) Mô tả mỗi quy trình vận hành và tương tác trên giao diện của PM cho quy trình này

1.Hệ thống quản lý thư viện sách
Use case: Mượn sách, Trả sách, Gia hạn mượn sách.
Vấn đề: Ghi chép mượn/trả sách thủ công dễ sai sót. Việc tìm kiếm sách theo tên, tác giả, hay kiểm tra sách còn hay không rất mất thời gian.
Lợi ích PM: Tự động hóa quá trình mượn/trả sách bằng mã vạch. Cung cấp chức năng tra cứu tức thì về tình trạng sách. Giúp thư viện quản lý tài sản chính xác, hiệu quả.