import { useState } from 'react';
import { Button, Alert, Typography, Tag, Statistic } from 'antd';
import { CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { loanApi } from '../services/api';
import LoanSearchTable, { InfoItem, isOverdue, estimateFine, type LoanInfo } from '../components/LoanSearchTable';
import axios from 'axios';

const { Text } = Typography;

interface ReturnResult {
  success: boolean;
  tienPhat: number;
  ngayTraThucTe: string;
}

export default function ReturnPage() {
  const [selectedLoan, setSelectedLoan] = useState<LoanInfo | null>(null);
  const [returnResult, setReturnResult] = useState<ReturnResult | null>(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const handleReturn = async () => {
    if (!selectedLoan) return;
    setReturnError(null);
    setReturnLoading(true);
    try {
      const { data } = await loanApi.returnBook(selectedLoan.maPhieu);
      setReturnResult({ success: data.success, tienPhat: data.tienPhat, ngayTraThucTe: data.ngayTraThucTe });
    } catch (err) {
      setReturnError(
        axios.isAxiosError(err)
          ? (err.response?.data?.error || err.response?.data?.message || 'Lỗi khi trả sách')
          : 'Lỗi khi trả sách'
      );
    } finally {
      setReturnLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedLoan(null);
    setReturnResult(null);
    setReturnError(null);
    setResetKey(k => k + 1);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: '#1E293B', fontWeight: 700 }}>Trả sách</h2>
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>Tìm phiếu mượn theo tên độc giả, tên sách hoặc mã phiếu</Text>
        </div>
        {(selectedLoan || returnResult) && (
          <Button icon={<ReloadOutlined />} onClick={handleReset}>Làm lại</Button>
        )}
      </div>

      {/* Search */}
      {!selectedLoan && !returnResult && (
        <LoanSearchTable key={resetKey} onSelect={setSelectedLoan} selectLabel="Chọn trả" showEstimatedFine />
      )}

      {/* Selected loan — confirm return */}
      {selectedLoan && !returnResult && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', marginBottom: 16 }}>Xác nhận trả sách</div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px',
            background: '#F8FAFC', borderRadius: 10, padding: 20, border: '1px solid #E2E8F0', marginBottom: 20,
          }}>
            <InfoItem label="Mã phiếu" value={selectedLoan.maPhieu} />
            <InfoItem label="Độc giả" value={selectedLoan.tenDocGia || selectedLoan.maDocGia} highlight />
            <InfoItem label="Sách" value={selectedLoan.tenSach || selectedLoan.maSach} highlight />
            <InfoItem label="Ngày mượn" value={selectedLoan.ngayMuon?.split('T')[0]} />
            <InfoItem label="Hạn trả" value={selectedLoan.hanTra?.split('T')[0]} />
            <InfoItem label="Trạng thái" value={
              isOverdue(selectedLoan.hanTra) ? <Tag color="red">Quá hạn</Tag> : <Tag color="green">Trong hạn</Tag>
            } />
          </div>

          {isOverdue(selectedLoan.hanTra) && (
            <div style={{
              background: '#FEF2F2', borderRadius: 10, padding: 16, border: '1px solid #FECACA', marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Text style={{ color: '#DC2626', fontWeight: 500 }}>Tiền phạt ước tính (quá hạn)</Text>
              <Statistic value={estimateFine(selectedLoan.hanTra)} suffix="VNĐ" valueStyle={{ color: '#DC2626', fontSize: 20, fontWeight: 700 }} />
            </div>
          )}

          {returnError && <Alert message={returnError} type="error" showIcon style={{ marginBottom: 16 }} />}

          <div style={{ display: 'flex', gap: 12 }}>
            <Button onClick={() => setSelectedLoan(null)} style={{ flex: 1, height: 44 }}>Quay lại danh sách</Button>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleReturn} loading={returnLoading} style={{ flex: 2, height: 44, fontWeight: 600 }}>
              Xác nhận trả sách
            </Button>
          </div>
        </div>
      )}

      {/* Return result */}
      {returnResult && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0' }}>
          <Alert message="Trả sách thành công!" type="success" showIcon icon={<CheckCircleOutlined />} style={{ marginBottom: 20 }} />
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px',
            background: '#F8FAFC', borderRadius: 10, padding: 20, border: '1px solid #E2E8F0', marginBottom: 20,
          }}>
            <InfoItem label="Mã phiếu" value={selectedLoan?.maPhieu || ''} />
            <InfoItem label="Ngày trả" value={new Date(returnResult.ngayTraThucTe).toLocaleDateString('vi-VN')} highlight />
            <InfoItem label="Tiền phạt" value={
              returnResult.tienPhat > 0
                ? <span style={{ color: '#DC2626', fontWeight: 700 }}>{returnResult.tienPhat.toLocaleString()} VNĐ</span>
                : <span style={{ color: '#16A34A', fontWeight: 600 }}>Không có</span>
            } />
          </div>
          <Button icon={<ReloadOutlined />} onClick={handleReset} block style={{ height: 42 }}>Trả sách khác</Button>
        </div>
      )}
    </div>
  );
}
