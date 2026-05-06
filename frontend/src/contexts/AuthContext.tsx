import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { authApi } from '../services/api';
import { type VaiTroType } from '../constants';

export interface UserInfo {
  maTaiKhoan: string;
  tenDangNhap: string;
  vaiTro: VaiTroType;
}

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (tenDangNhap: string, matKhau: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'lms_user';

function loadUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(loadUser);

  const login = useCallback(async (tenDangNhap: string, matKhau: string) => {
    const { data } = await authApi.login(tenDangNhap, matKhau);
    if (data.success && data.taiKhoan) {
      const userInfo: UserInfo = {
        maTaiKhoan: data.taiKhoan.maTaiKhoan,
        tenDangNhap: data.taiKhoan.tenDangNhap,
        vaiTro: data.taiKhoan.vaiTro,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
      setUser(userInfo);
    } else {
      throw new Error(data.error || 'Đăng nhập thất bại');
    }
  }, []);

  const logout = useCallback(async () => {
    if (user) {
      try {
        await authApi.logout(user.maTaiKhoan);
      } catch {
        // ignore logout API errors
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
