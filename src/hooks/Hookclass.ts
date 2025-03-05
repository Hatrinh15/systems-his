import { APIError, CollectionBeforeChangeHook } from 'payload'

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
  if (operation === 'create' || operation === 'update') {
    if (!data?.nhanvien || data.nhanvien.length === 0) {
      console.log('Không có nhân viên nào trong danh sách , không cần cập nhật.')
      return
    }

    if (!data?.tenphong) {
      console.log(' Không có ID phòng, không thể cập nhật.')
      return
    }
    console.log(`Cập nhật phòng cho nhân viên, ID Phòng: ${data.tenphong}`)
    await Promise.all(
      data.nhanvien.map(async (nhanvienId) => {
        await req.payload.update({
          collection: 'users',
          id: nhanvienId,
          data: { phong: data.tenphong }, // Lưu tên khoa vào users
        })
        console.log(`Đã cập nhật khoa cho nhân viên có ID: ${nhanvienId}`)
      }),
    )
  }
}
