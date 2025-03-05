import { APIError, CollectionBeforeValidateHook} from "payload";

export const hookMedicalSupplies: CollectionBeforeValidateHook = async ({ data, req, originalDoc }) => {
  if (!data) return;
  const { payload } = req;

  // Bản đồ key -> label
  const fieldLabels = {
    code: "Mã vật tư",
    name: "Tên vật tư y tế",
    category: "Loại vật tư",
    unit: "Đơn vị tính",
    expirydate: "Hạn sử dụng",
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

// Kiểm tra hạn sử dụng nếu có giá trị
if (expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Đặt về đầu ngày

  if (expiryDate.getTime() < today.getTime()) {
    throw new APIError("Hạn sử dụng phải lớn hơn hoặc bằng ngày hiện tại!", 400);
  }
}

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

