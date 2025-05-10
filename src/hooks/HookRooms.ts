import { APIError, CollectionAfterReadHook, CollectionBeforeChangeHook } from 'payload'
import { Access } from 'payload'
import { User } from '@/payload-types'
export const beforeChangeRooms: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create' && operation !== 'update') return
  if (operation === 'create') {
    const existingRooms = await req.payload.find({
      collection: 'Rooms',
      where: { khoa: { equals: data?.khoa } },
    })

    if (existingRooms.docs.length > 0) {
      throw new APIError(`Khoa này đã tồn tại trong danh sách phòng! Vui lòng chọn khoa khác.`, 400)
    }
  }
  const totalRooms = data?.totalRooms || 0
  const totalCurrentRooms = data?.Phong?.length || 0

  // Kiểm tra nếu tổng số phòng vượt quá giới hạn
  if (totalCurrentRooms > totalRooms) {
    throw new APIError(
      `Không thể thêm phòng mới, vì tổng số phòng đã đạt giới hạn (${totalRooms}).`,
      400,
    )
  }
  if (data?.Phong?.length > 0) {
    data?.Phong.forEach((room, index) => {
      const totalBeds = room.totalBeds || 0
      const patientCount = room.benhnhan?.length || 0

      if (patientCount > totalBeds) {
        throw new APIError(
          `Phòng ${index + 1} có số lượng bệnh nhân vượt quá số giường quy định là (${patientCount - totalBeds}) giường`,
          400,
        )
      }
      if (!room.bsi || room.bsi.length === 0) {
        throw new APIError(
          `Phòng ${index + 1} chưa có bác sĩ phụ trách. Vui lòng chọn ít nhất một bác sĩ.`,
          400,
        )
      }
    })
  }
}

export const checkTenPhong: CollectionBeforeChangeHook = async ({ data, req, operation, originalDoc }) => {
  if (!data?.Phong || !Array.isArray(data.Phong)) return

  const newNames = data.Phong.map((room) => room.tenphongbenh?.trim().toLowerCase()).filter(Boolean)
  if (newNames.length === 0) return

  // ✅ Kiểm tra trùng tên trong chính bản ghi đang nhập (cùng khoa)
  const nameCounts: Record<string, number> = {}
  newNames.forEach((name) => {
    nameCounts[name] = (nameCounts[name] || 0) + 1
  })

  const duplicatesInSameRecord = Object.entries(nameCounts)
    .filter(([_, count]) => count > 1)
    .map(([name]) => name)

  if (duplicatesInSameRecord.length > 0) {
    throw new APIError(`Tên phòng đã tồn tại trong khoa: ${duplicatesInSameRecord.join(', ')}`, 400)
  }

  // Lấy tên phòng cũ từ originalDoc nếu đang update
  const oldNames = operation === 'update' && originalDoc?.Phong
    ? originalDoc.Phong.map((room) => room.tenphongbenh?.trim().toLowerCase()).filter(Boolean)
    : []

  // ✅ Lấy tất cả bản ghi (bao gồm cả bản ghi hiện tại)
  const allRooms = await req.payload.find({
    collection: 'Rooms',
    limit: 1000,
  })

  // ✅ Kiểm tra trùng tên với các bản ghi khác trong hệ thống
  const existingNames = new Set<string>()
  allRooms.docs.forEach((doc) => {
    doc?.Phong?.forEach((room) => {
      const name = room?.tenphongbenh?.trim().toLowerCase()
      if (name) existingNames.add(name)
    })
  })

  // Nếu đang update, chỉ kiểm tra các tên mới (không nằm trong oldNames)
  const namesToCheck = operation === 'update'
    ? newNames.filter((name) => !oldNames.includes(name))
    : newNames

  const duplicatesInOtherRecords = namesToCheck.filter((name) => existingNames.has(name))

  if (duplicatesInOtherRecords.length > 0) {
    throw new APIError(`Tên phòng đã tồn tại ở khoa khác: ${duplicatesInOtherRecords.join(', ')}`, 400)
  }
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

export const themOrXoaRoom: CollectionBeforeChangeHook = async ({ data, req, originalDoc }) => {
  const user = req.user as User

  // Kiểm tra nếu không phải admin
  if (user?.taikhoan !== 'admin') {
    const originalRooms = originalDoc?.Phong || []
    const updatedRooms = data?.Phong || []

    const originalLength = originalRooms.length
    const updatedLength = updatedRooms.length

    // Nếu số lượng phòng khác => hoặc có thêm hoặc có xóa
    if (updatedLength !== originalLength) {
      throw new APIError('Bạn không được phép thêm hoặc xóa phòng bệnh!',400)
    }

    // Nếu người dùng cố gắng sửa danh sách (ví dụ thay đổi tên), bạn có thể kiểm tra thêm từng phòng
    // (phần này tuỳ chọn nếu bạn muốn kiểm soát cả update nội dung)
  }

  return data
}

export const formatGiaPhong: CollectionBeforeChangeHook= async ({ data }) => {
  if (data.giaphong && typeof data.giaphong === 'string') {
    // Xóa các dấu chấm cũ nếu có
    const cleaned = data.giaphong.replace(/\./g, '');
    const number = parseInt(cleaned);

    if (!isNaN(number)) {
      data.giaphong = number.toLocaleString('vi-VN'); // → 100000 → "100.000"
    }
  }

  return data;
}