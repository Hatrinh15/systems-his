import { APIError, CollectionBeforeChangeHook } from 'payload'

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
