import { CollectionAfterReadHook, CollectionBeforeChangeHook } from "payload";
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

    if (missingFields.length > 0) {
      throw new APIError(`Hãy điền đủ thông tin: ${missingFields.join(", ")}.`, 400);
    }

    // Kiểm tra ngày khám có hợp lệ không
    if (!data.ngaykham || isNaN(Date.parse(data.ngaykham))) {
      throw new APIError("Ngày khám không hợp lệ! Vui lòng chọn ngày hợp lệ.", 400);
    }

    // Kiểm tra ngày khám phải đặt trước ít nhất 1 ngày
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minAppointmentDate = new Date();
    minAppointmentDate.setDate(today.getDate() + 1); // Ngày tối thiểu phải là ngày mai

    const appointmentDate = new Date(data.ngaykham);
    if (appointmentDate < minAppointmentDate) {
      throw new APIError("Bạn phải đặt lịch trước ít nhất 1 ngày! Không thể chọn ngày hôm nay.", 400);
    }

    const { bacsi, ngaykham, giokham, patients } = data;

    // Kiểm tra bệnh nhân không đặt hai lịch trong cùng một ngày
    const duplicatePatientAppointments = await req.payload.find({
      collection: "appointments",
      where: {
        patients: { in: Array.isArray(patients) ? patients : [patients] },
        ngaykham: { equals: ngaykham },
      },
    });

    if (duplicatePatientAppointments?.totalDocs > 0) {
      throw new APIError("Bạn đã đặt lịch hẹn cho ngày này! Vui lòng chọn ngày khác.", 400);
    }

    // Giới hạn số lượng bệnh nhân
    const maxPatientsPerSlot = bacsi ? 5 : 30; // Nếu có bác sĩ: 5, nếu không có bác sĩ: 30

    // Kiểm tra số lượng bệnh nhân trong khung giờ đó
    const totalAppointmentsInSlot = await req.payload.find({
      collection: "appointments",
      where: {
        ngaykham: { equals: ngaykham },
        giokham: { equals: giokham },
        ...(bacsi ? { bacsi: { equals: bacsi } } : {}), // Nếu có bác sĩ, chỉ kiểm tra lịch của bác sĩ đó
      },
    });

    if ((totalAppointmentsInSlot?.totalDocs || 0) >= maxPatientsPerSlot) {
      throw new APIError(`Khung giờ này đã đủ số lượng bệnh nhân đặt lịch! Vui lòng chọn khung giờ khác.`, 400);
    }
  }
};
export const patientName:CollectionBeforeChangeHook = async ({ data, req }) => {
  try {
    if (data?.patients) {
      const patientID = typeof data.patients === 'string' ? data.patients : data.patients.id;
      const patientDoc = await req.payload.findByID({
        collection: 'patients',
        id: patientID,
      });

      if (patientDoc?.ten) {
        data.patientName = patientDoc.ten;
      }
    }
  } catch (err) {
    console.error('Không thể lấy tên bệnh nhân:', err);
  }

  return data;
};