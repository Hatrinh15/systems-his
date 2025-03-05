import { CollectionBeforeChangeHook } from "payload";
import { APIError } from "payload";

export const checkvalueuser: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === "create") {
    const errors: string[] = [];

    // Danh sách các trường bắt buộc
    const requiredFields = [
      { field: "name", message: "Họ và tên không được để trống." },
      { field: "sdt", message: "Số điện thoại không được để trống." },
      { field: "cccd", message: "Căn cước công dân không được để trống." },
      { field: "ngaysinh", message: "Ngày sinh không được để trống." },
      { field: "chucvu", message: "Chức vụ không được để trống." },
      { field: "tinhtranglamviec", message: "Tình trạng làm việc không được để trống." },
      { field: "ngayvaolam", message: "Ngày vào làm không được để trống." }, // ✅ Thêm ngày vào làm
    ];

    // Kiểm tra các trường bắt buộc
    requiredFields.forEach(({ field, message }) => {
      if (!data[field]) {
        errors.push(message);
      }
    });

    // Kiểm tra theo chức vụ
    if (["bacsi", "yta", "kythuatvien"].includes(data.chucvu)) {
      if (!data.bangcap) {
        errors.push("Bằng cấp chuyên môn không được để trống.");
      }
    }

    if (data.chucvu === "bacsi" && (!data.chungchi || data.chungchi.length === 0)) {
      errors.push("Bác sĩ bắt buộc phải có ít nhất một chứng chỉ hành nghề.");
    }

    // Kiểm tra trùng Số điện thoại
    const phoneCheck = await req.payload.find({
      collection: "users",
      where: { sdt: { equals: data.sdt } },
    });

    if (phoneCheck.totalDocs > 0) {
      errors.push("Số điện thoại đã được sử dụng.");
    }

    // Kiểm tra trùng Căn cước công dân (CCCD)
    const cccdCheck = await req.payload.find({
      collection: "users",
      where: { cccd: { equals: data.cccd } },
    });

    if (cccdCheck.totalDocs > 0) {
      errors.push("Căn cước công dân đã được sử dụng.");
    }

    // Nếu có lỗi, hiển thị thông báo lỗi chi tiết
    if (errors.length > 0) {
      throw new APIError(errors.join("\n"), 400);
    }
    

    console.log("check", data);
  }
};
