import { CollectionConfig } from 'payload'
const Departments: CollectionConfig = {
  slug: 'departments',
  labels: {
    singular: 'PHÒNG BAN',
    plural: 'PHÒNG BAN',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Thông tin phòng ban',
          fields: [
            {
              name: 'tenphong',
              label: 'TÊN PHÒNG',
              type: 'select',
              options: [
                { label: 'Tai', value: 'tai' },
                { label: 'Mũi', value: 'mui' },
                { label: 'Họng-Thanh quản ', value: 'hong' },
                { label: 'Cấp cứu', value: 'capcuu' },
                { label: 'Gây mê hồi sức', value: 'gaymehoisuc' },
              ],
            },
            {
              name: 'bacsiphutrach',
              label: 'Bác sĩ phụ trách',
              type: 'relationship',
              relationTo: 'users', // Đúng collection
              hasMany: true, // Một bác sĩ phụ trách một phòng
              filterOptions: ({data}) => {
                return {
                  chucvu: { equals: 'bacsi' },
                  chuyenkhoa: { equals: data?.tenphong },
                }
              },
            },
            {
              name: 'nhanvien',
              label: 'Nhân viên',
              type: 'relationship',
              relationTo: 'users', // Đúng collection
              hasMany: true, // Một bác sĩ phụ trách một phòng
              filterOptions: ({data}) => {
                return {
                  chucvu: { equals: 'yta' },
                  chuyenkhoa: { equals: data?.tenphong },
                }
              },
            },
            {
              name: 'thongtin',
              label: 'Thông tin hoạt động',
              type: 'group',
              fields: [
                { name: 'mota', label: 'Mô tả', type: 'text' },
                { name: 'ngaythanhlap', label: 'Ngày thành lập', type: 'date' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
export default Departments
