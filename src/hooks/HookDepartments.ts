import { APIError, CollectionBeforeChangeHook } from 'payload'

export const beforeChange: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === 'create') {
    const existingDepartments = await req.payload.find({
      collection: 'departments',
      where: { tenkhoa: { equals: data?.tenkhoa } },
    })

    if (existingDepartments.docs.length > 0) {
      throw new APIError(`Khoa này đã tồn tại trong danh sách! Vui lòng chọn khoa khác.`, 400)
    }
  }
  /// cập nhật cho trưởng khoa
  if (operation === 'create' || operation === 'update') {
    if (!data?.tenkhoa) {
      return
    }

    // 🚀 Cập nhật trưởng khoa trước (nếu có)
    if (data.truongkhoa && data.truongkhoa.length > 0) {
      await Promise.all(
        data.truongkhoa.map(async (truongkhoaId) => {
          try {
            const user = await req.payload.findByID({
              collection: 'users',
              id: truongkhoaId,
            })

            if (!user) return

            if (user.khoa === data.tenkhoa && user.chucvu === 'truongkhoa') {
              console.log(
                `Trưởng khoa ${truongkhoaId} đã thuộc khoa "${data.tenkhoa}", không cần cập nhật.`,
              )
              return
            }

            // ✅ Cập nhật trưởng khoa mới
            await req.payload.update({
              collection: 'users',
              id: truongkhoaId,
              data: { khoa: data.tenkhoa, chucvu: 'truongkhoa' },
            })

            console.log(`✅ Đã cập nhật trưởng khoa ${truongkhoaId} sang "${data.tenkhoa}".`)
          } catch (error) {
            console.error(`❌ Lỗi khi cập nhật trưởng khoa ${truongkhoaId}:`, error)
          }
        }),
      )
    }

    // 🚀 Cập nhật bác sĩ (không phụ thuộc vào trưởng khoa)
    if (data.doctors && data.doctors.length > 0) {
      await Promise.all(
        data.doctors.map(async (doctorId) => {
          try {
            const user = await req.payload.findByID({
              collection: 'users',
              id: doctorId,
            })

            if (!user) return

            if (user.khoa === data.tenkhoa) {
              console.log(`Bác sĩ ${doctorId} đã thuộc khoa "${data.tenkhoa}", không cần cập nhật.`)
              return
            }

            // ✅ Nếu bác sĩ này là trưởng khoa cũ, hạ xuống bác sĩ
            const newRole = user.chucvu === 'truongkhoa' ? 'bacsi' : user.chucvu

            await req.payload.update({
              collection: 'users',
              id: doctorId,
              data: { khoa: data.tenkhoa, chucvu: newRole },
            })

            console.log(`✅ Đã cập nhật khoa của bác sĩ ${doctorId} sang "${data.tenkhoa}".`)
          } catch (error) {
            console.error(`❌ Lỗi khi cập nhật khoa cho bác sĩ ${doctorId}:`, error)
          }
        }),
      )
    }
  }

  ////cập nhật cho y tá
  if (operation === 'create' || operation === 'update') {
    if (!data?.nures || data.nures.length === 0) {
      return
    }

    if (!data?.tenkhoa) {
      return
    }

    await Promise.all(
      data.nures.map(async (nuresId) => {
        try {
          // 🔍 Tìm bác sĩ hiện tại trong collection "users"
          const user = await req.payload.findByID({
            collection: 'users',
            id: nuresId,
          })

          if (!user) return // Nếu không tìm thấy bác sĩ, bỏ qua

          // 🛑 Nếu bác sĩ đã ở đúng khoa, không cần cập nhật
          if (user.khoa === data.tenkhoa) {
            console.log(`Y tá ${nuresId} đã thuộc khoa "${data.tenkhoa}", không cần cập nhật.`)
            return
          }

          // ✅ Cập nhật khoa mới cho bác sĩ
          await req.payload.update({
            collection: 'users',
            id: nuresId,
            data: { khoa: data.tenkhoa },
          })

          console.log(`Đã cập nhật khoa của Y tá ${nuresId} sang "${data.tenkhoa}".`)
        } catch (error) {
          console.error(`Lỗi khi cập nhật khoa cho Y tá ${nuresId}:`, error)
        }
      }),
    )
  }
}
export const showTitle: CollectionBeforeChangeHook = async ({ data }) => {
  if (!data) return
  const titleKhoa = [
    { label: 'Khoa tai', value: 'tai' },
    { label: 'Khoa mũi xoang', value: 'mui' },
    { label: 'Khoa họng-thanh quản', value: 'hong' },
    { label: 'Khoa cấp cứu', value: 'capcuu' },
    { label: 'Khoa gây mê hồi sức', value: 'gaymehoisuc' },
    { label: 'Khoa chẩn đoán hình ảnh', value: 'chandoanhinhanh' },
    { label: 'Khoa xét nghiệm', value: 'khoaxetnghiem' },
    { label: 'Khoa dược', value: 'khoaduoc' },
    { label: 'Khoa khác', value: 'khoakhac' },
  ]
  titleKhoa.map((item) => {
    if (data.tenkhoa === item.value) {
      data.title = item.label
    }
  })
  return data
}
