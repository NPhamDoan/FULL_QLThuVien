/**
 * Bỏ dấu tiếng Việt để hỗ trợ tìm kiếm gần đúng
 * "Lập trình" → "Lap trinh", "Nguyễn" → "Nguyen"
 */
export function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * So sánh từ khóa với 1 trường (case-insensitive, diacritics-insensitive).
 * Dùng cho search với tiếng Việt không dấu.
 */
export function matchesKeyword(field: string | number | null | undefined, keyword: string): boolean {
  if (field === null || field === undefined) return false;
  const f = String(field).toLowerCase();
  const kw = keyword.toLowerCase();
  return f.includes(kw) || removeDiacritics(f).includes(removeDiacritics(kw));
}

/**
 * Kiểm tra bất kỳ field nào trong array có match keyword không.
 * Ví dụ: matchesAny([sach.tieuDe, sach.tacGia], 'lap trinh')
 */
export function matchesAny(fields: (string | number | null | undefined)[], keyword: string): boolean {
  return fields.some(f => matchesKeyword(f, keyword));
}

/**
 * Filter danh sách record theo keyword, check trong các field được chọn.
 * @param records danh sách record
 * @param keyword từ khóa tìm (rỗng = trả về tất cả)
 * @param getFields hàm lấy các field cần search cho mỗi record
 */
export function filterByKeyword<T>(
  records: T[],
  keyword: string,
  getFields: (r: T) => (string | number | null | undefined)[]
): T[] {
  if (!keyword || keyword.trim() === '') return records;
  const trimmed = keyword.trim();
  return records.filter(r => matchesAny(getFields(r), trimmed));
}
