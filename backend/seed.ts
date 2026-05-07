import { initializeDatabase } from './database';
import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import { VaiTro, TrangThaiTaiKhoan, TrangThaiPhieu } from './types';

export function seedDatabase(db: Database.Database) {
  // Clear existing data (order matters for FK)
  db.exec('DELETE FROM PhieuMuon');
  db.exec('DELETE FROM Sach');
  db.exec('DELETE FROM DocGia');
  db.exec('DELETE FROM TaiKhoan');

  // === Tài khoản ===
  const hashedPass = bcrypt.hashSync('123456', 10);

  db.prepare(`
    INSERT INTO TaiKhoan (maTaiKhoan, tenDangNhap, matKhau, vaiTro, trangThai)
    VALUES (?, ?, ?, ?, ?)
  `).run('TK001', 'thuthu', hashedPass, VaiTro.THU_THU, TrangThaiTaiKhoan.HOAT_DONG);

  db.prepare(`
    INSERT INTO TaiKhoan (maTaiKhoan, tenDangNhap, matKhau, vaiTro, trangThai)
    VALUES (?, ?, ?, ?, ?)
  `).run('TK002', 'admin', hashedPass, VaiTro.QUAN_TRI_VIEN, TrangThaiTaiKhoan.HOAT_DONG);

  // === Độc giả ===
  const readers = [
    ['DG001', 'Nguyễn Văn An', 'an@email.com', '0901000001', '2027-12-31'],
    ['DG002', 'Trần Thị Bình', 'binh@email.com', '0901000002', '2027-06-30'],
    ['DG003', 'Lê Văn Cường', 'cuong@email.com', '0901000003', '2026-03-15'],
    ['DG004', 'Phạm Thị Dung', 'dung@email.com', '0901000004', '2025-01-01'],
    ['DG005', 'Hoàng Văn Em', 'em@email.com', '0901000005', '2027-09-30'],
    ['DG006', 'Võ Thị Phương', 'phuong@email.com', '0901000006', '2027-08-15'],
    ['DG007', 'Đặng Văn Giang', 'giang@email.com', '0901000007', '2027-11-20'],
    ['DG008', 'Bùi Thị Hạnh', 'hanh@email.com', '0901000008', '2026-07-01'],
    ['DG009', 'Ngô Văn Ích', 'ich@email.com', '0901000009', '2027-04-10'],
    ['DG010', 'Đỗ Thị Kim', 'kim@email.com', '0901000010', '2027-02-28'],
    ['DG011', 'Lý Văn Lâm', 'lam@email.com', '0901000011', '2026-12-31'],
    ['DG012', 'Trương Thị Mai', 'mai@email.com', '0901000012', '2027-05-15'],
    ['DG013', 'Đinh Văn Nam', 'nam@email.com', '0901000013', '2027-10-01'],
    ['DG014', 'Cao Thị Oanh', 'oanh@email.com', '0901000014', '2026-09-20'],
    ['DG015', 'Dương Văn Phúc', 'phuc@email.com', '0901000015', '2027-01-15'],
    ['DG016', 'Hà Thị Quyên', 'quyen@email.com', '0901000016', '2027-07-30'],
    ['DG017', 'Vũ Văn Rồng', 'rong@email.com', '0901000017', '2026-06-01'],
    ['DG018', 'Mai Thị Sơn', 'son@email.com', '0901000018', '2027-03-25'],
    ['DG019', 'Tăng Văn Tài', 'tai@email.com', '0901000019', '2025-06-01'],
    ['DG020', 'Lưu Thị Uyên', 'uyen@email.com', '0901000020', '2027-08-08'],
    ['DG021', 'Châu Văn Vinh', 'vinh@email.com', '0901000021', '2026-11-11'],
    ['DG022', 'Trịnh Thị Xuân', 'xuan@email.com', '0901000022', '2027-12-25'],
  ];

  const insertReader = db.prepare(`
    INSERT INTO DocGia (maDocGia, hoTen, email, soDienThoai, ngayHetHan)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const r of readers) insertReader.run(...r);

  // === Sách ===
  // Format: [maSach, tieuDe, tacGia, soBanSao, soMat, soBaoTri]
  // Các đầu sách phổ biến có nhiều bản sao để demo tính năng
  const books: [string, string, string, number, number, number][] = [
    ['S001', 'Lập trình TypeScript', 'Nguyễn Minh Tuấn', 5, 0, 0],           // sách hot, 5 bản
    ['S002', 'Cấu trúc dữ liệu và giải thuật', 'Trần Quốc Bảo', 8, 0, 1],    // giáo trình, 8 bản, 1 bảo trì
    ['S003', 'Nhập môn Machine Learning', 'Lê Hoàng Nam', 4, 0, 0],          // 4 bản
    ['S004', 'Thiết kế hệ thống phần mềm', 'Phạm Văn Hòa', 3, 0, 0],         // 3 bản (1 đang mượn PM001)
    ['S005', 'Lập trình Web với React', 'Võ Thị Lan', 6, 0, 0],              // sách hot, 6 bản
    ['S006', 'Cơ sở dữ liệu nâng cao', 'Nguyễn Đức Thành', 4, 0, 0],
    ['S007', 'Mạng máy tính', 'Trần Văn Hùng', 5, 0, 2],                     // 5 bản, 2 đang bảo trì
    ['S008', 'Trí tuệ nhân tạo', 'Lê Minh Đức', 3, 0, 0],
    ['S009', 'Hệ điều hành Linux', 'Phạm Quốc Việt', 2, 1, 0],               // mất 1 bản
    ['S010', 'Python cho Data Science', 'Hoàng Thị Mai', 7, 0, 0],           // sách hot, 7 bản (1 đang mượn PM002)
    ['S011', 'Java Spring Boot', 'Nguyễn Văn Tùng', 3, 0, 0],
    ['S012', 'Docker và Kubernetes', 'Trần Minh Quang', 4, 0, 0],
    ['S013', 'Lập trình C++ hiện đại', 'Lê Thị Hoa', 3, 0, 0],
    ['S014', 'Angular từ cơ bản đến nâng cao', 'Phạm Đức Long', 2, 0, 0],
    ['S015', 'Node.js và Express', 'Võ Văn Thành', 5, 0, 0],                 // 5 bản (1 đang mượn PM005)
    ['S016', 'Toán rời rạc', 'Nguyễn Thị Nga', 6, 0, 0],                     // giáo trình, 6 bản
    ['S017', 'Xử lý ảnh số', 'Trần Văn Đạt', 3, 0, 1],                       // 1 bảo trì
    ['S018', 'Lập trình di động với Flutter', 'Lê Văn Hải', 2, 0, 0],
    ['S019', 'An toàn thông tin', 'Phạm Thị Loan', 4, 0, 0],
    ['S020', 'Kiến trúc vi dịch vụ', 'Hoàng Văn Đức', 2, 0, 0],
    ['S021', 'Phân tích dữ liệu với R', 'Võ Thị Hương', 3, 0, 0],
    ['S022', 'Blockchain và ứng dụng', 'Nguyễn Quốc Anh', 2, 1, 0],          // mất 1
    ['S023', 'DevOps thực hành', 'Trần Thị Thảo', 4, 0, 0],
    ['S024', 'Lập trình game với Unity', 'Lê Đức Minh', 2, 0, 0],
    ['S025', 'SQL Server nâng cao', 'Phạm Văn Khánh', 3, 0, 0],
  ];

  const insertBook = db.prepare(`
    INSERT INTO Sach (maSach, tieuDe, tacGia, soBanSao, soMat, soBaoTri)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const b of books) insertBook.run(...b);

  // === Phiếu mượn ===
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  // Phiếu đang mượn - quá hạn (S004)
  const pastDue1 = new Date(today);
  pastDue1.setDate(pastDue1.getDate() - 20);
  const pastDue1Han = new Date(pastDue1);
  pastDue1Han.setDate(pastDue1Han.getDate() + 14);
  db.prepare(`
    INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('PM001', 'DG001', 'S004', fmt(pastDue1), fmt(pastDue1Han), TrangThaiPhieu.DANG_MUON);

  // Phiếu đang mượn - quá hạn (S010)
  const pastDue2 = new Date(today);
  pastDue2.setDate(pastDue2.getDate() - 30);
  const pastDue2Han = new Date(pastDue2);
  pastDue2Han.setDate(pastDue2Han.getDate() + 14);
  db.prepare(`
    INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('PM002', 'DG002', 'S010', fmt(pastDue2), fmt(pastDue2Han), TrangThaiPhieu.DANG_MUON);

  // Phiếu đang mượn - chưa quá hạn (S015)
  const recent = new Date(today);
  recent.setDate(recent.getDate() - 5);
  const recentHan = new Date(recent);
  recentHan.setDate(recentHan.getDate() + 14);
  db.prepare(`
    INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('PM005', 'DG006', 'S015', fmt(recent), fmt(recentHan), TrangThaiPhieu.DANG_MUON);

  // Phiếu đã trả
  db.prepare(`
    INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, ngayTraThucTe, tienPhat)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('PM003', 'DG003', 'S001', '2025-02-01', '2025-02-15', TrangThaiPhieu.DA_TRA, '2025-02-14', 0);

  // Phiếu đã trả - có phạt
  db.prepare(`
    INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, ngayTraThucTe, tienPhat)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('PM004', 'DG005', 'S002', '2025-01-10', '2025-01-24', TrangThaiPhieu.DA_TRA, '2025-01-27', 15000);

  console.log('Seed data created successfully!');
  console.log('');
  console.log('Tài khoản đăng nhập:');
  console.log('  Thủ thư:       thuthu / 123456');
  console.log('  Quản trị viên: admin / 123456');
  console.log('');
  console.log('Độc giả: DG001 - DG022 (22 người)');
  console.log('Sách: S001 - S025 (25 đầu sách, tổng ~90 bản sao)');
  console.log('  - Sách nhiều bản: S002 (8), S010 (7), S005 (6), S016 (6), S001 (5), S007 (5), S015 (5)');
  console.log('  - Có bảo trì: S002 (1), S007 (2), S017 (1)');
  console.log('  - Có mất: S009 (1), S022 (1)');
  console.log('Phiếu mượn: PM001-PM005 (3 đang mượn, 2 đã trả)');
}

// Run standalone: npx ts-node seed.ts
if (require.main === module) {
  const db = initializeDatabase('./Database/dev.db');
  seedDatabase(db);
  db.close();
}
