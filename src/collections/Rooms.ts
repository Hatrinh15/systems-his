import { beforeChangeRooms, checkTenPhong } from '@/hooks/HookRooms'
import { CollectionConfig } from 'payload'

const Rooms: CollectionConfig = {
  slug: 'Rooms',
  labels: {
    singular: 'Phòng Bệnh',
    plural: 'Phòng Bệnh',
  },
  admin: { group: 'Khoa & Nhân sự ', useAsTitle: 'khoa' },
  fields: [
    {
      name: 'khoa',
      label: 'Khoa',
      type: 'relationship',
      relationTo: 'departments',
      admin: {
        allowCreate: false,
      },
    },
    {
      name: 'totalRooms',
      type: 'number',
      label: 'Tổng số phòng',
      min: 1,
      max: 100,
    },
    {
      name: 'Phong',
      type: 'array',
      label: 'Danh sách phòng',
      fields: [
        {
          name: 'tenphongbenh',
          label: 'Tên phòng',
          type: 'text'
        },
        {
          type: 'row',
          fields: [
            {
              name: 'totalBeds',
              type: 'number',
              label: 'Tổng số giường',
              min: 1,
              max: 100,
            },

            {
              name: 'benhnhan',
              label: 'Bệnh nhân',
              type: 'relationship',
              relationTo: 'patients',
              hasMany: true,
              filterOptions: async ({ req, data }) => {
                if (!data?.khoa) {
                  return { id: { in: [] } }
                }

                try {
                  // 1. Lấy danh sách bệnh nhân đã chọn trong các mục "Phong" trước đó
                  //dùng Set() để lưu trữ danh sách ID bệnh nhân đã được chọn, giúp loại bỏ bệnh nhân trùng lặp và dễ dàng kiểm tra xem bệnh nhân đã xuất hiện ở mục nào khác chưa.
                  const selectedPatients = new Set()
                  if (data?.Phong) {
                    data.Phong.forEach((room) => {
                      if (room.benhnhan) {
                        const selectedIDs = Array.isArray(room.benhnhan)
                          ? room.benhnhan
                          : [room.benhnhan]
                        selectedIDs.forEach((id) => selectedPatients.add(id))
                      }
                    })
                  }

                  // 2. Tìm danh sách bệnh án thuộc khoa đã chọn
                  const medicalRecords = await req.payload.find({
                    collection: 'MedicalRecods',
                    where: {
                      'hoso.khoa': { contains: String(data.khoa) },
                    },
                    limit: 1000,
                  })

                  if (!medicalRecords.docs.length) {
                    console.log('Không tìm thấy hồ sơ bệnh án!')
                    return { id: { in: [] } }
                  }

                  // 3. Tạo danh sách ID bệnh nhân hợp lệ
                  const patientIDs = new Set()

                  medicalRecords.docs.forEach((record) => {
                    record.hoso?.forEach((hs) => {
                      const khoaId =
                        typeof hs.khoa === 'object' && hs.khoa !== null ? hs.khoa.id : hs.khoa

                      if (khoaId === data.khoa && hs.tinhtrang === 'no') {
                        const idBenhnhan =
                          typeof record.thongtinbenhnhan === 'object' &&
                          record.thongtinbenhnhan !== null
                            ? record.thongtinbenhnhan.id
                            : record.thongtinbenhnhan

                        if (idBenhnhan) {
                          patientIDs.add(idBenhnhan)
                        }
                      }
                    })
                  })

                  // 4. Nếu toàn bộ bệnh nhân hợp lệ đã bị chọn, giữ nguyên danh sách ban đầu
                  if (patientIDs.size === 0) {
                    console.log('Không có bệnh nhân nào hợp lệ! Trả về danh sách gốc để tránh lỗi.')
                    return { id: { exists: true } } // Hiển thị tất cả bệnh nhân để tránh lỗi
                  }

                  // 5. Loại bỏ bệnh nhân đã chọn trong mục "Phong" khác
                  selectedPatients.forEach((id) => patientIDs.delete(id))

                  // 6. Nếu sau khi lọc không còn bệnh nhân nào, không lọc nữa
                  if (patientIDs.size === 0) {
                    return { id: { exists: true } } //để giữ cho danh sách bệnh nhân không bị rỗng, giúp bạn vẫn lưu dữ liệu được.
                  }

                  return { id: { in: Array.from(patientIDs) } }
                } catch (error) {
                  console.error('Lỗi khi lọc bệnh nhân:', error)
                  return { id: { in: [] } }
                }
              },
            },

            {
              name: 'bsi',
              label: 'Bác sĩ phụ trách',
              type: 'relationship',
              relationTo: 'users',
              admin: {
                allowCreate: false,
              },
              hasMany: true,
              filterOptions: async ({ req, data }) => {
                if (!data?.khoa) return { id: { in: [] } } // Nếu chưa chọn khoa, không hiển thị bác sĩ nào

                try {
                  // Lấy danh sách bác sĩ từ khoa đã chọn trong Departments
                  const department = await req.payload.findByID({
                    collection: 'departments',
                    id: data.khoa,
                  })

                  if (!department || !department.doctors || department.doctors.length === 0) {
                    return { id: { in: [] } } // Không có bác sĩ nào trong khoa này
                  }

                  return {
                    id: {
                      in: department.doctors.map((doctor) =>
                        typeof doctor === 'object' && doctor != null ? doctor.id : doctor,
                      ),
                    },
                  } // Trả về danh sách ID bác sĩ
                } catch (error) {
                  console.error('Lỗi khi lọc bác sĩ:', error)
                  return { id: { in: [] } }
                }
              },
            },
          ],
        },
      ],
    },
  ],
  hooks: { beforeChange: [beforeChangeRooms,checkTenPhong] },
}
export default Rooms
