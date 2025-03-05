import { APIError, CollectionBeforeValidateHook, CollectionBeforeChangeHook } from 'payload'

export const valuemedicalorder: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return

  const error: string[] = []

  if (!data.khoa) {
    error.push('khoa')
  }
  if (!data.bacsi) {
    error.push('bác sĩ')
  }
  if (!data.dieuduong) {
    error.push('điều dưỡng')
  }
  if (!data.ngaynhapvien) {
    error.push('ngày nhập viện')
  }
  if (!data.ngayLap) {
    error.push('ngày lập')
  }
  if (!data.chuandoan) {
    error.push('chuẩn đoán')
  }
  if (!data.hinhthucdieutri) {
    error.push('hình thức điều trị')
  }
  if (data.hinhthucdieutri === 'benhnhannoitru' && !data.hosobenhan) {
    error.push('hồ sơ bệnh án')
  }

  if (Array.isArray(data.thuoc)) {
    data.thuoc.forEach((thuoc, index) => {
      if (!thuoc || typeof thuoc !== 'object') return
      const thuocErrors: string[] = []

      if (!thuoc.hamLuong) thuocErrors.push('Hàm lượng')
      if (!thuoc.lieuDung) thuocErrors.push('Liều dùng')
      if (!thuoc.cachDung) thuocErrors.push('Cách dùng')
      if (!thuoc.thoiGian) thuocErrors.push('Thời gian')

      if (thuocErrors.length > 0) {
        error.push(`Thuốc ${index + 1} hãy điền đủ thông tin: ${thuocErrors.join(', ')}`)
      }
    })
  }

  if (Array.isArray(data.xetNghiem)) {
    data.xetNghiem.forEach((xetNghiem, index) => {
      if (!xetNghiem || typeof xetNghiem !== 'object') return
      const xnErrors: string[] = []

      if (!xetNghiem.loaiXetNghiem) xnErrors.push('Loại xét nghiệm')
      if (!xetNghiem.ngayChiDinh) xnErrors.push('Ngày chỉ định')
      if (!xetNghiem.hinhAnh) xnErrors.push('Hình ảnh')
      if (!xetNghiem.fileDinhKem) xnErrors.push('File kết quả')

      if (xnErrors.length > 0) {
        error.push(`Xét nghiệm ${index + 1} hãy điền đủ thông tin: ${xnErrors.join(', ')}`)
      }
    })
  }

  const throwError = error.map((err) => `• ${err}`).join('\n')

  if (error.length > 0) {
    throw new APIError(`Hãy điền đủ thông tin:\n${throwError}`, 400)
  }
}
