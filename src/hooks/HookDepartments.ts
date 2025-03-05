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
  if (operation === 'create' || operation === 'update') {
    if (!data?.doctors || data.doctors.length === 0) {
      console.log('Không có bác sĩ nào trong danh sách , không cần cập nhật.')
      return
    }

    if (!data?.tenkhoa) {
      console.log(' Không có ID khoa, không thể cập nhật.')
      return
    }
    console.log(`Cập nhật khoa cho bác sĩ, ID Khoa: ${data.tenkhoa}`)
    await Promise.all(
      data.doctors.map(async (doctorId) => {
        await req.payload.update({
          collection: 'users',
          id: doctorId,
          data: { khoa: data.tenkhoa }, // Lưu tên khoa vào users
        })
        console.log(`Đã cập nhật khoa cho bác sĩ có ID: ${doctorId}`)
      }),
    )
  }
  if (operation === 'create' || operation === 'update') {
    if (!data?.nures || data.nures.length === 0) {
      console.log('Không có y tá nào trong danh sách , không cần cập nhật.')
      return
    }

    if (!data?.tenkhoa) {
      console.log(' Không có ID khoa, không thể cập nhật.')
      return
    }
    console.log(` Cập nhật khoa cho y tá, ID Khoa: ${data.tenkhoa}`)
    await Promise.all(
      data.nures.map(async (nuresId) => {
        await req.payload.update({
          collection: 'users',
          id: nuresId,
          data: { khoa: data.tenkhoa }, // Lưu tên khoa vào users
        })
        console.log(`Đã cập nhật khoa cho bác sĩ có ID: ${nuresId}`)
      }),
    )
  }
}
