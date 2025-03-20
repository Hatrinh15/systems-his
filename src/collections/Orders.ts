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
          name: 'medication',
          label: 'Thuốc',
          type: 'relationship',
          relationTo: 'medications',
          required: true,
        },
        {
          name: 'quantity',
          label: 'Số lượng',
          type: 'number',
          min: 1,
        },
        {
          name: 'price',
          label: 'Giá bán',
          type: 'number',
          min: 0,
        },
      ],
    },
    {
      name: 'totalprice',
      label: 'Tổng tiền',
      type: 'number',
      min: 0,
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
      required: true,
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
      required: true,
    },
  ],
}
