import { CollectionConfig } from "payload";
export const Pharmacies: CollectionConfig = {
    slug: 'pharmacies',
    labels: {
      singular: 'Quầy Thuốc',
      plural: 'Quầy Thuốc',
    },
    admin: {
        useAsTitle: 'medicine',
        defaultColumns: ['medicine', 'quantity', 'batchnumber', 'expirydate', 'price', 'unit'],
        group:'Dược Và Vật Tư Y Tế'
      },
      fields: [
        {
          name: 'medicine',
          label: 'Tên thuốc',
          type: 'relationship',
          relationTo: 'medications',
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
          name: 'batchnumber',
          label: 'Số lô thuốc',
          type: 'text',
        },
        {
          name: 'expirydate',
          label: 'Hạn sử dụng',
          type: 'date',
        },
        {
          name: 'notes',
          label: 'Ghi chú',
          type: 'textarea',
        },
      ],
      timestamps: true,
}