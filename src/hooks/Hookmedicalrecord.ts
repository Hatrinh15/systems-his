import { APIError, CollectionBeforeChangeHook, CollectionBeforeValidateHook } from 'payload'

export const valuemedicalrecord: CollectionBeforeValidateHook = ({ data }) => {
  if (!data || !Array.isArray(data.hoso)) {
    throw new APIError('Hãy nhập thông tin hồ sơ hợp lệ!', 400)
  }

  const error: string[] = []

  data.hoso.forEach((record, index) => {
    if (!record || typeof record !== 'object') {
      error.push(`Hồ sơ ${index + 1} không hợp lệ!`)
      return
    }

    const errorArray: string[] = []

    if (!record.khoa) errorArray.push('Khoa')
    if (!record.bacsi) errorArray.push('Bác sĩ')
    // if (!record.dieuduong) errorArray.push('Điều dưỡng')
    if (!record.ngaynhapvien) errorArray.push('Ngày nhập viện')
    if (!record.chuandoan) errorArray.push('Chuẩn đoán')

    if (errorArray.length > 0) {
      error.push(`Hồ sơ ${index + 1} hãy điền đủ thông tin: ${errorArray.join(', ')}`)
    }
  })

  if (error.length > 0) {
    throw new APIError(error.join('\n'), 400)
  }
}

export const valueho_so: CollectionBeforeValidateHook = ({ data, originalDoc }) => {


  if (!data) return

  // Kiểm tra nếu dữ liệu liên quan đến kết quả nội soi (ketqua) có thay đổi thì mới validate
  if (!data.ketqua && originalDoc?.ketqua) {
    data.ketqua = originalDoc.ketqua // Giữ nguyên dữ liệu cũ nếu không có thay đổi
    return
  }

  const error: string[] = []
  if (Array.isArray(data.ketqua)) {
    data.ketqua.forEach((err, index) => {
      const errorArray: string[] = []
      // if (!err.ngay) errorArray.push('Ngày thực hiện')
      // if (!err.bacsi) errorArray.push('Bác sĩ')
      if (!err.ketquanoisoi) errorArray.push('Kết quả nội soi')
      if (!err.hinhanh) errorArray.push('Hình ảnh nội soi')
      // if (!err.chuandoan) errorArray.push('Chuẩn đoán')
      if (!err.huongdieutri) errorArray.push('Hướng điều trị')

      if (errorArray.length > 0) {
        error.push(`Hồ sơ ${index + 1} hãy điền đủ thông tin: ${errorArray.join(', ')}`)
      }
    })
  }

  if (error.length > 0) {
    throw new APIError(error.map((err) => `• ${err}`).join('\n'), 400)
  }
}
export const preventDuplicateMedicalRecord: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  if (!data.thongtinbenhnhan) return // Không có thông tin bệnh nhân thì bỏ qua
  // Tìm kiếm các hồ sơ bệnh án trùng lặp (bỏ qua nếu là chính nó)
  if (data.thongtinbenhnhan !== originalDoc.thongtinbenhnhan) {
    const existingRecord = await req.payload.find({
      collection: 'MedicalRecods',
      where: {
        thongtinbenhnhan: { equals: data.thongtinbenhnhan },
        ...(data.id ? { id: { not_equals: data.id } } : {}), // Bỏ qua chính nó khi cập nhật
      },
    })

    if (existingRecord.docs.length > 0) {
      throw new APIError('Bệnh nhân này đã có hồ sơ bệnh án, không thể tạo thêm!', 400)
    }
  }
}

export const namePatient = async ({ data, req }) => {
  if (data.thongtinbenhnhan) {
    // Lấy thông tin bệnh nhân từ database
    const patient = await req.payload.findByID({
      collection: 'patients',
      id: data.thongtinbenhnhan,
    })

    if (patient) {
      data.tenBenhNhan = patient.ten // Cập nhật tên bệnh nhân
    }
  }
}

export const generateMedicalRecordID: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (!data) return;

  if (!data.hoso) {
    data.hoso = [];
  }

  for (let i = 0; i < data.hoso.length; i++) {
    if (!data.hoso[i].sohoso) {
      let newID;
      let isDuplicate = true;

      // Lặp cho đến khi tìm được số hồ sơ không trùng
      while (isDuplicate) {
        // Tạo số ngẫu nhiên
        const randomID = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        newID = `HS-${randomID}`;

        // Kiểm tra xem số này đã tồn tại trong database chưa
        const existingRecord = await req.payload.find({
          collection: 'MedicalRecods',
          where: { "hoso.sohoso": { equals: newID } },
          limit: 1
        });

        // Nếu không tìm thấy bản ghi nào trùng, thoát vòng lặp
        if (existingRecord.docs.length === 0) {
          isDuplicate = false;
        }
      }

      data.hoso[i].sohoso = newID;
    }
  }

  return data; 
};

