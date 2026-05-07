// Shared enum values - must match backend/types/index.ts

export const VaiTro = {
  THU_THU: 'THU_THU',
  QUAN_TRI_VIEN: 'QUAN_TRI_VIEN',
} as const;

export const TrangThaiTaiKhoan = {
  HOAT_DONG: 'HOAT_DONG',
  BI_KHOA: 'BI_KHOA',
} as const;

export const TrangThaiPhieu = {
  DANG_MUON: 'DANG_MUON',
  DA_TRA: 'DA_TRA',
} as const;

export type VaiTroType = typeof VaiTro[keyof typeof VaiTro];
export type TrangThaiTaiKhoanType = typeof TrangThaiTaiKhoan[keyof typeof TrangThaiTaiKhoan];
export type TrangThaiPhieuType = typeof TrangThaiPhieu[keyof typeof TrangThaiPhieu];
