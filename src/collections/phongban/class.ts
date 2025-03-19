import { beforeChangeclass } from '@/hooks/Hookclass';
import { CollectionConfig } from 'payload'
const Class: CollectionConfig = {
  slug: 'class',
  labels: {
    singular: 'Phòng ',
    plural: 'Phòng ',
  },
  admin: {group: 'Khoa & Nhân sự ',},
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
              name: 'nhanvien',
              label: 'Nhân viên',
              type: 'relationship',
              relationTo: 'users',
              hasMany: true,
              filterOptions: async ({ req, data }) => {
                try {
                  console.log('Dữ liệu hiện tại của form:', JSON.stringify(data, null, 2));
            
                  // Danh sách nhân viên đã chọn
                  const selectedNhanVien = Array.isArray(data?.nhanvien)
                    ? data.nhanvien
                        .map((nv) => (typeof nv === 'string' ? nv : nv?.id))
                        .filter(Boolean)
                    : [];
            
                  console.log('Nhân viên đang được chọn:', selectedNhanVien);
            
                  // Lấy danh sách nhân viên đã có phòng trong hệ thống
                  //dùng req.payload.find để tìm tất cả các nhân viên đã có khoa
                  const existingNhanVienData = await req.payload.find({
                    collection: 'class',
                    where: { nhanvien: { exists: true } },
                    limit: 999, // Giới hạn kết quả
                  });
            
                  // Lấy danh sách ID nhân viên đã có phòng (existingNhanvien)
                  const existingNhanVien = existingNhanVienData?.docs?.flatMap((doc) =>
                    (doc?.nhanvien ?? [])
                      .map((nv) => (typeof nv === 'string' ? nv : nv?.id))
                      .filter(Boolean)
                  ) ?? [];
            
                  console.log(' Nhân viên đã có phòng:', existingNhanVien);
            
                  // Điều kiện lọc nhân viên theo phòng ban
                  const baseCondition = data?.tenphong === 'hanhchinhquantri'
                    ? { chucvu: { equals: 'letan' } } // Lễ tân cho phòng hành chính quản trị
                    : { chucvu: { equals: 'kythuatvien' } }; // Kỹ thuật viên cho phòng khác
            
                  return {
                    and: [
                      baseCondition,
                      { tinhtranglamviec: { not_equals: 'nghiviec' } }, // Không hiển thị nhân viên đã nghỉ việc
                      {
                        or: [
                          { id: { not_in: existingNhanVien } }, // Không hiển thị nhân viên đã có phòng
                          { id: { in: selectedNhanVien } }, // Giữ lại nhân viên đã chọn trước đó
                        ],
                      },
                    ],
                  } as any
                } catch (error) {
                  console.error(' Lỗi truy vấn danh sách nhân viên:', error);
                  return {};
                }
              },
            },
                      
            {
              name: 'thongtin',
              label: 'Thông tin hoạt động',
              type: 'group',
              fields: [
                { name: 'mota', label: 'Mô tả', type: 'richText' },
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
