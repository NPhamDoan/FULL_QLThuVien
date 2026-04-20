# BÁO CÁO PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG QUẢN LÝ THƯ VIỆN

Hệ thống Quản lý Thư viện (Library Management System) là phần mềm (PM) hỗ trợ thủ thư và độc giả trong việc quản lý sách, mượn/trả sách, tra cứu và thống kê. Hệ thống thay thế quy trình thủ công bằng cơ sở dữ liệu tập trung.

## Bảng thuật ngữ

| Ký hiệu | Ý nghĩa |
|----------|---------|
| PM | Phần mềm Quản lý Thư viện |
| He_Thong | Hệ thống quản lý thư viện |
| Thu_Thu | Thủ thư - nhân viên thư viện |
| Doc_Gia | Độc giả - người sử dụng dịch vụ |
| Sach | Đối tượng sách (mã, tiêu đề, tác giả, tình trạng) |
| Phieu_Muon | Bản ghi mượn sách (mã phiếu, ngày mượn, hạn trả, tiền phạt) |
| Tai_Khoan | Tài khoản đăng nhập hệ thống |
| So_Muon_Tra | Sổ ghi chép mượn trả sách (thủ công) |
| The_Doc_Gia | Thẻ độc giả vật lý |

**3 Use Case chính:** UC01: Mượn sách | UC02: Trả sách | UC03: Gia hạn mượn sách

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

**Actors:** Thu_Thu, Doc_Gia, PM (He_Thong)
**Use Case hỗ trợ:** Đăng nhập, Xác nhận giao dịch

### UC01: Mượn sách (Có PM)

1. Độc giả đưa thẻ + sách cho thủ thư
2. Thủ thư tìm kiếm độc giả trên PM (theo mã, tên, email hoặc SĐT)
3. PM hiển thị danh sách kết quả, thủ thư chọn độc giả
4. PM kiểm tra hợp lệ (tồn tại + thẻ chưa hết hạn)
5. Thủ thư tìm kiếm sách (theo mã, tiêu đề hoặc tác giả)
6. PM hiển thị sách kèm tình trạng, thủ thư chọn sách sẵn sàng
7. Thủ thư xác nhận → PM tạo Phieu_Muon (hanTra = ngayMuon + 14 ngày)
8. PM cập nhật Sach.tinhTrang = DA_MUON

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
        PM-->>TT: Danh sách sách + tình trạng
        TT->>PM: Chọn sách SAN_SANG
        alt Không khả dụng
            PM-->>TT: Lỗi "Sách không khả dụng"
        else Khả dụng
            PM-->>TT: Thông tin sách ✓
            TT->>PM: Xác nhận mượn
            PM->>PM: Tạo Phieu_Muon + Cập nhật Sach
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
    G --> H{Khả dụng?}
    H -->|Không| I[Lỗi sách] --> Z
    H -->|Có| J[Tạo phiếu mượn +14 ngày]
    J --> K[Cập nhật sách = DA_MUON]
    K --> L[Hiển thị phiếu] --> Z
```

### UC02: Trả sách (Có PM)

1. Độc giả mang sách đến trả
2. Thủ thư tìm phiếu mượn (theo tên độc giả, tên sách, hoặc mã phiếu)
3. PM hiển thị danh sách phiếu đang mượn kèm phạt ước tính
4. Thủ thư chọn phiếu → PM hiển thị chi tiết + tiền phạt tự động
5. Thủ thư xác nhận → PM cập nhật trangThai = DA_TRA, Sach = SAN_SANG

```mermaid
sequenceDiagram
    actor DG as Actor: Doc_Gia
    actor TT as Actor: Thu_Thu
    participant PM as PM
    
    DG->>TT: Đưa sách cần trả
    TT->>PM: Tìm phiếu mượn (tên độc giả/tên sách/mã phiếu)
    PM-->>TT: Danh sách phiếu đang mượn + phạt ước tính
    TT->>PM: Chọn phiếu
    alt Không tìm thấy
        PM-->>TT: Lỗi "Không tìm thấy"
    else Tìm thấy
        PM-->>TT: Chi tiết phiếu
        PM->>PM: Tính phạt tự động
        Note right of PM: Quá hạn: soNgay × 5000 VNĐ<br/>Đúng hạn: 0
        PM-->>TT: Tiền phạt
        TT->>PM: Xác nhận trả
        PM->>PM: Cập nhật PhieuMuon + Sach
        PM-->>TT: Kết quả trả sách
        TT-->>DG: Thu phạt (nếu có)
    end
```

```mermaid
stateDiagram-v2
    [*] --> DANG_MUON: Tạo phiếu mượn
    DANG_MUON --> DA_TRA: Trả đúng hạn
    DANG_MUON --> QUA_HAN: Hết hạn trả
    QUA_HAN --> DA_TRA: Trả + nộp phạt
    DANG_MUON --> GIA_HAN: Gia hạn
    GIA_HAN --> DANG_MUON: +7 ngày
    DA_TRA --> [*]
```

### UC03: Gia hạn (Có PM)

1. Thủ thư nhập mã phiếu → PM tìm Phieu_Muon
2. PM kiểm tra hợp lệ (trangThai = DANG_MUON)
3. Thủ thư yêu cầu gia hạn → PM cập nhật hanTra += 7 ngày

```mermaid
sequenceDiagram
    actor TT as Actor: Thu_Thu
    participant PM as PM
    
    TT->>PM: Nhập mã phiếu
    PM->>PM: Tìm Phieu_Muon
    alt Không tồn tại
        PM-->>TT: Lỗi "Không tìm thấy"
    else Đã trả
        PM-->>TT: Lỗi "Đã hoàn tất"
    else Hợp lệ (DANG_MUON)
        PM-->>TT: Thông tin phiếu
        TT->>PM: Yêu cầu gia hạn
        PM->>PM: hanTra += 7 ngày
        PM-->>TT: Phiếu đã gia hạn
    end
```

**Ưu điểm PM:** Xử lý 3-5 giây, tự động validate, tính phạt chính xác, tìm kiếm không dấu, báo cáo tức thì

**Khuyết điểm PM:** Cần đầu tư ban đầu, phụ thuộc điện/máy tính, cần bảo trì

| Tiêu chí | Thủ công | Có PM |
|----------|---------|-------|
| Thời gian giao dịch | 5-10 phút | 3-5 giây |
| Tra cứu | 5-15 phút | < 2 giây |
| Tính phạt | Thủ công, dễ sai | Tự động |
| Phát hiện quá hạn | Rất khó | Tự động |

---

# PHẦN 2: PHÂN TÍCH YÊU CẦU

## 2a) Phân tích đối tượng thành phần (CRC)

**UC01:** Doc_Gia (kiểm tra hợp lệ), Sach (kiểm tra khả dụng), Phieu_Muon (tạo bản ghi)
**UC02:** Phieu_Muon (tìm, cập nhật, tính phạt), Sach (cập nhật trạng thái)
**UC03:** Phieu_Muon (tìm, kiểm tra điều kiện, cập nhật hạn trả)

| Lớp | Trách nhiệm | Cộng tác |
|-----|------------|---------|
| Sach | Lưu trữ thông tin sách, cập nhật trạng thái | Phieu_Muon |
| Doc_Gia | Lưu trữ thông tin độc giả, kiểm tra hạn thẻ | Phieu_Muon |
| Phieu_Muon | Ghi nhận mượn sách, tính phạt, gia hạn | Sach, Doc_Gia |
| Tai_Khoan | Xác thực đăng nhập, phân quyền | Thu_Thu |

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
    TT->>S: timKiem(tuKhoa: String): Sach[]
    S-->>TT: Danh sách kết quả
    TT->>S: kiemTraKhaDung(maSach): Boolean
    S-->>TT: isAvailable
    TT->>PM: tao(maDocGia, maSach, ngayMuon, hanTra)
    PM-->>TT: Phieu_Muon
    TT->>S: capNhatTrangThai(maSach, DA_MUON)
    S-->>TT: success
```

### UC02 - Trả sách

```mermaid
sequenceDiagram
    actor TT as Actor: Thu_Thu
    participant PM as Phieu_Muon
    participant S as Sach
    
    TT->>PM: timKiem(tuKhoa, loaiTim): PhieuMuon[]
    PM-->>TT: Danh sách phiếu đang mượn
    TT->>PM: tinhPhat(hanTra: Date, ngayTra: Date): Number
    Note right of PM: tienPhat = (ngayTra - hanTra) × 5000 nếu quá hạn
    PM-->>TT: tienPhat
    TT->>PM: xacNhanTra(ngayTraThucTe, tienPhat, DA_TRA)
    PM-->>TT: success
    TT->>S: capNhatTrangThai(maSach, SAN_SANG)
    S-->>TT: success
```

### UC03 - Gia hạn

```mermaid
sequenceDiagram
    actor TT as Actor: Thu_Thu
    participant PM as Phieu_Muon
    
    TT->>PM: layThongTin(maPhieu): PhieuMuon
    PM-->>TT: PhieuMuon
    TT->>PM: kiemTraChoPhepGiaHan(): Boolean
    PM-->>TT: canExtend
    alt Được phép (DANG_MUON)
        TT->>PM: capNhatHanTra(hanTra + 7 ngày)
        PM-->>TT: success
    else Không được phép
        PM-->>TT: Lỗi
    end
```

## 2c) Lược đồ lớp tổng quát lp-1

```mermaid
classDiagram
    Phieu_Muon --> Sach : tham chiếu maSach
    Phieu_Muon --> Doc_Gia : tham chiếu maDocGia
    Doc_Gia --> Tai_Khoan : liên kết tùy chọn
```

## 2d) Định nghĩa chi tiết các lớp

```mermaid
classDiagram
    class Sach {
        - maSach: String
        - tieuDe: String
        - tacGia: String
        - tinhTrang: TinhTrangSach
        + timKiem(tuKhoa): Sach[]
        + kiemTraKhaDung(): Boolean
        + capNhatTrangThai(trangThai): void
    }
    class Doc_Gia {
        - maDocGia: String
        - hoTen: String
        - email: String
        - soDienThoai: String
        - ngayHetHan: Date
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
        + tao(maDocGia, maSach, ngayMuon, hanTra): Phieu_Muon
        + timKiem(tuKhoa, loaiTim): PhieuMuon[]
        + tinhPhat(ngayTraThucTe): Number
        + capNhatHanTra(hanTraMoi): void
        + kiemTraChoPhepGiaHan(): Boolean
        + xacNhanTra(ngayTra, tienPhat): void
    }
    class Tai_Khoan {
        - maTaiKhoan: String
        - tenDangNhap: String
        - matKhau: String
        - vaiTro: VaiTro
        - trangThai: TrangThaiTaiKhoan
        + dangNhap(tenDN, matKhau): Boolean
        + dangXuat(): void
    }
    Phieu_Muon --> Sach : tham chiếu
    Phieu_Muon --> Doc_Gia : tham chiếu
```

```mermaid
classDiagram
    class TinhTrangSach {
        <<enumeration>>
        SAN_SANG
        DA_MUON
        BAO_TRI
        MAT
    }
    class TrangThaiPhieu {
        <<enumeration>>
        DANG_MUON
        DA_TRA
    }
    class VaiTro {
        <<enumeration>>
        THU_THU
        QUAN_TRI_VIEN
    }
    class TrangThaiTaiKhoan {
        <<enumeration>>
        HOAT_DONG
        BI_KHOA
    }
```

**Quy tắc nghiệp vụ:**
1. Tiền phạt = soNgayQuaHan × 5000 VNĐ/ngày
2. Thời hạn mượn: 14 ngày
3. Gia hạn: +7 ngày vào hạn trả hiện tại
4. Mượn sách: tinhTrang phải = SAN_SANG
5. Gia hạn: trangThai phải = DANG_MUON
6. Xóa độc giả: không có phiếu DANG_MUON
7. Xóa sách: tinhTrang ≠ DA_MUON

---

# PHẦN 3: THIẾT KẾ HỆ THỐNG

## 3a) Mô đun thiết kế

Kiến trúc phân lớp 3 tầng:

```
  Presentation Layer (Giao diện web SPA, tiếng Việt, responsive)
       ↓
  Business Logic Layer (Xử lý mượn/trả/gia hạn, quản lý, tra cứu, xác thực, báo cáo)
       ↓
  Data Access Layer (CSDL quan hệ: Doc_Gia, Sach, Phieu_Muon, Tai_Khoan)
```

**Segmentation:**

| Mô đun | Đối tượng nghiệp vụ |
|--------|---------------------|
| mod-auth | Tai_Khoan (đăng nhập, phân quyền) |
| mod-borrow | Phieu_Muon (mượn, trả, gia hạn, tính phạt) |
| mod-reader | Doc_Gia (quản lý độc giả) |
| mod-book | Sach (quản lý sách, tra cứu) |
| mod-report | Báo cáo (quá hạn, tình trạng kho) |

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
    subgraph mod-report
        BC[Bao_Cao]
    end
    PM -->|Kiểm tra hợp lệ| DG
    PM -->|Cập nhật trạng thái| S
    BC -->|Truy vấn| PM
    BC -->|Truy vấn| S
```

## 3b) Liên kết Giao diện - Xử lý - Database

```mermaid
flowchart TB
    subgraph "Giao diện"
        Login[Đăng nhập]
        Dashboard[Tổng quan & Báo cáo]
        Borrow[Mượn sách]
        Return[Trả sách]
        Extend[Gia hạn]
        Books[Quản lý sách]
        Readers[Quản lý độc giả]
    end
    subgraph "Xử lý"
        XLAuth[Xác thực]
        XLMuon[Mượn/Trả/Gia hạn]
        XLSach[Quản lý sách]
        XLDG[Quản lý độc giả]
        XLBC[Báo cáo]
    end
    subgraph "CSDL"
        TBDocGia[(Doc_Gia)]
        TBSach[(Sach)]
        TBPhieuMuon[(Phieu_Muon)]
        TBTaiKhoan[(Tai_Khoan)]
    end
    Login --> XLAuth --> TBTaiKhoan
    Borrow --> XLMuon
    Return --> XLMuon
    Extend --> XLMuon
    XLMuon --> TBPhieuMuon
    XLMuon --> TBSach
    Books --> XLSach --> TBSach
    Readers --> XLDG --> TBDocGia
    Dashboard --> XLBC --> TBPhieuMuon
    XLBC --> TBSach
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
        enum tinhTrang
    }
    PHIEU_MUON {
        string maPhieu PK
        string maDocGia FK
        string maSach FK
        date ngayMuon
        date hanTra
        date ngayTraThucTe
        enum trangThai
        number tienPhat
    }
    TAI_KHOAN {
        string maTaiKhoan PK
        string tenDangNhap UK
        string matKhau
        enum vaiTro
        enum trangThai
    }
```

## 3c) Quy trình vận hành trên giao diện

**Layout:** Sidebar trái (3 nhóm: Menu chính, Quản lý, Báo cáo) + Header + Vùng nội dung

**Mượn sách** — Wizard 3 bước:
- Bước 1: Tìm độc giả (đa trường, không dấu) → bảng kết quả → Chọn
- Bước 2: Tìm sách (đa trường, không dấu) → bảng kết quả → Chọn (chỉ SẴN SÀNG)
- Bước 3: Xác nhận → Phiếu mượn

**Trả sách** — 2 bước:
- Bước 1: Tìm phiếu (dropdown loại tìm + từ khóa) → bảng phiếu + phạt ước tính → Chọn
- Bước 2: Xác nhận trả → Kết quả (ngày trả, tiền phạt)

**Gia hạn** — 2 bước:
- Bước 1: Nhập mã phiếu → Thông tin phiếu
- Bước 2: Gia hạn +7 ngày → Hạn trả mới

**Quản lý sách:** Tìm kiếm + bảng CRUD + không xóa được sách đang mượn
**Quản lý độc giả:** Bảng CRUD + không xóa được độc giả đang mượn
**Đăng nhập:** Form tên đăng nhập + mật khẩu, phân quyền Thủ thư / Quản trị viên
