import { CollectionConfig } from 'payload'
import {
  hookPriceQuayThuoc,
  priceAfterRead,
  thongBao,
  updateProductName,
  canReadBangGia,
} from '@/hooks/HookBaoGia'
import { isAdminKeToan } from '@/hooks/AccessAdmin'
export const baoGia: CollectionConfig = {
  slug: 'baogia',
  access: {
    create: (args) => isAdminKeToan(args),
    delete: (args) => isAdminKeToan(args),
    update: (args) => isAdminKeToan(args),
    read: (args) => canReadBangGia(args) || isAdminKeToan(args),
  },
  labels: {
    singular: 'Bảng Giá',
    plural: 'Bảng Giá',
  },
  admin: {
    useAsTitle: 'sanpham',
    defaultColumns: ['sanpham', 'gianhaptrungbinh', 'thue', 'loinhuan', 'giabanle'],
    group: 'Quản Lý Phiếu & Bảng Giá',
  },
  fields: [
    {
      name: 'category',
      label: 'Danh mục',
      type: 'radio',
      options: [
        { label: 'Thuốc', value: 'medications' },
        { label: 'Vật tư y tế', value: 'medicalSupplies' },
      ],
      required: true,
    },
    {
      name: 'item',
      label: 'Sản phẩm',
      type: 'relationship',
      relationTo: 'medications',
      admin: { condition: (data) => data?.category === 'medications', allowCreate: false },
      filterOptions: async ({ req, data }) => {
        const existingInventory = await req.payload.find({
          collection: 'baogia',
          where: {},
          limit: 1000,
        })

        // Lấy danh sách thuốc đã có trong kho
        const usedMedications = existingInventory.docs
          .map((doc) => (doc.item && typeof doc.item === 'object' ? doc.item.id : doc.item))
          .filter(Boolean)

        // 🛠 Giữ lại thuốc đã lưu trước đó để không bị lỗi khi cập nhật
        if (data?.item) {
          usedMedications.splice(usedMedications.indexOf(data.item), 1)
        }

        return {
          id: { not_in: usedMedications },
        }
      },
    },

    {
      name: 'items',
      label: 'Sản phẩm',
      type: 'relationship',
      relationTo: 'medicalSupplies',
      admin: {
        condition: (data) => data?.category === 'medicalSupplies',
        allowCreate: false,
      },
      filterOptions: async ({ req, data }) => {
        //  Lấy danh sách vật tư tiêu hao trong kho
        const existingInventory = await req.payload.find({
          collection: 'inventory',
          where: { category: { equals: 'vattutieuhao' } },
          limit: 1000,
        })

        const medicationIdsInInventory = existingInventory.docs
          .map((doc) => (doc.items && typeof doc.items === 'object' ? doc.items.id : doc.items))
          .filter(Boolean) // Xóa undefined/null

        //  Lấy danh sách vật tư đã có trong quầy thuốc
        const existingPharmacies = await req.payload.find({
          collection: 'baogia',
          where: {},
          limit: 1000,
        })

        const medicationIdsInPharmacies = existingPharmacies.docs
          .map((doc) => (doc.items && typeof doc.items === 'object' ? doc.items.id : doc.items))
          .filter(Boolean)

        //  Giữ lại sản phẩm đã chọn nếu có
        if (data?.items && !medicationIdsInInventory.includes(data.items)) {
          medicationIdsInInventory.push(data.items)
        }

        //  Lọc danh sách vật tư chưa có trong quầy thuốc
        const availableMedicationIds = medicationIdsInInventory.filter(
          (id) => !medicationIdsInPharmacies.includes(id),
        )

        //  Giữ lại sản phẩm đang chọn (nếu có)
        if (data?.items && !availableMedicationIds.includes(data.items)) {
          availableMedicationIds.push(data.items)
        }

        //  Kiểm tra nếu danh sách trống, trả về điều kiện không có thuốc
        if (!availableMedicationIds.length) {
          return false // Hoàn toàn không có lựa chọn nào
        }

        //  Trả về danh sách vật tư có thể chọn
        return {
          id: { in: availableMedicationIds },
        }
      },
    },
    {
      name: 'sanpham',
      label: 'Sản phẩm',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'gianhapnhacungcap',
      label: 'Nhà cung cấp và giá nhập',
      type: 'array',
      fields: [
        {
          name: 'nhacungcap',
          label: 'Nhà cung cấp',
          type: 'relationship',
          relationTo: 'suppliers',
          admin: { allowCreate: false },
          filterOptions: async ({ req, data }) => {
            try {
              // 1️ Xác định sản phẩm đã chọn
              const selectedProduct = data?.item || data?.items
              if (!selectedProduct) {
                return { id: { in: [] } } // Nếu chưa chọn sản phẩm, không hiển thị nhà cung cấp nào
              }

              // 2️ Xác định collection tương ứng (medications hoặc medicalSupplies)
              const collection =
                data?.category === 'medications' ? 'medications' : 'medicalSupplies'

              // 3️ Truy vấn danh sách nhà cung cấp từ bảng thuốc/vật tư
              const product = await req.payload.find({
                collection: collection,
                where: { id: { equals: selectedProduct } },
                limit: 1,
              })

              if (!product || !product.docs || product.docs.length === 0) {
                return { id: { in: [] } }
              }

              // 4️ Lấy danh sách nhà cung cấp từ sản phẩm
              const supplierIds = product.docs[0].supplier // Giả sử `supplier` là một mảng hoặc một ID

              // Nếu `supplier` là object hoặc mảng, chuẩn hóa thành danh sách ID
              const supplierIdList = Array.isArray(supplierIds)
                ? supplierIds.map((s) => (typeof s === 'string' ? s : s.id))
                : []

              if (!supplierIdList.length) {
                return { id: { in: [] } }
              }

              // 5️ Trả về danh sách nhà cung cấp phù hợp
              return {
                id: {
                  in: supplierIdList,
                },
              }
            } catch (error) {
              console.error('🚨 Lỗi khi lọc nhà cung cấp theo thuốc:', error)
              return { id: { in: [] } }
            }
          },
        },
        { name: 'gianhap', label: 'Giá nhập (VNĐ)', type: 'text' },
      ],
    },
    {
      name: 'gianhaptrungbinh',
      label: 'Giá nhập trung bình (VNĐ)',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'thue',
      label: 'Thuế (%)',
      type: 'number',
      min: 0,
      defaultValue: 5,
    },
    {
      name: 'loinhuan',
      label: 'Lợi nhuận (%)',
      type: 'number',
      min: 0,
      defaultValue: 10,
    },
    {
      type: 'row',
      admin: { readOnly: true },
      fields: [
        { name: 'don', label: 'Đơn vị', type: 'text', defaultValue: 'Hộp' },
        {
          name: 'giaban',
          label: 'Giá bán lẻ (VNĐ)',
          type: 'text',
        },
        {
          name: 'tam',
          label: '80%',
          type: 'text',
          admin: { condition: (data) => data?.bhyt === 'co' },
        },
        {
          name: 'chin',
          label: '95%',
          type: 'text',
          admin: { condition: (data) => data?.bhyt === 'co' },
        },
        {
          name: 'mot',
          label: '100%',
          type: 'text',
          admin: { condition: (data) => data?.bhyt === 'co' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'donvi',
          label: 'Đơn vị',
          admin: { condition: (data) => data?.category === 'medications' },
          type: 'select',
          options: [
            { label: 'Viên', value: 'vien' },
            { label: 'Ống', value: 'ong' },
            { label: 'Lọ', value: 'lo' },
            { label: 'Gói', value: 'goi' },
          ],
        },
        {
          name: 'donvis',
          label: 'Đơn vị',
          type: 'select',
          admin: { condition: (data) => data?.category === 'medicalSupplies' },
          options: [
            { label: 'Chai', value: 'vien' },
            { label: 'Cuộn', value: 'cuon' },
            { label: 'Miếng', value: 'mieng' },
            { label: 'Gói', value: 'goi' },
          ],
        },
        { name: 'quychuan', label: 'Quy chuẩn', type: 'number' },
        { name: 'phantram', label: '%', type: 'number' },
        { name: 'tien', label: 'Giá tiền', type: 'text' },
        {
          name: 'tammuoi',
          label: '80%',
          type: 'text',
          admin: { condition: (data) => data?.bhyt === 'co' },
        },
        {
          name: 'chinlam',
          label: '95%',
          type: 'text',
          admin: { condition: (data) => data?.bhyt === 'co' },
        },
        {
          name: 'mottram',
          label: '100%',
          type: 'text',
          admin: { condition: (data) => data?.bhyt === 'co' },
        },
      ],
    },
    {
      name: 'bhyt',
      label: 'BHYT',
      type: 'radio',
      options: [
        { value: 'co', label: 'Có' },
        { value: 'khong', label: 'Không' },
      ],
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [updateProductName, thongBao],
    afterRead: [priceAfterRead, hookPriceQuayThuoc],
  },
}
