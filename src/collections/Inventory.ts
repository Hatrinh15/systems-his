import { CollectionConfig } from 'payload'

export const Inventory: CollectionConfig = {
  slug: 'inventory',
  labels: {
    singular: 'Kho Hàng',
    plural: 'Kho Hàng',
  },
  admin: {
    useAsTitle: 'item',
    defaultColumns: [
      'item',
      'items',
      'batchnumber',
      'quantity',
      'stockstatus',
      'reorderlevel',
      'expirydate',
      'importprice',
    ],
    group: 'Dược Và Vật Tư Y Tế',
  },
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
      name: 'item',
      label: 'Sản phẩm',
      type: 'relationship',
      relationTo: 'medications',
      admin: { condition: (data) => data?.category === 'medications' },
      filterOptions: async ({ req, data }) => {
        const existingInventory = await req.payload.find({
          collection: 'inventory',
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
        condition: (data) =>
          data?.category === 'vattutieuhao' || data?.category === 'maymocthietbi',
      },
      filterOptions: async ({ req, data }) => {
        const existingInventory = await req.payload.find({
          collection: 'inventory',
          where: {},
          limit: 1000,
        })

        // Lấy danh sách thuốc đã có trong kho
        const usedMedications = existingInventory.docs
          .map((doc) => (doc.items && typeof doc.items === 'object' ? doc.items.id : doc.items))
          .filter(Boolean)

        // 🛠 Giữ lại thuốc đã lưu trước đó để không bị lỗi khi cập nhật
        if (data?.items) {
          usedMedications.splice(usedMedications.indexOf(data.items), 1)
        }

        return {
          id: { not_in: usedMedications },
        }
      },
    },
    {
      name: 'quantity',
      label: 'Số lượng tồn kho',
      type: 'number',
      min: 0,
    },
    {
      name: 'stockstatus',
      label: 'Tình trạng hàng hóa',
      type: 'select',
      options: [
        { label: 'Còn hàng', value: 'conhang' },
        { label: 'Hết hàng', value: 'hethang' },
        { label: 'Sắp hết', value: 'saphet' },
        { label: 'Hết hạn sử dụng', value: 'hethansudung' },
      ],
      defaultValue: 'conhang',
      required: true,
    },
    {
      name: 'reorderlevel',
      label: 'Mức cảnh báo tồn kho',
      type: 'number',
      min: 0,
      defaultValue: 10, // Số lượng tối thiểu để cảnh báo
    },
    {
      name: 'supplier',
      label: 'Nhà cung cấp',
      type: 'relationship',
      relationTo: 'suppliers',
      hasMany: true,
      filterOptions: async ({ req, data }) => {
        try {
          // 1️ Xác định sản phẩm đã chọn
          const selectedProduct = data?.item || data?.items
          if (!selectedProduct) {
            return { id: { in: [] } } // Nếu chưa chọn sản phẩm, không hiển thị nhà cung cấp nào
          }

          // 2️ Xác định collection tương ứng (medications hoặc medicalSupplies)
          const collection = data?.category === 'medications' ? 'medications' : 'medicalSupplies'

          // 3️ Truy vấn danh sách nhà cung cấp từ bảng thuốc/vật tư
          const product = await req.payload.find({
            collection: collection,
            where: { id: { equals: selectedProduct } },
            limit: 1000,
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
    {
      name: 'importdate',
      label: 'Ngày nhập',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd-MM-yyy',
        },
      },
    },
  ],
  timestamps: true,
}
