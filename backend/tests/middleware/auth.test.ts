import { Request, Response, NextFunction } from 'express';
import {
  authMiddleware,
  requireRole,
  sessionStore,
  addSession,
  removeSession,
  SessionInfo,
} from '../../middleware/auth';
import { VaiTro, TrangThaiTaiKhoan } from '../../types';

// Helper to create mock Request/Response/NextFunction
function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function createMockRes(): Response & { statusCode: number; body: any } {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
  };
  return res;
}

const sampleSession: SessionInfo = {
  maTaiKhoan: 'TK001',
  tenDangNhap: 'thuthu1',
  vaiTro: VaiTro.THU_THU,
  trangThai: TrangThaiTaiKhoan.HOAT_DONG,
};

const adminSession: SessionInfo = {
  maTaiKhoan: 'TK002',
  tenDangNhap: 'admin1',
  vaiTro: VaiTro.QUAN_TRI_VIEN,
  trangThai: TrangThaiTaiKhoan.HOAT_DONG,
};

describe('Session Store helpers', () => {
  beforeEach(() => {
    sessionStore.clear();
  });

  it('addSession stores a session', () => {
    addSession(sampleSession);
    expect(sessionStore.get('TK001')).toEqual(sampleSession);
  });

  it('removeSession deletes a session', () => {
    addSession(sampleSession);
    removeSession('TK001');
    expect(sessionStore.has('TK001')).toBe(false);
  });

  it('removeSession is a no-op for non-existent key', () => {
    expect(() => removeSession('NONEXISTENT')).not.toThrow();
  });
});

describe('authMiddleware', () => {
  beforeEach(() => {
    sessionStore.clear();
  });

  it('returns 401 when no Authorization header', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Không có token xác thực');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header does not start with Bearer', () => {
    const req = createMockReq({ headers: { authorization: 'Basic abc' } as any });
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is not in session store', () => {
    const req = createMockReq({ headers: { authorization: 'Bearer INVALID_TOKEN' } as any });
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Token không hợp lệ hoặc phiên đã hết hạn');
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches user to req and calls next() for valid token', () => {
    addSession(sampleSession);
    const req = createMockReq({ headers: { authorization: 'Bearer TK001' } as any });
    const res = createMockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(req.user).toEqual(sampleSession);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('requireRole', () => {
  beforeEach(() => {
    sessionStore.clear();
  });

  it('returns 403 when user has wrong role', () => {
    const middleware = requireRole(VaiTro.QUAN_TRI_VIEN);
    const req = createMockReq();
    (req as any).user = sampleSession; // THU_THU
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Không có quyền truy cập');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when no user on request', () => {
    const middleware = requireRole(VaiTro.QUAN_TRI_VIEN);
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when user has correct role', () => {
    const middleware = requireRole(VaiTro.QUAN_TRI_VIEN);
    const req = createMockReq();
    (req as any).user = adminSession;
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next() for THU_THU role check with THU_THU user', () => {
    const middleware = requireRole(VaiTro.THU_THU);
    const req = createMockReq();
    (req as any).user = sampleSession;
    const res = createMockRes();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
