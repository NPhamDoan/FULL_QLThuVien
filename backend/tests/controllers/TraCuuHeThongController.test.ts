import { TraCuuHeThongController } from '../../controllers/TraCuuHeThongController';
import { initializeDatabase } from '../../database';
import Database from 'better-sqlite3';

describe('TraCuuHeThongController', () => {
  let db: Database.Database;
  let controller: TraCuuHeThongController;

  beforeEach(() => {
    db = initializeDatabase(':memory:');
    controller = new TraCuuHeThongController(db);

    const insert = db.prepare(`
      INSERT INTO Sach (maSach, tieuDe, tacGia, soBanSao, soMat, soBaoTri)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insert.run('S001', 'Lập trình TypeScript', 'Nguyen Van A', 3, 0, 0);
    insert.run('S002', 'Lập trình JavaScript', 'Nguyen Van A', 2, 0, 0);
    insert.run('S003', 'Cơ sở dữ liệu', 'Tran Thi B', 1, 0, 0);
    insert.run('S004', 'Thuật toán nâng cao', 'Le Van C', 2, 0, 1);
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
      expect(controller.searchByTitle('Vật lý')).toHaveLength(0);
    });

    it('should return proper counter fields', () => {
      const results = controller.searchByTitle('TypeScript');
      expect(results).toHaveLength(1);
      expect(results[0].soBanSao).toBe(3);
      expect(results[0].soMat).toBe(0);
      expect(results[0].soBaoTri).toBe(0);
    });
  });

  describe('searchByAuthor', () => {
    it('should return books matching the author keyword', () => {
      const results = controller.searchByAuthor('Nguyen Van A');
      expect(results).toHaveLength(2);
    });

    it('should be case-insensitive', () => {
      expect(controller.searchByAuthor('nguyen van a')).toHaveLength(2);
    });

    it('should return empty array when no match', () => {
      expect(controller.searchByAuthor('Unknown')).toHaveLength(0);
    });

    it('should preserve counter fields', () => {
      const results = controller.searchByAuthor('Le Van C');
      expect(results).toHaveLength(1);
      expect(results[0].soBaoTri).toBe(1);
    });
  });

  describe('searchByCode', () => {
    it('should return the book matching the exact code', () => {
      const result = controller.searchByCode('S001');
      expect(result).not.toBeNull();
      expect(result!.maSach).toBe('S001');
      expect(result!.soBanSao).toBe(3);
    });

    it('should return null when code does not exist', () => {
      expect(controller.searchByCode('S999')).toBeNull();
    });

    it('should not do partial matching on code', () => {
      expect(controller.searchByCode('S00')).toBeNull();
    });
  });
});
