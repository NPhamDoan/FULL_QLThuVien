# BÁO CÁO PHÂN TÍCH VÀ THIẾT KẾ - 3 USE CASE CHÍNH

Hệ thống Quản lý Thư viện (Library Management System) - Phân tích 3 chức năng nghiệp vụ chính: Mượn sách, Trả sách, Gia hạn.

## Bảng thuật ngữ

| Ký hiệu | Ý nghĩa |
|----------|---------|
| PM | Phần mềm Quản lý Thư viện |
| Thu_Thu | Thủ thư - nhân viên thư viện |
| Doc_Gia | Độc giả - người sử dụng dịch vụ |
| Sach | Đối tượng sách (mã, tiêu đề, tác giả, counters bản sao) |
| Phieu_Muon | Bản ghi mượn sách (mã phiếu, ngày mượn, hạn trả, tiền phạt) |
| So_Muon_Tra | Sổ ghi chép mượn trả sách (thủ công) |
| The_Doc_Gia | Thẻ độc giả vật lý |

**3 Use Case:** UC01: Mượn sách | UC02: Trả sách | UC03: Gia hạn mượn sách

---

# PHẦN 1: MÔ TẢ MÔI TRƯỜNG VẬN HÀNH

## 1a) Mô hình vận hành cũ (Thủ công)

**UC01 - Mượn sách:** Độc giả đưa thẻ cho thủ thư. Thủ thư kiểm tra thẻ bằng mắt, tra sổ danh mục sách, ghi thông tin vào sổ mượn trả (mã độc giả, mã sách, ngày mượn, hạn trả 14 ngày), đóng dấu phiếu mượn giấy và giao sách.

**UC02 - Trả sách:** Thủ thư đối chiếu phiếu mượn với sổ, kiểm tra hạn trả, tính tiền phạt thủ công (số ngày quá hạn × đơn giá), ghi ngày trả vào sổ, thu tiền phạt.

**UC03 - Gia hạn:** Thủ thư tra sổ tìm bản ghi, gạch hạn trả cũ và ghi hạn trả mới (+7 ngày).

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

**Actors:** Thu_Thu, Doc_Gia, PM (Hệ thống)

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

**Ưu điểm PM:** Xử lý 3-5 giây, tự động validate, tính phạt chính xác, tìm kiếm không dấu

**Khuyết điểm PM:** Cần đầu tư ban đầu, phụ thuộc điện/máy tính

| Tiêu chí | Thủ công | Có PM |
|----------|---------|-------|
| Thời gian giao dịch | 5-10 phút | 3-5 giây |
| Tra cứu | 5-15 phút | < 2 giây |
| Tính phạt | Thủ công, dễ sai | Tự động |
| Phát hiện quá hạn | Rất khó | Tự động |

---

# PHẦN 2: PHÂN TÍCH YÊU CẦU

## 2a) Phân tích đối tượng thành phần (CRC)

**UC01:** Doc_Gia (kiểm tra hợp lệ), Sach (kiểm tra soKhaDung), Phieu_Muon (tạo bản ghi)
**UC02:** Phieu_Muon (tìm, cập nhật, tính phạt), Sach (tăng soMat nếu mất)
**UC03:** Phieu_Muon (tìm, kiểm tra điều kiện, cập nhật hạn trả)

| Lớp | Trách nhiệm | Cộng tác |
|-----|------------|---------|
| Sach | Lưu trữ thông tin sách, tìm kiếm (không dấu), quản lý counters (soBanSao/soMat/soBaoTri), tính soKhaDung | Phieu_Muon |
| Doc_Gia | Lưu trữ thông tin độc giả, tìm kiếm (không dấu), kiểm tra hạn thẻ | Phieu_Muon |
| Phieu_Muon | Ghi nhận mượn sách, tính phạt, gia hạn, tìm kiếm | Sach, Doc_Gia |

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
TT -> S : timKiem(tuKhoa: String): SachWithAvailability[]
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

## 2c) Lược đồ lớp tổng quát lp-1

```plantuml
@startuml
class Phieu_Muon
class Sach
class Doc_Gia

Phieu_Muon --> Sach : tham chiếu maSach
Phieu_Muon --> Doc_Gia : tham chiếu maDocGia
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
    + timKiem(tuKhoa): DocGia[]
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
    + tao(maDocGia, maSach): PhieuMuon [Transaction]
    + timKiem(tuKhoa, loaiTim): PhieuMuon[]
    + traSach(maPhieu, {daMatSach?, phiMat?}): ReturnResult
    + giaHan(maPhieu): PhieuMuon
    + tinhPhat(hanTra, ngayTra): Number
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
@enduml
```

**Quy tắc nghiệp vụ:**
1. Tiền phạt trễ = soNgayQuaHan × 5000 VNĐ/ngày
2. Thời hạn mượn: 14 ngày
3. Gia hạn: +7 ngày vào hạn trả hiện tại
4. Mượn sách: soKhaDung > 0 (kiểm tra trong transaction)
5. Gia hạn: trangThai phải = DANG_MUON
6. Tạo phiếu mượn: sử dụng database transaction (atomic)
7. Trả sách có thể đánh dấu mất: tienPhat = phatTre + phiMat, soMat += 1

---

# PHẦN 3: THIẾT KẾ HỆ THỐNG

## 3a) Mô đun thiết kế

Kiến trúc phân lớp:

```
  Giao diện (Web SPA)  →  Xử lý nghiệp vụ  →  CSDL (SQLite)
```

**Segmentation:**

| Mô đun | Đối tượng nghiệp vụ |
|--------|---------------------|
| mod-borrow | Phieu_Muon (mượn, trả, gia hạn, tính phạt) |
| mod-reader | Doc_Gia (tìm kiếm, kiểm tra hợp lệ) |
| mod-book | Sach (tìm kiếm, quản lý counters, tính soKhaDung) |

**Factoring:**

```plantuml
@startuml
package "mod-borrow" {
    [Phieu_Muon]
}
package "mod-reader" {
    [Doc_Gia]
}
package "mod-book" {
    [Sach]
}

[Phieu_Muon] --> [Doc_Gia] : Kiểm tra hợp lệ
[Phieu_Muon] --> [Sach] : Check soKhaDung / incrementLost
@enduml
```

## 3b) Liên kết Giao diện - Xử lý - Database

```plantuml
@startuml
package "Giao diện" {
    [Mượn sách] as Borrow
    [Trả sách] as Return
    [Gia hạn] as Extend
}

package "Xử lý" {
    [Xử lý Mượn/Trả/Gia hạn] as XLMuon
    [Xử lý Sách] as XLSach
    [Xử lý Độc giả] as XLDG
}

database "CSDL" {
    [Doc_Gia] as TBDocGia
    [Sach] as TBSach
    [Phieu_Muon] as TBPhieuMuon
}

Borrow --> XLMuon
Borrow --> XLDG
Borrow --> XLSach
Return --> XLMuon
Extend --> XLMuon
XLMuon --> TBPhieuMuon
XLMuon --> TBSach
XLSach --> TBSach
XLDG --> TBDocGia
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
}

entity "SACH" as S {
    * maSach : String <<PK>>
    --
    * tieuDe : String
    * tacGia : String
    * soBanSao : Integer (default 1)
    * soMat : Integer (default 0)
    * soBaoTri : Integer (default 0)
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
}

DG ||--o{ PM : "có nhiều"
S ||--o{ PM : "được mượn trong"
@enduml
```

## 3c) Quy trình vận hành trên giao diện

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
