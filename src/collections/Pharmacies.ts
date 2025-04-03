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
      relationTo: 'medications',
      admin: {
        condition: (data) => data?.category === 'medications',
      },
      filterOptions: async ({ req, data }) => {
        // 🏥 Lấy danh sách vật tư tiêu hao trong kho
        const existingInventory = await req.payload.find({
          collection: 'inventory',
          where: { category: { equals: 'medications' } },
          limit: 1000,
        })

        const medicationIdsInInventory = existingInventory.docs
          .map((doc) => (doc.item && typeof doc.item === 'object' ? doc.item.id : doc.item))
          .filter(Boolean) // Xóa undefined/null

        // 🏪 Lấy danh sách vật tư đã có trong quầy thuốc
        const existingPharmacies = await req.payload.find({
          collection: 'pharmacies',
          where: {},
          limit: 1000,
        })

        const medicationIdsInPharmacies = existingPharmacies.docs
          .map((doc) => (doc.item && typeof doc.item === 'object' ? doc.item.id : doc.item))
          .filter(Boolean)

        // ✅ Giữ lại sản phẩm đã chọn nếu có
        if (data?.item && !medicationIdsInInventory.includes(data.item)) {
          medicationIdsInInventory.push(data.item)
        }

        // 🔍 Lọc danh sách vật tư chưa có trong quầy thuốc
        const availableMedicationIds = medicationIdsInInventory.filter(
          (id) => !medicationIdsInPharmacies.includes(id),
        )

        // ✅ Giữ lại sản phẩm đang chọn (nếu có)
        if (data?.item && !availableMedicationIds.includes(data.item)) {
          availableMedicationIds.push(data.item)
        }

        // 🚨 Kiểm tra nếu danh sách trống, trả về điều kiện không có thuốc
        if (!availableMedicationIds.length) {
          return false // Hoàn toàn không có lựa chọn nào
        }

        // ✅ Trả về danh sách vật tư có thể chọn
        return {
          id: { in: availableMedicationIds },
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
          collection: 'pharmacies',
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
      admin: { readOnly: true, hidden: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'unit',
          label: 'Đơn vị ',
          type: 'text',
          defaultValue: 'Hộp',
        },
        {
          name: 'quantity',
          label: 'Số lượng ',
          type: 'number',
          min: 0,
        },
        {
          name: 'price',
          label: 'Giá niêm yết',
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
