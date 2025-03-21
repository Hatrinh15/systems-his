
import { CollectionConfig } from "payload";
export const Pharmacies: CollectionConfig = {
    slug: 'pharmacies',
    labels: {
      singular: 'Quầy Thuốc',
      plural: 'Quầy Thuốc',
    },
    admin: {
        useAsTitle: "medicineName",
        defaultColumns: ["medicineName", 'quantity', 'batchnumber', 'expirydate', 'price', 'unit'],
        group:'Dược Và Vật Tư Y Tế'
      },
      fields: [
        {
          name: "medicine",
          label: "Tên sản phẩm",
          type: "relationship",
          relationTo: ['medications','medicalSupplies'],
          filterOptions: ({relationTo}) => {
            if(relationTo === 'medications') {
              return true
            }
            if(relationTo === 'medicalSupplies'){
              return {
                loaivattu: {equals: 'vattutieuhao'}
              }
            }
            return true
          }
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