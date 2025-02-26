import { APIError, CollectionBeforeValidateHook } from 'payload'

export const valuemedicalrecord: CollectionBeforeValidateHook = ({ data }) => {
  if (!data || !Array.isArray(data.hoso)) {
    throw new APIError('Hãy nhập thông tin hồ sơ hợp lệ!', 400)
  }

  console.log('Dữ liệu đầu vào:', data)

  const error: string[] = []

  data.hoso.forEach((record, index) => {
    if (!record || typeof record !== 'object') {
      error.push(`Hồ sơ ${index + 1} không hợp lệ!`)
      return
    }

    const errorArray: string[] = []

    if (!record.khoa) errorArray.push('Khoa')
    if (!record.bacsi) errorArray.push('Bác sĩ')
    if (!record.dieuduong) errorArray.push('Điều dưỡng')
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

export const valueho_so: CollectionBeforeValidateHook = ({ data }) => {
  console.log('Chạy hook validation cho hồ sơ y tế!') // Kiểm tra xem có chạy không

  if (!data) return

  const error: string[] = []
  data?.ketqua.forEach((err, index) => {
    const errorArray: string[] = []
    if (!err.ngay) {
      errorArray.push('ngày thực hiện')
    }
    if (!err.bacsi) {
      errorArray.push('bác sĩ')
    }
    if (!err.ketquanoisoi) {
      errorArray.push('kết quả nội soi')
    }
    if (!err.hinhanh) {
      errorArray.push('hình ảnh nội soi')
    }
    if (!err.chuandoan) {
      errorArray.push('chuẩn đoán')
    }
    if (!err.huongdieutri) {
      errorArray.push('hướng điều trị')
    }
    const throwErrorArray = errorArray.map((err) => err).join(',')
    error.push(`Hồ sơ ${index + 1} hãy điền đủ thông tin: ${throwErrorArray}`)
  })

  const throwError = error.map((err) => `• ${err}`).join('\n') // Mỗi lỗi trên một dòng
  if (error.length > 0) {
    throw new APIError(throwError.trim(), 400)
  }
}

export const preventDuplicateMedicalRecord = async ({ data, req }) => {
  if (!data.thongtinbenhnhan) return // Nếu không có thông tin bệnh nhân thì không cần kiểm tra

  const existingRecord = await req.payload.find({
    collection: 'MedicalRecods',
    where: {
      thongtinbenhnhan: {
        equals: data.thongtinbenhnhan, // Kiểm tra nếu bệnh nhân đã có hồ sơ
      },
    },
  })
  if (existingRecord.docs.length > 0) {
    throw new APIError('Bệnh nhân này đã có hồ sơ bệnh án, không thể tạo thêm!', 400)
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
