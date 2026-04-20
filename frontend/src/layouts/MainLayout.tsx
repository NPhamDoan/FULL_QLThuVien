import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Avatar, Dropdown, Typography } from 'antd';
import {
  BookOutlined, ImportOutlined, ExportOutlined, HistoryOutlined,
  TeamOutlined, BarChartOutlined, LogoutOutlined, UserOutlined,
  SettingOutlined, ReadOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Content, Sider } = Layout;

const menuSections = [
  {
    label: 'MENU CHÍNH',
    items: [
      { key: '/borrow', icon: <ImportOutlined />, label: 'Mượn sách' },
      { key: '/return', icon: <ExportOutlined />, label: 'Trả sách' },
      { key: '/extend', icon: <HistoryOutlined />, label: 'Gia hạn' },
    ],
  },
  {
    label: 'QUẢN LÝ',
    items: [
      { key: '/books', icon: <BookOutlined />, label: 'Sách' },
      { key: '/readers', icon: <TeamOutlined />, label: 'Độc giả' },
    ],
  },
  {
    label: 'BÁO CÁO & THỐNG KÊ',
    items: [
      { key: '/', icon: <BarChartOutlined />, label: 'Tổng quan' },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Báo cáo & Thống kê', '/borrow': 'Mượn sách', '/return': 'Trả sách',
  '/extend': 'Gia hạn', '/books': 'Quản lý sách',
  '/readers': 'Quản lý độc giả',
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <Layout style={{ minHeight: '100vh', background: '#F1F5F9' }}>
      {/* White Sidebar */}
      <Sider
        width={240}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{
          background: '#fff',
          borderRight: '1px solid #E2E8F0',
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
          overflow: 'auto',
        }}
      >
        {/* Brand */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          padding: collapsed ? '0 16px' : '0 20px', gap: 10,
          borderBottom: '1px solid #F1F5F9',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#0F766E', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}>
            <ReadOutlined />
          </div>
          {!collapsed && (
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0F766E', letterSpacing: -0.3 }}>
              Bookary
            </span>
          )}
        </div>

        {/* Menu */}
        <div style={{ padding: '12px 0' }}>
          {menuSections.map((section) => (
            <div key={section.label} style={{ marginBottom: 8 }}>
              {!collapsed && (
                <div style={{
                  padding: '8px 20px 4px', fontSize: 11, fontWeight: 600,
                  color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase',
                }}>
                  {section.label}
                </div>
              )}
              {section.items.map((item) => {
                const active = location.pathname === item.key;
                return (
                  <div
                    key={item.key}
                    onClick={() => navigate(item.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: collapsed ? '10px 16px' : '10px 20px',
                      margin: '2px 8px', borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 14, fontWeight: active ? 600 : 400,
                      color: active ? '#fff' : '#475569',
                      background: active ? '#0F766E' : 'transparent',
                      transition: 'all 0.15s ease-out',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F1F5F9'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom: Settings + User */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          borderTop: '1px solid #F1F5F9', padding: '12px 8px',
        }}>
          <div
            onClick={() => {}}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 16px' : '10px 20px',
              margin: '2px 0', borderRadius: 10,
              cursor: 'pointer', fontSize: 14, color: '#475569',
            }}
          >
            <SettingOutlined style={{ fontSize: 16 }} />
            {!collapsed && <span>Cài đặt</span>}
          </div>
          <Dropdown
            menu={{
              items: [
                { key: 'info', label: (<div><div style={{ fontWeight: 600 }}>{user?.tenDangNhap}</div><div style={{ fontSize: 12, color: '#94A3B8' }}>{user?.vaiTro === 'QUAN_TRI_VIEN' ? 'Quản trị viên' : 'Thủ thư'}</div></div>), disabled: true },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: handleLogout },
              ],
            }}
            placement="topRight"
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 16px' : '10px 20px',
              borderRadius: 10, cursor: 'pointer',
            }}>
              <Avatar size={28} icon={<UserOutlined />} style={{ background: '#0F766E', flexShrink: 0 }} />
              {!collapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap' }}>{user?.tenDangNhap}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                    {user?.vaiTro === 'QUAN_TRI_VIEN' ? 'Quản trị viên' : 'Thủ thư'}
                  </div>
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, background: '#F1F5F9', transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <div style={{
          height: 64, background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', borderBottom: '1px solid #E2E8F0',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Typography.Text strong style={{ fontSize: 20, color: '#1E293B' }}>
              {PAGE_TITLES[location.pathname] || 'Thư viện'}
            </Typography.Text>
            {location.pathname === '/' && (
              <Typography.Text style={{ color: '#94A3B8', fontSize: 14 }}>
                Xin chào, {user?.tenDangNhap}
              </Typography.Text>
            )}
          </div>
        </div>

        <Content style={{ padding: 20 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
