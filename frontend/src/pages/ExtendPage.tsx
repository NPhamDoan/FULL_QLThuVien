import { useState } from 'react';
import { Button, Alert, Typography, Tag, message } from 'antd';
import { CheckCircleOutlined, ReloadOutlined, CalendarOutlined } from '@ant-design/icons';
import { loanApi } from '../services/api';
import LoanSearchTable, { InfoItem, isOverdue, type LoanInfo } from '../components/LoanSearchTable';
import LoanReceipt, { type LoanReceiptData } from '../components/LoanReceipt';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { Text } = Typography;

export default function ExtendPage() {
  const { user } = useAuth();
  const [selectedLoan, setSelectedLoan] = useState<LoanInfo | null>(null);
  const [extendedLoan, setExtendedLoan] = useState<LoanInfo | null>(null);
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendError, setExtendError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [receiptData, setReceiptData] = useState<LoanReceiptData | null>(null);

  const handlePrint = async (loan: LoanInfo) => {
    try {
      const { data } = await loanApi.getDetails(loan.maPhieu);
      setReceiptData({
        maPhieu: data.maPhieu,
        ngayMuon: data.ngayMuon,
        hanTra: data.hanTra,
        docGia: data.docGia,
        sach: data.sach,
        thuThu: user?.tenDangNhap,
      });
      setTimeout(() => window.print(), 100);
    } catch {
      message.error('Không tải được thông tin phiếu');
    }
  };

  const handleExtend = async () => {
    if (!selectedLoan) return;
    setExtendError(null);
    setExtendLoading(true);
    try {
      const { data } = await loanApi.extend(selectedLoan.maPhieu);
      setExtendedLoan(data);
    } catch (err) {
      setExtendError(axios.isAxiosError(err) ? (err.response?.data?.error || 'Lỗi khi gia hạn') : 'Lỗi khi gia hạn');
    } finally {
      setExtendLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedLoan(null);
    setExtendedLoan(null);
    setExtendError(null);
    setResetKey(k => k + 1);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: '#1E293B', fontWeight: 700 }}>Gia hạn mượn sách</h2>
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>Tìm phiếu mượn và gia hạn thêm 7 ngày</Text>
        </div>
        {(selectedLoan || extendedLoan) && (
          <Button icon={<ReloadOutlined />} onClick={handleReset}>Làm lại</Button>
        )}
      </div>

      {/* Search */}
      {!selectedLoan && !extendedLoan && (
        <LoanSearchTable key={resetKey} onSelect={setSelectedLoan} selectLabel="Chọn gia hạn" onPrint={handlePrint} />
      )}

      {/* Selected loan — confirm extend */}
      {selectedLoan && !extendedLoan && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', marginBottom: 16 }}>Xác nhận gia hạn</div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px',
            background: '#F8FAFC', borderRadius: 10, padding: 20, border: '1px solid #E2E8F0', marginBottom: 20,
          }}>
            <InfoItem label="Mã phiếu" value={selectedLoan.maPhieu} />
            <InfoItem label="Độc giả" value={selectedLoan.tenDocGia || selectedLoan.maDocGia} highlight />
            <InfoItem label="Sách" value={selectedLoan.tenSach || selectedLoan.maSach} highlight />
            <InfoItem label="Ngày mượn" value={selectedLoan.ngayMuon?.split('T')[0]} />
            <InfoItem label="Hạn trả hiện tại" value={selectedLoan.hanTra?.split('T')[0]} />
            <InfoItem label="Trạng thái" value={
              isOverdue(selectedLoan.hanTra) ? <Tag color="red">Quá hạn</Tag> : <Tag color="green">Trong hạn</Tag>
            } />
          </div>

          {extendError && <Alert message={extendError} type="error" showIcon style={{ marginBottom: 16 }} />}

          <div style={{ display: 'flex', gap: 12 }}>
            <Button onClick={() => setSelectedLoan(null)} style={{ flex: 1, height: 44 }}>Quay lại danh sách</Button>
            <Button type="primary" icon={<CalendarOutlined />} onClick={handleExtend} loading={extendLoading} style={{ flex: 2, height: 44, fontWeight: 600 }}>
              Gia hạn thêm 7 ngày
            </Button>
          </div>
        </div>
      )}

      {/* Extend result */}
      {extendedLoan && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0' }}>
          <Alert message="Gia hạn thành công!" type="success" showIcon icon={<CheckCircleOutlined />} style={{ marginBottom: 20 }} />
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px',
            background: '#F8FAFC', borderRadius: 10, padding: 20, border: '1px solid #E2E8F0', marginBottom: 20,
          }}>
            <InfoItem label="Mã phiếu" value={extendedLoan.maPhieu} />
            <InfoItem label="Hạn trả cũ" value={selectedLoan?.hanTra?.split('T')[0] || ''} />
            <InfoItem label="Hạn trả mới" value={extendedLoan.hanTra?.split('T')[0]} highlight />
          </div>
          <Button icon={<ReloadOutlined />} onClick={handleReset} block style={{ height: 42 }}>Gia hạn phiếu khác</Button>
        </div>
      )}

      {/* Printable receipt */}
      {receiptData && <LoanReceipt data={receiptData} />}
    </div>
  );
}
