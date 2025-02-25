import { CollectionBeforeChangeHook } from "payload";
import { APIError } from "payload";

export const validateAppointment: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation === "create" || operation === "update") {
    const missingFields: string[] = [];

    // Danh sách các trường bắt buộc
    const requiredFields = [
      { key: "patients", label: "Bệnh nhân" },
      { key: "ngaykham", label: "Ngày khám" },
      { key: "giokham", label: "Giờ khám" },
      { key: "trieuchung", label: "Triệu chứng" },
      { key: "xacnhanthongtin", label: "Xác nhận thông tin" },
    ];

    // Kiểm tra xem có trường nào bị thiếu không
    requiredFields.forEach((field) => {
      if (!data[field.key] || (Array.isArray(data[field.key]) && data[field.key].length === 0)) {
        missingFields.push(field.label);
      }
    });

    // Nếu có trường bị thiếu, báo lỗi
    if (missingFields.length > 0) {
      throw new APIError(`Hãy điền đủ thông tin: ${missingFields.join(", ")}.`, 400);
    }

    // Kiểm tra ngày khám không được ở quá khứ
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentDate = new Date(data.ngaykham);
    if (appointmentDate < today) {
      throw new APIError("Ngày khám không được ở quá khứ! Vui lòng chọn ngày hiện tại hoặc tương lai.", 400);
    }

    // Kiểm tra bác sĩ không bị trùng lịch
    const { bacsi, ngaykham, giokham } = data;
    const existingAppointments = await req.payload.find({
      collection: "appointments",
      where: {
        ngaykham: { equals: ngaykham },
        giokham: { equals: giokham },
        bacsi: { equals: bacsi },
      },
    });

    if (existingAppointments.totalDocs > 0) {
      throw new APIError("Lịch hẹn đã bị trùng! Vui lòng chọn thời gian khác.", 400);
    }

    // Kiểm tra bệnh nhân không đặt hai lịch trong cùng một ngày
    const duplicatePatientAppointments = await req.payload.find({
      collection: "appointments",
      where: {
        "patients.id": { equals: data.patients },
        ngaykham: { equals: ngaykham },
      },
    });

    if (duplicatePatientAppointments.totalDocs > 0) {
      throw new APIError("Bạn đã đặt lịch hẹn cho ngày này! Vui lòng chọn ngày khác.", 400);
    }
  }
};
