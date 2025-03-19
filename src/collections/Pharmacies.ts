
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