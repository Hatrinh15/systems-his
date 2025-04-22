import { hookCheckInfo, hookQuantity, inventoryHook } from '@/hooks/HookInventory'
import { CollectionConfig } from 'payload'
import { isAdminNhanVienKho } from '@/hooks/AccessAdmin'
export const Inventory: CollectionConfig = {
  slug: 'inventory',
  access: {
    create: isAdminNhanVienKho,
    read: isAdminNhanVienKho, 
    update: isAdminNhanVienKho,
    delete: isAdminNhanVienKho,
  },
  labels: {
    singular: 'Kho Hàng',
    plural: 'Kho Hàng',
  },
  admin: {
    useAsTitle: 'sanpham',
    defaultColumns: ['sanpham', 'quantity', 'stockstatus', 'reorderlevel'],
    group:'Dược & Vật Tư Y Tế'
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
    },
    {
      name: 'item',
      label: 'Sản phẩm',
      type: 'relationship',
      relationTo: 'medications',
      admin: { condition: (data) => data?.category === 'medications' , allowCreate: false },
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
        allowCreate: false,
      },
      filterOptions: async ({ req, data }) => {
        if (!data?.category) return false; // Nếu chưa chọn danh mục, không hiển thị gì cả
      
        try {
          // 🔍 Lấy danh sách sản phẩm đã có trong kho thuộc danh mục được chọn
          const existingInventory = await req.payload.find({
            collection: 'inventory',
            where: {
              category: { equals: data.category }, // Lọc theo danh mục đã chọn
            },
            limit: 1000,
          });
      
          // Lấy danh sách ID của các sản phẩm đã có trong kho
          const usedItems = existingInventory.docs
            .map((doc) => (doc.items && typeof doc.items === 'object' ? doc.items.id : doc.items))
            .filter(Boolean); // Lọc bỏ giá trị null/undefined
      
          // 🛠 Giữ lại sản phẩm đã lưu trước đó để không bị lỗi khi cập nhật
          if (data?.items) {
            usedItems.splice(usedItems.indexOf(data.items), 1);
          }
      
          // 🔍 Lấy danh sách sản phẩm thuộc danh mục từ `medicalSupplies`
          const medicalSuppliesData = await req.payload.find({
            collection: 'medicalSupplies',
            where: {
              loaivattu: { equals: data.category }, // Chỉ lấy vật tư thuộc danh mục
            },
            limit: 1000,
          });
      
          const medicalSuppliesIds = medicalSuppliesData.docs.map((doc) => doc.id);
      
          // ❌ Loại bỏ các sản phẩm đã có trong kho
          const filteredItems = medicalSuppliesIds.filter((id) => !usedItems.includes(id));
      
          // Nếu không còn sản phẩm hợp lệ, không hiển thị gì
          if (filteredItems.length === 0) return false;
      
          return {
            id: { in: filteredItems },
          };
        } catch (error) {
          console.error('Lỗi khi lọc danh sách vật tư:', error);
          return false; // Tránh lỗi hệ thống
        }
      },      
    },
    {
      name: 'sanpham',
      label: 'Sản phẩm',
      type: 'text',
      admin: { readOnly: true,
        hidden: true },
    },
    {
      name: 'unit',
      label: 'Đơn vị tính',
      type: 'select',
      options: [
        { label: 'Hộp', value: 'hop' },
        { label: 'Thùng', value: 'thung' },
        { label: 'Cái', value: 'cai' },
        {label: 'Bộ', value: 'bo'},
      ],
    },
    {
      name: 'quantity',
      label: 'Số lượng tồn kho',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Nếu số lượng bằng 0 hệ thống sẽ tự động đặt tình trạng là "Hết hàng". Nếu nhỏ hơn mức cảnh báo sẽ đặt là "Sắp hết".',
      }, // Số lượng tối thiểu
    },
    {
      name: 'stockstatus',
      label: 'Tình trạng hàng hóa',
      type: 'select',
      options: [
        { label: 'Còn hàng', value: 'conhang' },
        { label: 'Hết hàng', value: 'hethang' },
        { label: 'Sắp hết', value: 'saphet' },
      ],
      defaultValue: 'conhang',
    },
    {
      name: 'reorderlevel',
      label: 'Mức cảnh báo tồn kho',
      type: 'number',
      min: 0,
      defaultValue: 10, // Số lượng tối thiểu để cảnh báo
    },
    // {
    //   name: 'supplier',
    //   label: 'Nhà cung cấp',
    //   type: 'relationship',
    //   relationTo: 'suppliers',
    //   admin: {
    //     allowCreate: false,
    //   },
    //   hasMany: true,
    //   filterOptions: async ({ req, data }) => {
    //     try {
    //       // 1️ Xác định sản phẩm đã chọn
    //       const selectedProduct = data?.item || data?.items
    //       if (!selectedProduct) {
    //         return { id: { in: [] } } // Nếu chưa chọn sản phẩm, không hiển thị nhà cung cấp nào
    //       }

    //       // 2️ Xác định collection tương ứng (medications hoặc medicalSupplies)
    //       const collection = data?.category === 'medications' ? 'medications' : 'medicalSupplies'

    //       // 3️ Truy vấn danh sách nhà cung cấp từ bảng thuốc/vật tư
    //       const product = await req.payload.find({
    //         collection: collection,
    //         where: { id: { equals: selectedProduct } },
    //         limit: 1000,
    //       })

    //       if (!product || !product.docs || product.docs.length === 0) {
    //         return { id: { in: [] } }
    //       }

    //       // 4️ Lấy danh sách nhà cung cấp từ sản phẩm
    //       const supplierIds = product.docs[0].supplier // Giả sử `supplier` là một mảng hoặc một ID

    //       // Nếu `supplier` là object hoặc mảng, chuẩn hóa thành danh sách ID
    //       const supplierIdList = Array.isArray(supplierIds)
    //         ? supplierIds.map((s) => (typeof s === 'string' ? s : s.id))
    //         : []

    //       if (!supplierIdList.length) {
    //         return { id: { in: [] } }
    //       }

    //       // 5️ Trả về danh sách nhà cung cấp phù hợp
    //       return {
    //         id: {
    //           in: supplierIdList,
    //         },
    //       }
    //     } catch (error) {
    //       console.error('🚨 Lỗi khi lọc nhà cung cấp theo thuốc:', error)
    //       return { id: { in: [] } }
    //     }
    //   },
    // },
    {
      name: 'note',
      label: 'Ghi chú',
      type: 'textarea',
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [inventoryHook,hookCheckInfo,hookQuantity]
  }
}
