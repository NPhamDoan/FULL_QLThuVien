import { TraCuuHeThongController } from '../../controllers/TraCuuHeThongController';
import { initializeDatabase } from '../../database';
import { TinhTrangSach } from '../../types';
import Database from 'better-sqlite3';

describe('TraCuuHeThongController', () => {
  let db: Database.Database;
  let controller: TraCuuHeThongController;

  beforeEach(() => {
    db = initializeDatabase(':memory:');
    controller = new TraCuuHeThongController(db);

    // Pre-insert test books
    db.prepare(`
      INSERT INTO Sach (maSach, tieuDe, tacGia, tinhTrang)
      VALUES (?, ?, ?, ?)
    `).run('S001', 'Lập trình TypeScript', 'Nguyen Van A', 'SAN_SANG');

    db.prepare(`
      INSERT INTO Sach (maSach, tieuDe, tacGia, tinhTrang)
      VALUES (?, ?, ?, ?)
    `).run('S002', 'Lập trình JavaScript', 'Nguyen Van A', 'DA_MUON');

    db.prepare(`
      INSERT INTO Sach (maSach, tieuDe, tacGia, tinhTrang)
      VALUES (?, ?, ?, ?)
    `).run('S003', 'Cơ sở dữ liệu', 'Tran Thi B', 'SAN_SANG');

    db.prepare(`
      INSERT INTO Sach (maSach, tieuDe, tacGia, tinhTrang)
      VALUES (?, ?, ?, ?)
    `).run('S004', 'Thuật toán nâng cao', 'Le Van C', 'BAO_TRI');
  });

  afterEach(() => {
    db.close();
  });

  describe('searchByTitle', () => {
    it('should return books matching the title keyword', () => {
      const results = controller.searchByTitle('Lập trình');

      expect(results).toHaveLength(2);
      expect(results.map(s => s.maSach)).toEqual(expect.arrayContaining(['S001', 'S002']));
    });

    it('should be case-insensitive', () => {
      const results = controller.searchByTitle('lập trình');

      expect(results).toHaveLength(2);
    });

    it('should return empty array when no match', () => {
      const results = controller.searchByTitle('Vật lý');

      expect(results).toHaveLength(0);
    });

    it('should return books with partial title match', () => {
      const results = controller.searchByTitle('TypeScript');

      expect(results).toHaveLength(1);
      expect(results[0].maSach).toBe('S001');
      expect(results[0].tieuDe).toBe('Lập trình TypeScript');
      expect(results[0].tinhTrang).toBe(TinhTrangSach.SAN_SANG);
    });

    it('should include tinhTrang in results', () => {
      const results = controller.searchByTitle('Lập trình');

      const ts = results.find(s => s.maSach === 'S001');
      const js = results.find(s => s.maSach === 'S002');

      expect(ts?.tinhTrang).toBe(TinhTrangSach.SAN_SANG);
      expect(js?.tinhTrang).toBe(TinhTrangSach.DA_MUON);
    });

    it('should return proper Sach objects with Date fields', () => {
      const results = controller.searchByTitle('TypeScript');

      expect(results[0].createdAt).toBeInstanceOf(Date);
      expect(results[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('searchByAuthor', () => {
    it('should return books matching the author keyword', () => {
      const results = controller.searchByAuthor('Nguyen Van A');

      expect(results).toHaveLength(2);
      expect(results.map(s => s.maSach)).toEqual(expect.arrayContaining(['S001', 'S002']));
    });

    it('should be case-insensitive', () => {
      const results = controller.searchByAuthor('nguyen van a');

      expect(results).toHaveLength(2);
    });

    it('should return empty array when no match', () => {
      const results = controller.searchByAuthor('Unknown Author');

      expect(results).toHaveLength(0);
    });

    it('should return books with partial author match', () => {
      const results = controller.searchByAuthor('Tran');

      expect(results).toHaveLength(1);
      expect(results[0].maSach).toBe('S003');
      expect(results[0].tacGia).toBe('Tran Thi B');
    });

    it('should include tinhTrang in results', () => {
      const results = controller.searchByAuthor('Le Van C');

      expect(results).toHaveLength(1);
      expect(results[0].tinhTrang).toBe(TinhTrangSach.BAO_TRI);
    });
  });

  describe('searchByCode', () => {
    it('should return the book matching the exact code', () => {
      const result = controller.searchByCode('S001');

      expect(result).not.toBeNull();
      expect(result!.maSach).toBe('S001');
      expect(result!.tieuDe).toBe('Lập trình TypeScript');
      expect(result!.tacGia).toBe('Nguyen Van A');
      expect(result!.tinhTrang).toBe(TinhTrangSach.SAN_SANG);
    });

    it('should return null when code does not exist', () => {
      const result = controller.searchByCode('S999');

      expect(result).toBeNull();
    });

    it('should return proper Sach object with Date fields', () => {
      const result = controller.searchByCode('S003');

      expect(result).not.toBeNull();
      expect(result!.createdAt).toBeInstanceOf(Date);
      expect(result!.updatedAt).toBeInstanceOf(Date);
    });

    it('should not do partial matching on code', () => {
      const result = controller.searchByCode('S00');

      expect(result).toBeNull();
    });
  });
});
