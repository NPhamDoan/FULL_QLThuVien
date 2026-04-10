import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Spin, Table, Alert, Tabs } from 'antd';
import {
  BookOutlined,
  TeamOutlined,
  ImportOutlined,
  WarningOutlined,
  CalendarOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { bookApi, readerApi, reportApi, loanApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { Text } = Typography;

interface Stats {
  totalBooks: number;
  totalReaders: number;
  issued: number;
  returned: number;
  overdue: number;
  baoTri: number;
  mat: number;
}

interface OverdueLoan {
  maPhieu: string;
  maDocGia: string;
  maSach: string;
  ngayMuon: string;
  hanTra: string;
}

interface ActiveLoan {
  maPhieu: string;
  maDocGia: string;
  maSach: string;
  ngayMuon: string;
  hanTra: string;
  trangThai: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalBooks: 0, totalReaders: 0, issued: 0, returned: 0, overdue: 0, baoTri: 0, mat: 0 });
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoan[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [overdueError, setOverdueError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [booksRes, readersRes, inventoryRes, overdueRes, activeRes] = await Promise.all([
          bookApi.list(),
          readerApi.list(),
          reportApi.getInventory(),
          reportApi.getOverdue(),
          loanApi.list(),
        ]);
        const inv = inventoryRes.data;
        const overdueData = Array.isArray(overdueRes.data) ? overdueRes.data : [];
        const activeData = Array.isArray(activeRes.data) ? activeRes.data : [];
        setStats({
          totalBooks: Array.isArray(booksRes.data) ? booksRes.data.length : 0,
          totalReaders: Array.isArray(readersRes.data) ? readersRes.data.length : 0,
          issued: activeData.length,
          returned: inv?.sanSang ?? 0,
          overdue: overdueData.length,
          baoTri: inv?.baoTri ?? 0,
          mat: inv?.mat ?? 0,
        });
        setOverdueLoans(overdueData);
        setActiveLoans(activeData);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setOverdueError(err.response?.data?.error || 'Lỗi khi tải dữ liệu');
        }
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  const [activeTab, setActiveTab] = useState('active');

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  }

  const summaryCards = [
    { title: 'Tổng sách', value: stats.totalBooks, icon: <BookOutlined />, color: '#0F766E', bg: 'rgba(212,160,23,0.1)', link: '/books', tab: '' },
    { title: 'Độc giả', value: stats.totalReaders, icon: <TeamOutlined />, color: '#22C55E', bg: 'rgba(34,197,94,0.1)', link: '/readers', tab: '' },
    { title: 'Đang mượn', value: stats.issued, icon: <ImportOutlined />, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', link: '', tab: 'active' },
    { title: 'Quá hạn', value: stats.overdue, icon: <WarningOutlined />, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', link: '', tab: 'overdue' },
  ];

  const overdueColumns = [
    { title: 'Mã phiếu', dataIndex: 'maPhieu', key: 'maPhieu', width: 140 },
    { title: 'Mã độc giả', dataIndex: 'maDocGia', key: 'maDocGia', width: 130 },
    { title: 'Mã sách', dataIndex: 'maSach', key: 'maSach', width: 120 },
    { title: 'Ngày mượn', dataIndex: 'ngayMuon', key: 'ngayMuon', width: 130 },
    { title: 'Hạn trả', dataIndex: 'hanTra', key: 'hanTra', width: 130,
      render: (v: string) => <Text type="danger" strong>{v}</Text>,
    },
  ];

  const inventoryData = [
    { label: 'Sẵn sàng', value: stats.returned, color: '#27ae60' },
    { label: 'Đang mượn', value: stats.issued, color: '#e67e22' },
    { label: 'Bảo trì', value: stats.baoTri, color: '#3498db' },
    { label: 'Mất', value: stats.mat, color: '#e74c3c' },
  ];
  const totalBooks = stats.totalBooks || 1;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {user?.vaiTro === 'QUAN_TRI_VIEN' ? 'Quản trị viên' : 'Thủ thư'} • {today}
          </Text>
        </div>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        {summaryCards.map((card, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card
              hoverable
              onClick={() => card.tab ? setActiveTab(card.tab) : navigate(card.link)}
              style={{ cursor: 'pointer', borderRadius: 10, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              styles={{ body: { padding: '20px 22px' } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: card.color, lineHeight: 1.2 }}>{card.value}</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{card.title}</div>
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: card.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: card.color,
                }}>
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Reports Section */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'active',
            label: <span><ImportOutlined style={{ marginRight: 6 }} />Đang mượn ({activeLoans.length})</span>,
            children: (
              <Table
                columns={[
                  { title: 'Mã phiếu', dataIndex: 'maPhieu', key: 'maPhieu', width: 140 },
                  { title: 'Mã độc giả', dataIndex: 'maDocGia', key: 'maDocGia', width: 130 },
                  { title: 'Mã sách', dataIndex: 'maSach', key: 'maSach', width: 120 },
                  { title: 'Ngày mượn', dataIndex: 'ngayMuon', key: 'ngayMuon', width: 130 },
                  { title: 'Hạn trả', dataIndex: 'hanTra', key: 'hanTra', width: 130,
                    render: (v: string) => {
                      const isOverdue = new Date(v) < new Date();
                      return <Text type={isOverdue ? 'danger' : undefined} strong={isOverdue}>{v}</Text>;
                    },
                  },
                ]}
                dataSource={activeLoans}
                rowKey="maPhieu"
                size="small"
                pagination={{ pageSize: 8 }}
                locale={{ emptyText: 'Không có phiếu đang mượn' }}
                style={{ marginTop: 8 }}
              />
            ),
          },
          {
            key: 'overdue',
            label: <span><WarningOutlined style={{ marginRight: 6 }} />Sách quá hạn ({stats.overdue})</span>,
            children: (
              <>
                {overdueError && <Alert message={overdueError} type="error" showIcon style={{ marginBottom: 16 }} />}
                <Table
                  columns={overdueColumns}
                  dataSource={overdueLoans}
                  rowKey="maPhieu"
                  size="small"
                  pagination={{ pageSize: 8 }}
                  locale={{ emptyText: 'Không có sách quá hạn 🎉' }}
                  style={{ marginTop: 8 }}
                />
              </>
            ),
          },
          {
            key: 'inventory',
            label: <span><BookOutlined style={{ marginRight: 6 }} />Tình trạng kho</span>,
            children: (
              <div style={{ marginTop: 8 }}>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  {inventoryData.map((item, i) => (
                    <Col xs={12} sm={6} key={i}>
                      <div style={{
                        background: '#F8FAFC', borderRadius: 10, padding: '16px 20px',
                        border: '1px solid #E2E8F0',
                      }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{item.label}</div>
                      </div>
                    </Col>
                  ))}
                </Row>

                {/* Simple bar chart */}
                <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 20, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 16 }}>Phân bố tình trạng sách</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {inventoryData.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 80, fontSize: 12, color: '#64748B', textAlign: 'right', flexShrink: 0 }}>{item.label}</div>
                        <div style={{ flex: 1, height: 24, background: '#E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 6,
                            background: item.color,
                            width: `${Math.max((item.value / totalBooks) * 100, 2)}%`,
                            transition: 'width 0.6s ease',
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                          }}>
                            {item.value > 0 && <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{item.value}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'status',
            label: <span><CalendarOutlined style={{ marginRight: 6 }} />Tổng quan</span>,
            children: (
              <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                {[
                  { title: 'ĐANG MƯỢN', value: stats.issued, icon: <ImportOutlined style={{ fontSize: 28, color: '#607D8B' }} /> },
                  { title: 'SẴN SÀNG', value: stats.returned, icon: <ExportOutlined style={{ fontSize: 28, color: '#27ae60' }} /> },
                  { title: 'QUÁ HẠN', value: stats.overdue, icon: <WarningOutlined style={{ fontSize: 28, color: '#e74c3c' }} /> },
                  { title: 'BẢO TRÌ', value: stats.baoTri, icon: <BookOutlined style={{ fontSize: 28, color: '#3498db' }} /> },
                ].map((card, i) => (
                  <Col xs={12} sm={6} key={i}>
                    <Card styles={{ body: { padding: '18px 20px' } }} style={{ borderRadius: 10, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {card.icon}
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {card.title}
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>{card.value}</div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ),
          },
        ]}
      />
    </div>
  );
}
