import { CollectionConfig } from 'payload';

export const Inventory: CollectionConfig = {
  slug: 'inventory',
  labels: {
    singular: 'KHO HÀNG',
    plural: 'KHO HÀNG',
  },
  admin: {
    useAsTitle: 'item',
    defaultColumns: ['item', 'batchnumber', 'quantity', 'stockstatus', 'reorderlevel', 'expirydate', 'importprice'],
  },
  fields: [
    {
      name: 'item',
      label: 'Sản phẩm',
      type: 'relationship',
      relationTo: ['medications', 'medicalSupplies'],
    },
    {
      name: 'batchnumber',
      label: 'Số lô',
      type: 'text',
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
    },
    {
      name: 'importprice',
      label: 'Giá nhập',
      type: 'number',
      min: 0,
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
    },
  ],
  timestamps: true,
};
