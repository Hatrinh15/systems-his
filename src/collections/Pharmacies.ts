
import { CollectionConfig } from "payload";
export const Pharmacies: CollectionConfig = {
    slug: 'pharmacies',
    labels: {
      singular: 'QUẦY THUỐC',
      plural: 'QUẦY THUỐC',
    },
    admin: {
        useAsTitle: 'medicineName',
        defaultColumns: ['medicineName','quantity', 'expirydate', 'price', 'unit'],
      },
      fields: [
        {
          name: "medicine",
          label: "Tên sản phẩm",
          type: "relationship",
          relationTo: ['medications','medicalSupplies']
        },
        {
          name: "medicineName", 
          label: "Tên hiển thị",
          type: "text",
          admin: { readOnly: true }, 
        },
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
          type: 'text'
        },
        {
          name: 'notes',
          label: 'Ghi chú',
          type: 'textarea',
        },
      ],
  };