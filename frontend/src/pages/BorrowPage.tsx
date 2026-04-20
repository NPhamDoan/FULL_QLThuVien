import { useState } from 'react';
import { Input, Button, Alert, Typography, Tag, Table } from 'antd';
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
  SAN_SANG: { label: 'Sẵn sàng', color: 'green' },
  DA_MUON: { label: 'Đã mượn', color: 'red' },
  BAO_TRI: { label: 'Bảo trì', color: 'orange' },
  MAT: { label: 'Mất', color: 'default' },
};

const stepStyle = (active: boolean, done: boolean) => ({
  width: 40, height: 40, borderRadius: '50%',
  display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
  fontSize: 18,
  background: done ? '#22C55E' : active ? '#0F766E' : '#F8FAFC',
  color: done || active ? '#fff' : '#64748B',
  transition: 'all 0.2s ease',
  boxShadow: active ? '0 0 0 4px rgba(15,118,110,0.15)' : 'none',
});

export default function BorrowPage() {
  // Step 1: Reader search
  const [readerKeyword, setReaderKeyword] = useState('');
  const [readers, setReaders] = useState<ReaderInfo[]>([]);
  const [readerSearched, setReaderSearched] = useState(false);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [selectedReader, setSelectedReader] = useState<ReaderInfo | null>(null);

  // Step 2: Book search
  const [bookKeyword, setBookKeyword] = useState('');
  const [books, setBooks] = useState<BookInfo[]>([]);
  const [bookSearched, setBookSearched] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookInfo | null>(null);

  // Step 3: Confirm
  const [loanResult, setLoanResult] = useState<LoanResult | null>(null);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);

  const currentStep = loanResult ? 3 : selectedBook ? 2 : selectedReader ? 1 : 0;

  // --- Reader search ---
  const handleSearchReaders = async (kw?: string) => {
    setReaderError(null);
    setReaders([]);
    setSelectedReader(null);
    setSelectedBook(null);
    setBooks([]);
    setBookSearched(false);
    setLoanResult(null);
    setReaderLoading(true);
    setReaderSearched(true);
    try {
      const { data } = await readerApi.search(kw ?? readerKeyword.trim());
      setReaders(Array.isArray(data) ? data : []);
    } catch (err) {
      setReaderError(axios.isAxiosError(err) ? (err.response?.data?.error || 'Lỗi khi tìm kiếm') : 'Lỗi khi tìm kiếm');
    } finally { setReaderLoading(false); }
  };

  const handleShowAllReaders = () => { setReaderKeyword(''); handleSearchReaders(''); };

  const handleSelectReader = (r: ReaderInfo) => {
    const today = new Date().toISOString().split('T')[0];
    const expiry = r.ngayHetHan?.split('T')[0] || r.ngayHetHan;
    if (expiry < today) {
      setReaderError(`Thẻ độc giả ${r.hoTen} đã hết hạn từ ngày ${expiry}`);
      return;
    }
    setReaderError(null);
    setSelectedReader(r);
  };

  // --- Book search ---
  const handleSearchBooks = async (kw?: string) => {
    setBookError(null);
    setBooks([]);
    setSelectedBook(null);
    setLoanResult(null);
    setBookLoading(true);
    setBookSearched(true);
    try {
      const keyword = kw ?? bookKeyword.trim();
      const { data } = keyword
        ? await bookApi.search({ keyword } as any)
        : await bookApi.list();
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      setBookError(axios.isAxiosError(err) ? (err.response?.data?.error || 'Lỗi khi tìm kiếm') : 'Lỗi khi tìm kiếm');
    } finally { setBookLoading(false); }
  };

  const handleShowAllBooks = () => { setBookKeyword(''); handleSearchBooks(''); };

  const handleSelectBook = (b: BookInfo) => {
    if (b.tinhTrang !== 'SAN_SANG') {
      setBookError(`Sách "${b.tieuDe}" không khả dụng (${TINH_TRANG[b.tinhTrang]?.label || b.tinhTrang})`);
      return;
    }
    setBookError(null);
    setSelectedBook(b);
  };

  // --- Borrow ---
  const handleBorrow = async () => {
    if (!selectedReader || !selectedBook) return;
    setBorrowError(null); setBorrowLoading(true);
    try {
      const { data } = await loanApi.create(selectedReader.maDocGia, selectedBook.maSach);
      setLoanResult({ maPhieu: data.maPhieu, ngayMuon: data.ngayMuon, hanTra: data.hanTra });
    } catch (err) {
      setBorrowError(axios.isAxiosError(err) ? (err.response?.data?.error || 'Lỗi khi tạo phiếu mượn') : 'Lỗi khi tạo phiếu mượn');
    } finally { setBorrowLoading(false); }
  };

  const handleReset = () => {
    setReaderKeyword(''); setBookKeyword('');
    setReaders([]); setBooks([]);
    setReaderSearched(false); setBookSearched(false);
    setSelectedReader(null); setSelectedBook(null);
    setReaderError(null); setBookError(null);
    setLoanResult(null); setBorrowError(null);
  };

  const steps = [
    { icon: <UserOutlined />, label: 'Độc giả' },
    { icon: <BookOutlined />, label: 'Sách' },
    { icon: <FileDoneOutlined />, label: 'Xác nhận' },
  ];

  // --- Reader table columns ---
  const readerColumns = [
    { title: 'Mã', dataIndex: 'maDocGia', key: 'maDocGia', width: 100 },
    { title: 'Họ tên', dataIndex: 'hoTen', key: 'hoTen', width: 180,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 180 },
    { title: 'SĐT', dataIndex: 'soDienThoai', key: 'soDienThoai', width: 120 },
    { title: 'Hạn thẻ', dataIndex: 'ngayHetHan', key: 'ngayHetHan', width: 110,
      render: (v: string) => {
        const d = v?.split('T')[0] || v;
        const expired = d < new Date().toISOString().split('T')[0];
        return <Text type={expired ? 'danger' : undefined} strong={expired}>{d}</Text>;
      },
    },
    { title: '', key: 'action', width: 90,
      render: (_: unknown, r: ReaderInfo) => (
        <Button type="primary" size="small" onClick={() => handleSelectReader(r)} style={{ borderRadius: 8 }}>Chọn</Button>
      ),
    },
  ];

  // --- Book table columns ---
  const bookColumns = [
    { title: 'Mã', dataIndex: 'maSach', key: 'maSach', width: 90 },
    { title: 'Tiêu đề', dataIndex: 'tieuDe', key: 'tieuDe', width: 220,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: 'Tác giả', dataIndex: 'tacGia', key: 'tacGia', width: 160 },
    { title: 'Tình trạng', dataIndex: 'tinhTrang', key: 'tinhTrang', width: 110,
      render: (v: string) => <Tag color={TINH_TRANG[v]?.color || 'default'}>{TINH_TRANG[v]?.label || v}</Tag>,
    },
    { title: '', key: 'action', width: 90,
      render: (_: unknown, b: BookInfo) => (
        <Button type="primary" size="small" onClick={() => handleSelectBook(b)}
          disabled={b.tinhTrang !== 'SAN_SANG'} style={{ borderRadius: 8 }}>
          Chọn
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
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
                <span style={{ fontSize: 12, fontWeight: 600, color: currentStep >= i ? '#1E293B' : '#64748B' }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  width: 80, height: 2, margin: '0 12px', marginBottom: 22,
                  background: currentStep > i ? '#22C55E' : '#F8FAFC',
                  borderRadius: 1, transition: 'background 0.3s ease',
                }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Reader Search */}
      {!selectedReader && !loanResult && (
        <div style={{ background: '#fff', border: '1px solid #0F766E', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(15,118,110,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0F766E', fontSize: 16,
            }}>
              <UserOutlined />
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#1E293B' }}>Bước 1: Tìm và chọn độc giả</span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              placeholder="Nhập mã, tên, email hoặc SĐT độc giả..."
              value={readerKeyword}
              onChange={(e) => setReaderKeyword(e.target.value)}
              onPressEnter={() => handleSearchReaders()}
              allowClear
              style={{ flex: 1 }}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={() => handleSearchReaders()} loading={readerLoading}>Tìm</Button>
            <Button onClick={handleShowAllReaders}>Xem tất cả</Button>
          </div>

          {readerError && <Alert message={readerError} type="error" showIcon style={{ marginBottom: 12 }} />}

          {readerSearched && (
            <div>
              <div style={{ marginBottom: 8, fontSize: 13, color: '#64748B' }}>
                {readers.length > 0
                  ? `Tìm thấy ${readers.length} độc giả${readerKeyword ? ` cho "${readerKeyword}"` : ''}`
                  : 'Không tìm thấy độc giả nào'}
              </div>
              <Table columns={readerColumns} dataSource={readers} rowKey="maDocGia" size="small"
                pagination={{ pageSize: 5 }} locale={{ emptyText: 'Không có độc giả nào' }} />
            </div>
          )}
        </div>
      )}

      {/* Selected reader summary */}
      {selectedReader && !loanResult && (
        <div style={{
          background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(15,118,110,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0F766E', fontSize: 16,
            }}>
              <UserOutlined />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>Độc giả</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                {selectedReader.hoTen} <span style={{ fontWeight: 400, color: '#64748B' }}>({selectedReader.maDocGia})</span>
              </div>
            </div>
            <Tag color="success">Hợp lệ</Tag>
          </div>
          <Button size="small" onClick={() => { setSelectedReader(null); setSelectedBook(null); setBooks([]); setBookSearched(false); }}>
            Đổi
          </Button>
        </div>
      )}

      {/* Step 2: Book Search */}
      {selectedReader && !selectedBook && !loanResult && (
        <div style={{ background: '#fff', border: '1px solid #0F766E', borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(15,118,110,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0F766E', fontSize: 16,
            }}>
              <BookOutlined />
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#1E293B' }}>Bước 2: Tìm và chọn sách</span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              placeholder="Nhập mã sách, tiêu đề hoặc tác giả..."
              value={bookKeyword}
              onChange={(e) => setBookKeyword(e.target.value)}
              onPressEnter={() => handleSearchBooks()}
              allowClear
              style={{ flex: 1 }}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={() => handleSearchBooks()} loading={bookLoading}>Tìm</Button>
            <Button onClick={handleShowAllBooks}>Xem tất cả</Button>
          </div>

          {bookError && <Alert message={bookError} type="error" showIcon style={{ marginBottom: 12 }} />}

          {bookSearched && (
            <div>
              <div style={{ marginBottom: 8, fontSize: 13, color: '#64748B' }}>
                {books.length > 0
                  ? `Tìm thấy ${books.length} sách${bookKeyword ? ` cho "${bookKeyword}"` : ''}`
                  : 'Không tìm thấy sách nào'}
              </div>
              <Table columns={bookColumns} dataSource={books} rowKey="maSach" size="small"
                pagination={{ pageSize: 5 }} locale={{ emptyText: 'Không có sách nào' }} />
            </div>
          )}
        </div>
      )}

      {/* Selected book summary */}
      {selectedBook && !loanResult && (
        <div style={{
          background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(15,118,110,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#0F766E', fontSize: 16,
            }}>
              <BookOutlined />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sách</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                {selectedBook.tieuDe} <span style={{ fontWeight: 400, color: '#64748B' }}>({selectedBook.maSach})</span>
              </div>
            </div>
            <Tag color="success">Khả dụng</Tag>
          </div>
          <Button size="small" onClick={() => { setSelectedBook(null); setBooks([]); setBookSearched(false); }}>
            Đổi
          </Button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {selectedReader && selectedBook && !loanResult && (
        <div style={{ background: '#fff', border: '1px solid #0F766E', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#FEF3C7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#F97316', fontSize: 16,
            }}>
              <FileDoneOutlined />
            </div>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#1E293B' }}>Bước 3: Xác nhận mượn sách</span>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px',
            background: '#F8FAFC', borderRadius: 10, padding: 20, border: '1px solid #E2E8F0', marginBottom: 20,
          }}>
            <InfoItem label="Độc giả" value={selectedReader.hoTen} highlight />
            <InfoItem label="Mã độc giả" value={selectedReader.maDocGia} />
            <InfoItem label="Sách" value={selectedBook.tieuDe} highlight />
            <InfoItem label="Mã sách" value={selectedBook.maSach} />
          </div>

          {borrowError && <Alert message={borrowError} type="error" showIcon style={{ marginBottom: 12 }} />}

          <Button type="primary" icon={<ArrowRightOutlined />} size="large" block
            onClick={handleBorrow} loading={borrowLoading}
            style={{ height: 48, fontSize: 16, fontWeight: 600 }}>
            Xác nhận mượn sách
          </Button>
        </div>
      )}

      {/* Loan result */}
      {loanResult && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E2E8F0' }}>
          <Alert message="Mượn sách thành công!" type="success" showIcon icon={<CheckCircleOutlined />} style={{ marginBottom: 20 }} />
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 24px',
            background: '#F8FAFC', borderRadius: 10, padding: 20, border: '1px solid #E2E8F0', marginBottom: 20,
          }}>
            <InfoItem label="Mã phiếu" value={loanResult.maPhieu} highlight />
            <InfoItem label="Ngày mượn" value={loanResult.ngayMuon?.split?.('T')?.[0] || loanResult.ngayMuon} />
            <InfoItem label="Hạn trả" value={loanResult.hanTra?.split?.('T')?.[0] || loanResult.hanTra} highlight />
            <InfoItem label="Độc giả" value={selectedReader?.hoTen || ''} />
            <InfoItem label="Sách" value={selectedBook?.tieuDe || ''} />
          </div>
          <Button icon={<ReloadOutlined />} onClick={handleReset} block style={{ height: 42 }}>
            Tạo phiếu mượn mới
          </Button>
        </div>
      )}
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
