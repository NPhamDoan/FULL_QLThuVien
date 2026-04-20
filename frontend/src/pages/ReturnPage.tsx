import { useState } from 'react';
import { Input, Button, Alert, Typography, Table, Tag, Statistic, Select, Space } from 'antd';
import { SearchOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { loanApi } from '../services/api';
import axios from 'axios';

const { Text } = Typography;

interface LoanInfo {
  maPhieu: string;
  maDocGia: string;
  maSach: string;
  ngayMuon: string;
  hanTra: string;
  trangThai: string;
  tienPhat: number;
  tenDocGia?: string;
  tenSach?: string;
}

interface ReturnResult {
  success: boolean;
  tienPhat: number;
  ngayTraThucTe: string;
}

type SearchType = 'all' | 'docgia' | 'sach' | 'maphieu';

export default function ReturnPage() {
  const [keyword, setKeyword] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [loans, setLoans] = useState<LoanInfo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const [selectedLoan, setSelectedLoan] = useState<LoanInfo | null>(null);
  const [returnResult, setReturnResult] = useState<ReturnResult | null>(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  const doSearch = async (search?: string, type?: string) => {
    setSearchError(null);
    setLoans([]);
    setSelectedLoan(null);
    setReturnResult(null);
    setSearchLoading(true);
    setSearched(true);
    try {
      const { data } = await loanApi.list(search, type !== 'all' ? type : undefined);
      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setSearchError(err.response?.data?.error || 'Lỗi khi tìm kiếm');
      } else {
        setSearchError('Lỗi khi tìm kiếm');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = () => doSearch(keyword.trim() || undefined, searchType);

  const handleShowAll = () => {
    setKeyword('');
    setSearchType('all');
    doSearch();
  };

  const handleReturn = async () => {
    if (!selectedLoan) return;
    setReturnError(null);
    setReturnLoading(true);
    try {
      const { data } = await loanApi.returnBook(selectedLoan.maPhieu);
      setReturnResult({ success: data.success, tienPhat: data.tienPhat, ngayTraThucTe: data.ngayTraThucTe });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setReturnError(err.response?.data?.error || err.response?.data?.message || 'Lỗi khi trả sách');
      } else {
        setReturnError('Lỗi khi trả sách');
      }
    } finally {
      setReturnLoading(false);
    }
  };

  const handleReset = () => {
    setKeyword('');
    setSearchType('all');
    setLoans([]);
    setSearched(false);
    setSelectedLoan(null);
    setReturnResult(null);
    setReturnError(null);
    setSearchError(null);
  };

  const isOverdue = (hanTra: string) => new Date() > new Date(hanTra);
  const estimateFine = (hanTra: string) => {
    if (!isOverdue(hanTra)) return 0;
    return Math.ceil((new Date().getTime() - new Date(hanTra).getTime()) / (1000 * 60 * 60 * 24)) * 5000;
  };

  const columns = [
    { title: 'Mã phiếu', dataIndex: 'maPhieu', key: 'maPhieu', width: 130 },
    {
      title: 'Độc giả', key: 'docgia', width: 160,
      render: (_: unknown, r: LoanInfo) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.tenDocGia || r.maDocGia}</div>
          {r.tenDocGia && <div style={{ fontSize: 12, color: '#94A3B8' }}>{r.maDocGia}</div>}
        </div>
      ),
    },
    {
      title: 'Sách', key: 'sach', width: 180,
      render: (_: unknown, r: LoanInfo) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.tenSach || r.maSach}</div>
          {r.tenSach && <div style={{ fontSize: 12, color: '#94A3B8' }}>{r.maSach}</div>}
        </div>
      ),
    },
    {
      title: 'Ngày mượn', dataIndex: 'ngayMuon', key: 'ngayMuon', width: 110,
      render: (v: string) => v?.split('T')[0],
    },
    {
      title: 'Hạn trả', dataIndex: 'hanTra', key: 'hanTra', width: 110,
      render: (v: string) => <Text type={isOverdue(v) ? 'danger' : undefined} strong={isOverdue(v)}>{v?.split('T')[0]}</Text>,
    },
    {
      title: 'Phạt (ước tính)', key: 'fine', width: 120,
      render: (_: unknown, r: LoanInfo) => {
        const fine = estimateFine(r.hanTra);
        return fine > 0 ? <Tag color="red">{fine.toLocaleString()} VNĐ</Tag> : <Tag color="green">Không</Tag>;
      },
    },
    {
      title: '', key: 'action', width: 100,
      render: (_: unknown, r: LoanInfo) => (
        <Button type="primary" size="small" onClick={() => setSelectedLoan(r)} style={{ borderRadius: 8 }}>
          Chọn trả
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: '#1E293B', fontWeight: 700 }}>Trả sách</h2>
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>Tìm phiếu mượn theo tên độc giả, tên sách hoặc mã phiếu</Text>
        </div>
        {(searched || selectedLoan) && (
          <Button icon={<ReloadOutlined />} onClick={handleReset}>Làm lại</Button>
        )}
      </div>

      {/* Search */}
      {!selectedLoan && !returnResult && (
        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Space.Compact style={{ flex: 1 }}>
              <Select
                value={searchType}
                onChange={(v) => setSearchType(v)}
                style={{ width: 150 }}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'docgia', label: 'Tên độc giả' },
                  { value: 'sach', label: 'Tên sách' },
                  { value: 'maphieu', label: 'Mã phiếu' },
                ]}
              />
              <Input
                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                placeholder={
                  searchType === 'docgia' ? 'Nhập tên độc giả...' :
                  searchType === 'sach' ? 'Nhập tên sách...' :
                  searchType === 'maphieu' ? 'Nhập mã phiếu...' :
                  'Nhập từ khóa tìm kiếm...'
                }
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                allowClear
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={searchLoading}>
                Tìm
              </Button>
            </Space.Compact>
            <Button onClick={handleShowAll}>Xem tất cả</Button>
          </div>

          {searchError && <Alert message={searchError} type="error" showIcon style={{ marginTop: 12 }} />}

          {searched && (
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8, fontSize: 13, color: '#64748B' }}>
                {loans.length > 0
                  ? `Tìm thấy ${loans.length} phiếu đang mượn${keyword ? ` cho "${keyword}"` : ''}`
                  : 'Không tìm thấy phiếu mượn nào'}
              </div>
              <Table
                columns={columns}
                dataSource={loans}
                rowKey="maPhieu"
                size="small"
                pagination={{ pageSize: 6 }}
                locale={{ emptyText: 'Không có phiếu mượn nào' }}
              />
            </div>
          )}
        </div>
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

function InfoItem({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: highlight ? 600 : 400, color: '#1E293B' }}>{value}</div>
    </div>
  );
}
