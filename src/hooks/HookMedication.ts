import { APIError, CollectionBeforeValidateHook } from "payload";

export const validateMedicationData: CollectionBeforeValidateHook = async ({ data, req, originalDoc }) => {
  if (!data) return;
  const { payload } = req;

  // Bản đồ key -> label
  const fieldLabels: Record<string, string> = {
    code: "Mã thuốc",
    name: "Tên thuốc",
    category: "Loại thuốc",
    unit: "Đơn vị tính",
    expiryDate: "Hạn sử dụng",
  };

  // Danh sách trường bắt buộc
  const requiredFields = Object.keys(fieldLabels);
  const missingFields = requiredFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    const missingLabels = missingFields.map(field => fieldLabels[field]);
    throw new APIError(`Hãy điền đủ thông tin: ${missingLabels.join(", ")}`, 400);
  }

  // Kiểm tra định dạng mã thuốc
  const codePattern = /^(?=.*[A-Z])(?=.*\d)[A-Z\d]+$/;
  if (!codePattern.test(data.code)) {
    throw new APIError("Mã thuốc phải chứa cả chữ và số, và phải là chữ in hoa!", 400);
  }

  // Kiểm tra hạn sử dụng
  const today = new Date().toISOString().split("T")[0];
  if (data.expiryDate < today) {
    throw new APIError("Hạn sử dụng phải lớn hơn hoặc bằng ngày hiện tại!", 400);
  }

 // Kiểm tra trùng mã thuốc (chỉ khi thay đổi mã)
if (!originalDoc || originalDoc.code !== data.code) {
  const existingCode = await payload.find({
    collection: "medications",
    where: {
      code: { equals: data.code },
      id: { not_equals: originalDoc?.id }, // Loại trừ bản ghi hiện tại
    },
  });

  if (existingCode.docs.length > 0) {
    throw new APIError("Mã thuốc đã tồn tại!", 400);
  }
}

// Kiểm tra trùng tên thuốc (chỉ khi thay đổi tên)
if (!originalDoc || originalDoc.name !== data.name) {
  const existingName = await payload.find({
    collection: "medications",
    where: {
      name: { equals: data.name },
      id: { not_equals: originalDoc?.id }, // Loại trừ bản ghi hiện tại
    },
  });

  if (existingName.docs.length > 0) {
    throw new APIError("Tên thuốc đã tồn tại!", 400);
  }
}
  return data;
};