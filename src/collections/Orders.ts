import {
  hookCheckOrderDate,
  hookTinhGiaThuoc,
  hookTinhGiaThuocSanpham,
  hookTinhTongDonThuoc,
  hookTruThuocQuay,
  hookValidateOrderFields, canReadOrders,
  autoStaff,
  afterReadOrdersCustomerLabel,
  afterReadOrdersStaffLabel
} from '@/hooks/HookOrders'
import { CollectionConfig } from 'payload'
import { isAdminDuocSi } from '@/hooks/AccessAdmin'

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: { 
    create: isAdminDuocSi,
    read: canReadOrders,  
    update: isAdminDuocSi,
    delete: isAdminDuocSi,
  },
  labels: {
    singular: 'Tạo Đơn Thuốc',
    plural: 'Tạo Đơn Thuốc',
  },
  admin: {
    useAsTitle: 'customer',
    group: 'Quản Lý Phiếu & Bảng Giá',
  },
  fields: [
    {
      name: 'customer',
      label: 'Bệnh nhân mua thuốc',
      type: 'relationship',
      relationTo: 'patients',
      admin: {
        allowCreate: false,
      },
      access: {
        read: ({req}) =>{
          const user = req.user
          if(user?.khoa === 'khoaduoc' && user.chucvu === 'truongphong' || user?.chucvu === 'duocsi') {
            return true
          }
          if(user?.taikhoan === 'admin') {
            return true
          }
          return false
        }
      }
    },
    {
      name: 'customerLabel',
      label: 'Tên bệnh nhân',
      type: 'text',
      admin: {
        readOnly: true,
        condition: () => true, // luôn hiển thị
      },
      // access: {
      //   read: ({req}) => {
      //     const user = req.user 
      //     if(user?.phong === 'taichinhketoan' && user.chucvu === 'truongphong' || user?.chucvu === 'ketoan') {
      //       return true
      //     }  
      //     return false
      //   },
      // }
    },
    {
      name: 'baohiemyte',
      label: 'BHYT',
      type: 'radio',
      options: [
        { value: 'yes', label: 'Có' },
        { value: 'no', label: 'Không' },
      ],
    },
    {
      name: 'bhyt',
      label: 'Thuốc BHYT',
      type: 'group',
      admin: { condition: (data) => data?.baohiemyte === 'yes' },
      fields: [
        {
          name: 'loai',
          label: 'Loại miễn giảm',
          type: 'select',
          options: [
            { value: 'tamtram', label: '80%' },
            { value: 'chinlam', label: '95%' },
            { value: 'mottram', label: '100%' },
          ],
        },
        {
          name: 'items',
          label: 'Danh sách thuốc mua',
          type: 'array',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'medication',
                  label: 'Sản phẩm',
                  type: 'relationship',
                  relationTo: 'pharmacies',
          
                  admin:{allowCreate: false},
                  filterOptions: async ({ req, data, siblingData }) => {
                    if (!data) return false
                    const id = siblingData as { medication?: string }
                    const products = await req.payload.find({
                      collection: 'pharmacies',
                      where: {
                        bhyt: { equals: 'co' }, // Giả sử field `bhyt` trong `pharmacies`
                      },
                      limit: 1000,
                    })
                    const medicationIds = data?.bhyt?.items.map((dt) => dt.medication) || []
                    const ids = products.docs
                      .map((doc) => doc.id)
                      .filter((id) => !medicationIds.includes(id))
                    return {
                      or: [
                        { id: { in: ids !== undefined ? ids : null } },
                        { id: { equals: id.medication } },
                      ],
                    }
                  },
                },
                {
                  name: 'quantity',
                  label: 'Số lượng',
                  type: 'number',
                  min: 1,
                },
                {
                  name: 'donvi',
                  label: 'Đơn vị',
                  type: 'select',
                  options: [
                    { label: 'Hộp', value: 'hop' },
                    { label: 'Viên', value: 'vien' },
                    { label: 'Ống', value: 'ong' },
                    { label: 'Lọ', value: 'lo' },
                    { label: 'Gói', value: 'goi' },
                    { label: 'Chai', value: 'vien' },
                    { label: 'Cuộn', value: 'cuon' },
                    { label: 'Miếng', value: 'mieng' },
                    { label: 'Gói', value: 'goi' },
                  ],
                },
                {
                  name: 'price',
                  label: 'Giá bán',
                  type: 'text',
                },
                { name: 'tien', label: 'Tổng tiền', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'dichvu',
      label: 'Dịch vụ',
      type: 'group',
      fields: [
        {
          name: 'item',
          label: 'Danh sách thuốc mua',
          type: 'array',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'medications',
                  label: 'Sản phẩm',
                  type: 'relationship',
                  relationTo: 'pharmacies',
          
                  admin: { condition: (data) => data?.baohiemyte === 'yes',
                    allowCreate: false 
                   },
                  filterOptions: async ({ req, data, siblingData }) => {
                    const id = siblingData as { medications?: string }
                    const products = await req.payload.find({
                      collection: 'pharmacies',
                      where: {
                        bhyt: { equals: 'khong' }, // Giả sử field `bhyt` trong `pharmacies`
                      },
                      limit: 1000,
                    })
                  if(!data ) return false
                    const medicationIds = data?.dichvu?.item.map((dt) => dt.medications) || []
                    const ids = products.docs
                      .map((doc) => doc.id)
                      .filter((id) => !medicationIds.includes(id))
                    return {
                      or: [
                        { id: { in: ids !== undefined ? ids : null } },
                        { id: { equals: id.medications } },
                      ],
                    }
                  },
                },
                {
                  name: 'sanpham',
                  label: 'Sản phẩm',
                  type: 'relationship',
                  relationTo: 'pharmacies',
          
                  admin: { condition: (data) => data?.baohiemyte === 'no',
                    allowCreate: false
                   },
                  filterOptions: async ({ req, data, siblingData }) => {
                    const id = siblingData as { sanpham?: string }
                    const products = await req.payload.find({
                      collection: 'pharmacies',
                      where: {},
                      limit: 1000,
                    })

                    const medicationIds = data?.dichvu?.item.map((dt) => dt.sanpham) || []
                    const ids = products.docs
                      .map((doc) => doc.id)
                      .filter((id) => !medicationIds.includes(id))
                    return {
                      or: [
                        { id: { in: ids !== undefined ? ids : null } },
                        { id: { equals: id.sanpham } },
                      ],
                    }
                  },
                },
                {
                  name: 'quantitys',
                  label: 'Số lượng',
                  type: 'number',
                  min: 1,
                },

                {
                  name: 'donvi',
                  label: 'Đơn vị',
                  type: 'select',
                  options: [
                    { label: 'Hộp', value: 'hop' },
                    { label: 'Viên', value: 'vien' },
                    { label: 'Ống', value: 'ong' },
                    { label: 'Lọ', value: 'lo' },
                    { label: 'Gói', value: 'goi' },
                    { label: 'Chai', value: 'vien' },
                    { label: 'Cuộn', value: 'cuon' },
                    { label: 'Miếng', value: 'mieng' },
                  ],
                },
                {
                  name: 'prices',
                  label: 'Giá bán',
                  type: 'text',
                },
                { name: 'tiens', label: 'Tổng tiền', type: 'text' },
              ],
            },
          ],
        },
      ],
    },

    {
      name: 'totalprice',
      label: 'Tổng giá trị đơn thuốc',
      type: 'text',

      admin: {
        readOnly: true,
      },
    },
    {
      name: 'orderdate',
      label: 'Ngày mua',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd-MM-yyy',
        },
      },
    },
    {
      name: 'staff',
      label: 'Nhân viên bán hàng',
      type: 'relationship',
      relationTo: 'users',
      access: {
        read: ({req}) =>{
          const user = req.user
          if(user?.khoa === 'khoaduoc' && user.chucvu === 'truongphong' || user?.chucvu === 'duocsi') {
            return true
          }
          if(user?.taikhoan === 'admin') {
            return true
          }
          return false
        }
      },
      admin: {allowCreate: false},
      filterOptions: async ({ data, req }) => {
        try {
          // Lấy danh sách bác sĩ thuộc Khoa Dược
          const khoaDuoc = await req.payload.find({
            collection: 'departments',
            where: { tenkhoa: { equals: 'khoaduoc' } },
            limit: 1, // Chỉ lấy khoa Dược
          })

          const khoaDuocData = khoaDuoc?.docs?.[0] // Lấy khoa đầu tiên (nếu có)
          const doctorsInKhoaDuoc =
            khoaDuocData?.doctors?.map((doc) => (typeof doc === 'string' ? doc : doc?.id)) || []

          // Kiểm tra nếu đã chọn bác sĩ trước đó
          const selectedUser = data?.receiverorsender
          const selectedUserId = typeof selectedUser === 'string' ? selectedUser : selectedUser?.id

          return {
            and: [
              { chucvu: { equals: 'duocsi' } }, // Chỉ lấy dược sĩ
              {
                or: [
                  { id: { in: doctorsInKhoaDuoc } }, // Chỉ lấy bác sĩ thuộc khoa Dược
                  { id: { equals: selectedUserId } }, // Giữ lại người đã chọn trước đó
                ],
              },
            ],
          } as any
        } catch (error) {
          console.error('Lỗi khi lọc Người nhận/Người xuất:', error)
          return {}
        }
      },
    },
    {
      name: 'staffLabel',
      label: 'Tên nhân viên',
      type: 'text',
      admin: {
        readOnly: true,
      },
      access: {
        read: ({req}) => {
          const user = req.user 
          if(user?.phong === 'taichinhketoan' && user.chucvu === 'truongphong' || user?.chucvu === 'ketoan') {
            return true
          }  
          return false
        },
      }
    },    
    {
      name: 'paymentmethod',
      label: 'Hình thức thanh toán',
      type: 'select',
      options: [
        { label: 'Tiền mặt', value: 'cash' },
        { label: 'Thẻ', value: 'card' },
        { label: 'Bảo hiểm y tế', value: 'insurance' },
      ],
    },
    {
      name: 'ghichu',
      label: 'Ghi chú',
      type: 'textarea',
    }
  ],
  hooks: {
    beforeChange: [autoStaff,hookTinhGiaThuoc, hookTinhGiaThuocSanpham, hookTinhTongDonThuoc,
      hookCheckOrderDate,hookValidateOrderFields,afterReadOrdersCustomerLabel,afterReadOrdersStaffLabel],
    afterChange: [hookTruThuocQuay],
  },
}
