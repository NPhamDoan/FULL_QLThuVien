import { useState } from 'react';
import { Input, Button, Alert, Typography, Tag } from 'antd';
import {
  SearchOutlined,
  CheckCircleOutlined,
  UserOutlined,
  BookOutlined,
  FileDoneOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { readerApi, bookApi, loanApi } from '../services/api';
import axios from 'axios';

const { Text } = Typography;

interface ReaderInfo {
  maDocGia: string;
  hoTen: string;
  email: string;
  soDienThoai: string;
  ngayHetHan: string;
}

interface BookInfo {
  maSach: string;
  tieuDe: string;
  tacGia: string;
  tinhTrang: string;
}

interface LoanResult {
  maPhieu: string;
  ngayMuon: string;
  hanTra: string;
}

const TINH_TRANG: Record<string, { label: string; color: string }> = {
  SAN_SANG: { label: 'Sẵn sàng', color: '#22C55E' },
  DA_MUON: { label: 'Đã mượn', color: '#e74c3c' },
  BAO_TRI: { label: 'Bảo trì', color: '#f39c12' },
  MAT: { label: 'Mất', color: '#95a5a6' },
};

const stepStyle = (active: boolean, done: boolean) => ({
  width: 40, height: 40, borderRadius: '50%',
  display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
  fontSize: 18,
  background: done ? '#22C55E' : active ? '#0F766E' : '#F8FAFC',
  color: done || active ? '#fff' : '#64748B',
  transition: 'all 0.2s ease',
  boxShadow: active ? '0 0 0 4px rgba(124,58,237,0.15)' : 'none',
});

export default function BorrowPage() {
  const [maDocGia, setMaDocGia] = useState('');
  const [maSach, setMaSach] = useState('');
  const [reader, setReader] = useState<ReaderInfo | null>(null);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [book, setBook] = useState<BookInfo | null>(null);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [loanResult, setLoanResult] = useState<LoanResult | null>(null);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);

  const currentStep = loanResult ? 3 : book ? 2 : reader ? 1 : 0;

  const handleValidateReader = async () => {
    if (!maDocGia.trim()) return;
    setReaderError(null); setReader(null); setBook(null); setLoanResult(null);
    setReaderLoading(true);
    try {
      const { data } = await readerApi.getById(maDocGia.trim());
      setReader(data);
    } catch (err) {
      setReaderError(axios.isAxiosError(err) ? (err.response?.data?.error || 'Không tìm thấy độc giả') : 'Lỗi khi kiểm tra độc giả');
    } finally { setReaderLoading(false); }
  };

  const handleValidateBook = async () => {
    if (!maSach.trim()) return;
    setBookError(null); setBook(null); setLoanResult(null);
    setBookLoading(true);
    try {
      const { data } = await bookApi.search({ maSach: maSach.trim() });
      if (data.length === 0) setBookError('Mã sách không tồn tại');
      else setBook(data[0]);
    } catch (err) {
      setBookError(axios.isAxiosError(err) ? (err.response?.data?.error || 'Lỗi khi kiểm tra sách') : 'Lỗi khi kiểm tra sách');
    } finally { setBookLoading(false); }
  };

  const handleBorrow = async () => {
    if (!reader || !book) return;
    setBorrowError(null); setLoanResult(null); setBorrowLoading(true);
    try {
      const { data } = await loanApi.create(reader.maDocGia, book.maSach);
      setLoanResult({ maPhieu: data.maPhieu, ngayMuon: data.ngayMuon, hanTra: data.hanTra });
    } catch (err) {
      setBorrowError(axios.isAxiosError(err) ? (err.response?.data?.error || 'Lỗi khi tạo phiếu mượn') : 'Lỗi khi tạo phiếu mượn');
    } finally { setBorrowLoading(false); }
  };

  const handleReset = () => {
    setMaDocGia(''); setMaSach('');
    setReader(null); setReaderError(null);
    setBook(null); setBookError(null);
    setLoanResult(null); setBorrowError(null);
  };

  const steps = [
    { icon: <UserOutlined />, label: 'Độc giả' },
    { icon: <BookOutlined />, label: 'Sách' },
    { icon: <FileDoneOutlined />, label: 'Xác nhận' },
  ];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, color: '#1E293B', fontWeight: 700 }}>Mượn sách</h2>
            <Text type="secondary">Tạo phiếu mượn sách cho độc giả</Text>
          </div>
          {currentStep > 0 && !loanResult && (
            <Button icon={<ReloadOutlined />} onClick={handleReset}>Làm lại</Button>
          )}
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={stepStyle(currentStep === i, currentStep > i)}>
                  {currentStep > i ? <CheckCircleOutlined /> : s.icon}
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: currentStep >= i ? '#1E293B' : '#64748B',
                }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  width: 80, height: 2, margin: '0 12px',
                  marginBottom: 22,
                  background: currentStep > i ? '#22C55E' : '#F8FAFC',
                  borderRadius: 1,
                  transition: 'background 0.3s ease',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Reader */}
      <div style={{
        background: currentStep === 0 ? '#fff' : (reader ? '#F8FAFC' : '#fff'),
        border: `1px solid ${currentStep === 0 ? '#0F766E' : (reader ? '#CBD5E1' : '#E2E8F0')}`,
        borderRadius: 10, padding: 24, marginBottom: 16,
        transition: 'all 0.3s ease',
        opacity: loanResult ? 0.7 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: reader ? 'rgba(15,118,110,0.15)' : 'rgba(15,118,110,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: reader ? '#0F766E' : '#0F766E', fontSize: 16,
          }}>
            <UserOutlined />
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#1E293B' }}>Bước 1: Kiểm tra độc giả</span>
          {reader && <Tag color="success">Hợp lệ</Tag>}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input
            placeholder="Nhập mã độc giả (VD: DG001)"
            value={maDocGia}
            onChange={(e) => setMaDocGia(e.target.value)}
            onPressEnter={handleValidateReader}
            disabled={!!loanResult}
            prefix={<UserOutlined style={{ color: '#CBD5E1' }} />}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleValidateReader}
            loading={readerLoading}
            disabled={!maDocGia.trim() || !!loanResult}
          >
            Kiểm tra
          </Button>
        </div>

        {readerError && <Alert message={readerError} type="error" showIcon style={{ marginBottom: 8 }} />}

        {reader && (
          <div style={{
            background: '#F8FAFC', borderRadius: 8, padding: 16,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px',
            border: '1px solid #E2E8F0',
          }}>
            <InfoItem label="Mã độc giả" value={reader.maDocGia} />
            <InfoItem label="Họ tên" value={reader.hoTen} highlight />
            <InfoItem label="Email" value={reader.email} />
            <InfoItem label="Số điện thoại" value={reader.soDienThoai} />
            <InfoItem label="Hạn thẻ" value={reader.ngayHetHan} />
          </div>
        )}
      </div>

      {/* Step 2: Book */}
      <div style={{
        background: currentStep === 1 ? '#fff' : (book ? '#F8FAFC' : '#fff'),
        border: `1px solid ${currentStep === 1 ? '#0F766E' : (book ? '#CBD5E1' : '#E2E8F0')}`,
        borderRadius: 10, padding: 24, marginBottom: 16,
        transition: 'all 0.3s ease',
        opacity: !reader && !loanResult ? 0.5 : (loanResult ? 0.7 : 1),
        pointerEvents: !reader ? 'none' : 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: book ? 'rgba(15,118,110,0.15)' : '#E2E8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: book ? '#0F766E' : '#60A5FA', fontSize: 16,
          }}>
            <BookOutlined />
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#1E293B' }}>Bước 2: Kiểm tra sách</span>
          {book && book.tinhTrang === 'SAN_SANG' && <Tag color="success">Khả dụng</Tag>}
          {book && book.tinhTrang !== 'SAN_SANG' && (
            <Tag color="error">{TINH_TRANG[book.tinhTrang]?.label || book.tinhTrang}</Tag>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input
            placeholder="Nhập mã sách (VD: S001)"
            value={maSach}
            onChange={(e) => setMaSach(e.target.value)}
            onPressEnter={handleValidateBook}
            disabled={!!loanResult || !reader}
            prefix={<BookOutlined style={{ color: '#CBD5E1' }} />}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleValidateBook}
            loading={bookLoading}
            disabled={!maSach.trim() || !!loanResult || !reader}
          >
            Kiểm tra
          </Button>
        </div>

        {bookError && <Alert message={bookError} type="error" showIcon style={{ marginBottom: 8 }} />}

        {book && (
          <div style={{
            background: '#F8FAFC', borderRadius: 8, padding: 16,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px',
            border: '1px solid #E2E8F0',
          }}>
            <InfoItem label="Mã sách" value={book.maSach} />
            <InfoItem label="Tiêu đề" value={book.tieuDe} highlight />
            <InfoItem label="Tác giả" value={book.tacGia} />
            <InfoItem label="Tình trạng" value={
              <span style={{ color: TINH_TRANG[book.tinhTrang]?.color || '#333', fontWeight: 600 }}>
                {TINH_TRANG[book.tinhTrang]?.label || book.tinhTrang}
              </span>
            } />
          </div>
        )}
      </div>

      {/* Step 3: Confirm */}
      <div style={{
        background: loanResult ? '#F8FAFC' : '#fff',
        border: `1px solid ${loanResult ? '#CBD5E1' : (currentStep === 2 ? '#0F766E' : '#E2E8F0')}`,
        borderRadius: 10, padding: 24,
        transition: 'all 0.3s ease',
        opacity: !reader || !book ? 0.5 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: loanResult ? 'rgba(15,118,110,0.15)' : '#FEF3C7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: loanResult ? '#0F766E' : '#F97316', fontSize: 16,
          }}>
            <FileDoneOutlined />
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#1E293B' }}>Bước 3: Xác nhận mượn sách</span>
          {loanResult && <Tag color="success">Thành công</Tag>}
        </div>

        {borrowError && <Alert message={borrowError} type="error" showIcon style={{ marginBottom: 12 }} />}

        {!loanResult ? (
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            size="large"
            block
            onClick={handleBorrow}
            loading={borrowLoading}
            disabled={!reader || !book || book.tinhTrang !== 'SAN_SANG'}
            style={{ height: 48, fontSize: 16, fontWeight: 600 }}
          >
            Xác nhận mượn sách
          </Button>
        ) : (
          <div>
            <Alert
              message="Mượn sách thành công!"
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginBottom: 16 }}
            />
            <div style={{
              background: '#F8FAFC', borderRadius: 8, padding: 16,
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 24px',
              border: '1px solid #E2E8F0',
            }}>
              <InfoItem label="Mã phiếu" value={loanResult.maPhieu} highlight />
              <InfoItem label="Ngày mượn" value={loanResult.ngayMuon} />
              <InfoItem label="Hạn trả" value={loanResult.hanTra} highlight />
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
              block
              style={{ marginTop: 16, height: 40 }}
            >
              Tạo phiếu mượn mới
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: highlight ? 600 : 400, color: '#1E293B' }}>
        {value}
      </div>
    </div>
  );
}
