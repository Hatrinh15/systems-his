import { APIError, CollectionBeforeValidateHook} from "payload";
import { Access } from "payload";
import { User } from "@/payload-types";
export const hookMedicalSupplies: CollectionBeforeValidateHook = async ({ data, req, originalDoc }) => {
  if (!data) return;
  const { payload } = req;

  // Bản đồ key -> label
  const fieldLabels = {
    code: "Mã ",
    name: "Tên ",
    category: "Loại vật tư",
    unit: "Đơn vị tính",
  };

  // Kiểm tra các trường bắt buộc
  const requiredFields = Object.keys(fieldLabels);
  const missingFields = requiredFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    const missingLabels = missingFields.map(field => fieldLabels[field]);
    throw new APIError(`Hãy điền đủ thông tin: ${missingLabels.join(", ")}`, 400);
  }

  // Kiểm tra hạn sử dụng không nhỏ hơn ngày hiện tại
  // Lấy giá trị hạn sử dụng từ dữ liệu đầu vào
const expiryDate = data.expirydate ? new Date(data.expirydate) : null;

  // Kiểm tra định dạng mã vật tư (chỉ gồm chữ in hoa + số)
  const codeRegex = /^[A-Z0-9]+$/;
  if (!codeRegex.test(data.code)) {
    throw new APIError("Mã vật tư chỉ được chứa chữ in hoa và số!", 400);
  }

  // Kiểm tra trùng mã và tên vật tư y tế
  const [existingCode, existingName] = await Promise.all([
    payload.find({
      collection: "medicalSupplies",
      where: { code: { equals: data.code }, id: { not_equals: originalDoc?.id } },
    }),
    payload.find({
      collection: "medicalSupplies",
      where: { name: { equals: data.name }, id: { not_equals: originalDoc?.id } },
    }),
  ]);

  if (existingCode.docs.length > 0) {
    throw new APIError("Mã vật tư đã tồn tại!", 400);
  }

  if (existingName.docs.length > 0) {
    throw new APIError("Tên vật tư y tế đã tồn tại!", 400);
  }
  return data;
};

export const notChangeLoaiVatTu: CollectionBeforeValidateHook = async ({ data, originalDoc, operation }) => {
  // Chỉ thực hiện khi đang cập nhật
  if (operation === 'update' && originalDoc?.loaivattu && data?.loaivattu) {
    // Nếu người dùng cố gắng thay đổi loại vật tư
    if (data.loaivattu !== originalDoc.loaivattu) {
      throw new APIError('Loại vật tư không thể thay đổi khi đã tạo.', 400);
    }
  }

  return data;
};
export const accessMedicalSupplies: Access = ({ req }) => {
  const user = req.user as User

  if (!user) return false

  // Admin toàn quyền
  if (user.taikhoan === 'admin') return true

  const { chucvu, phong, khoa } = user

  // Người trong phòng hành chính - quản trị
  const isHanhChinhQuanTri =
    phong === 'hanhchinhquantri' &&
    ['truongphong', 'nhanvienkho'].includes(chucvu ?? '')

  // Người trong khoa Dược
  const isKhoaDuoc =
    khoa === 'khoaduoc' &&
    ['truongkhoa', 'duocsi'].includes(chucvu ?? '')

  return isHanhChinhQuanTri || isKhoaDuoc
}
export const canReadMedicalSupplies: Access = ({ req }) => {
  const user = req.user as User;
  const chucvuChoPhep = [
    'truongphong', 'nhanvienkho',
    'ketoan', 'duocsi',
    'truongkhoa', 'bacsi', 'yta',
  ];

  return (
    user?.taikhoan === 'admin' ||
    chucvuChoPhep.includes(user?.chucvu ?? '')
  );
};