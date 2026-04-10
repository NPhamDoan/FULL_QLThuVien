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
      background: '#F1F5F9', padding: 40,
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
          background: 'linear-gradient(180deg, #F8FAFC 0%, #E2E8F0 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative blob */}
          <svg viewBox="0 0 400 400" style={{ position: 'absolute', width: '120%', height: '120%', opacity: 0.3 }}>
            <path d="M200,20 C300,20 380,100 380,200 C380,300 300,380 200,380 C100,380 20,300 20,200 C20,100 100,20 200,20 Z"
              fill="#99F6E4" />
          </svg>

          {/* Book illustration using SVG */}
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
            <svg width="220" height="180" viewBox="0 0 220 180" fill="none" style={{ marginBottom: 24 }}>
              {/* Open book */}
              <path d="M30 140 L110 120 L110 30 L30 50 Z" fill="#CBD5E1" stroke="#0F766E" strokeWidth="2"/>
              <path d="M190 140 L110 120 L110 30 L190 50 Z" fill="#E2E8F0" stroke="#0F766E" strokeWidth="2"/>
              {/* Book spine */}
              <line x1="110" y1="30" x2="110" y2="120" stroke="#0F766E" strokeWidth="2"/>
              {/* Page lines left */}
              <line x1="50" y1="65" x2="95" y2="55" stroke="#5EEAD4" strokeWidth="1.5" opacity="0.5"/>
              <line x1="50" y1="80" x2="95" y2="70" stroke="#5EEAD4" strokeWidth="1.5" opacity="0.5"/>
              <line x1="50" y1="95" x2="95" y2="85" stroke="#5EEAD4" strokeWidth="1.5" opacity="0.5"/>
              <line x1="50" y1="110" x2="80" y2="103" stroke="#5EEAD4" strokeWidth="1.5" opacity="0.5"/>
              {/* Page lines right */}
              <line x1="125" y1="55" x2="170" y2="65" stroke="#5EEAD4" strokeWidth="1.5" opacity="0.5"/>
              <line x1="125" y1="70" x2="170" y2="80" stroke="#5EEAD4" strokeWidth="1.5" opacity="0.5"/>
              <line x1="125" y1="85" x2="170" y2="95" stroke="#5EEAD4" strokeWidth="1.5" opacity="0.5"/>
              {/* Floating elements */}
              <circle cx="45" cy="25" r="6" fill="#5EEAD4" opacity="0.4"/>
              <circle cx="175" cy="20" r="4" fill="#0F766E" opacity="0.3"/>
              <rect x="160" y="35" width="12" height="12" rx="2" fill="#CBD5E1" transform="rotate(15 166 41)"/>
              {/* Light bulb */}
              <circle cx="110" cy="12" r="8" fill="none" stroke="#0F766E" strokeWidth="1.5"/>
              <line x1="110" y1="4" x2="110" y2="0" stroke="#0F766E" strokeWidth="1.5"/>
              <line x1="104" y1="6" x2="101" y2="3" stroke="#0F766E" strokeWidth="1"/>
              <line x1="116" y1="6" x2="119" y2="3" stroke="#0F766E" strokeWidth="1"/>
              {/* Chat bubbles */}
              <rect x="15" y="100" width="20" height="14" rx="4" fill="#0F766E"/>
              <rect x="170" y="100" width="24" height="14" rx="4" fill="#0F766E"/>
              {/* Heart */}
              <path d="M170 25 C170 22 174 20 176 22 C178 20 182 22 182 25 C182 30 176 33 176 33 C176 33 170 30 170 25Z" fill="#5EEAD4" opacity="0.5"/>
            </svg>

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
              Tài khoản mẫu: <span style={{ color: '#0F766E', fontWeight: 600 }}>thuthu</span> / <span style={{ color: '#0F766E', fontWeight: 600 }}>123456</span>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
