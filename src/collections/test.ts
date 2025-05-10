import { CollectionConfig } from "payload";
export const test : CollectionConfig = { 
    slug: 'test',
      admin: {
        defaultColumns: ['quantity', 'expirydate', 'price', 'unit'],
      },
    fields: [
        {
            name: "medicine",
            label: "Tên thuốc",
            type: "relationship",
            relationTo: ['medications','medicalSupplies']
          },
          {
            name: "medicineName", // 🔥 Thêm field này để UI dễ đọc
            label: "Tên hiển thị",
            type: "text",
            admin: { readOnly: true }, // Chỉ hiển thị, không chỉnh sửa
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
            type: 'date',
          },
          {
            name: 'notes',
            label: 'Ghi chú',
            type: 'textarea',
          },
    
    ]
}