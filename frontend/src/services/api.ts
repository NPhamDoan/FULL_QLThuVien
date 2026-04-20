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

// Book APIs
export const bookApi = {
  list: () =>
    api.get('/books'),
  search: (params: { tieuDe?: string; tacGia?: string; maSach?: string; keyword?: string; tinhTrang?: string }) =>
    api.get('/books/search', { params }),
  create: (data: { tieuDe: string; tacGia: string }) =>
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
  returnBook: (id: string) =>
    api.post(`/loans/${id}/return`),
  extend: (id: string) =>
    api.post(`/loans/${id}/extend`),
};

// Report APIs
export const reportApi = {
  getOverdue: () => api.get('/reports/overdue'),
  getInventory: () => api.get('/reports/inventory'),
};

export default api;
