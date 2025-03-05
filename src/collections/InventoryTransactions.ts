import { CollectionConfig } from 'payload';
import { medicalSupplies } from './MedicalSupplies';

export const InventoryTransactions: CollectionConfig = {
  slug: 'inventorytransactions',
  labels: {
    singular: 'PHIẾU GIAO DỊCH KHO',
    plural: 'PHIẾU GIAO DỊCH KHO',
  },
  admin: {
    useAsTitle: 'transactiontype',
    defaultColumns: ['transactiontype', 'receiverorsender', 'transactiondate'],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Thông Tin Giao Dịch',
          fields: [
            {
              name: 'transactiontype',
              label: 'Loại giao dịch',
              type: 'select',
              required: true,
              options: [
                { label: 'Nhập kho', value: 'nhapkho' },
                { label: 'Xuất kho', value: 'xuatkho' },
              ],
            },
            {
              name: 'supplier',
              label: 'Nhà cung cấp',
              type: 'relationship',
              relationTo: 'suppliers',
              admin: {
                condition: (data) => data.transactiontype === 'nhapkho',
              },
            },
            {
              name: 'destination',
              label: 'Nơi nhận',
              type: 'select',
              admin: {
                condition: (data) => data.transactiontype === 'xuatkho',
              },
              options: [
                { label: 'Quầy thuốc', value: 'quaythuoc' },
                { label: 'Khoa', value: 'khoa' },
              ],
            },
            {
              name: 'transactiondate',
              label: 'Ngày giao dịch',
              type: 'date',
            },
            {
              name: 'receiverorsender',
              label: 'Người nhận/Người xuất',
              type: 'relationship',
              relationTo: 'users',
            },
            {
              name: 'notes',
              label: 'Ghi chú',
              type: 'textarea',
            },
          ],
        },
        {
          label: 'Sản Phẩm',
          fields: [
            {
              name: 'medications',
              label: 'Danh sách thuốc',
              type: 'array',
              fields: [
                {
                  name: 'medicine',
                  label: 'Tên thuốc',
                  type: 'relationship',
                  relationTo: 'medications',
                },
                {
                  name: 'quantity',
                  label: 'Số lượng',
                  type: 'number',
                  min: 1,
                },
                {
                  name: 'unitprice',
                  label: 'Đơn giá',
                  type: 'number',
                  min: 0,
                },
                {
                  name: 'totalprice',
                  label: 'Tổng giá trị',
                  type: 'number',
                  admin: {
                    readOnly: true,
                  },
                },
              ],
            },
            {
              name: 'medicalSupplies',
              label: 'Danh sách vật tư y tế',
              type: 'array',
              fields: [
                {
                  name: 'supply',
                  label: 'Tên vật tư y tế',
                  type: 'relationship',
                  relationTo: 'medicalSupplies',
                },
                {
                  name: 'quantity',
                  label: 'Số lượng',
                  type: 'number',
                  min: 1,
                },
                {
                  name: 'unitprice',
                  label: 'Đơn giá',
                  type: 'number',
                  min: 0,
                },
                {
                  name: 'totalprice',
                  label: 'Tổng giá trị',
                  type: 'number',
                  admin: {
                    readOnly: true,
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Báo cáo',
          fields: [
            {
              name: 'total_import_quantity',
              label: 'Tổng số lượng nhập',
              type: 'number',
              admin: {
                readOnly: true,
                condition: (data) => data.transactiontype === 'nhapkho',
              },
            },
            {
              name: 'total_import_value',
              label: 'Tổng giá trị nhập',
              type: 'number',
              admin: {
                readOnly: true,
                condition: (data) => data.transactiontype === 'nhapkho',
              },
            },
            {
              name: 'total_export_quantity',
              label: 'Tổng số lượng xuất',
              type: 'number',
              admin: {
                readOnly: true,
                condition: (data) => data.transactiontype === 'xuatkho',
              },
            },
            {
              name: 'total_export_value',
              label: 'Tổng giá trị xuất',
              type: 'number',
              admin: {
                readOnly: true,
                condition: (data) => data.transactiontype === 'xuatkho',
              },
            },
            {
              name: 'report_date',
              label: 'Ngày tạo báo cáo',
              type: 'date',
            },
            {
              name: 'report_notes',
              label: 'Ghi chú báo cáo',
              type: 'textarea',
            },
          ],
        }
      ],
    },
  ],
  timestamps: true,
};
