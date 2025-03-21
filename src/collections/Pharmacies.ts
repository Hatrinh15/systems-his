import { CollectionConfig } from 'payload'
export const Pharmacies: CollectionConfig = {
  slug: 'pharmacies',
  labels: {
    singular: 'Quầy Thuốc',
    plural: 'Quầy Thuốc',
  },
  admin: {
    // useAsTitle: 'medicineName',
    defaultColumns: [
      'medicine',
      'medicines',
      'quantity',
      'batchnumber',
      'expirydate',
      'price',
      'unit',
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
      ],
      required: true,
    },
    {
      name: 'medicine',
      label: 'Sản phẩm',
      type: 'relationship',
      relationTo: 'medications',
      admin: { condition: (data) => data?.category === 'medications' },
    },
    {
      name: 'medicines',
      label: 'Sản phẩm',
      type: 'relationship',
      relationTo: 'medicalSupplies',
      admin: {
        condition: (data) => data?.category === 'vattutieuhao',
      },
    },
    // {
    //   name: 'medicineName',
    //   label: 'Tên hiển thị',
    //   type: 'text',
    //   admin: { readOnly: true },
    // },
    {
      name: 'quantity',
      label: 'Số lượng tại quầy',
      type: 'number',
      min: 0,
      admin: { readOnly: true }, // Chỉ hiển thị, không chỉnh sửa
    },
    {
      name: 'price',
      label: 'Giá niêm yết',
      type: 'number',
      min: 0,
    },
    {
      name: 'unit',
      label: 'Đơn vị tính',
      type: 'text',
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
}
