import { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

export const checkvalue: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === 'create') {
    const missingFields: string[] = []

    // Danh sách các trường bắt buộc
    const requiredFields = [
      { key: 'ten', label: 'Họ và tên' },
      { key: 'sdt', label: 'Số điện thoại' },
      { key: 'cccd', label: 'Căn cước công dân' },
      { key: 'ngaysinh', label: 'Ngày sinh ' },
      { key: 'gioitinh', label: 'Giới tính' },
      { key: 'diachi', label: 'Địa chỉ' },
    ]
    // Kiểm tra xem có trường nào bị thiếu không
    requiredFields.forEach((field) => {
      if (!data[field.key] || data[field.key].toString().trim() === '') {
        missingFields.push(field.label)
      }
    })

    const errors: string[] = []

    // Kiểm tra trùng Số điện thoại
    if (data.sdt) {
      const phoneCheck = await req.payload.find({
        collection: 'patients',
        where: { sdt: { equals: data.sdt } },
      })

      if (phoneCheck.totalDocs > 0) {
        errors.push('Số điện thoại đã được sử dụng.')
      }
    }

    // Kiểm tra trùng Email nếu có nhập
    if (data.email) {
      const emailCheck = await req.payload.find({
        collection: 'patients',
        where: { email: { equals: data.email } },
      })

      if (emailCheck.totalDocs > 0) {
        errors.push('Email đã được sử dụng.')
      }
    }

    // Kiểm tra trùng Căn cước công dân (CCCD)
    if (data.cccd) {
      const cccdCheck = await req.payload.find({
        collection: 'patients',
        where: { cccd: { equals: data.cccd } },
      })

      if (cccdCheck.totalDocs > 0) {
        errors.push('Căn cước công dân đã được sử dụng.')
      }
    }

    // Kiểm tra trùng Mã bảo hiểm y tế (BHYT) nếu có
    if (data.bhyt === 'co' && data.idbaohiem) {
      const bhytCheck = await req.payload.find({
        collection: 'patients',
        where: { idbaohiem: { equals: data.idbaohiem } },
      })

      if (bhytCheck.totalDocs > 0) {
        errors.push('Mã bảo hiểm y tế đã được sử dụng.')
      }
    }

    // Nếu có trường bị thiếu, thêm vào danh sách lỗi
    if (missingFields.length > 0) {
      errors.unshift(`Hãy điền đủ thông tin: ${missingFields.join(', ')}.`)
    }

    // Nếu có lỗi, ném APIError với danh sách lỗi
    if (errors.length > 0) {
      throw new APIError(errors.join('\n'), 400)
    }
  }
}
