import { APIError, CollapsedPreferences, CollectionBeforeChangeHook } from 'payload'
import { User } from '@/payload-types'
import { Access } from 'payload'

import { isAdmin } from './AccessAdmin'
export const beforeChangeclass: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === 'create') {
    const existingClass = await req.payload.find({
      collection: 'class',
      where: { tenphong: { equals: data?.tenphong } },
    })

    if (existingClass.docs.length > 0) {
      throw new APIError(`Phòng này đã có trong danh sách ! Vui lòng chọn phòng khác.`, 400)
    }
  }
  ///cập nhật phòng cho truongphong
  if (operation === 'create' || operation === 'update') {
    if (!data?.tenphong) {
      return
    }

    // 🚀 Cập nhật trưởng khoa trước (nếu có)
    if (data.truongphong && data.truongphong.length > 0) {
      await Promise.all(
        data.truongphong.map(async (truongphongId) => {
          try {
            const user = await req.payload.findByID({
              collection: 'users',
              id: truongphongId,
            })

            if (!user) return

            if (user.phong === data.tenphong && user.chucvu === 'truongphong') {
              
              return
            }

            // ✅ Cập nhật trưởng khoa mới
            await req.payload.update({
              collection: 'users',
              id: truongphongId,
              data: { phong: data.tenphong, chucvu: 'truongphong' },
            })

          } catch (error) {
            console.error(`❌ Lỗi khi cập nhật trưởng khoa ${truongphongId}:`, error)
          }
        }),
      )
    }
    ///cập nhật phòng cho nhân viên
    if (data.nhanvien && data.nhanvien.length > 0) {
      await Promise.all(
        data.nhanvien.map(async (nhanvienId) => {
          try {
            const user = await req.payload.findByID({
              collection: 'users',
              id: nhanvienId,
            })

            if (!user) return

            if (user.phong === data.tenphong) {
              
              return
            }

            // ✅ Nếu bác sĩ này là trưởng khoa cũ, hạ xuống bác sĩ
            const newRole =
              user.chucvu === 'nhanvienkho' ||user.chucvu === 'ketoan' || user.chucvu === 'kythuatvien' ? 'truongphong' : user.chucvu

            await req.payload.update({
              collection: 'users',
              id: nhanvienId,
              data: { phong: data.tenphong, chucvu: newRole },
            })

            
          } catch (error) {
            console.error(`❌ Lỗi khi cập nhật khoa cho bác sĩ ${nhanvienId}:`, error)
          }
        }),
      )
    }
  }
}
export const checkclass: CollectionBeforeChangeHook= async ({ data }) => {
  const errors: string[] = []

  // Kiểm tra tên phòng
  if (!data?.tenphong) {
    errors.push('Vui lòng chọn TÊN PHÒNG.')
  }

  // Kiểm tra trưởng phòng
  if (!data?.truongphong || data.truongphong.length === 0) {
    errors.push('Vui lòng chọn TRƯỞNG PHÒNG.')
  }

  // Kiểm tra nhân viên
  if (!data?.nhanvien || data.nhanvien.length === 0) {
    errors.push('Vui lòng chọn ít nhất một NHÂN VIÊN.')
  }

  // Kiểm tra ngày thành lập
  if (!data?.thongtin?.ngaythanhlap) {
    errors.push('Vui lòng chọn NGÀY THÀNH LẬP.')
  }

  if (errors.length > 0) {
    throw new APIError(errors.join('\n'),400) // Hiển thị lỗi gộp nhiều dòng
  }

  return data
}
export const notChangeNameClass: CollectionBeforeChangeHook = async ({ req, data, originalDoc }) => {
  // Nếu đang update (document đã tồn tại)
  if (originalDoc) {
    const oldTenPhong = originalDoc.tenphong
    const newTenPhong = data?.tenphong

    if (oldTenPhong && newTenPhong && oldTenPhong !== newTenPhong) {
      throw new APIError('TÊN PHÒNG đã được chọn và không thể thay đổi.', 400)
    }
  }

  return data
}
export const showTitle: CollectionBeforeChangeHook = async ({ data }) => {
  if (!data) return
  const titlePhong = [
    { label: 'Phòng hành chính-quản trị', value: 'hanhchinhquantri' },
    { label: 'Phòng tài chính-kế toán', value: 'taichinhketoan' },
    { label: 'Phòng công nghệ thông tin', value: 'anninh' },
  ]
  titlePhong.map((item) => {
    if (data.tenphong === item.value) {
      data.title = item.label
    }
  })
  return data
}
 
export const readClassAccess: Access = async ({ req }) => {

  // Admin thì truy cập toàn quyền
  if (req?.user?.taikhoan === 'admin') {
    return true
  }
  const chucvu = req?.user?.chucvu

  // Nếu không phải bác sĩ, y tá, trưởng khoa => không thấy gì cả
  const allowedRoles = ['nhanvienkho', 'ketoan', 'truongphong']
  if (!chucvu || !allowedRoles.includes(chucvu)) {
    return false
  }

  // Nếu user có khoa, thì trả về khoa tương ứng
  const find = await req.payload.find({
    collection: 'class',
    where: {
      tenphong: { equals: req?.user?.phong },
    },
  })

  const id = find.docs[0]?.id

  // Nếu không tìm thấy khoa thì không trả về gì cả
  if (!id) return false

  return {
    id: {
      equals: id,
    },
  }
}

