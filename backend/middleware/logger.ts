import { Request, Response, NextFunction } from 'express';

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function statusColor(status: number): string {
  if (status >= 500) return COLORS.red;
  if (status >= 400) return COLORS.yellow;
  return COLORS.green;
}

/**
 * Request logger middleware
 * Logs: method, path, status, response time
 * Control via LOG_LEVEL env: "debug" | "info" (default) | "error" | "off"
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const level = (process.env.LOG_LEVEL || 'info').toLowerCase();
  if (level === 'off') { next(); return; }

  // Skip static file requests
  if (!req.path.startsWith('/auth') && !req.path.startsWith('/readers') &&
      !req.path.startsWith('/books') && !req.path.startsWith('/loans') &&
      !req.path.startsWith('/reports')) {
    next();
    return;
  }

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const sc = statusColor(res.statusCode);
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });

    // "error" level: only log 4xx/5xx
    if (level === 'error' && res.statusCode < 400) return;

    console.log(
      `${COLORS.dim}${timestamp}${COLORS.reset} ${COLORS.cyan}${req.method.padEnd(6)}${COLORS.reset} ${req.originalUrl} ${sc}${res.statusCode}${COLORS.reset} ${COLORS.dim}${duration}ms${COLORS.reset}`
    );

    // Log request body for POST/PUT on error, or always in debug mode
    if ((res.statusCode >= 400 || level === 'debug') && (req.method === 'POST' || req.method === 'PUT')) {
      const body = { ...req.body };
      if (body.matKhau) body.matKhau = '***';
      console.log(`  ${COLORS.dim}body:${COLORS.reset}`, JSON.stringify(body));
    }
  });

  next();
}

/**
 * Error logger middleware (place after routes)
 */
export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction): void {
  const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  console.error(`${COLORS.red}${timestamp} ERROR${COLORS.reset} ${req.method} ${req.originalUrl}`);
  console.error(`  ${err.stack || err.message}`);

  if (!res.headersSent) {
    res.status(500).json({ error: 'Lỗi hệ thống' });
  } else {
    next(err);
  }
}
