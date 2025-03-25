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
    if (!data?.truongkhoa || data.truongkhoa.length === 0) {
      return
    }
    if (!data?.tenkhoa) {
      return
    }
    await Promise.all(
      data.truongkhoa.map(async (truongkhoaId) => {
        await req.payload.update({
          collection: 'users',
          id: truongkhoaId,
          data: { khoa: data.tenkhoa }, // Lưu tên khoa vào users
        })
        console.log(`Đã cập nhật khoa cho bác sĩ có ID: ${truongkhoaId}`)
      }),
    )
  }
  if (operation === 'create' || operation === 'update') {
    if (!data?.doctors || data.doctors.length === 0) {
      return
    }

    if (!data?.tenkhoa) {
      return
    }
    await Promise.all(
      data.doctors.map(async (doctorId) => {
        await req.payload.update({
          collection: 'users',
          id: doctorId,
          data: { khoa: data.tenkhoa }, // Lưu tên khoa vào users
        })
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
