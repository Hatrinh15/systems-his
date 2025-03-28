import { CollectionConfig } from 'payload'
import { beforeChange, showTitle } from '@/hooks/HookDepartments'

const Departments: CollectionConfig = {
  slug: 'departments',
  labels: {
    singular: 'Khoa',
    plural: 'Khoa',
  },
  admin: {
    group: 'Khoa & Nhân sự ',
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Thông Tin Khoa',
          fields: [
            {
              name: 'title',
              label: 'Tên khoa',
              type: 'text',
              admin: {
                hidden: true,
              },
            },
            {
              name: 'tenkhoa',
              label: 'TÊN KHOA',
              type: 'select',
              admin: {
                isClearable: true,
              },
              options: [
                { label: 'Khoa tai', value: 'tai' },
                { label: 'Khoa mũi xoang', value: 'mui' },
                { label: 'Khoa họng-thanh quản', value: 'hong' },
                { label: 'Khoa cấp cứu', value: 'capcuu' },
                { label: 'Khoa gây mê hồi sức', value: 'gaymehoisuc' },
                { label: 'Khoa chẩn đoán hình ảnh', value: 'chandoanhinhanh' },
                { label: 'Khoa xét nghiệm', value: 'khoaxetnghiem' },
                { label: 'Khoa dược', value: 'khoaduoc' },
                { label: 'Khoa khác', value: 'khoakhac' },
              ],
            },
            {
              name: 'truongkhoa',
              label: 'Trưởng khoa',
              type: 'relationship',
              relationTo: 'users', // Đúng collection
              hasMany: true, // Một bác sĩ phụ trách một phòng
              filterOptions: async ({ req, data }) => {
                try {
                  // Kiểm tra nếu data không có doctors thì gán giá trị mặc định là []
                  const selectedtruongkhoa = Array.isArray(data?.truongkhoa)
                    ? data.truongkhoa
                        .map((doc) => (typeof doc === 'string' ? doc : doc?.id))
                        .filter(Boolean)
                    : []
                  // Lấy danh sách bác sĩ đã có khoa
                  // dùng req.payload.find để tìm những bác sĩ đã có khoa
                  const checktruongkhoa = await req.payload.find({
                    collection: 'departments',
                    where: { truongkhoa: { exists: true } },
                    limit: 999,
                  })
                  // Lấy danh sách ID bác sĩ đã có khoa
                  const docChecktruongkhoa = checktruongkhoa?.docs ?? []
                  const checkouttruongkhoa = docChecktruongkhoa.flatMap((doc) =>
                    (doc?.truongkhoa ?? [])
                      .map((emp) => (typeof emp === 'string' ? emp : emp?.id))
                      .filter(Boolean),
                  )
                  return {
                    and: [
                      { tinhtranglamviec: { not_equals: 'nghiviec' } }, // Loại bác sĩ đã nghỉ việc
                      { chucvu: { equals: 'truongkhoa' } },
                      {
                        or: [
                          { id: { not_in: checkouttruongkhoa } }, // không chọn bác sĩ đã có khoa
                          { id: { in: selectedtruongkhoa } }, //  Giữ lại bác sĩ đã chọn
                        ],
                      },
                    ],
                  } as any
                } catch (error) {
                  console.error('Lỗi truy vấn danh sách bác sĩ:', error)
                  return {}
                }
              },
            },
            {
              name: 'doctors',
              label: 'Bác sĩ',
              type: 'relationship',
              relationTo: 'users',
              hasMany: true,
              filterOptions: async ({ req, data }) => {
                try {
                  // console.log(' Dữ liệu hiện tại của form:', JSON.stringify(data, null, 2))
                  // Kiểm tra nếu data không có doctors thì gán giá trị mặc định là []
                  const selectedDoctors = Array.isArray(data?.doctors)
                    ? data.doctors
                        .map((doc) => (typeof doc === 'string' ? doc : doc?.id))
                        .filter(Boolean)
                    : []
                  // Lấy danh sách bác sĩ đã có khoa
                  // dùng req.payload.find để tìm những bác sĩ đã có khoa
                  const checkDoctors = await req.payload.find({
                    collection: 'departments',
                    where: { doctors: { exists: true } },
                    limit: 999,
                  })
                  // Lấy danh sách ID bác sĩ đã có khoa
                  const docCheckDoctors = checkDoctors?.docs ?? []
                  const checkoutDoctors = docCheckDoctors.flatMap((doc) =>
                    (doc?.doctors ?? [])
                      .map((emp) => (typeof emp === 'string' ? emp : emp?.id))
                      .filter(Boolean),
                  )
                  const baseCondition =
                    data?.tenkhoa === 'khoaduoc'
                      ? { chucvu: { equals: 'duocsi' } } // DUOCSI cho khoa duoc
                      : { chucvu: { equals: 'bacsi' } } // bác sĩ cho các khoa khác

                  return {
                    and: [
                      baseCondition,
                      { tinhtranglamviec: { not_equals: 'nghiviec' } }, // Loại bác sĩ đã nghỉ việc
                      {
                        or: [
                          { id: { not_in: checkoutDoctors } }, // không chọn bác sĩ đã có khoa
                          { id: { in: selectedDoctors } }, //  Giữ lại bác sĩ đã chọn
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
              name: 'nures',
              label: 'Y tá- điều dưỡng',
              type: 'relationship',
              relationTo: 'users',
              hasMany: true,
              filterOptions: async ({ req, data }) => {
                try {
                  // Kiểm tra nếu data không có doctors thì gán giá trị mặc định là []
                  const selectedNures = Array.isArray(data?.nures)
                    ? data.nures
                        .map((doc) => (typeof doc === 'string' ? doc : doc?.id))
                        .filter(Boolean)
                    : []
                  // Lấy danh sách bác sĩ đã có khoa
                  // dùng req.payload.find để tìm những y tá đã có khoa
                  const checkNures = await req.payload.find({
                    collection: 'departments',
                    where: { nures: { exists: true } },
                    limit: 999,
                  })
                  // Lấy danh sách ID bác sĩ đã có khoa
                  const docCheckNures = checkNures?.docs ?? []
                  const checkoutNures = docCheckNures.flatMap((doc) =>
                    (doc?.nures ?? [])
                      .map((emp) => (typeof emp === 'string' ? emp : emp?.id))
                      .filter(Boolean),
                  )
                  return {
                    and: [
                      { chucvu: { equals: 'yta' } }, // Chỉ lấy y tá
                      { tinhtranglamviec: { not_equals: 'nghiviec' } }, // Loại y tá đã nghỉ việc
                      {
                        or: [
                          { id: { not_in: checkoutNures } }, // không chọn y tá đã có khoa
                          { id: { in: selectedNures } }, //  Giữ lại y tá đã chọn
                        ],
                      },
                    ],
                  }
                } catch (error) {
                  console.error('Lỗi truy vấn danh sách y tá:', error)
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
        {
          label: 'Kho Khoa',
          fields: [
            {
              name: 'departmentInventory',
              label: 'Danh sách sản phẩm',
              type: 'array',
              fields: [
                {
                  name: 'category',
                  label: 'Danh mục',
                  type: 'radio',
                  options: [
                    { label: 'Thuốc', value: 'medications' },
                    { label: 'Vật tư tiêu hao', value: 'vattutieuhao' },
                    { label: 'Máy móc/Thiết bị', value: 'maymocthietbi' },
                  ],
                  required: true,
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'item',
                      label: 'Sản phẩm',
                      type: 'relationship',
                      relationTo: 'medications',
                      admin: {
                        allowCreate: false,
                        condition: (_, siblingData) => siblingData?.category === 'medications',
                      },
                    },
                    {
                      name: 'items',
                      label: 'Sản phẩm',
                      type: 'relationship',
                      relationTo: 'medicalSupplies',
                      admin: {
                        allowCreate: false,
                        condition: (_, siblingData) =>
                          siblingData?.category === 'vattutieuhao' ||
                          siblingData?.category === 'maymocthietbi',
                      },
                    },
                    {
                      name: 'quantity',
                      label: 'Số lượng hiện tại',
                      type: 'number',
                      min: 0,
                      admin: { readOnly: true },
                      defaultValue: 0
                    },
                    {
                      name: 'unit',
                      label: 'Đơn vị tính',
                      type: 'select',
                      options: [
                        {label:'Hộp',value:'hop'},
                        {
                          label:'Thùng',value:'thung'
                        },
                        {label:'Cái',value: 'cai'},
                        {label:'Bộ',value:'bo'}
                      ],
                      admin: {
                        readOnly :true
                      }
                    },
                    {
                      name: 'expirydate',
                      label: 'Hạn sử dụng',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [beforeChange, showTitle],
  },
}
export default Departments
