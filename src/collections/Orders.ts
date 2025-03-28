import { hookTinhGiaThuoc } from '@/hooks/HookOrders'
import { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: 'Tạo Đơn Thuốc',
    plural: 'Tạo Đơn Thuốc',
  },
  admin: {
    useAsTitle: 'customer',
    group: 'Quản Lý Phiếu & Bảng Giá',
  },
  fields: [
    {
      name: 'customer',
      label: 'Bệnh nhân mua thuốc',
      type: 'relationship',
      relationTo: 'patients',
      required: true,
    },
    {
      name: 'items',
      label: 'Danh sách thuốc mua',
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'medication',
              label: 'Sản phẩm',
              type: 'relationship',
              relationTo: 'pharmacies',
              required: true,
            },
            {
              name: 'quantity',
              label: 'Số lượng',
              type: 'number',
              min: 1,
            },
            {
              name: 'donvi',
              label: 'Đơn vị',
              type: 'select',
              options: [
                { label: 'Hộp', value: 'hop' },
                { label: 'Viên', value: 'vien' },
                { label: 'Ống', value: 'ong' },
                { label: 'Lọ', value: 'lo' },
                { label: 'Gói', value: 'goi' },
                { label: 'Chai', value: 'vien' },
                { label: 'Cuộn', value: 'cuon' },
                { label: 'Miếng', value: 'mieng' },
                { label: 'Gói', value: 'goi' },
              ],
            },
            {
              name: 'price',
              label: 'Giá bán',
              type: 'text',
            },
            { name: 'tien', label: 'Tổng tiền', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'totalprice',
      label: 'Tổng giá trị đơn thuốc',
      type: 'text',

      admin: {
        readOnly: true,
      },
    },
    {
      name: 'orderdate',
      label: 'Ngày mua',
      type: 'date',
    },
    {
      name: 'staff',
      label: 'Nhân viên bán hàng',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'paymentmethod',
      label: 'Hình thức thanh toán',
      type: 'select',
      options: [
        { label: 'Tiền mặt', value: 'cash' },
        { label: 'Thẻ', value: 'card' },
        { label: 'Bảo hiểm y tế', value: 'insurance' },
      ],
    },
  ],
  hooks: {
    beforeChange: [hookTinhGiaThuoc],
  },
}
