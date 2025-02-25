import { beforeChangeclass } from '@/hooks/Hookclass';
import { CollectionConfig } from 'payload'
const Class: CollectionConfig = {
  slug: 'class',
  labels: {
    singular: 'PHÒNG ',
    plural: 'PHÒNG ',
  },
  admin: {group:'Khối'},
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
              type: 'radio',
              options: [
                {label:'Phòng hành chính-quản trị',value:'hanhchinhquantri'},
                {label:'Phòng tài chính-kế toán',value:'taichinhketoan'},
                {label:'Phòng an ninh',value:'anninh'},
              ],
            },
            {
              name: 'truongphong',
              label: 'Trưởng phòng',
              type: 'relationship',
              relationTo: 'users', // Đúng collection
              hasMany: true, // Một bác sĩ phụ trách một phòng
              filterOptions: ({data}) => {
                return {
                  chucvu: { equals: 'truongphong' },
                  
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
  hooks:{
    beforeChange:[beforeChangeclass],
  }
}
export default Class
