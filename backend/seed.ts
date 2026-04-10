import { initializeDatabase } from './database';
import bcrypt from 'bcrypt';

async function seed() {
  const db = initializeDatabase('./Database/dev.db');

  // Clear existing data (order matters for FK)
  db.exec('DELETE FROM PhieuMuon');
  db.exec('DELETE FROM Sach');
  db.exec('DELETE FROM DocGia');
  db.exec('DELETE FROM TaiKhoan');

  // === Tài khoản ===
  const hashedPass = await bcrypt.hash('123456', 10);

  db.prepare(`
    INSERT INTO TaiKhoan (maTaiKhoan, tenDangNhap, matKhau, vaiTro, trangThai)
    VALUES (?, ?, ?, ?, ?)
  `).run('TK001', 'thuthu', hashedPass, 'THU_THU', 'HOAT_DONG');

  db.prepare(`
    INSERT INTO TaiKhoan (maTaiKhoan, tenDangNhap, matKhau, vaiTro, trangThai)
    VALUES (?, ?, ?, ?, ?)
  `).run('TK002', 'admin', hashedPass, 'QUAN_TRI_VIEN', 'HOAT_DONG');

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
  const books = [
    ['S001', 'Lập trình TypeScript', 'Nguyễn Minh Tuấn', 'SAN_SANG'],
    ['S002', 'Cấu trúc dữ liệu và giải thuật', 'Trần Quốc Bảo', 'SAN_SANG'],
    ['S003', 'Nhập môn Machine Learning', 'Lê Hoàng Nam', 'SAN_SANG'],
    ['S004', 'Thiết kế hệ thống phần mềm', 'Phạm Văn Hòa', 'DA_MUON'],
    ['S005', 'Lập trình Web với React', 'Võ Thị Lan', 'SAN_SANG'],
    ['S006', 'Cơ sở dữ liệu nâng cao', 'Nguyễn Đức Thành', 'SAN_SANG'],
    ['S007', 'Mạng máy tính', 'Trần Văn Hùng', 'BAO_TRI'],
    ['S008', 'Trí tuệ nhân tạo', 'Lê Minh Đức', 'SAN_SANG'],
    ['S009', 'Hệ điều hành Linux', 'Phạm Quốc Việt', 'MAT'],
    ['S010', 'Python cho Data Science', 'Hoàng Thị Mai', 'DA_MUON'],
    ['S011', 'Java Spring Boot', 'Nguyễn Văn Tùng', 'SAN_SANG'],
    ['S012', 'Docker và Kubernetes', 'Trần Minh Quang', 'SAN_SANG'],
    ['S013', 'Lập trình C++ hiện đại', 'Lê Thị Hoa', 'SAN_SANG'],
    ['S014', 'Angular từ cơ bản đến nâng cao', 'Phạm Đức Long', 'SAN_SANG'],
    ['S015', 'Node.js và Express', 'Võ Văn Thành', 'DA_MUON'],
    ['S016', 'Toán rời rạc', 'Nguyễn Thị Nga', 'SAN_SANG'],
    ['S017', 'Xử lý ảnh số', 'Trần Văn Đạt', 'BAO_TRI'],
    ['S018', 'Lập trình di động với Flutter', 'Lê Văn Hải', 'SAN_SANG'],
    ['S019', 'An toàn thông tin', 'Phạm Thị Loan', 'SAN_SANG'],
    ['S020', 'Kiến trúc vi dịch vụ', 'Hoàng Văn Đức', 'SAN_SANG'],
    ['S021', 'Phân tích dữ liệu với R', 'Võ Thị Hương', 'SAN_SANG'],
    ['S022', 'Blockchain và ứng dụng', 'Nguyễn Quốc Anh', 'MAT'],
    ['S023', 'DevOps thực hành', 'Trần Thị Thảo', 'SAN_SANG'],
    ['S024', 'Lập trình game với Unity', 'Lê Đức Minh', 'SAN_SANG'],
    ['S025', 'SQL Server nâng cao', 'Phạm Văn Khánh', 'SAN_SANG'],
  ];

  const insertBook = db.prepare(`
    INSERT INTO Sach (maSach, tieuDe, tacGia, tinhTrang)
    VALUES (?, ?, ?, ?)
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
  `).run('PM001', 'DG001', 'S004', fmt(pastDue1), fmt(pastDue1Han), 'DANG_MUON');

  // Phiếu đang mượn - quá hạn (S010)
  const pastDue2 = new Date(today);
  pastDue2.setDate(pastDue2.getDate() - 30);
  const pastDue2Han = new Date(pastDue2);
  pastDue2Han.setDate(pastDue2Han.getDate() + 14);
  db.prepare(`
    INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('PM002', 'DG002', 'S010', fmt(pastDue2), fmt(pastDue2Han), 'DANG_MUON');

  // Phiếu đang mượn - chưa quá hạn (S015)
  const recent = new Date(today);
  recent.setDate(recent.getDate() - 5);
  const recentHan = new Date(recent);
  recentHan.setDate(recentHan.getDate() + 14);
  db.prepare(`
    INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('PM005', 'DG006', 'S015', fmt(recent), fmt(recentHan), 'DANG_MUON');

  // Phiếu đã trả
  db.prepare(`
    INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, ngayTraThucTe, tienPhat)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('PM003', 'DG003', 'S001', '2025-02-01', '2025-02-15', 'DA_TRA', '2025-02-14', 0);

  // Phiếu đã trả - có phạt
  db.prepare(`
    INSERT INTO PhieuMuon (maPhieu, maDocGia, maSach, ngayMuon, hanTra, trangThai, ngayTraThucTe, tienPhat)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('PM004', 'DG005', 'S002', '2025-01-10', '2025-01-24', 'DA_TRA', '2025-01-27', 15000);

  console.log('Seed data created successfully!');
  console.log('');
  console.log('Tài khoản đăng nhập:');
  console.log('  Thủ thư:       thuthu / 123456');
  console.log('  Quản trị viên: admin / 123456');
  console.log('');
  console.log('Độc giả: DG001 - DG022 (22 người, 2+ pages)');
  console.log('Sách: S001 - S025 (25 cuốn, 2+ pages)');
  console.log('Phiếu mượn: PM001-PM005');

  db.close();
}

seed().catch(console.error);
