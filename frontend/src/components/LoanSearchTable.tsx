import { useState } from 'react';
import { Input, Button, Alert, Table, Tag, Select, Space, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { loanApi } from '../services/api';
import axios from 'axios';

const { Text } = Typography;

export interface LoanInfo {
  maPhieu: string;
  maDocGia: string;
  maSach: string;
  ngayMuon: string;
  hanTra: string;
  trangThai: string;
  tienPhat?: number;
  tenDocGia?: string;
  tenSach?: string;
}

type SearchType = 'all' | 'docgia' | 'sach' | 'maphieu';

interface Props {
  onSelect: (loan: LoanInfo) => void;
  selectLabel?: string;
  /** Show estimated fine column (for return page) */
  showEstimatedFine?: boolean;
}

export const isOverdue = (hanTra: string) => new Date() > new Date(hanTra);
export const estimateFine = (hanTra: string) => {
  if (!isOverdue(hanTra)) return 0;
  return Math.ceil((new Date().getTime() - new Date(hanTra).getTime()) / (1000 * 60 * 60 * 24)) * 5000;
};

export function InfoItem({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: highlight ? 600 : 400, color: '#1E293B' }}>{value}</div>
    </div>
  );
}

export default function LoanSearchTable({ onSelect, selectLabel = 'Chọn', showEstimatedFine = false }: Props) {
  const [keyword, setKeyword] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [loans, setLoans] = useState<LoanInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const doSearch = async (search?: string, type?: string) => {
    setError(null);
    setLoans([]);
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await loanApi.list(search, type !== 'all' ? type : undefined);
      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(axios.isAxiosError(err) ? (err.response?.data?.error || 'Lỗi khi tìm kiếm') : 'Lỗi khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => doSearch(keyword.trim() || undefined, searchType);
  const handleShowAll = () => { setKeyword(''); setSearchType('all'); doSearch(); };

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
    showEstimatedFine
      ? {
          title: 'Phạt (ước tính)', key: 'fine', width: 120,
          render: (_: unknown, r: LoanInfo) => {
            const fine = estimateFine(r.hanTra);
            return fine > 0 ? <Tag color="red">{fine.toLocaleString()} VNĐ</Tag> : <Tag color="green">Không</Tag>;
          },
        }
      : {
          title: 'Trạng thái', key: 'status', width: 100,
          render: (_: unknown, r: LoanInfo) =>
            isOverdue(r.hanTra) ? <Tag color="red">Quá hạn</Tag> : <Tag color="green">Trong hạn</Tag>,
        },
    {
      title: '', key: 'action', width: 110,
      render: (_: unknown, r: LoanInfo) => (
        <Button type="primary" size="small" onClick={() => onSelect(r)} style={{ borderRadius: 8 }}>
          {selectLabel}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 20, border: '1px solid #E2E8F0' }}>
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
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
            Tìm
          </Button>
        </Space.Compact>
        <Button onClick={handleShowAll}>Xem tất cả</Button>
      </div>

      {error && <Alert message={error} type="error" showIcon style={{ marginTop: 12 }} />}

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
  );
}
