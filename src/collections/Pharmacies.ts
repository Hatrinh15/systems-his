
import { CollectionConfig } from "payload";
import { hookQuayThuoc } from "@/hooks/Hookpharmacies";
export const Pharmacies: CollectionConfig = {
  slug: 'pharmacies',
  labels: {
    singular: 'Quầy Thuốc',
    plural: 'Quầy Thuốc',
  },
    admin: {
        useAsTitle: 'sanpham',
        defaultColumns: ['sanpham', 'quantity', 'batchnumber', 'expirydate', 'price', 'unit'],
        group:'Dược Và Vật Tư Y Tế'
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
          admin: { condition: (data) => data?.category === 'medications' },
        },
        {
          name: 'items',
          label: 'Sản phẩm',
          type: 'relationship',
          relationTo: 'medicalSupplies',
          admin: {
            condition: (data) => data?.category === 'vattutieuhao',
          },
        },
        {
          name: 'sanpham',
          label: 'Sản phẩm',
          type: 'text',
          admin: { readOnly: true,
            hidden: true },
        },
        {
          name: 'quantity',
          label: 'Số lượng tại quầy',
          type: 'number',
          min: 0,
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
          type: 'text'
        },
        {
          name: 'notes',
          label: 'Ghi chú',
          type: 'textarea',
        },
      ],
      hooks:{
        beforeChange:[hookQuayThuoc]
      }
  };
