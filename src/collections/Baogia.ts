import { CollectionConfig } from 'payload'
import { priceAfterRead, thongBao, updateProductName } from '@/hooks/HookBaoGia'
export const baoGia: CollectionConfig = {
  slug: 'baogia',
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
      admin: {
        condition: (data) => data?.category === 'medications',
      },
      filterOptions: async ({ req }) => {
        const existingBaoGia = await req.payload.find({
          collection: 'baogia',
          where: {},
          limit: 1000,
        })

        // Lọc ra danh sách ID các thuốc đã có trong báo giá
        const usedMedications = existingBaoGia.docs
          .map((doc) => (doc.item && typeof doc.item === 'object' ? doc.item.id : doc.item))
          .filter(Boolean) // Loại bỏ giá trị null/undefined

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
      admin: { condition: (data) => data?.category === 'medicalSupplies' },
      filterOptions: async ({ req }) => {
        const existingBaoGia = await req.payload.find({
          collection: 'baogia',
          where: {},
          limit: 1000,
        })

        // Lọc ra danh sách ID các thuốc đã có trong báo giá
        const usedMedications = existingBaoGia.docs
          .map((doc) => (doc.items && typeof doc.items === 'object' ? doc.items.id : doc.items))
          .filter(Boolean) // Loại bỏ giá trị null/undefined

        return {
          id: { not_in: usedMedications },
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
      name: 'giaban',
      label: 'Giá bán lẻ (VNĐ)',
      type: 'text',
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [updateProductName, thongBao],
    afterRead: [priceAfterRead],
  },
}
