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
