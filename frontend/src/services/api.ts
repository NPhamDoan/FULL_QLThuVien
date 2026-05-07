import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach auth token from localStorage
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('lms_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.maTaiKhoan) {
        config.headers.Authorization = `Bearer ${user.maTaiKhoan}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

// Auth APIs
export const authApi = {
  login: (tenDangNhap: string, matKhau: string) =>
    api.post('/auth/login', { tenDangNhap, matKhau }),
  logout: (maTaiKhoan: string) =>
    api.post('/auth/logout', { maTaiKhoan }),
};

// Account Management APIs
export const accountApi = {
  list: () => api.get('/auth/accounts'),
  create: (data: { tenDangNhap: string; matKhau: string; vaiTro: string }) =>
    api.post('/auth/accounts', data),
  updateStatus: (id: string, trangThai: string) =>
    api.put(`/auth/accounts/${id}/status`, { trangThai }),
  resetPassword: (id: string, matKhau: string) =>
    api.put(`/auth/accounts/${id}/password`, { matKhau }),
  delete: (id: string) =>
    api.delete(`/auth/accounts/${id}`),
};

// Backup APIs (admin only)
export const backupApi = {
  list: () => api.get('/backups'),
  create: () => api.post('/backups/create'),
  download: async (name: string) => {
    const { data } = await api.get(`/backups/download/${encodeURIComponent(name)}`, {
      responseType: 'blob',
    });
    // Trigger browser download
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

// Book APIs
export const bookApi = {
  list: () =>
    api.get('/books'),
  search: (params: { tieuDe?: string; tacGia?: string; maSach?: string; keyword?: string; tinhTrang?: string }) =>
    api.get('/books/search', { params }),
  create: (data: { tieuDe: string; tacGia: string; soBanSao?: number }) =>
    api.post('/books', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/books/${id}`, data),
  delete: (id: string) =>
    api.delete(`/books/${id}`),
};

// Reader APIs
export const readerApi = {
  list: () =>
    api.get('/readers'),
  getById: (id: string) =>
    api.get(`/readers/${id}`),
  search: (keyword: string) =>
    api.get('/readers/search', { params: { keyword } }),
  create: (data: Record<string, unknown>) =>
    api.post('/readers', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/readers/${id}`, data),
  delete: (id: string) =>
    api.delete(`/readers/${id}`),
};

// Loan APIs
export const loanApi = {
  list: (search?: string, searchType?: string) =>
    api.get('/loans', { params: { ...(search ? { search } : {}), ...(searchType ? { searchType } : {}) } }),
  create: (maDocGia: string, maSach: string) =>
    api.post('/loans', { maDocGia, maSach }),
  getById: (id: string) =>
    api.get(`/loans/${id}`),
  getDetails: (id: string) =>
    api.get(`/loans/${id}/details`),
  returnBook: (id: string, options?: { daMatSach?: boolean; phiMat?: number }) =>
    api.post(`/loans/${id}/return`, options || {}),
  extend: (id: string) =>
    api.post(`/loans/${id}/extend`),
};

// Report APIs
export const reportApi = {
  getOverdue: () => api.get('/reports/overdue'),
  getInventory: () => api.get('/reports/inventory'),
};

export default api;
