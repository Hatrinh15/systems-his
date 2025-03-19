import { APIError, CollectionBeforeValidateHook } from "payload";

export const hookSupplier: CollectionBeforeValidateHook = async ({ data, req, originalDoc }) => {
  if (!data) return;
  const { payload } = req;

  // Danh sách các trường quan trọng và nhãn hiển thị
  const fieldLabels: Record<string, string> = {
    nhacungcap: "Tên nhà cung cấp",
    address: "Địa chỉ",
    phone: "Số điện thoại",
    email: "Email",
    businessLicense: "Số giấy phép kinh doanh",
  };

  // Kiểm tra các trường bắt buộc
  const requiredFields = Object.keys(fieldLabels);
  const missingFields = requiredFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    const missingLabels = missingFields.map(field => fieldLabels[field]);
    throw new APIError(`Hãy điền đủ thông tin: ${missingLabels.join(", ")}`, 400);
  }

  // Kiểm tra định dạng số điện thoại
  const phoneRegex = /^(?:\(\d{2,4}\)\s?\d{6,8}|\d{10,11})$/;
  if (!phoneRegex.test(data.phone)) {
    throw new APIError("Số điện thoại không hợp lệ!", 400);
  }

  // Kiểm tra định dạng số giấy phép kinh doanh (phải gồm đúng 10 chữ số)
  const businessLicenseRegex = /^\d{10}$/;
  if (!businessLicenseRegex.test(data.businessLicense)) {
    throw new APIError("Số giấy phép kinh doanh không hợp lệ!", 400);
  }

  // Kiểm tra trùng tên nhà cung cấp
  if (!originalDoc || originalDoc.nhacungcap !== data.nhacungcap) {
    const existingName = await payload.find({
      collection: "suppliers",
      where: { nhacungcap: { equals: data.nhacungcap} },
    });

    if (existingName.docs.length > 0) {
      throw new APIError("Tên nhà cung cấp đã tồn tại!", 400);
    }
  }

  // Kiểm tra trùng địa chỉ
  if (!originalDoc || originalDoc.address !== data.address) {
    const existingAddress = await payload.find({
      collection: "suppliers",
      where: { address: { equals: data.address } },
    });

    if (existingAddress.docs.length > 0) {
      throw new APIError("Địa chỉ nhà cung cấp đã tồn tại!", 400);
    }
  }

  // Kiểm tra trùng số điện thoại
  if (!originalDoc || originalDoc.phone !== data.phone) {
    const existingPhone = await payload.find({
      collection: "suppliers",
      where: { phone: { equals: data.phone } },
    });

    if (existingPhone.docs.length > 0) {
      throw new APIError("Số điện thoại đã tồn tại!", 400);
    }
  }

  // Kiểm tra trùng email
if (!originalDoc || originalDoc.email !== data.email) {
  const existingEmail = await payload.find({
    collection: "suppliers",
    where: { email: { equals: data.email } },
  });

  if (existingEmail.docs.length > 0) {
    throw new APIError("Email nhà cung cấp đã tồn tại!", 400);
  }
}

  // Kiểm tra trùng số giấy phép kinh doanh
  if (!originalDoc || originalDoc.businessLicense !== data.businessLicense) {
    const existingLicense = await payload.find({
      collection: "suppliers",
      where: { businessLicense: { equals: data.businessLicense } },
    });

    if (existingLicense.docs.length > 0) {
      throw new APIError("Số giấy phép kinh doanh đã tồn tại!", 400);
    }
  }

  return data;
};
