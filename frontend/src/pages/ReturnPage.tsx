import { useState } from 'react';
import { Button, Alert, Typography, Tag, Statistic, Checkbox, InputNumber, Space, message } from 'antd';
import { CheckCircleOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { loanApi } from '../services/api';
import LoanSearchTable, { InfoItem, isOverdue, estimateFine, type LoanInfo } from '../components/LoanSearchTable';
import LoanReceipt, { type LoanReceiptData } from '../components/LoanReceipt';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { Text } = Typography;

interface ReturnResult {
  success: boolean;
  tienPhat: number;
  ngayTraThucTe: string;
  daMatSach?: boolean;
}

export default function ReturnPage() {
  const { user } = useAuth();
  const [selectedLoan, setSelectedLoan] = useState<LoanInfo | null>(null);
  const [returnResult, setReturnResult] = useState<ReturnResult | null>(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  // Receipt data for reprinting
  const [receiptData, setReceiptData] = useState<LoanReceiptData | null>(null);

  // Mất sách option
  const [daMatSach, setDaMatSach] = useState(false);
  const [phiMat, setPhiMat] = useState<number>(0);

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
      // Wait a tick for component to render, then print
      setTimeout(() => window.print(), 100);
    } catch {
      message.error('Không tải được thông tin phiếu');
    }
  };

  const handleReturn = async () => {
    if (!selectedLoan) return;
    setReturnError(null);
    setReturnLoading(true);
    try {
      const { data } = await loanApi.returnBook(selectedLoan.maPhieu, {
        daMatSach,
        phiMat: daMatSach ? phiMat : 0,
      });
      setReturnResult({
        success: data.success,
        tienPhat: data.tienPhat,
        ngayTraThucTe: data.ngayTraThucTe,
        daMatSach: data.daMatSach,
      });
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
    setDaMatSach(false);
    setPhiMat(0);
    setResetKey(k => k + 1);
  };

  const finePhatTre = selectedLoan ? estimateFine(selectedLoan.hanTra) : 0;
  const tongPhat = finePhatTre + (daMatSach ? phiMat : 0);

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
        <LoanSearchTable key={resetKey} onSelect={setSelectedLoan} selectLabel="Chọn trả" showEstimatedFine onPrint={handlePrint} />
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

          {/* Đánh dấu mất sách */}
          <div style={{
            background: daMatSach ? '#FEF2F2' : '#F8FAFC',
            border: `1px solid ${daMatSach ? '#FECACA' : '#E2E8F0'}`,
            borderRadius: 10, padding: 16, marginBottom: 16,
          }}>
            <Checkbox checked={daMatSach} onChange={(e) => setDaMatSach(e.target.checked)}>
              <Space>
                <WarningOutlined style={{ color: daMatSach ? '#DC2626' : undefined }} />
                <span style={{ fontWeight: 500 }}>Sách bị mất / không thể trả</span>
              </Space>
            </Checkbox>
            {daMatSach && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: '#DC2626' }}>Phí đền sách:</Text>
                <InputNumber
                  value={phiMat}
                  onChange={(v) => setPhiMat(Number(v) || 0)}
                  min={0}
                  step={10000}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => parseFloat(`${v}`.replace(/,/g, '')) as 0}
                  style={{ width: 160 }}
                />
                <Text type="secondary">VNĐ</Text>
              </div>
            )}
          </div>

          {/* Tổng phạt */}
          {(finePhatTre > 0 || (daMatSach && phiMat > 0)) && (
            <div style={{
              background: '#FEF2F2', borderRadius: 10, padding: 16, border: '1px solid #FECACA', marginBottom: 20,
            }}>
              {finePhatTre > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: daMatSach && phiMat > 0 ? 8 : 0 }}>
                  <Text style={{ color: '#DC2626' }}>Phạt quá hạn</Text>
                  <Text strong style={{ color: '#DC2626' }}>{finePhatTre.toLocaleString()} VNĐ</Text>
                </div>
              )}
              {daMatSach && phiMat > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: '#DC2626' }}>Phí đền sách mất</Text>
                  <Text strong style={{ color: '#DC2626' }}>{phiMat.toLocaleString()} VNĐ</Text>
                </div>
              )}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                paddingTop: 8, borderTop: '1px solid #FECACA',
              }}>
                <Text strong style={{ color: '#DC2626' }}>Tổng cộng</Text>
                <Statistic
                  value={tongPhat}
                  suffix="VNĐ"
                  valueStyle={{ color: '#DC2626', fontSize: 18, fontWeight: 700 }}
                />
              </div>
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
          <Alert
            message={returnResult.daMatSach ? 'Đã ghi nhận sách mất' : 'Trả sách thành công!'}
            type={returnResult.daMatSach ? 'warning' : 'success'}
            showIcon
            icon={returnResult.daMatSach ? <WarningOutlined /> : <CheckCircleOutlined />}
            style={{ marginBottom: 20 }}
          />
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px',
            background: '#F8FAFC', borderRadius: 10, padding: 20, border: '1px solid #E2E8F0', marginBottom: 20,
          }}>
            <InfoItem label="Mã phiếu" value={selectedLoan?.maPhieu || ''} />
            <InfoItem label="Ngày trả" value={new Date(returnResult.ngayTraThucTe).toLocaleDateString('vi-VN')} highlight />
            <InfoItem label="Tổng phạt" value={
              returnResult.tienPhat > 0
                ? <span style={{ color: '#DC2626', fontWeight: 700 }}>{returnResult.tienPhat.toLocaleString()} VNĐ</span>
                : <span style={{ color: '#16A34A', fontWeight: 600 }}>Không có</span>
            } />
          </div>
          <Button icon={<ReloadOutlined />} onClick={handleReset} block style={{ height: 42 }}>Trả sách khác</Button>
        </div>
      )}

      {/* Printable receipt (hidden on screen, visible when printing) */}
      {receiptData && <LoanReceipt data={receiptData} />}
    </div>
  );
}
