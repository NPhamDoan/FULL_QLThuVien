# BÁO CÁO PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG QUẢN LÝ THƯ VIỆN

Hệ thống Quản lý Thư viện (Library Management System) là phần mềm (PM) hỗ trợ thủ thư và quản trị viên trong việc quản lý sách, mượn/trả sách, tra cứu, thống kê và quản lý tài khoản. Hệ thống thay thế quy trình thủ công bằng cơ sở dữ liệu tập trung.

## Bảng thuật ngữ

| Ký hiệu | Ý nghĩa |
|----------|---------|
| PM | Phần mềm Quản lý Thư viện |
| He_Thong | Hệ thống quản lý thư viện |
| Thu_Thu | Thủ thư - nhân viên thư viện |
| Quan_Tri | Quản trị viên - người quản lý hệ thống |
| Doc_Gia | Độc giả - người sử dụng dịch vụ |
| Sach | Đối tượng sách (mã, tiêu đề, tác giả, counters bản sao) |
| Phieu_Muon | Bản ghi mượn sách (mã phiếu, ngày mượn, hạn trả, tiền phạt) |
| Tai_Khoan | Tài khoản đăng nhập hệ thống |
| So_Muon_Tra | Sổ ghi chép mượn trả sách (thủ công) |
| The_Doc_Gia | Thẻ độc giả vật lý |

**4 Use Case chính:** UC01: Mượn sách | UC02: Trả sách | UC03: Gia hạn mượn sách | UC04: Quản lý tài khoản

---

# PHẦN 1: MÔ TẢ MÔI TRƯỜNG VẬN HÀNH

## 1a) Mô hình vận hành cũ (Thủ công)

**UC01 - Mượn sách:** Độc giả đưa thẻ cho thủ thư. Thủ thư kiểm tra thẻ bằng mắt, tra sổ danh mục sách, ghi thông tin vào sổ mượn trả (mã độc giả, mã sách, ngày mượn, hạn trả 14 ngày), đóng dấu phiếu mượn giấy và giao sách.

**UC02 - Trả sách:** Thủ thư đối chiếu phiếu mượn với sổ, kiểm tra hạn trả, tính tiền phạt thủ công (số ngày quá hạn × đơn giá), ghi ngày trả vào sổ, thu tiền phạt.

**UC03 - Gia hạn:** Thủ thư tra sổ tìm bản ghi, gạch hạn trả cũ và ghi hạn trả mới (+7 ngày).

**UC04 - Quản lý tài khoản:** Không có trong mô hình cũ (chỉ 1 người quản lý).

### Lược đồ cộng tác - Mô hình cũ

```plantuml
@startuml
left to right direction
actor Doc_Gia as DG
actor Thu_Thu as TT
rectangle The_Doc_Gia as TDG
rectangle Danh_Muc_Sach as DM
rectangle So_Muon_Tra as SMT
rectangle Phieu_Muon_Giay as PMG

DG --> TT : 1: Yêu cầu mượn/trả/gia hạn
TT --> TDG : 2: Kiểm tra thẻ bằng mắt
TT --> DM : 3: Tra cứu sách thủ công
TT --> SMT : 4: Ghi chép / Tra cứu
TT --> PMG : 5: Đóng dấu / Cập nhật
TT --> DG : 6: Giao sách / Thu phạt
@enduml
```

**Ưu điểm:** Không cần công nghệ, dễ triển khai, không phụ thuộc điện/mạng

**Khuyết điểm:** Tốn 5-10 phút/giao dịch, dễ sai sót, khó thống kê, không phát hiện được quá hạn

---

## 1b) Mô hình vận hành mới có PM

**Actors:** Thu_Thu, Quan_Tri, Doc_Gia, PM (He_Thong)
**Use Case hỗ trợ:** Đăng nhập, Xác nhận giao dịch, Phân quyền

### UC01: Mượn sách (Có PM)

1. Độc giả đưa thẻ + sách cho thủ thư
2. Thủ thư tìm kiếm độc giả trên PM (theo mã, tên, email hoặc SĐT - hỗ trợ không dấu)
3. PM hiển thị danh sách kết quả, thủ thư chọn độc giả
4. PM kiểm tra hợp lệ (tồn tại + thẻ chưa hết hạn)
5. Thủ thư tìm kiếm sách (theo mã, tiêu đề hoặc tác giả - hỗ trợ không dấu)
6. PM hiển thị sách kèm số khả dụng, thủ thư chọn sách có soKhaDung > 0
7. Thủ thư xác nhận → PM tạo Phieu_Muon (hanTra = ngayMuon + 14 ngày)
8. PM kiểm tra soKhaDung > 0 trong transaction, INSERT PhieuMuon (không UPDATE Sach)

```plantuml
@startuml
actor "Doc_Gia" as DG
actor "Thu_Thu" as TT
participant "PM" as PM

DG -> TT : Đưa thẻ độc giả + sách
TT -> PM : Tìm kiếm độc giả (mã/tên/email/SĐT)
PM --> TT : Hiển thị danh sách kết quả
TT -> PM : Chọn độc giả

alt Không hợp lệ
    PM --> TT : Hiển thị lỗi
    TT --> DG : Từ chối
else Hợp lệ
    PM --> TT : Thông tin độc giả ✓
    TT -> PM : Tìm kiếm sách (mã/tiêu đề/tác giả)
    PM --> TT : Danh sách sách + số khả dụng
    TT -> PM : Chọn sách (soKhaDung > 0)
    alt Hết bản khả dụng
        PM --> TT : Lỗi "Hết bản khả dụng"
    else Còn bản
        PM --> TT : Thông tin sách ✓
        TT -> PM : Xác nhận mượn
        PM -> PM : Transaction:\n- Check soKhaDung > 0\n- INSERT PhieuMuon\n- (không update Sach)
        PM --> TT : Phiếu mượn (mã, ngày mượn, hạn trả)
        TT --> DG : Giao sách
    end
end
@enduml
```

```plantuml
@startuml
start
:Tìm kiếm độc giả;
:Chọn độc giả;
if (Hợp lệ?) then (Có)
  :Tìm kiếm sách;
  :Chọn sách;
  if (soKhaDung > 0?) then (Có)
    :Transaction: Check soKhaDung > 0;
    :INSERT PhieuMuon (hanTra +14 ngày);
    :Hiển thị phiếu;
  else (Không)
    :Lỗi "Hết bản khả dụng";
  endif
else (Không)
  :Lỗi;
endif
stop
@enduml
```

### UC02: Trả sách (Có PM)

1. Độc giả mang sách đến trả
2. Thủ thư tìm phiếu mượn (theo tên độc giả, tên sách, hoặc mã phiếu - dropdown chọn loại tìm)
3. PM hiển thị danh sách phiếu đang mượn kèm phạt ước tính
4. Thủ thư chọn phiếu → PM hiển thị chi tiết + tiền phạt tự động
5. Thủ thư xác nhận trả (hoặc đánh dấu mất sách + phí đền) → PM cập nhật trangThai = DA_TRA

```plantuml
@startuml
actor "Doc_Gia" as DG
actor "Thu_Thu" as TT
participant "PM" as PM

DG -> TT : Đưa sách cần trả
TT -> PM : Tìm phiếu mượn (dropdown: tên ĐG/tên sách/mã phiếu)
PM --> TT : Danh sách phiếu đang mượn + phạt ước tính
TT -> PM : Chọn phiếu

alt Không tìm thấy
    PM --> TT : Lỗi "Không tìm thấy"
else Tìm thấy
    PM --> TT : Chi tiết phiếu
    PM -> PM : Tính phạt tự động
    note right of PM
      Quá hạn: soNgay × 5000 VNĐ
      Đúng hạn: 0
    end note

    alt Sách bị mất
        TT -> PM : Đánh dấu mất (daMatSach) + nhập phí đền (phiMat)
        PM -> PM : tienPhat = phatTre + phiMat\nsoMat += 1
    else Trả bình thường
        TT -> PM : Xác nhận trả
        PM -> PM : UPDATE PhieuMuon = DA_TRA
    end

    PM --> TT : Kết quả (ngày trả, tiền phạt)
    TT --> DG : Thu phạt (nếu có)
end
@enduml
```

```plantuml
@startuml
[*] --> DANG_MUON : Tạo phiếu mượn\n(check soKhaDung > 0)

DANG_MUON --> DA_TRA : Trả bình thường\n(tính phạt quá hạn)
DANG_MUON --> DA_TRA : Trả + đánh dấu mất\n(soMat += 1, charge phiMat)
DANG_MUON --> DANG_MUON : Gia hạn\n(hanTra += 7 ngày)

state DANG_MUON {
  state "Trong hạn" as InTime
  state "Quá hạn" as Overdue
  InTime --> Overdue : hanTra < today
}

DA_TRA --> [*]

note right of DANG_MUON
  soKhaDung của Sach tự giảm
  (derived từ COUNT PhieuMuon DANG_MUON)
end note

note right of DA_TRA
  soKhaDung tự tăng lại
  (trừ khi đánh dấu mất → soMat += 1)
end note
@enduml
```

### UC03: Gia hạn (Có PM)

1. Thủ thư tìm phiếu mượn (dropdown chọn loại tìm + từ khóa)
2. PM hiển thị danh sách phiếu đang mượn
3. Thủ thư chọn phiếu → PM kiểm tra hợp lệ (trangThai = DANG_MUON)
4. Thủ thư yêu cầu gia hạn → PM cập nhật hanTra += 7 ngày

```plantuml
@startuml
actor "Thu_Thu" as TT
participant "PM" as PM

TT -> PM : Tìm phiếu mượn (dropdown: tên ĐG/tên sách/mã phiếu)
PM --> TT : Danh sách phiếu đang mượn
TT -> PM : Chọn phiếu

alt Không tồn tại
    PM --> TT : Lỗi "Không tìm thấy"
else Đã trả
    PM --> TT : Lỗi "Đã hoàn tất"
else Hợp lệ (DANG_MUON)
    PM --> TT : Thông tin phiếu
    TT -> PM : Yêu cầu gia hạn
    PM -> PM : hanTra += 7 ngày
    PM --> TT : Phiếu đã gia hạn (hạn trả mới)
end
@enduml
```

### UC04: Quản lý tài khoản (Có PM - Chỉ Quản trị viên)

1. Quản trị viên đăng nhập → PM kiểm tra vaiTro = QUAN_TRI_VIEN
2. Quản trị viên truy cập trang Tài khoản → PM hiển thị danh sách tài khoản
3. Quản trị viên có thể: Tạo mới, Khóa/Mở khóa, Đổi mật khẩu, Xóa tài khoản

```plantuml
@startuml
actor "Quan_Tri" as QT
participant "PM" as PM

QT -> PM : Truy cập /accounts
PM -> PM : Kiểm tra Authorization header

alt Không phải admin
    PM --> QT : 403 Forbidden
else Là admin
    PM --> QT : Danh sách tài khoản
    alt Tạo mới
        QT -> PM : Tạo (tenDangNhap, matKhau, vaiTro)
        PM -> PM : Hash mật khẩu + Tạo mã TK
        PM --> QT : Tài khoản mới
    else Khóa/Mở khóa
        QT -> PM : Cập nhật trạng thái
        PM --> QT : Thành công
    else Đổi mật khẩu
        QT -> PM : Đặt mật khẩu mới
        PM -> PM : Hash mật khẩu mới
        PM --> QT : Thành công
    else Xóa
        QT -> PM : Xóa tài khoản
        PM --> QT : Thành công
    end
end
@enduml
```

**Ưu điểm PM:** Xử lý 3-5 giây, tự động validate, tính phạt chính xác, tìm kiếm không dấu, báo cáo tức thì, phân quyền rõ ràng

**Khuyết điểm PM:** Cần đầu tư ban đầu, phụ thuộc điện/máy tính, cần bảo trì

| Tiêu chí | Thủ công | Có PM |
|----------|---------|-------|
| Thời gian giao dịch | 5-10 phút | 3-5 giây |
| Tra cứu | 5-15 phút | < 2 giây |
| Tính phạt | Thủ công, dễ sai | Tự động |
| Phát hiện quá hạn | Rất khó | Tự động |
| Phân quyền | Không có | Admin/Thủ thư |

---

# PHẦN 2: PHÂN TÍCH YÊU CẦU

## 2a) Phân tích đối tượng thành phần (CRC)

**UC01:** Doc_Gia (kiểm tra hợp lệ), Sach (kiểm tra soKhaDung), Phieu_Muon (tạo bản ghi)
**UC02:** Phieu_Muon (tìm, cập nhật, tính phạt), Sach (tăng soMat nếu mất)
**UC03:** Phieu_Muon (tìm, kiểm tra điều kiện, cập nhật hạn trả)
**UC04:** Tai_Khoan (CRUD, phân quyền, hash mật khẩu)

| Lớp | Trách nhiệm | Cộng tác |
|-----|------------|---------|
| Sach | Lưu trữ thông tin sách, CRUD, tìm kiếm (không dấu), quản lý counters, tính soKhaDung | Phieu_Muon |
| Doc_Gia | Lưu trữ thông tin độc giả, CRUD, tìm kiếm (không dấu), kiểm tra hạn thẻ | Phieu_Muon |
| Phieu_Muon | Ghi nhận mượn sách, tính phạt, gia hạn, tìm kiếm | Sach, Doc_Gia |
| Tai_Khoan | Xác thực đăng nhập, phân quyền, CRUD tài khoản, hash mật khẩu | Thu_Thu, Quan_Tri |

## 2b) Tương tác chi tiết trên đối tượng

### UC01 - Mượn sách

```plantuml
@startuml
actor "Thu_Thu" as TT
participant "Doc_Gia" as DG
participant "Sach" as S
participant "Phieu_Muon" as PM

TT -> DG : timKiem(tuKhoa: String): DocGia[]
DG --> TT : Danh sách kết quả
TT -> DG : kiemTraHopLe(maDocGia): Boolean
DG --> TT : isValid
TT -> S : searchBooks(tuKhoa: String): SachWithAvailability[]
S --> TT : Danh sách kết quả + soKhaDung
TT -> S : getAvailableCount(maSach): Integer
S --> TT : soKhaDung
TT -> PM : tao(maDocGia, maSach): PhieuMuon [Transaction]
note right of PM : Check soKhaDung > 0\nINSERT PhieuMuon\n(không UPDATE Sach)
PM --> TT : Phieu_Muon
@enduml
```

### UC02 - Trả sách

```plantuml
@startuml
actor "Thu_Thu" as TT
participant "Phieu_Muon" as PM
participant "Sach" as S

TT -> PM : timKiem(tuKhoa, loaiTim): PhieuMuon[]
PM --> TT : Danh sách phiếu đang mượn
TT -> PM : traSach(maPhieu, {daMatSach?, phiMat?})
PM -> PM : tinhPhat(hanTra, ngayTraThucTe)
note right of PM : phatTre = max(0, ngayTra - hanTra) × 5000

alt daMatSach = true
    PM -> S : incrementLost(maSach)
    note right of S : soMat += 1
    PM -> PM : tienPhat = phatTre + phiMat
else Trả bình thường
    PM -> PM : tienPhat = phatTre
end

PM -> PM : UPDATE PhieuMuon (DA_TRA, tienPhat)
PM --> TT : {tienPhat, ngayTraThucTe}
@enduml
```

### UC03 - Gia hạn

```plantuml
@startuml
actor "Thu_Thu" as TT
participant "Phieu_Muon" as PM

TT -> PM : timKiem(tuKhoa, loaiTim): PhieuMuon[]
PM --> TT : Danh sách phiếu đang mượn
TT -> PM : giaHan(maPhieu)
PM -> PM : kiemTraChoPhepGiaHan(): Boolean

alt Được phép (DANG_MUON)
    PM -> PM : capNhatHanTra(hanTra + 7 ngày)
    PM --> TT : {hanTraMoi}
else Không được phép
    PM --> TT : Lỗi
end
@enduml
```

### UC04 - Quản lý tài khoản

```plantuml
@startuml
actor "Quan_Tri" as QT
participant "Tai_Khoan" as TK

QT -> TK : checkRole(maTaiKhoan, QUAN_TRI_VIEN): Boolean
TK --> QT : isAdmin

alt Không phải admin
    TK --> QT : 403 Forbidden
else Là admin
    QT -> TK : listAccounts(): TaiKhoan[]
    TK --> QT : Danh sách
    QT -> TK : createAccount(tenDN, matKhau, vaiTro)
    TK -> TK : bcrypt.hash(matKhau)
    TK --> QT : {maTaiKhoan}
end
@enduml
```

## 2c) Lược đồ lớp tổng quát lp-1

```plantuml
@startuml
class Phieu_Muon
class Sach
class Doc_Gia
class Tai_Khoan

Phieu_Muon --> Sach : tham chiếu maSach
Phieu_Muon --> Doc_Gia : tham chiếu maDocGia
Tai_Khoan --> Tai_Khoan : quản lý (admin)
@enduml
```

## 2d) Định nghĩa chi tiết các lớp

```plantuml
@startuml
class Sach {
    - maSach: String
    - tieuDe: String
    - tacGia: String
    - soBanSao: Integer
    - soMat: Integer
    - soBaoTri: Integer
    - createdAt: DateTime
    - updatedAt: DateTime
    ..derived (runtime)..
    soDangMuon = COUNT(PhieuMuon DANG_MUON)
    soKhaDung = soBanSao - soMat - soBaoTri - soDangMuon
    --
    + listBooks(): SachWithAvailability[]
    + searchBooks(tuKhoa, onlyAvailable?): SachWithAvailability[]
    + createBook(tieuDe, tacGia, soBanSao?): Sach
    + updateBook(maSach, data): Sach
    + deleteBook(maSach): DeleteResult
    + getAvailableCount(maSach): Integer
    + getActiveLoanCount(maSach): Integer
    + incrementLost(maSach): void
    + withAvailability(sach): SachWithAvailability
}

class Doc_Gia {
    - maDocGia: String
    - hoTen: String
    - email: String
    - soDienThoai: String
    - ngayHetHan: Date
    - createdAt: DateTime
    - updatedAt: DateTime
    + danhSach(): DocGia[]
    + timKiem(tuKhoa): DocGia[]
    + tao(hoTen, email, sdt, ngayHetHan): DocGia
    + capNhat(maDocGia, data): void
    + xoa(maDocGia): DeleteResult
    + kiemTraHopLe(): Boolean
}

class Phieu_Muon {
    - maPhieu: String
    - maDocGia: String
    - maSach: String
    - ngayMuon: Date
    - hanTra: Date
    - ngayTraThucTe: Date
    - trangThai: TrangThaiPhieu
    - tienPhat: Number
    - createdAt: DateTime
    - updatedAt: DateTime
    + danhSach(search, searchType): PhieuMuon[]
    + tao(maDocGia, maSach): PhieuMuon [Transaction]
    + traSach(maPhieu, {daMatSach?, phiMat?}): ReturnResult
    + giaHan(maPhieu): PhieuMuon
    + tinhPhat(hanTra, ngayTra): Number
}

class Tai_Khoan {
    - maTaiKhoan: String
    - tenDangNhap: String
    - matKhau: String {bcrypt hash}
    - vaiTro: VaiTro
    - trangThai: TrangThaiTaiKhoan
    - createdAt: DateTime
    - updatedAt: DateTime
    + login(tenDN, matKhau): LoginResult
    + logout(maTaiKhoan): void
    + checkRole(maTaiKhoan, quyen): Boolean
    + listAccounts(): TaiKhoan[]
    + createAccount(tenDN, matKhau, vaiTro): TaiKhoan
    + updateStatus(maTK, trangThai): void
    + resetPassword(maTK, matKhauMoi): void
    + deleteAccount(maTK): void
}

Phieu_Muon --> Sach : tham chiếu
Phieu_Muon --> Doc_Gia : tham chiếu
@enduml
```

```plantuml
@startuml
enum TrangThaiPhieu {
    DANG_MUON
    DA_TRA
}

enum VaiTro {
    THU_THU
    QUAN_TRI_VIEN
}

enum TrangThaiTaiKhoan {
    HOAT_DONG
    BI_KHOA
}
@enduml
```

**Quy tắc nghiệp vụ:**
1. Tiền phạt trễ = soNgayQuaHan × 5000 VNĐ/ngày
2. Thời hạn mượn: 14 ngày
3. Gia hạn: +7 ngày vào hạn trả hiện tại
4. Mượn sách: soKhaDung > 0 (kiểm tra trong transaction)
5. Gia hạn: trangThai phải = DANG_MUON
6. Xóa độc giả: không có phiếu DANG_MUON
7. Xóa sách: soDangMuon = 0
8. Quản lý tài khoản: chỉ vaiTro = QUAN_TRI_VIEN mới được phép
9. Mật khẩu: hash bằng bcrypt (10 rounds)
10. Tạo phiếu mượn: sử dụng database transaction (atomic)
11. Trả sách có thể đánh dấu mất: tienPhat = phatTre + phiMat, soMat += 1

---

# PHẦN 3: THIẾT KẾ HỆ THỐNG

## 3a) Mô đun thiết kế

Kiến trúc phân lớp:

```
  Frontend (React SPA)  →  Axios (/api proxy dev)  →  Express API (port 3000)  →  SQLite
```

**Segmentation:**

| Mô đun | Đối tượng nghiệp vụ | API Routes |
|--------|---------------------|------------|
| mod-auth | Tai_Khoan (đăng nhập, phân quyền, CRUD tài khoản) | /auth/* |
| mod-borrow | Phieu_Muon (mượn, trả, gia hạn, tính phạt) | /loans/* |
| mod-reader | Doc_Gia (CRUD, tìm kiếm không dấu) | /readers/* |
| mod-book | Sach (CRUD, tìm kiếm không dấu, quản lý counters) | /books/* |
| mod-report | Báo cáo (quá hạn, tình trạng kho) | /reports/* |

**Factoring:**

```plantuml
@startuml
package "mod-auth" {
    [Tai_Khoan]
}
package "mod-borrow" {
    [Phieu_Muon]
}
package "mod-reader" {
    [Doc_Gia]
}
package "mod-book" {
    [Sach]
}
package "mod-report" {
    [Bao_Cao]
}

[Tai_Khoan] --> [Tai_Khoan] : Phân quyền
[Phieu_Muon] --> [Doc_Gia] : Kiểm tra hợp lệ
[Phieu_Muon] --> [Sach] : Check soKhaDung / incrementLost
[Bao_Cao] --> [Phieu_Muon] : Truy vấn
[Bao_Cao] --> [Sach] : Truy vấn
@enduml
```

## 3b) Liên kết Giao diện - Xử lý - Database

```plantuml
@startuml
package "Giao diện (React SPA)" {
    [Đăng nhập] as Login
    [Tổng quan & Báo cáo] as Dashboard
    [Mượn sách] as Borrow
    [Trả sách] as Return
    [Gia hạn] as Extend
    [Quản lý sách] as Books
    [Quản lý độc giả] as Readers
    [Quản lý tài khoản] as Accounts
}

package "Xử lý (Express Controllers)" {
    [TaiKhoanController] as XLAuth
    [PhieuMuonController] as XLMuon
    [SachController] as XLSach
    [DocGiaController] as XLDG
    [TraCuuHeThongController] as XLTraCuu
    [BaoCaoController] as XLBC
}

database "CSDL (SQLite)" {
    [Doc_Gia] as TBDocGia
    [Sach] as TBSach
    [Phieu_Muon] as TBPhieuMuon
    [Tai_Khoan] as TBTaiKhoan
}

Login --> XLAuth
Accounts --> XLAuth
XLAuth --> TBTaiKhoan

Borrow --> XLMuon
Return --> XLMuon
Extend --> XLMuon
XLMuon --> TBPhieuMuon
XLMuon --> TBSach

Books --> XLSach
Books --> XLTraCuu
XLSach --> TBSach
XLTraCuu --> TBSach

Readers --> XLDG
XLDG --> TBDocGia

Dashboard --> XLBC
XLBC --> TBPhieuMuon
XLBC --> TBSach
@enduml
```

**Lược đồ quan hệ dữ liệu:**

```plantuml
@startuml
entity "DOC_GIA" as DG {
    * maDocGia : String <<PK>>
    --
    * hoTen : String
    * email : String <<UK>>
    * soDienThoai : String
    * ngayHetHan : Date
    createdAt : DateTime
    updatedAt : DateTime
}

entity "SACH" as S {
    * maSach : String <<PK>>
    --
    * tieuDe : String
    * tacGia : String
    * soBanSao : Integer (default 1)
    * soMat : Integer (default 0)
    * soBaoTri : Integer (default 0)
    createdAt : DateTime
    updatedAt : DateTime
    ..derived (runtime)..
    soDangMuon : COUNT(PhieuMuon DANG_MUON)
    soKhaDung : soBanSao - soMat - soBaoTri - soDangMuon
}

entity "PHIEU_MUON" as PM {
    * maPhieu : String <<PK>>
    --
    * maDocGia : String <<FK>>
    * maSach : String <<FK>>
    * ngayMuon : Date
    * hanTra : Date
    ngayTraThucTe : Date
    * trangThai : Enum {DANG_MUON|DA_TRA}
    * tienPhat : Number
    createdAt : DateTime
    updatedAt : DateTime
}

entity "TAI_KHOAN" as TK {
    * maTaiKhoan : String <<PK>>
    --
    * tenDangNhap : String <<UK>>
    * matKhau : String {bcrypt hash}
    * vaiTro : Enum {THU_THU|QUAN_TRI_VIEN}
    * trangThai : Enum {HOAT_DONG|BI_KHOA}
    createdAt : DateTime
    updatedAt : DateTime
}

DG ||--o{ PM : "có nhiều"
S ||--o{ PM : "được mượn trong"
@enduml
```

## 3c) Quy trình vận hành trên giao diện

**Layout:** Sidebar trái (3 nhóm: Menu chính, Quản lý, Báo cáo) + Header (tiêu đề trang) + Vùng nội dung

**Sidebar Menu:**
- MENU CHÍNH: Mượn sách, Trả sách, Gia hạn
- QUẢN LÝ: Sách, Độc giả, Tài khoản (Admin), Sao lưu (Admin)
- BÁO CÁO & THỐNG KÊ: Tổng quan

**Mượn sách** — Wizard 3 bước:
- Bước 1: Tìm độc giả (đa trường, không dấu) → bảng kết quả → Chọn
- Bước 2: Tìm sách (đa trường, không dấu) → bảng kết quả → Chọn (chỉ soKhaDung > 0)
- Bước 3: Xác nhận → Phiếu mượn

**Trả sách** — 2 bước:
- Bước 1: Tìm phiếu (dropdown loại tìm + từ khóa) → bảng phiếu + phạt ước tính → Chọn
- Bước 2: Xác nhận trả (hoặc đánh dấu mất + phí đền) → Kết quả (ngày trả, tiền phạt)

**Gia hạn** — 2 bước:
- Bước 1: Tìm phiếu (dropdown loại tìm + từ khóa) → bảng phiếu → Chọn
- Bước 2: Gia hạn +7 ngày → Hạn trả mới

**Quản lý sách:** Tìm kiếm + bảng CRUD + modal edit (soBanSao/soMat/soBaoTri number inputs) + không xóa được sách đang mượn (soDangMuon > 0)
**Quản lý độc giả:** Tìm kiếm (không dấu) + bảng CRUD + modal + DatePicker ngayHetHan + không xóa được độc giả đang mượn
**Quản lý tài khoản (Admin):** Bảng danh sách + Tạo mới (modal) + Khóa/Mở khóa + Đổi mật khẩu (modal) + Xóa
**Sao lưu dữ liệu (Admin):** Bảng danh sách file backup + Tạo backup ngay + Download file (auto-backup mỗi 24h trên production, giữ 7 bản gần nhất)
**Đăng nhập:** Form tên đăng nhập + mật khẩu, phân quyền Thủ thư / Quản trị viên
**Tổng quan:** Cards thống kê + Tabs (phiếu mượn gần đây, quá hạn, tình trạng kho)

## 3d) API Endpoints

| Method | Path | Mô tả | Phân quyền |
|--------|------|-------|-----------|
| POST | /auth/login | Đăng nhập | Public |
| POST | /auth/logout | Đăng xuất | Public |
| GET | /auth/accounts | Danh sách tài khoản | Admin |
| POST | /auth/accounts | Tạo tài khoản | Admin |
| PUT | /auth/accounts/:id/status | Khóa/Mở khóa | Admin |
| PUT | /auth/accounts/:id/password | Đổi mật khẩu | Admin |
| DELETE | /auth/accounts/:id | Xóa tài khoản | Admin |
| GET | /readers | Danh sách độc giả | All |
| GET | /readers/search | Tìm kiếm độc giả (không dấu) | All |
| POST | /readers | Tạo độc giả | All |
| PUT | /readers/:id | Cập nhật độc giả | All |
| DELETE | /readers/:id | Xóa độc giả | All |
| GET | /books | Danh sách sách (with computed soKhaDung, soDangMuon) | All |
| GET | /books/search | Tìm kiếm sách (không dấu) | All |
| POST | /books | Tạo sách | All |
| PUT | /books/:id | Cập nhật sách | All |
| DELETE | /books/:id | Xóa sách | All |
| GET | /loans | Danh sách phiếu mượn | All |
| POST | /loans | Tạo phiếu mượn | All |
| POST | /loans/:id/return | Trả sách (optional: {daMatSach, phiMat}) | All |
| POST | /loans/:id/extend | Gia hạn | All |
| GET | /reports/overdue | Báo cáo quá hạn | All |
| GET | /reports/inventory | Thống kê tình trạng kho | All |
| GET | /backups | Danh sách file sao lưu | Admin |
| POST | /backups/create | Tạo sao lưu ngay | Admin |
| GET | /backups/download/:name | Tải xuống file sao lưu | Admin |

## 3e) Xác thực và Phân quyền

```plantuml
@startuml
actor Client
participant Server
database DB

Client -> Server : POST /auth/login (tenDN, matKhau)
Server -> DB : SELECT * FROM TaiKhoan WHERE tenDangNhap = ?
DB --> Server : TaiKhoan row
Server -> Server : bcrypt.compare(matKhau, hash)

alt Hợp lệ
    Server --> Client : 200 {success, taiKhoan}
    Client -> Client : localStorage.setItem('lms_user', userInfo)
    note right of Client : Axios interceptor gắn\nAuthorization: Bearer {maTaiKhoan}
    Client -> Server : GET /auth/accounts\n[Authorization: Bearer TK002]
    Server -> DB : SELECT vaiTro FROM TaiKhoan WHERE maTaiKhoan = ?
    DB --> Server : QUAN_TRI_VIEN
    Server --> Client : 200 OK (danh sách)
else Không hợp lệ
    Server --> Client : 401 {error}
end
@enduml
```

- Frontend lưu `{maTaiKhoan, tenDangNhap, vaiTro}` trong localStorage
- Axios interceptor tự gắn `Authorization: Bearer {maTaiKhoan}` vào mọi request
- Backend check quyền admin trực tiếp trong route handler (không middleware riêng)
