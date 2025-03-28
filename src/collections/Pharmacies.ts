import { CollectionConfig } from 'payload'
import { hookQuayThuoc } from '@/hooks/Hookpharmacies'
export const Pharmacies: CollectionConfig = {
  slug: 'pharmacies',
  labels: {
    singular: 'Quầy Thuốc',
    plural: 'Quầy Thuốc',
  },
  admin: {
    useAsTitle: 'sanpham',
    defaultColumns: ['sanpham', 'quantity', 'batchnumber', 'expirydate', 'price', 'unit'],
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
      ],
      required: true,
    },
    {
      name: 'item',
      label: 'Sản phẩm',
      type: 'relationship',
      relationTo: 'medications', // Chỉ liên kết với bảng thuốc
      admin: { condition: (data) => data?.category === 'medications' },
      filterOptions: async ({ req, data }) => {
        // 1️⃣ Lấy danh sách thuốc trong kho
        const existingInventory = await req.payload.find({
          collection: 'inventory',
          where: { category: { equals: 'medications' } },
          limit: 1000,
        })

        const medicationIdsInInventory = existingInventory.docs
          .map((doc) => (doc.item && typeof doc.item === 'object' ? doc.item.id : doc.item))
          .filter(Boolean)

        // 2️⃣ Lấy danh sách thuốc đã có trong quầy thuốc
        const existingPharmacies = await req.payload.find({
          collection: 'pharmacies',
          where: {},
          limit: 1000,
        })

        const medicationIdsInPharmacies = existingPharmacies.docs
          .map((doc) => (doc.item && typeof doc.item === 'object' ? doc.item.id : doc.item))
          .filter(Boolean)

        // 3️⃣ Giữ lại thuốc đã chọn nếu có
        if (data?.item && !medicationIdsInInventory.includes(data.item)) {
          medicationIdsInInventory.push(data.item) // Thêm item cũ để tránh lỗi khi cập nhật
        }

        // 4️⃣ Lọc thuốc chưa có trong quầy thuốc
        const availableMedicationIds = medicationIdsInInventory.filter(
          (id) => !medicationIdsInPharmacies.includes(id),
        )

        // 5️⃣ Giữ lại thuốc đã chọn nếu có
        if (data?.item && !availableMedicationIds.includes(data.item)) {
          availableMedicationIds.push(data.item)
        }

        return {
          id: { in: availableMedicationIds }, // Giữ lại item đang chọn để tránh lỗi
        }
      },
    },

    {
      name: 'items',
      label: 'Sản phẩm',
      type: 'relationship',
      relationTo: 'medicalSupplies',
      admin: {
        condition: (data) => data?.category === 'vattutieuhao',
      },
      filterOptions: async ({ req, data }) => {
        //  Lấy danh sách thuốc trong kho
        const existingInventory = await req.payload.find({
          collection: 'inventory',
          where: { category: { equals: 'vattutieuhao' } },
          limit: 1000,
        })

        const medicationIdsInInventory = existingInventory.docs
          .map((doc) => (doc.items && typeof doc.items === 'object' ? doc.items.id : doc.items))
          .filter(Boolean)
        //  Lấy danh sách thuốc đã có trong quầy thuốc
        const existingPharmacies = await req.payload.find({
          collection: 'pharmacies',
          where: {},
          limit: 1000,
        })
        const medicationIdsInPharmacies = existingPharmacies.docs
          .map((doc) => (doc.items && typeof doc.items === 'object' ? doc.items.id : doc.items))
          .filter(Boolean)
        //  Giữ lại thuốc đã chọn nếu có
        if (data?.item && !medicationIdsInInventory.includes(data.items)) {
          medicationIdsInInventory.push(data.items) // Thêm item cũ để tránh lỗi khi cập nhật
        }
        // Lọc thuốc chưa có trong quầy thuốc
        const availableMedicationIds = medicationIdsInInventory.filter(
          (id) => !medicationIdsInPharmacies.includes(id),
        )
        // 5 Giữ lại thuốc đã chọn nếu có
        if (data?.items && !availableMedicationIds.includes(data.items)) {
          availableMedicationIds.push(data.items)
        }
        return {
          id: { in: availableMedicationIds }, // Giữ lại item đang chọn để tránh lỗi
        }
      },
    },
    {
      name: 'sanpham',
      label: 'Sản phẩm',
      type: 'text',
      admin: { readOnly: true, hidden: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'quantity',
          label: 'Số lượng ',
          type: 'number',
          min: 0,
        },
        {
          name: 'unit',
          label: 'Đơn vị tính',
          type: 'text',
          defaultValue: 'Hộp',
        },
        {
          name: 'price',
          label: 'Giá niêm yết',
          type: 'text',
        },
      ],
    },
    {
      type: 'row',

      fields: [
        {
          name: 'donvi',
          label: 'Đơn vị',
          type: 'select',
          admin: { condition: (data) => data?.category === 'medications', readOnly: true },
          options: [
            { label: 'Viên', value: 'vien' },
            { label: 'Ống', value: 'ong' },
            { label: 'Lọ', value: 'lo' },
            { label: 'Gói', value: 'goi' },
            { label: 'Hộp', value: 'hop' },
          ],
        },
        {
          name: 'units',
          label: 'Đơn vị',
          type: 'select',

          admin: { condition: (data) => data?.category === 'vattutieuhao', readOnly: true },
          options: [
            { label: 'Chai', value: 'vien' },
            { label: 'Cuộn', value: 'cuon' },
            { label: 'Miếng', value: 'mieng' },
            { label: 'Gói', value: 'goi' },
          ],
        },
        { name: 'quychuan', label: 'Quy chuẩn', type: 'number', admin: { readOnly: true } },
        { name: 'soluong', label: 'Tổng số lượng theo đơn vị', type: 'number' },
        { name: 'tongtien', label: 'Tiền theo đơn vị tính bán lẻ', type: 'text' },
      ],
    },
    {
      name: 'expirydate',
      label: 'Hạn sử dụng',
      type: 'text',
    },
    {
      name: 'notes',
      label: 'Ghi chú',
      type: 'textarea',
    },
  ],
  hooks: {
    beforeChange: [hookQuayThuoc],
  },
}
