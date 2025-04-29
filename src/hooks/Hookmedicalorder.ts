import { APIError, CollectionBeforeValidateHook, CollectionBeforeChangeHook } from 'payload'
import { PayloadRequest } from 'payload'
import { Access } from 'payload'
import { User } from '@/payload-types'
import { isAdmin, isBacSiYTaTruongKhoa } from './AccessAdmin'

export const valuemedicalorder: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return

  const error: string[] = []
  if(!data.hosobenhan) error.push('Hồ sơ bệnh án')
 
  if (!data.chuandoan) error.push('Chuẩn đoán')
  if (!data.hinhthucdieutri) {
    error.push('Hình thức điều trị')
  } else {
    // Kiểm tra theo hình thức điều trị
    if (data.hinhthucdieutri === 'benhnhannoitru') {
      if (!data.ngaynhapvien) {
        error.push('ngày nhập viện (bắt buộc với bệnh nhân nội trú)')
      }
      if(!data.ngayLap) {
        error.push('ngày lập (bắt buộc với bệnh nhân nội trú)')
      }
    } else if (data.hinhthucdieutri === 'benhnhanngoaitru') {
      // Với ngoại trú chỉ cần ngày lập
      if (!data.ngayLap) {
        error.push('ngày lập (bắt buộc với bệnh nhân ngoại trú)')
      }
    }
  }

  // Kiểm tra danh sách thuốc
  if (Array.isArray(data.thuoc)) {
    data.thuoc.forEach((thuoc, index) => {
      if (!thuoc || typeof thuoc !== 'object') return
      const thuocErrors: string[] = []

      if (!thuoc.hamLuong) thuocErrors.push('Hàm lượng')
      if (!thuoc.lieuDung) thuocErrors.push('Liều dùng')
      if (!thuoc.cachDung) thuocErrors.push('Cách dùng')
      if (!thuoc.thoiGian) thuocErrors.push('Thời gian')

      if (thuocErrors.length > 0) {
        error.push(`Thuốc ${index + 1} thiếu: ${thuocErrors.join(', ')}`)
      }
    })
  }

  // Kiểm tra danh sách xét nghiệm
  if (Array.isArray(data.xetNghiem)) {
    data.xetNghiem.forEach((xetNghiem, index) => {
      if (!xetNghiem || typeof xetNghiem !== 'object') return
      const xnErrors: string[] = []

      if (!xetNghiem.loaiXetNghiem) xnErrors.push('Loại xét nghiệm')
      if (!xetNghiem.ngayChiDinh) xnErrors.push('Ngày chỉ định')
      if (!xetNghiem.hinhAnh) xnErrors.push('Hình ảnh')
      if (!xetNghiem.fileDinhKem) xnErrors.push('File kết quả')

      if (xnErrors.length > 0) {
        error.push(`Xét nghiệm ${index + 1} thiếu: ${xnErrors.join(', ')}`)
      }
    })
  }

  if (error.length > 0) {
    const throwError = error.map((err) => `, ${err}`).join('\n')
    throw new APIError(`Hãy điền đủ thông tin:\n${throwError}`, 400)
  }
}

export const hookcheck: CollectionBeforeChangeHook = async ({ data }) => {
  const errors: string[] = []

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Chỉ lấy ngày

  // Kiểm tra ngày lập y lệnh
  if (data?.ngayLap) {
    const ngayLap = new Date(data.ngayLap)
    ngayLap.setHours(0, 0, 0, 0) // bỏ phần giờ
    if (ngayLap.getTime() > today.getTime()) {
      errors.push('Ngày lập y lệnh không được ở tương lai.')
    }
  }

  // Kiểm tra ngày nhập viện nếu là bệnh nhân nội trú
  if (data?.hinhthucdieutri === 'benhnhannoitru' && data?.ngaynhapvien) {
    const ngayNhapVien = new Date(data.ngaynhapvien)
    ngayNhapVien.setHours(0, 0, 0, 0)
    if (ngayNhapVien.getTime() > today.getTime()) {
      errors.push('Ngày nhập viện không được ở tương lai.')
    }
  }

  if (errors.length > 0) {
    throw new APIError(errors.join(' '), 400)
  }

  return data
}

export const hookSoHoSo: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data?.hosobenhan) return data

  const recordID = typeof data.hosobenhan === 'string' ? data.hosobenhan : data.hosobenhan.id
  if (!recordID) return data

  const medicalRecord = await req.payload.findByID({
    collection: 'MedicalRecods',
    id: recordID,
  })

  const hosos = medicalRecord?.hoso || []

  const dataKhoaID = typeof data.khoa === 'string' ? data.khoa : data.khoa?.id

  const hosoDangNhapVien = hosos.find((h) => {
    const khoaID = typeof h.khoa === 'string' ? h.khoa : h.khoa?.id
    return khoaID === dataKhoaID && h.tinhtrang === 'no'
  })

  if (hosoDangNhapVien) {
    data.sohoso = hosoDangNhapVien.sohoso
  }

  return data
}

export const notChangeHinhThucĐT: CollectionBeforeChangeHook = async ({ data, req, operation, originalDoc }) => {
  if (operation === 'update') {
    const oldValue = originalDoc?.hinhthucdieutri
    const newValue = data.hinhthucdieutri

    if (oldValue && newValue && oldValue !== newValue) {
      throw new APIError('Hình thức điều trị đã được chọn và không thể thay đổi.',400)
    }
  }

  return data
}

export const checkKhoaRead: Access= async ({req,data})=> {
  const user = req.user as User;
  // Kiểm tra nếu là admin hoặc bác sĩ/y tá/trưởng khoa
  if (user?.taikhoan === 'admin') {
    return true;
  }

  // Kiểm tra khoa của người dùng và khoa trong bản ghi
const userKhoa = user?.khoa; // Khoa của người dùng, là chuỗi
const find = await req.payload.find({
  collection: 'departments',
  where: {
    tenkhoa: { equals: userKhoa },
  }
})
const id = find.docs[0]?.id
// Nếu khoa của người dùng trùng với khoa của bản ghi, cho phép xem
  if (user?.chucvu === 'bacsi' ||user?.chucvu === 'truongkhoa' || user?.chucvu === 'yta') {
  return {
    khoa : {
      equals: id
    }
  }
}

  return false;
}
  // Nếu không thỏa mãn, không cho phép xem
export const checkAutoKhoa: CollectionBeforeChangeHook = async ({ req, data, originalDoc }) => {
  // Nếu là admin thì không cần tự động gán khoa
  const user = req.user

  // Nếu là admin thì bỏ qua
  if ((user as User & { role?: string })?.role === 'admin') {
    return data
  }
  const find = await req.payload.find({
    collection: 'departments',
    where: {
      tenkhoa: { equals: user?.khoa, },
    }
  })
  const id = find.docs[0]?.id
  // Kiểm tra nếu user có liên kết đến khoa
  if (user?.khoa) {
    // Nếu trường khoa chưa có hoặc muốn ghi đè
    return {
      ...data,
      khoa: id, // Gán khoa từ tài khoản nhân sự đang đăng nhập
    }
  }

  return data
}
export const BacSiyTa: CollectionBeforeChangeHook = async ({ req, data }) => {
  if (!data) return

  const user = req.user

  if (!user) return

  // Nếu là bác sĩ hoặc trưởng khoa
  if (user.chucvu === 'bacsi' || user.chucvu === 'truongkhoa') {
    // Nếu chưa có người được gán vào trường bác sĩ
    if (!data.bacsi) {
      return {
        ...data,
        bacsi: user.id, // Gán user hiện tại làm bác sĩ
      }
    }
  }

  // Nếu là y tá
  if (user.chucvu === 'yta') {
    if (!data.dieuduong) {
      return {
        ...data,
        dieuduong: user.id, // Gán user hiện tại làm điều dưỡng
      }
    }
  }

  return data
}
