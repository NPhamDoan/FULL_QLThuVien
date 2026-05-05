import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined, ReadOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { Title, Text } = Typography;

interface LoginForm { tenDangNhap: string; matKhau: string; }

const ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: 'Tên đăng nhập không tồn tại',
  WRONG_PASSWORD: 'Mật khẩu không đúng',
  ACCOUNT_LOCKED: 'Tài khoản đã bị khóa',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: LoginForm) => {
    setError(null); setLoading(true);
    try {
      await login(values.tenDangNhap, values.matKhau);
      navigate('/', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) setError(ERROR_MESSAGES[err.response?.data?.error] || 'Đăng nhập thất bại');
      else if (err instanceof Error) setError(ERROR_MESSAGES[err.message] || err.message || 'Đăng nhập thất bại');
      else setError('Đăng nhập thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#fff', padding: 40,
    }}>
      <div style={{
        display: 'flex', maxWidth: 960, width: '100%',
        background: '#fff', borderRadius: 24,
        boxShadow: '0 4px 40px rgba(124,107,255,0.06)',
        overflow: 'hidden',
        animation: 'fadeInScale 0.5s ease-out',
      }}>
        {/* Left — Illustration */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '48px 40px',
          background: '#fff',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative blob */}
          <svg viewBox="0 0 400 400" style={{ position: 'absolute', width: '90%', height: '90%', opacity: 0.3 }}>
            <circle cx="200" cy="200" r="180" fill="#99F6E4" />
          </svg>

          {/* Book illustration using SVG */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
            <img
              src="/book-illustration.svg"
              alt="PTIT Logo"
              width={220}
              height={180}
              style={{ marginBottom: 24 }}
            />

            <Title level={3} style={{
              color: '#1E293B', margin: '0 0 8px',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
            }}>
              Khám phá Thế giới Sách
            </Title>
            <Text style={{ color: '#78716C', fontSize: 14 }}>
              Hệ thống quản lý thư viện hiện đại
            </Text>
          </div>
        </div>

        {/* Right — Form */}
        <div style={{
          width: 400, padding: '48px 44px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          animation: 'fadeInUp 0.5s ease-out 0.2s both',
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#0F766E', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>
              <ReadOutlined />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', letterSpacing: -0.3 }}>BOOKS</span>
          </div>

          {error && (
            <Alert message={error} type="error" showIcon closable
              onClose={() => setError(null)}
              style={{ marginBottom: 20, borderRadius: 12 }}
            />
          )}

          <Form<LoginForm> onFinish={onFinish} autoComplete="off" layout="vertical">
            <Form.Item
              name="tenDangNhap"
              label={<span style={{ fontSize: 13, color: '#78716C' }}>Tên đăng nhập</span>}
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#A8A29E' }} />}
                placeholder="Nhập tên đăng nhập"
                size="large"
                style={{ borderRadius: 10, height: 46, background: '#F8FAFC', border: '1px solid #E2E8F0' }}
              />
            </Form.Item>
            <Form.Item
              name="matKhau"
              label={<span style={{ fontSize: 13, color: '#78716C' }}>Mật khẩu</span>}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#A8A29E' }} />}
                placeholder="Nhập mật khẩu"
                size="large"
                style={{ borderRadius: 10, height: 46, background: '#F8FAFC', border: '1px solid #E2E8F0' }}
              />
            </Form.Item>
            <Form.Item style={{ marginTop: 4 }}>
              <Button type="primary" htmlType="submit" loading={loading} block size="large"
                style={{ height: 46, borderRadius: 10, fontSize: 15, fontWeight: 600 }}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text style={{ color: '#A8A29E', fontSize: 13 }}>
              Tài khoản mẫu 1: <span style={{ color: '#0F766E', fontWeight: 600 }}>thuthu</span> / <span style={{ color: '#0F766E', fontWeight: 600 }}>123456</span>
            </Text>
            </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text style={{ color: '#A8A29E', fontSize: 13 }}>
              Tài khoản mẫu 2: <span style={{ color: '#0F766E', fontWeight: 600 }}>admin</span> / <span style={{ color: '#0F766E', fontWeight: 600 }}>123456</span>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
