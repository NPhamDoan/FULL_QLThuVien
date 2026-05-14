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

```mermaid
flowchart LR
    DG[Doc_Gia] -->|1: Yêu cầu mượn/trả/gia hạn| TT[Thu_Thu]
    TT -->|2: Kiểm tra thẻ bằng mắt| TDG[The_Doc_Gia]
    TT -->|3: Tra cứu sách thủ công| DM[Danh_Muc_Sach]
    TT -->|4: Ghi chép / Tra cứu| SMT[So_Muon_Tra]
    TT -->|5: Đóng dấu / Cập nhật| PMG[Phieu_Muon_Giay]
    TT -->|6: Giao sách / Thu phạt| DG
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

```mermaid
sequenceDiagram
    actor DG as Actor: Doc_Gia
    actor TT as Actor: Thu_Thu
    participant PM as PM

    DG->>TT: Đưa thẻ độc giả + sách
    TT->>PM: Tìm kiếm độc giả (mã/tên/email/SĐT)
    PM-->>TT: Hiển thị danh sách kết quả
    TT->>PM: Chọn độc giả
    alt Không hợp lệ
        PM-->>TT: Hiển thị lỗi
        TT-->>DG: Từ chối
    else Hợp lệ
        PM-->>TT: Thông tin độc giả ✓
        TT->>PM: Tìm kiếm sách (mã/tiêu đề/tác giả)
        PM-->>TT: Danh sách sách + số khả dụng
        TT->>PM: Chọn sách (soKhaDung > 0)
        alt Hết bản khả dụng
            PM-->>TT: Lỗi "Hết bản khả dụng"
        else Còn bản
            PM-->>TT: Thông tin sách ✓
            TT->>PM: Xác nhận mượn
            PM->>PM: Transaction: Check soKhaDung > 0, INSERT PhieuMuon
            PM-->>TT: Phiếu mượn (mã, ngày mượn, hạn trả)
            TT-->>DG: Giao sách
        end
    end
```

```mermaid
flowchart TD
    A[Bắt đầu] --> B[Tìm kiếm độc giả]
    B --> C[Chọn độc giả]
    C --> D{Hợp lệ?}
    D -->|Không| E[Lỗi] --> Z[Kết thúc]
    D -->|Có| F[Tìm kiếm sách]
    F --> G[Chọn sách]
    G --> H{soKhaDung > 0?}
    H -->|Không| I[Lỗi: Hết bản khả dụng] --> Z
    H -->|Có| J[Transaction: Check soKhaDung > 0]
    J --> K[INSERT PhieuMuon - hanTra +14 ngày]
    K --> L[Hiển thị phiếu] --> Z
```

### UC02: Trả sách (Có PM)

1. Độc giả mang sách đến trả
2. Thủ thư tìm phiếu mượn (theo tên độc giả, tên sách, hoặc mã phiếu - dropdown chọn loại tìm)
3. PM hiển thị danh sách phiếu đang mượn kèm phạt ước tính
4. Thủ thư chọn phiếu → PM hiển thị chi tiết + tiền phạt tự động
5. Thủ thư xác nhận trả (hoặc đánh dấu mất sách + phí đền) → PM cập nhật trangThai = DA_TRA

```mermaid
sequenceDiagram
    actor DG as Actor: Doc_Gia
    actor TT as Actor: Thu_Thu
    participant PM as PM

    DG->>TT: Đưa sách cần trả
    TT->>PM: Tìm phiếu mượn (dropdown: tên ĐG/tên sách/mã phiếu)
    PM-->>TT: Danh sách phiếu đang mượn + phạt ước tính
    TT->>PM: Chọn phiếu
    alt Không tìm thấy
        PM-->>TT: Lỗi "Không tìm thấy"
    else Tìm thấy
        PM-->>TT: Chi tiết phiếu
        PM->>PM: Tính phạt tự động
        Note right of PM: Quá hạn: soNgay × 5000 VNĐ<br/>Đúng hạn: 0
        alt Sách bị mất
            TT->>PM: Đánh dấu mất (daMatSach) + phí đền (phiMat)
            PM->>PM: tienPhat = phatTre + phiMat, soMat += 1
        else Trả bình thường
            TT->>PM: Xác nhận trả
            PM->>PM: UPDATE PhieuMuon = DA_TRA
        end
        PM-->>TT: Kết quả (ngày trả, tiền phạt)
        TT-->>DG: Thu phạt (nếu có)
    end
```

```mermaid
stateDiagram-v2
    [*] --> DANG_MUON: Tạo phiếu mượn (check soKhaDung > 0)
    DANG_MUON --> DA_TRA: Trả bình thường (tính phạt quá hạn)
    DANG_MUON --> DA_TRA: Trả + đánh dấu mất (soMat += 1, phiMat)
    DANG_MUON --> DANG_MUON: Gia hạn (+7 ngày)
    DA_TRA --> [*]
```

### UC03: Gia hạn (Có PM)

1. Thủ thư tìm phiếu mượn (dropdown chọn loại tìm + từ khóa)
2. PM hiển thị danh sách phiếu đang mượn
3. Thủ thư chọn phiếu → PM kiểm tra hợp lệ (trangThai = DANG_MUON)
4. Thủ thư yêu cầu gia hạn → PM cập nhật hanTra += 7 ngày

```mermaid
sequenceDiagram
    actor TT as Actor: Thu_Thu
    participant PM as PM

    TT->>PM: Tìm phiếu mượn (dropdown: tên ĐG/tên sách/mã phiếu)
    PM-->>TT: Danh sách phiếu đang mượn
    TT->>PM: Chọn phiếu
    alt Không tồn tại
        PM-->>TT: Lỗi "Không tìm thấy"
    else Đã trả
        PM-->>TT: Lỗi "Đã hoàn tất"
    else Hợp lệ (DANG_MUON)
        PM-->>TT: Thông tin phiếu
        TT->>PM: Yêu cầu gia hạn
        PM->>PM: hanTra += 7 ngày
        PM-->>TT: Phiếu đã gia hạn (hạn trả mới)
    end
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

```mermaid
sequenceDiagram
    actor TT as Actor: Thu_Thu
    participant DG as Doc_Gia
    participant S as Sach
    participant PM as Phieu_Muon

    TT->>DG: timKiem(tuKhoa: String): DocGia[]
    DG-->>TT: Danh sách kết quả
    TT->>DG: kiemTraHopLe(maDocGia): Boolean
    DG-->>TT: isValid
    TT->>S: searchBooks(tuKhoa: String): SachWithAvailability[]
    S-->>TT: Danh sách kết quả + soKhaDung
    TT->>S: getAvailableCount(maSach): Integer
    S-->>TT: soKhaDung
    TT->>PM: tao(maDocGia, maSach): PhieuMuon [Transaction]
    Note right of PM: Check soKhaDung > 0<br/>INSERT PhieuMuon<br/>(không UPDATE Sach)
    PM-->>TT: Phieu_Muon
```

### UC02 - Trả sách

```mermaid
sequenceDiagram
    actor TT as Actor: Thu_Thu
    participant PM as Phieu_Muon
    participant S as Sach

    TT->>PM: timKiem(tuKhoa, loaiTim): PhieuMuon[]
    PM-->>TT: Danh sách phiếu đang mượn
    TT->>PM: traSach(maPhieu, {daMatSach?, phiMat?})
    PM->>PM: tinhPhat(hanTra, ngayTraThucTe)
    Note right of PM: phatTre = max(0, ngayTra - hanTra) × 5000
    alt daMatSach = true
        PM->>S: incrementLost(maSach)
        Note right of S: soMat += 1
        PM->>PM: tienPhat = phatTre + phiMat
    else Trả bình thường
        PM->>PM: tienPhat = phatTre
    end
    PM->>PM: UPDATE PhieuMuon (DA_TRA, tienPhat)
    PM-->>TT: {tienPhat, ngayTraThucTe}
```

### UC03 - Gia hạn

```mermaid
sequenceDiagram
    actor TT as Actor: Thu_Thu
    participant PM as Phieu_Muon

    TT->>PM: timKiem(tuKhoa, loaiTim): PhieuMuon[]
    PM-->>TT: Danh sách phiếu đang mượn
    TT->>PM: giaHan(maPhieu)
    PM->>PM: kiemTraChoPhepGiaHan(): Boolean
    alt Được phép (DANG_MUON)
        PM->>PM: capNhatHanTra(hanTra + 7 ngày)
        PM-->>TT: {hanTraMoi}
    else Không được phép
        PM-->>TT: Lỗi
    end
```

## 2c) Lược đồ lớp tổng quát lp-1

```mermaid
classDiagram
    Phieu_Muon --> Sach : tham chiếu maSach
    Phieu_Muon --> Doc_Gia : tham chiếu maDocGia
```

## 2d) Định nghĩa chi tiết các lớp

```mermaid
classDiagram
    class Sach {
        - maSach: String
        - tieuDe: String
        - tacGia: String
        - soBanSao: Integer
        - soMat: Integer
        - soBaoTri: Integer
        - createdAt: DateTime
        - updatedAt: DateTime
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
        + traSach(maPhieu, options?): ReturnResult
        + giaHan(maPhieu): PhieuMuon
        + tinhPhat(hanTra, ngayTra): Number
    }
    Phieu_Muon --> Sach : tham chiếu
    Phieu_Muon --> Doc_Gia : tham chiếu
```

```mermaid
classDiagram
    class TrangThaiPhieu {
        <<enumeration>>
        DANG_MUON
        DA_TRA
    }
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

```mermaid
flowchart TB
    subgraph mod-borrow
        PM[Phieu_Muon]
    end
    subgraph mod-reader
        DG[Doc_Gia]
    end
    subgraph mod-book
        S[Sach]
    end
    PM -->|Kiểm tra hợp lệ| DG
    PM -->|Check soKhaDung / incrementLost| S
```

## 3b) Liên kết Giao diện - Xử lý - Database

```mermaid
flowchart TB
    subgraph "Giao diện"
        Borrow[Mượn sách]
        Return[Trả sách]
        Extend[Gia hạn]
    end
    subgraph "Xử lý"
        XLMuon[Xử lý Mượn/Trả/Gia hạn]
        XLSach[Xử lý Sách]
        XLDG[Xử lý Độc giả]
    end
    subgraph "CSDL"
        TBDocGia[(Doc_Gia)]
        TBSach[(Sach)]
        TBPhieuMuon[(Phieu_Muon)]
    end
    Borrow --> XLMuon
    Borrow --> XLDG
    Borrow --> XLSach
    Return --> XLMuon
    Extend --> XLMuon
    XLMuon --> TBPhieuMuon
    XLMuon --> TBSach
    XLSach --> TBSach
    XLDG --> TBDocGia
```

**Lược đồ quan hệ dữ liệu:**

```mermaid
erDiagram
    DOC_GIA ||--o{ PHIEU_MUON : "có nhiều"
    SACH ||--o{ PHIEU_MUON : "được mượn trong"
    DOC_GIA {
        string maDocGia PK
        string hoTen
        string email UK
        string soDienThoai
        date ngayHetHan
    }
    SACH {
        string maSach PK
        string tieuDe
        string tacGia
        integer soBanSao "default 1"
        integer soMat "default 0"
        integer soBaoTri "default 0"
    }
    PHIEU_MUON {
        string maPhieu PK
        string maDocGia FK
        string maSach FK
        date ngayMuon
        date hanTra
        date ngayTraThucTe
        enum trangThai "DANG_MUON|DA_TRA"
        number tienPhat
    }
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
