import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BorrowPage from './pages/BorrowPage';
import ReturnPage from './pages/ReturnPage';
import ExtendPage from './pages/ExtendPage';
import ReadersPage from './pages/ReadersPage';
import BooksPage from './pages/BooksPage';

export default function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#0F766E',
          colorSuccess: '#16A34A',
          colorWarning: '#D97706',
          colorError: '#DC2626',
          colorInfo: '#2563EB',
          borderRadius: 10,
          fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
          fontSize: 14,
          colorBgContainer: '#ffffff',
          colorBgLayout: '#F1F5F9',
          colorBorder: '#E2E8F0',
          colorBorderSecondary: '#CBD5E1',
          colorText: '#1E293B',
          colorTextSecondary: '#64748B',
        },
        components: {
          Button: { controlHeight: 40, fontWeight: 600 },
          Card: { borderRadiusLG: 12 },
          Table: { headerBg: '#F8FAFC', headerColor: '#64748B', borderColor: '#E2E8F0' },
          Input: { controlHeight: 40 },
          Menu: { darkItemBg: '#fff', darkSubMenuItemBg: '#fff', darkItemSelectedBg: '#0F766E' },
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/borrow" element={<BorrowPage />} />
                <Route path="/return" element={<ReturnPage />} />
                <Route path="/extend" element={<ExtendPage />} />
                <Route path="/readers" element={<ReadersPage />} />
                <Route path="/books" element={<BooksPage />} />
                <Route path="/reports" element={<DashboardPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
