import { CollectionConfig } from 'payload'
import {
  beforeChange,
  hookCheckKhoa,
  showTitle,
  readDepartmentAccess,
} from '@/hooks/HookDepartments'
import { isAdmin, isBacSiYTaTruongKhoaDuocSi } from '@/hooks/AccessAdmin'
import { User } from 'payload'
const Departments: CollectionConfig = {
  slug: 'departments',
  labels: {
    singular: 'Khoa',
    plural: 'Khoa',
  },
  access: {
    create: (args) => isAdmin(args),
    read: readDepartmentAccess,
    update: (args) => isAdmin(args) || isBacSiYTaTruongKhoaDuocSi(args),
    delete: (args) => isAdmin(args),
  },
  admin: {
    group: 'Khoa & Nhân Sự',
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
              access: {
                update: ({ req }) => {
                  const user = req.user as User
                  return user?.taikhoan === 'admin'
                },
              },
              admin: {
                isClearable: true,
              },
              options: [
                { label: 'Khoa Tai', value: 'tai' },
                { label: 'Khoa Mũi Xoang', value: 'mui' },
                { label: 'Khoa Họng-Thanh Quản', value: 'hong' },
                { label: 'Khoa Cấp Cứu', value: 'capcuu' },
                { label: 'Khoa Gây Mê Hồi Sức', value: 'gaymehoisuc' },
                { label: 'Khoa Chẩn Đoán Hình Ảnh', value: 'chandoanhinhanh' },
                { label: 'Khoa Xét Nghiệm', value: 'khoaxetnghiem' },
                { label: 'Khoa Dược', value: 'khoaduoc' },
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
              access: {
                update: ({ req }) => {
                  const user = req.user as User
                  return user?.taikhoan === 'admin'
                },
              },
            },
            {
              name: 'doctors',
              label: 'Bác sĩ / Dược sĩ',
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
              access: {
                update: ({ req }) => {
                  const user = req.user as User
                  return user?.taikhoan === 'admin'
                },
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
              access: {
                update: ({ req }) => {
                  const user = req.user as User
                  return user?.taikhoan === 'admin'
                },
              },
            },
            {
              name: 'thongtin',
              label: 'Thông tin hoạt động',
              type: 'group',
              access: {
                update: ({ req }) => {
                  const user = req.user as User
                  return user?.taikhoan === 'admin'
                },
              },
              fields: [
                { name: 'mota', label: 'Mô tả', type: 'textarea' },
                {
                  name: 'ngaythanhlap',
                  label: 'Ngày thành lập',
                  type: 'date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayOnly',
                      displayFormat: 'dd-MM-yyy',
                    },
                  },
                },
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
                      filterOptions: async ({ req, data, siblingData }) => {
                        try {
                          // Lấy danh sách thuốc có trong kho hàng với số lượng > 0
                          const inventoryData = await req.payload.find({
                            collection: 'inventory',
                            where: {
                              category: { equals: 'medications' },
                              quantity: { greater_than: 0 },
                            },
                            limit: 1000,
                          })
                          const id = siblingData as { item?: string }

                          // Lấy danh sách ID của thuốc có trong kho
                          const availableMedications = inventoryData.docs
                            .map((doc) =>
                              doc.item && typeof doc.item === 'object' ? doc.item.id : doc.item,
                            )
                            .filter((id) => typeof id === 'string' && id.trim() !== '') // Lọc bỏ null/undefined
                          const show = data.departmentInventory.map((dt) => dt.item)
                          const findId = availableMedications.filter((dt) => !show.includes(dt))
                          // Nếu không có thuốc nào trong kho, trả về false để ẩn tất cả
                          if (availableMedications.length === 0) return false
                          // console.log(findId)
                          return {
                            or: [
                              { id: { in: findId !== undefined ? findId : null } },
                              { id: { equals: id.item } },
                            ],
                          }
                        } catch (error) {
                          console.error('Lỗi khi lọc danh sách thuốc:', error)
                          return false // Trả về false trong trường hợp lỗi
                        }
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
                      filterOptions: async ({ req, siblingData, data }) => {
                        try {
                          if (
                            !siblingData ||
                            typeof siblingData !== 'object' ||
                            !('category' in siblingData)
                          ) {
                            return false // Tránh lỗi khi `category` không tồn tại
                          }

                          // Xác định loại vật tư cần lọc trong kho hàng
                          const selectedCategory = siblingData.category // 'vattutieuhao' hoặc 'maymocthietbi'

                          // Truy vấn danh sách vật tư có tồn kho theo danh mục được chọn
                          const inventoryData = await req.payload.find({
                            collection: 'inventory',
                            where: {
                              category: { equals: selectedCategory }, // Chỉ lấy vật tư thuộc loại đã chọn
                              quantity: { greater_than: 0 }, // Chỉ lấy vật tư có tồn kho
                            },
                            limit: 1000,
                          })
                          const id = siblingData as { items?: string }
                          // Lấy danh sách ID của vật tư có trong kho
                          const availableSupplies = inventoryData.docs
                            .map((doc) =>
                              doc.items && typeof doc.items === 'object' ? doc.items.id : doc.items,
                            )
                            .filter((id) => typeof id === 'string' && id.trim() !== '') // Lọc bỏ null/undefined
                          const show = data.departmentInventory.map((dt) => dt.items)
                          const findId = availableSupplies.filter((dt) => !show.includes(dt))
                          // Nếu không có vật tư nào phù hợp, trả về false để ẩn danh sách
                          if (availableSupplies.length === 0) return false
                          return {
                            or: [
                              { id: { in: findId !== undefined ? findId : null } },
                              { id: { in: id.items } },
                            ],
                            // Chỉ hiển thị vật tư có tồn kho
                          }
                        } catch (error) {
                          console.error('Lỗi khi lọc danh sách vật tư:', error)
                          return false // Trả về false nếu có lỗi
                        }
                      },
                    },
                    {
                      name: 'unit',
                      label: 'Đơn vị tính',
                      type: 'select',
                      options: [
                        { label: 'Hộp', value: 'hop' },
                        {
                          label: 'Thùng',
                          value: 'thung',
                        },
                        { label: 'Cái', value: 'cai' },
                        { label: 'Bộ', value: 'bo' },
                      ],
                      admin: {
                        readOnly: true,
                      },
                    },
                    {
                      name: 'quantity',
                      label: 'Số lượng',
                      type: 'number',
                      min: 0,
                      // admin: { readOnly: true },
                      defaultValue: 0,
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
    beforeChange: [beforeChange, showTitle, hookCheckKhoa],
  },
}
export default Departments
// hic hic