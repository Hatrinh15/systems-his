import { CollectionConfig } from 'payload'
import { updateProductName } from '@/hooks/HookBaoGia'
export const baoGia: CollectionConfig = {
  slug: 'baogia',

  labels: {
    singular: 'Báo Giá',
    plural: 'Báo Giá',
  },
  admin: {
    useAsTitle: 'sanpham',
    defaultColumns: ['sanpham', 'gianhaptrungbinh', 'thue', 'loinhuan', 'giabanle'],
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
    },
    {
      name: 'items',
      label: 'Sản phẩm',
      type: 'relationship',
      relationTo: 'medicalSupplies',
      admin: { condition: (data) => data?.category === 'medicalSupplies' },
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
      name: 'giabanle',
      label: 'Giá bán lẻ (VNĐ)',
      type: 'text',
      // admin: {readOnly: true},
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [updateProductName],
  },
}
