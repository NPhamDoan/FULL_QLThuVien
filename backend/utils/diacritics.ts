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
