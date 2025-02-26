import { beforeChange } from '@/hooks/HookDepartments'
import { APIError, CollectionConfig } from 'payload'

const Rooms: CollectionConfig = {
  slug: 'Rooms',
  labels: {
    singular: 'PHÒNG BỆNH',
    plural: 'PHÒNG BỆNH',
  },
  admin: { group: 'Quản lý nội dung' },
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
        {name:'tenphongbenh',
          label:'Tên Phòng',
          type:'relationship',
          relationTo:'MedicalRecods',
          hidden:true,
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
          name: 'hosobenhnhan',
          label: 'Hồ sơ bệnh nhân',
          type: 'relationship',
          relationTo: 'MedicalRecods',
          hasMany: true,
          required: true,
          filterOptions: {},
        },
        {
          name: 'bsi',
          label: 'Bác sĩ phụ trách',
          type: 'relationship',
          relationTo: 'users', // Liên kết tới bảng Users (bác sĩ)
          hasMany: true,
          required: true,
        },
      ],
      hooks: {
        beforeChange: [
          async ({ data, operation }) => {
            if (operation !== 'create' && operation !== 'update') return
            const totalRooms = data?.totalRooms || 0
            const totalCurrentRooms = data?.stt?.length || 0

            // Kiểm tra nếu tổng số phòng vượt quá giới hạn
            if (totalCurrentRooms > totalRooms) {
              throw new APIError(
                `Không thể thêm phòng mới, vì tổng số phòng đã đạt giới hạn (${totalRooms}).`,
                400,
              )
            }
            if (data?.stt?.length > 0) {
              data?.stt.forEach((room, index) => {
                const totalBeds = room.totalBeds || 0
                const patientCount = room.hosobenhnhan?.length || 0

                if (patientCount > totalBeds) {
                  throw new APIError(
                    `Phòng ${index + 1} có số lượng bệnh nhân là (${patientCount}) vượt quá (${totalBeds}) giường.`,
                    400,
                  )
                }
              })
            }
          },
        ],
      },
    },
  ],
  hooks:{beforeChange:[]}
}
export default Rooms
