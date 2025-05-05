import {
  beforeChangeclass,
  checkclass,
  notChangeNameClass,
  showTitle,
  readClassAccess,
} from '@/hooks/Hookclass'
import { CollectionConfig } from 'payload'

import { isAdmin, isTruongPhongNhanVien } from '@/hooks/AccessAdmin'

const Class: CollectionConfig = {
  slug: 'class',
  labels: {
    singular: 'Phòng ',
    plural: 'Phòng ',
  },
  access: {

    create: isAdmin,
    read: readClassAccess,
    update: isAdmin,
    delete: isAdmin,
  },

  admin: { group: 'Khoa & Nhân sự',
    useAsTitle: 'title'
   },

  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Thông Tin Phòng Ban',
          fields: [
            {
              name: 'title',
              label: 'Tên phòng',
              type: 'text',
              admin: {
                hidden: true,
              },
            },
            {
              name: 'tenphong',
              label: 'TÊN PHÒNG',
              type: 'radio',
              options: [
                { label: 'Phòng hành chính-quản trị', value: 'hanhchinhquantri' },
                { label: 'Phòng tài chính-kế toán', value: 'taichinhketoan' },
                { label: 'Phòng công nghệ thông tin', value: 'anninh' },
              ],
            },
            {
              name: 'truongphong',
              label: 'Trưởng phòng',
              type: 'relationship',
              relationTo: 'users', // Đúng collection
              hasMany: true, // Một bác sĩ phụ trách một phòng
              filterOptions: async ({ req, data }) => {
                try {
                  // Kiểm tra nếu data không có doctors thì gán giá trị mặc định là []
                  const selectedtruongphong = Array.isArray(data?.truongphong)
                    ? data.truongphong
                        .map((doc) => (typeof doc === 'string' ? doc : doc?.id))
                        .filter(Boolean)
                    : []
                  // Lấy danh sách bác sĩ đã có khoa
                  // dùng req.payload.find để tìm những bác sĩ đã có khoa
                  const checktruongphong = await req.payload.find({
                    collection: 'class',
                    where: { truongphong: { exists: true } },
                    limit: 999,
                  })
                  // Lấy danh sách ID bác sĩ đã có khoa
                  const docChecktruongphong = checktruongphong?.docs ?? []
                  const checkouttruongphong = docChecktruongphong.flatMap((doc) =>
                    (doc?.truongphong ?? [])
                      .map((emp) => (typeof emp === 'string' ? emp : emp?.id))
                      .filter(Boolean),
                  )

                  return {
                    and: [
                      { chucvu: { equals: 'truongphong' } },
                      {
                        or: [
                          { id: { not_in: checkouttruongphong } }, // không chọn bác sĩ đã có khoa
                          { id: { in: selectedtruongphong } }, //  Giữ lại bác sĩ đã chọn
                        ],
                      },
                    ],
                  }
                } catch (error) {
                  console.error('Lỗi truy vấn danh sách bác sĩ:', error)
                  return {}
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
                  const selectedNhanVien = Array.isArray(data?.nhanvien)
                    ? data.nhanvien
                        .map((nv) => (typeof nv === 'string' ? nv : nv?.id))
                        .filter(Boolean)
                    : []

                  const existingNhanVienData = await req.payload.find({
                    collection: 'class',
                    where: { nhanvien: { exists: true } },
                    limit: 999,
                  })

                  const existingNhanVien =
                    existingNhanVienData?.docs?.flatMap((doc) =>
                      (doc?.nhanvien ?? [])
                        .map((nv) => (typeof nv === 'string' ? nv : nv?.id))
                        .filter(Boolean),
                    ) ?? []

                  // === Xác định baseCondition dựa vào phòng ===
                  let baseCondition = {}

                  switch (data?.tenphong) {
                    case 'hanhchinhquantri':
                      baseCondition = { chucvu: { equals: 'nhanvienkho' } }
                      break
                    case 'taichinhketoan':
                      baseCondition = { chucvu: { equals: 'ketoan' } }
                      break
                    case 'anninh':
                      baseCondition = { chucvu: { equals: 'kythuatvien' } }
                      break
                    default:
                      baseCondition = {}
                  }

                  return {
                    and: [
                      baseCondition,
                      {
                        or: [
                          { id: { not_in: existingNhanVien } },
                          { id: { in: selectedNhanVien } },
                        ],
                      },
                    ],
                  } as any
                } catch (error) {
                  console.error('Lỗi truy vấn danh sách nhân viên:', error)
                  return {}
                }
              },
            },
            {
              name: 'thongtin',
              label: 'Thông tin hoạt động',
              type: 'group',
              fields: [
                { name: 'mota', label: 'Mô tả', type: 'textarea' },
                { name: 'ngaythanhlap', label: 'Ngày thành lập', type: 'date' },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [beforeChangeclass, checkclass, notChangeNameClass, showTitle],
  },
}
export default Class
