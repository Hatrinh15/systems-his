import { CollectionConfig } from 'payload';

export const medicalUsages: CollectionConfig = {
  slug: 'medicalUsages',
  labels: {
    singular: 'Phiếu Sử Dụng Vật Tư Y Tế',
    plural: 'Phiếu Sử Dụng Vật Tư Y Tế',
  },
  admin: {
    useAsTitle:'department',
     group:'Dược Và Vật Tư Y Tế'
  },
  fields: [
    {
      name: 'usagedate',
      label: 'Ngày sử dụng',
      type: 'date',
    },
    {
      name: 'department',
      label: 'Khoa sử dụng',
      type: 'relationship',
      relationTo: 'departments',
      required: true,
    },
    {
      name: 'staff',
      label: 'Nhân viên thực hiện',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'items',
      label: 'Danh sách vật tư y tế',
      type: 'array',
      fields: [
        {
          name: 'item',
          label: 'Vật tư y tế',
          type: 'relationship',
          relationTo: 'medicalSupplies',
        },
        {
          name: 'quantity',
          label: 'Số lượng sử dụng',
          type: 'number',
          min: 1,
        },
        {
            name: 'reason',
            label: 'Lý do sử dụng',
            type: 'textarea',
          },
      ],
    },
  ],
};

