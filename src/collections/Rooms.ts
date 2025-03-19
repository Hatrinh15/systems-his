import { beforeChangeRooms } from '@/hooks/HookRooms'
import { CollectionConfig } from 'payload'

const Rooms: CollectionConfig = {
  slug: 'Rooms',
  labels: {
    singular: 'PHÒNG BỆNH',
    plural: 'PHÒNG BỆNH',
  },
  admin: { group: 'Quản lý nội dung', useAsTitle: 'khoa' },
  fields: [
    {
      name: 'khoa',
      label: 'Khoa',
      type: 'relationship',
      relationTo: 'departments',
      required: true,
    },
    {
      name: 'totalRooms',
      type: 'number',
      label: 'Tổng số phòng',
      required: true,
      min: 1,
      max: 100,
    },
    {
      name: 'Phong',
      type: 'array',
      label: 'Danh sách phòng',
      fields: [
        {
          type: 'row',
          fields: [
        {
          name: 'tenphongbenh',
          label: 'Tên Phòng',
          type: 'relationship',
          relationTo: 'MedicalRecods',
          hidden: true,
        },
        {
          name: 'totalBeds',
          type: 'number',
          label: 'Tổng số giường',
          required: true,
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
              console.log('Không có khoa nào được chọn!')
              return { id: { in: [] } }
            }
        
            try {
              console.log('Khoa được chọn:', data.khoa)
        
              // 1. Lấy danh sách bệnh nhân đã chọn trong các mục "Phong" trước đó
//dùng Set() để lưu trữ danh sách ID bệnh nhân đã được chọn, giúp loại bỏ bệnh nhân trùng lặp và dễ dàng kiểm tra xem bệnh nhân đã xuất hiện ở mục nào khác chưa.
              const selectedPatients = new Set()
              if (data?.Phong) {
                data.Phong.forEach((room) => {
                  if (room.benhnhan) {
                    const selectedIDs = Array.isArray(room.benhnhan) ? room.benhnhan : [room.benhnhan]
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
              console.log('Danh sách hồ sơ bệnh án:', medicalRecords.docs)
        
              if (!medicalRecords.docs.length) {
                console.log('Không tìm thấy hồ sơ bệnh án!')
                return { id: { in: [] } }
              }
        
              // 3. Tạo danh sách ID bệnh nhân hợp lệ
              const patientIDs = new Set()
        
              medicalRecords.docs.forEach((record) => {
                record.hoso?.forEach((hs) => {
                  const khoaId = typeof hs.khoa === 'object' && hs.khoa !== null ? hs.khoa.id : hs.khoa
        
                  if (khoaId === data.khoa && hs.tinhtrang === 'no') {
                    const idBenhnhan =
                      typeof record.thongtinbenhnhan === 'object' && record.thongtinbenhnhan !== null
                        ? record.thongtinbenhnhan.id
                        : record.thongtinbenhnhan
        
                    if (idBenhnhan) {
                      patientIDs.add(idBenhnhan)
                    }
                  }
                })
              })
        
              console.log('Danh sách ID bệnh nhân hợp lệ trước khi lọc:', Array.from(patientIDs))
        
              // 4. Nếu toàn bộ bệnh nhân hợp lệ đã bị chọn, giữ nguyên danh sách ban đầu
              if (patientIDs.size === 0) {
                console.log('Không có bệnh nhân nào hợp lệ! Trả về danh sách gốc để tránh lỗi.')
                return { id: { exists: true } } // Hiển thị tất cả bệnh nhân để tránh lỗi
              }
        
              // 5. Loại bỏ bệnh nhân đã chọn trong mục "Phong" khác
              selectedPatients.forEach((id) => patientIDs.delete(id))
        
              console.log('Danh sách ID bệnh nhân sau khi loại bỏ đã chọn:', Array.from(patientIDs))
        
              // 6. Nếu sau khi lọc không còn bệnh nhân nào, không lọc nữa
              if (patientIDs.size === 0) {
                console.log('Tất cả bệnh nhân hợp lệ đã bị chọn, không lọc nữa.')
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
  hooks: { beforeChange: [beforeChangeRooms] },
}
export default Rooms
