# Phần 5: Frontend deep-dive

**Mục tiêu:** Hiểu routing, state, API client, auth guard để debug frontend.

---

## 5.1. Entry point

`frontend/src/main.tsx`:
```tsx
import App from './App';
createRoot(document.getElementById('root')!).render(<App />);
```

`frontend/src/App.tsx` — nơi setup toàn bộ:
- `ConfigProvider` (Ant Design theme + locale tiếng Việt)
- `AuthProvider` (context login/logout)
- `BrowserRouter` (routing)
- Define routes

## 5.2. Routing

```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />

  <Route element={<ProtectedRoute />}>           {/* Check đã login chưa */}
    <Route element={<MainLayout />}>              {/* Sidebar + Header */}
      <Route path="/" element={<DashboardPage />} />
      <Route path="/borrow" element={<BorrowPage />} />
      <Route path="/return" element={<ReturnPage />} />
      <Route path="/extend" element={<ExtendPage />} />
      <Route path="/readers" element={<ReadersPage />} />
      <Route path="/books" element={<BooksPage />} />

      <Route element={<ProtectedRoute requiredRole={VaiTro.QUAN_TRI_VIEN} />}>
        <Route path="/accounts" element={<AccountsPage />} />   {/* Admin only */}
      </Route>
    </Route>
  </Route>

  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

**Cấu trúc lồng:**
1. `/login` — public
2. Mọi route khác bọc trong `ProtectedRoute` (check auth) + `MainLayout` (sidebar)
3. `/accounts` bọc thêm `ProtectedRoute requiredRole` (check admin)
4. `*` fallback → redirect về `/`

### ProtectedRoute

`frontend/src/components/ProtectedRoute.tsx`:

```tsx
export default function ProtectedRoute({ requiredRole }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user?.vaiTro !== requiredRole) return <Navigate to="/" replace />;
  return <Outlet />;
}
```

## 5.3. Authentication state

`frontend/src/contexts/AuthContext.tsx` — state user global:

```tsx
interface UserInfo {
  maTaiKhoan: string;
  tenDangNhap: string;
  vaiTro: 'THU_THU' | 'QUAN_TRI_VIEN';
}

// State lưu trong localStorage, key = 'lms_user'
function loadUser(): UserInfo | null {
  const raw = localStorage.getItem('lms_user');
  return raw ? JSON.parse(raw) : null;
}
```

Context cung cấp:
- `user` — thông tin đăng nhập hoặc null
- `isAuthenticated` — có user không
- `login(tenDN, matKhau)` — gọi API, lưu localStorage
- `logout()` — xóa localStorage, gọi API logout

Dùng ở bất kỳ component con nào:
```tsx
const { user, logout } = useAuth();
```

## 5.4. API client

`frontend/src/services/api.ts` — tập trung mọi API call:

```ts
const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : '',  // Dev: '/api' (Vite proxy). Prod: '' (cùng origin)
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor tự gắn auth header
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('lms_user') || 'null');
  if (user?.maTaiKhoan) config.headers.Authorization = `Bearer ${user.maTaiKhoan}`;
  return config;
});

export const authApi = {
  login: (tenDangNhap, matKhau) => api.post('/auth/login', { tenDangNhap, matKhau }),
  logout: (maTaiKhoan) => api.post('/auth/logout', { maTaiKhoan }),
};

export const bookApi = { list, search, create, update, delete: ... };
export const readerApi = { ... };
export const loanApi = { list, create, returnBook, extend, ... };
export const reportApi = { getOverdue, getInventory };
export const accountApi = { list, create, updateStatus, resetPassword, delete };
```

**Quy ước:** Page component chỉ gọi `xxxApi.method()`, không gọi `axios` trực tiếp. Dễ refactor khi đổi endpoint.

## 5.5. Layout

`frontend/src/layouts/MainLayout.tsx` — sidebar + header chung cho mọi trang sau login.

**Sidebar** chia 3 nhóm:
```
MENU CHÍNH:            Mượn, Trả, Gia hạn
QUẢN LÝ:               Sách, Độc giả, Tài khoản (admin only)
BÁO CÁO & THỐNG KÊ:    Tổng quan
```

Menu build động theo role:
```tsx
const getMenuSections = (vaiTro?: string) => {
  return [
    ...
    {
      label: 'QUẢN LÝ',
      items: [
        { key: '/books', ... },
        { key: '/readers', ... },
        ...(vaiTro === VaiTro.QUAN_TRI_VIEN
          ? [{ key: '/accounts', ... }]
          : []),
      ],
    },
    ...
  ];
};
```

Header: hiển thị `PAGE_TITLES[location.pathname]` (map path → title Việt hóa).

## 5.6. Page pattern

Hầu hết page đều theo pattern state + effect:

```tsx
export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data } = await bookApi.list();
      setBooks(data);
    } catch { setError('...'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBooks(); }, []);

  return <Table dataSource={books} loading={loading} ... />;
}
```

### Pattern 3 phases (Borrow/Return/Extend)

3 pages này có chung pattern "search → chọn → xác nhận":

```tsx
const [selected, setSelected] = useState(null);
const [result, setResult] = useState(null);

// Phase 1: search
if (!selected && !result) return <SearchTable onSelect={setSelected} />;

// Phase 2: confirm
if (selected && !result) return <ConfirmCard onConfirm={handleSubmit} />;

// Phase 3: result
if (result) return <ResultCard onReset={handleReset} />;
```

`LoanSearchTable` component tái sử dụng cho Return + Extend (fix #4 trước).

## 5.7. Ant Design usage

App dùng Ant Design 6 — tất cả UI component (Table, Form, Modal, Card) đều từ đây.

**Theme** định nghĩa trong `App.tsx`:

```tsx
theme={{
  token: {
    colorPrimary: '#0F766E',   // Teal chính
    borderRadius: 10,
    fontFamily: "'Plus Jakarta Sans', ...",
    // ...
  },
  components: {
    Button: { controlHeight: 40 },
    Card: { borderRadiusLG: 12 },
    // ...
  },
}}
```

Đổi màu brand: chỉnh `colorPrimary`.

**Locale:** `locale={viVN}` — DatePicker, Pagination, Empty state... tự dịch tiếng Việt.

**Form pattern:**

```tsx
const [form] = Form.useForm();

<Form form={form} onFinish={handleSubmit} layout="vertical">
  <Form.Item name="tieuDe" label="Tiêu đề" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
  <Button htmlType="submit">Lưu</Button>
</Form>
```

`form.resetFields()` để reset sau submit.

## 5.8. Error handling frontend

Mọi API call đều wrap try/catch, extract message từ error:

```tsx
try {
  await bookApi.create(values);
  message.success('Tạo thành công');
} catch (err) {
  if (axios.isAxiosError(err)) {
    message.error(err.response?.data?.error || 'Lỗi');
  } else {
    message.error('Lỗi không xác định');
  }
}
```

Ant Design `message.xxx()` hiện toast tạm thời ở góc trên.

## 5.9. Constants và Types

- `frontend/src/constants.ts` — mirror enum từ backend:

```ts
export const VaiTro = { THU_THU: 'THU_THU', QUAN_TRI_VIEN: 'QUAN_TRI_VIEN' } as const;
export const TrangThaiPhieu = { DANG_MUON: 'DANG_MUON', DA_TRA: 'DA_TRA' } as const;
export const TrangThaiTaiKhoan = { HOAT_DONG: 'HOAT_DONG', BI_KHOA: 'BI_KHOA' } as const;
export type VaiTroType = typeof VaiTro[keyof typeof VaiTro];
```

Dùng `VaiTro.QUAN_TRI_VIEN` thay vì `'QUAN_TRI_VIEN'` khắp codebase. (Đã bỏ `TinhTrangSach` enum sau Cách A refactor.)

**Lý do duplicate từ backend:** FE và BE build riêng, không share code. Muốn share phải setup monorepo hoặc npm workspace — thêm phức tạp không cần thiết cho project nhỏ.

## 5.10. Vite config

`frontend/vite.config.ts`:

```ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

**Chỉ có tác dụng khi `pnpm run dev`:**
- Gọi `/api/books` → Vite forward sang `http://localhost:3000/books`
- Tránh CORS khi dev (2 port khác nhau)

**Production không cần config này** vì chỉ có 1 server (Express).

### Environment-based assets

Login page chọn ảnh theo mode:
```tsx
<img src={import.meta.env.DEV ? '/book-illustration.svg' : '/ptit.png'} />
```
- `import.meta.env.DEV === true` trong `pnpm run dev`
- `false` khi `pnpm run build`

## 5.11. Print receipt

File `frontend/src/components/LoanReceipt.tsx`:

```tsx
<LoanReceipt data={{ maPhieu, ngayMuon, hanTra, docGia, sach, thuThu }} />
```

Component ẩn hoàn toàn trên màn hình (`display: none`), chỉ hiện khi in (`@media print`). Trigger bằng `window.print()`.

Dùng ở:
- **BorrowPage** — sau khi tạo phiếu xong, button "In phiếu mượn"
- **ReturnPage/ExtendPage** — icon 🖨 ở mỗi row trong LoanSearchTable (gọi `loanApi.getDetails(id)` rồi print)

## 5.12. Debug tricks

### Xem request frontend gửi đi
Mở DevTools → Network tab → click request → xem Headers, Payload, Response.

### State không update?
Check: có dùng `setXxx` không? `useEffect` đúng dependency chưa? Mutate trực tiếp state (`state.push(...)`) là anti-pattern.

### Route redirect loop?
Thường do `ProtectedRoute` → `Navigate to="/"` → `/` lại check authen fail → loop. Check `isAuthenticated` logic.

### Ant Design component không hoạt động?
Check đã wrap `<ConfigProvider>` chưa. Locale của DatePicker cần `locale={viVN}`.

### localStorage stale?
Logout không xóa token → `localStorage.clear()` trong console.

---

## Tóm tắt phần 5

- Routing lồng: ProtectedRoute → MainLayout → Page
- Auth state trong `AuthContext`, persist qua localStorage
- Mọi API gọi qua `services/api.ts`, không dùng axios trực tiếp
- Ant Design cho UI, theme trong App.tsx
- Pattern chung: state + useEffect fetch + try/catch + message.error
- Enum mirror trong `constants.ts`

**Phần tiếp theo (6):** Debug & Deploy — cách tìm bug, chạy test, deploy lên Render.
