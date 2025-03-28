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
              console.log(
                `Trưởng khoa ${truongphongId} đã thuộc khoa "${data.tenphong}", không cần cập nhật.`,
              )
              return
            }

            // ✅ Cập nhật trưởng khoa mới
            await req.payload.update({
              collection: 'users',
              id: truongphongId,
              data: { phong: data.tenphong, chucvu: 'truongphong' },
            })

            console.log(`✅ Đã cập nhật trưởng khoa ${truongphongId} sang "${data.tenphong}".`)
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
              console.log(
                `Bác sĩ ${nhanvienId} đã thuộc khoa "${data.tenphong}", không cần cập nhật.`,
              )
              return
            }

            // ✅ Nếu bác sĩ này là trưởng khoa cũ, hạ xuống bác sĩ
            const newRole =
              user.chucvu === 'letan' || user.chucvu === 'kythuatvien' ? 'truongphong' : user.chucvu

            await req.payload.update({
              collection: 'users',
              id: nhanvienId,
              data: { phong: data.tenphong, chucvu: newRole },
            })

            console.log(`✅ Đã cập nhật khoa của bác sĩ ${nhanvienId} sang "${data.tenkhoa}".`)
          } catch (error) {
            console.error(`❌ Lỗi khi cập nhật khoa cho bác sĩ ${nhanvienId}:`, error)
          }
        }),
      )
    }
  }
}
