import { Access,AccessArgs } from "payload";
import { User } from "@/payload-types";
// ✅ Admin có toàn quyền
export const isAdmin: Access = ({ req }) => {
  const user = req.user as User
  return user && user.taikhoan === 'admin'
}

export const isBacSiYTaTruongKhoa: Access = ({ req }) => {
  const user = req.user as User;
  return (
    user &&
    (user.chucvu === 'bacsi' ||
      user.chucvu === 'yta' ||
      user.chucvu === 'truongkhoa')
  );
};

export const isBacSiYTaTruongKhoaDuocSi: Access = ({ req }) => {
  const user = req.user as User;
  return (
    user &&
    (user.chucvu === 'bacsi' ||
      user.chucvu === 'yta' ||
      user.chucvu === 'duocsi' ||
      user.chucvu === 'truongkhoa')
  );
};

export const isTruongPhongNhanVien: Access = ({ req }) => {
  const user = req.user as User;
  return (
    user &&
    (user.chucvu === 'truongphong' ||
      user.chucvu === 'nhanvienkho' ||
      user.chucvu === 'ketoan')
  );
};

export const isAdminDuocSi: Access = ({ req }) => {
  const user = req.user as User

  if (!user) return false

  const isAdminAccount = user.taikhoan === 'admin'

  const isDuocFullAccess =
    user.khoa === 'khoaduoc' &&
    ['duocsi', 'truongkhoa'].includes(user.chucvu ?? '')

  return isAdminAccount || isDuocFullAccess
} 

export const isAdminNhanVienKho: Access = ({ req }) => {
  const user = req.user as User

  if (!user) return false

  const isAdminAccount = user.taikhoan === 'admin'

  const isKhoFullAccess =
    user.phong === 'hanhchinhquantri' &&
    ['nhanvienkho', 'truongphong'].includes(user.chucvu ?? '')

  return isAdminAccount || isKhoFullAccess
} 

export const isAdminKeToan: Access = ({ req }) => {
  const user = req.user as User

  if (!user) return false

  const isAdminAccount = user.taikhoan === 'admin'

  const isKeToanFullAccess =
    user.phong === 'taichinhketoan' &&
    ['ketoan', 'truongphong'].includes(user.chucvu ?? '')

  return isAdminAccount || isKeToanFullAccess
} 