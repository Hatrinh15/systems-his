import { CollectionConfig } from 'payload';

export const Inventory: CollectionConfig = {
  slug: 'inventory',
  labels: {
    singular: 'KHO HÀNG',
    plural: 'KHO HÀNG',
  },
  admin: {
    useAsTitle: 'category',
    defaultColumns: ['category', 'item', 'quantity', 'expirydate', 'importprice'],
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
      relationTo: ['medications', 'medicalSupplies'],
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
      name: 'expirydate',
      label: 'Hạn sử dụng',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd-MM-yyy',
        },
      },
    },
    {
      name: 'supplier',
      label: 'Nhà cung cấp',
      type: 'relationship',
      relationTo: 'suppliers',
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
};
