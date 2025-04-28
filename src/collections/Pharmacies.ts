import { CollectionConfig } from 'payload'
import { hookcheck, hookQuayThuoc, hookTinhTrangHang ,accessRead} from '@/hooks/Hookpharmacies'
import { isAdminDuocSi } from '@/hooks/AccessAdmin'
export const Pharmacies: CollectionConfig = {
  slug: 'pharmacies',
access: { 
  create: isAdminDuocSi,
  read: accessRead,  
  update: isAdminDuocSi,
  delete: isAdminDuocSi,
},
  labels: {
    singular: 'Quầy Thuốc',
    plural: 'Quầy Thuốc',
  },
  admin: {
    useAsTitle: 'sanpham',
    defaultColumns: ['sanpham', 'quantity', 'batchnumber', 'expirydate', 'price', 'unit'],
    group: 'Dược & Vật Tư Y Tế', 
    hidden: ({ user }) => {
      if(user?.taikhoan === 'admin') {
        return false
      }
      if(user?.khoa === 'khoaduoc' && user?.chucvu === 'duocsi' || user?.chucvu === 'truongkhoa') {
        return false
      }
      return true
    }
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
    },
    {
      name: 'item',
      label: 'Sản phẩm',
      type: 'relationship',
      relationTo: 'medications',
      admin: {
        condition: (data) => data?.category === 'medications',
        allowCreate: false,
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
          type: 'select',
          options: [
            { label: 'Hộp', value: 'hop' },
          ],
        },
        {
          name: 'quantity',
          label: 'Số lượng ',
          type: 'number',
          min: 0,
          defaultValue: 0,
        },
        {
          name: 'price',
          label: 'Giá niêm yết',
          type: 'text',
          defaultValue: '0',
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
        { name: 'soluong', label: 'Tổng số lượng theo đơn vị', type: 'number' ,defaultValue: 0},
        { name: 'tongtien', label: 'Tiền theo đơn vị tính bán lẻ', type: 'text', defaultValue: '0' },
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
      label: 'Bảo hiểm y tế',
      type: 'select',
      options: [
        { value: 'co', label: 'Có' },
        { value: 'khong', label: 'Không' },
      ],
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
          label: 'Mức cảnh báo tồn',
          type: 'number',
          min: 0,
          defaultValue: 10, // Số lượng tối thiểu để cảnh báo
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
    beforeChange: [hookQuayThuoc,hookcheck,hookTinhTrangHang],
  },
}
