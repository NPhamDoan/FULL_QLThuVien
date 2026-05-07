import { forwardRef } from 'react';

export interface LoanReceiptData {
  maPhieu: string;
  ngayMuon: string;
  hanTra: string;
  docGia: {
    maDocGia: string;
    hoTen: string;
    email?: string;
    soDienThoai?: string;
  };
  sach: {
    maSach: string;
    tieuDe: string;
    tacGia: string;
  };
  thuThu?: string;
}

/**
 * Phiếu mượn sách - tối ưu cho in (A5 hoặc nửa A4).
 * Ẩn khỏi màn hình, chỉ hiện khi in (dùng CSS @media print).
 */
const LoanReceipt = forwardRef<HTMLDivElement, { data: LoanReceiptData }>(({ data }, ref) => {
  const fmtDate = (iso: string) => {
    const s = iso?.split('T')[0] || iso;
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div ref={ref} className="loan-receipt">
      <style>{`
        /* Hidden on screen, visible only when printing */
        .loan-receipt {
          display: none;
        }
        @media print {
          @page {
            size: A5;
            margin: 15mm;
          }
          body * {
            visibility: hidden;
          }
          .loan-receipt, .loan-receipt * {
            visibility: visible;
          }
          .loan-receipt {
            display: block;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            font-family: 'Times New Roman', serif;
            color: #000;
          }
        }

        .loan-receipt .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 16px;
        }
        .loan-receipt .lib-name {
          font-size: 14pt;
          font-weight: bold;
          margin: 0;
        }
        .loan-receipt .title {
          font-size: 18pt;
          font-weight: bold;
          margin: 10px 0 4px;
          letter-spacing: 2px;
        }
        .loan-receipt .code {
          font-size: 12pt;
          font-weight: bold;
        }
        .loan-receipt .section {
          margin-bottom: 12px;
        }
        .loan-receipt .section-title {
          font-weight: bold;
          font-size: 11pt;
          border-bottom: 1px dashed #666;
          margin-bottom: 6px;
          padding-bottom: 2px;
        }
        .loan-receipt table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11pt;
        }
        .loan-receipt td {
          padding: 4px 8px;
          vertical-align: top;
        }
        .loan-receipt td.label {
          font-weight: bold;
          width: 35%;
        }
        .loan-receipt .dates {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 10px;
          border: 1px solid #000;
          margin: 12px 0;
        }
        .loan-receipt .dates > div {
          text-align: center;
        }
        .loan-receipt .dates .label {
          font-size: 10pt;
          color: #555;
        }
        .loan-receipt .dates .value {
          font-size: 13pt;
          font-weight: bold;
        }
        .loan-receipt .note {
          margin-top: 14px;
          padding: 8px;
          border: 1px dashed #666;
          font-size: 10pt;
          font-style: italic;
        }
        .loan-receipt .signatures {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
        }
        .loan-receipt .signatures > div {
          width: 40%;
          text-align: center;
          font-size: 10pt;
        }
        .loan-receipt .signatures .role {
          font-weight: bold;
          margin-bottom: 4px;
        }
        .loan-receipt .signatures .sign-area {
          height: 50px;
        }
        .loan-receipt .signatures .name {
          border-top: 1px solid #000;
          padding-top: 4px;
        }
      `}</style>

      <div className="header">
        <p className="lib-name">THƯ VIỆN - QL THƯ VIỆN</p>
        <h1 className="title">PHIẾU MƯỢN SÁCH</h1>
        <p className="code">Số phiếu: <strong>{data.maPhieu}</strong></p>
      </div>

      {/* Độc giả */}
      <div className="section">
        <div className="section-title">Thông tin độc giả</div>
        <table>
          <tbody>
            <tr>
              <td className="label">Mã độc giả:</td>
              <td>{data.docGia.maDocGia}</td>
            </tr>
            <tr>
              <td className="label">Họ và tên:</td>
              <td>{data.docGia.hoTen}</td>
            </tr>
            {data.docGia.email && (
              <tr>
                <td className="label">Email:</td>
                <td>{data.docGia.email}</td>
              </tr>
            )}
            {data.docGia.soDienThoai && (
              <tr>
                <td className="label">Điện thoại:</td>
                <td>{data.docGia.soDienThoai}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sách */}
      <div className="section">
        <div className="section-title">Thông tin sách mượn</div>
        <table>
          <tbody>
            <tr>
              <td className="label">Mã sách:</td>
              <td>{data.sach.maSach}</td>
            </tr>
            <tr>
              <td className="label">Tiêu đề:</td>
              <td><strong>{data.sach.tieuDe}</strong></td>
            </tr>
            <tr>
              <td className="label">Tác giả:</td>
              <td>{data.sach.tacGia}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ngày */}
      <div className="dates">
        <div>
          <div className="label">Ngày mượn</div>
          <div className="value">{fmtDate(data.ngayMuon)}</div>
        </div>
        <div>
          <div className="label">Hạn trả</div>
          <div className="value">{fmtDate(data.hanTra)}</div>
        </div>
      </div>

      <div className="note">
        <strong>Lưu ý:</strong> Độc giả vui lòng giữ phiếu này để xuất trình khi trả sách.
        Trả sách quá hạn sẽ bị phạt 5.000 VNĐ/ngày. Làm mất sách phải đền theo quy định.
      </div>

      {/* Chữ ký */}
      <div className="signatures">
        <div>
          <div className="role">Người mượn</div>
          <div className="sign-area"></div>
          <div className="name">{data.docGia.hoTen}</div>
        </div>
        <div>
          <div className="role">Thủ thư</div>
          <div className="sign-area"></div>
          <div className="name">{data.thuThu || '...........................'}</div>
        </div>
      </div>
    </div>
  );
});

LoanReceipt.displayName = 'LoanReceipt';

export default LoanReceipt;
