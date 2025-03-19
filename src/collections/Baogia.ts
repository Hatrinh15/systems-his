import { CollectionConfig } from 'payload'
import { updateProductName, priceAfterRead, thongBao } from '@/hooks/HookBaoGia'
export const baoGia: CollectionConfig = {
  slug: 'baoGia',
  labels: {
    singular: 'Bảng Giá',
    plural: 'Bảng Giá',
  },
  admin: {
    useAsTitle: 'sanpham',
    defaultColumns: ['sanpham', 'gianhaptrungbinh', 'thue', 'loinhuan', 'giaban', 'giabanle'],
    group: 'Dược Và Vật Tư Y Tế',
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
      admin: { condition: (data) => data?.category === 'medications' },
      filterOptions: async ({ req, id }) => {
        // 🆕 Nhận thêm `id` để biết đang cập nhật hay tạo mới
        try {
          // 1️⃣ Truy vấn danh sách sản phẩm đã tồn tại trong `baoGia`
          const existingRecords = await req.payload.find({
            collection: 'baoGia',
            where: { item: { exists: true } },
            limit: 1000,
          })

          // 2️⃣ Lấy danh sách ID sản phẩm đã tồn tại
          const usedProductIds = existingRecords.docs
            .map((record) =>
              typeof record.item === 'object' && record.item !== null
                ? record.item.id
                : record.item,
            )
            .filter((productId) => typeof productId === 'string')

          // 3️⃣ Nếu chưa có sản phẩm nào được chọn, không lọc gì cả
          if (usedProductIds.length === 0) {
            return {}
          }

          // 🆕 4️⃣ Kiểm tra nếu đang **cập nhật** (`id` tồn tại), thì bỏ qua sản phẩm cũ để cho phép cập nhật
          if (id) {
            const currentRecord = await req.payload.findByID({
              collection: 'baoGia',
              id,
            })

            if (currentRecord && currentRecord.item) {
              const currentProductId =
                typeof currentRecord.item === 'object' ? currentRecord.item.id : currentRecord.item

              // Loại bỏ sản phẩm cũ khỏi danh sách bị chặn
              if (currentProductId) {
                const index = usedProductIds.indexOf(currentProductId)
                if (index !== -1) {
                  usedProductIds.splice(index, 1) // Xóa khỏi danh sách bị lọc
                }
              }
            }
          }

          // 5️⃣ Trả về danh sách sản phẩm chưa được chọn
          return {
            id: {
              not_in: usedProductIds,
            },
          } as any
        } catch (error) {
          console.error('🚨 Lỗi khi lọc sản phẩm đã tồn tại:', error)
          return {} // Trả về điều kiện rỗng để không gây lỗi
        }
      },
    },
    {
      name: 'items',
      label: 'Sản phẩm',
      type: 'relationship',
      relationTo: 'medicalSupplies',
      admin: { condition: (data) => data?.category === 'medicalSupplies' },
      filterOptions: async ({ req, id }) => {
        // 🆕 Nhận thêm `id` để biết đang cập nhật hay tạo mới
        try {
          // 1️⃣ Truy vấn danh sách sản phẩm đã tồn tại trong `baoGia`
          const existingRecords = await req.payload.find({
            collection: 'baoGia',
            where: { items: { exists: true } },
            limit: 1000,
          })

          // 2️⃣ Lấy danh sách ID sản phẩm đã tồn tại
          const usedProductIds = existingRecords.docs
            .map((record) =>
              typeof record.items === 'object' && record.items !== null
                ? record.items.id
                : record.items,
            )
            .filter((productId) => typeof productId === 'string')

          // 3️⃣ Nếu chưa có sản phẩm nào được chọn, không lọc gì cả
          if (usedProductIds.length === 0) {
            return {}
          }

          // 🆕 4️⃣ Kiểm tra nếu đang **cập nhật** (`id` tồn tại), thì bỏ qua sản phẩm cũ để cho phép cập nhật
          if (id) {
            const currentRecord = await req.payload.findByID({
              collection: 'baoGia',
              id,
            })

            if (currentRecord && currentRecord.items) {
              const currentProductId =
                typeof currentRecord.items === 'object'
                  ? currentRecord.items.id
                  : currentRecord.items

              // Loại bỏ sản phẩm cũ khỏi danh sách bị chặn
              if (currentProductId) {
                const index = usedProductIds.indexOf(currentProductId)
                if (index !== -1) {
                  usedProductIds.splice(index, 1) // Xóa khỏi danh sách bị lọc
                }
              }
            }
          }

          // 5️⃣ Trả về danh sách sản phẩm chưa được chọn
          return {
            id: {
              not_in: usedProductIds,
            },
          } as any
        } catch (error) {
          console.error('🚨 Lỗi khi lọc sản phẩm đã tồn tại:', error)
          return {} // Trả về điều kiện rỗng để không gây lỗi
        }
      },
    },

    {
      name: 'sanpham',
      label: 'Sản phẩm',
      type: 'text',
      admin: { readOnly: true },
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
              // 1️⃣ Xác định sản phẩm đã chọn
              const selectedProduct = data?.item || data?.items
              if (!selectedProduct) {
                return { id: { in: [] } } // Nếu chưa chọn sản phẩm, không hiển thị nhà cung cấp nào
              }

              // 2️⃣ Xác định collection tương ứng (medications hoặc medicalSupplies)
              const collection =
                data?.category === 'medications' ? 'medications' : 'medicalSupplies'

              // 3️⃣ Truy vấn danh sách nhà cung cấp từ bảng thuốc/vật tư
              const product = await req.payload.find({
                collection: collection,
                where: { id: { equals: selectedProduct } },
                limit: 1,
              })

              if (!product || !product.docs || product.docs.length === 0) {
                return { id: { in: [] } }
              }

              // 4️⃣ Lấy danh sách nhà cung cấp từ sản phẩm
              const supplierIds = product.docs[0].supplier // Giả sử `supplier` là một mảng hoặc một ID

              // Nếu `supplier` là object hoặc mảng, chuẩn hóa thành danh sách ID
              const supplierIdList = Array.isArray(supplierIds)
                ? supplierIds.map((s) => (typeof s === 'string' ? s : s.id))
                : []

              if (!supplierIdList.length) {
                return { id: { in: [] } }
              }

              // 5️⃣ Trả về danh sách nhà cung cấp phù hợp
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
          name: 'gianhap',
          label: 'Giá nhập',
          type: 'text',
        },
      ],
    },
    {
      name: 'gianhaptrungbinh',
      label: 'Giá nhập trung bình',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'thue',
      label: 'Thuế (%)',
      type: 'number',
      defaultValue: 5,
      min: 0,
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
      label: 'Giá bán  (VNĐ)',
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
