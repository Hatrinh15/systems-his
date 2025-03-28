import { CollectionConfig } from 'payload';

export const medicalUsages: CollectionConfig = {
  slug: 'medicalUsages',
  labels: {
    singular: 'Phiếu Sử Dụng Kho Khoa',
    plural: 'Phiếu Sử Dụng Kho Khoa',
  },
  admin: {
    useAsTitle:'department',
     group:'Dược Và Vật Tư Y Tế'
  },
  fields: [
    {
      name : 'loaiphieu',
      label: 'Loại phiếu ',
      type: 'radio',
      options:[
        {label: 'Sử dụng',value:'sudung'},
        {label:'Hủy hàng',value: 'huyhang'}
      ],
    defaultValue: 'sudung'
    },
    {
      name: 'usagedate',
      label: 'Ngày sử dụng/hủy hàng',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd-MM-yyy',
        },
      },
    },
    {
      name: 'department',
      label: 'Khoa sử dụng',
      type: 'relationship',
      relationTo: 'departments',
      required: true,
      admin:{
        allowCreate: false
      }
    },
    {
      name: 'staff',
      label: 'Nhân viên thực hiện',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin:{
        allowCreate: false,
    },
  },
    {
      name: 'ghichu',
      label: 'Ghi chú',
      type:'textarea'
    },
    {
      name: 'danhsachsudung',
      label: 'Danh sách sử dụng thuốc & vật tư',
      type: 'array',
      fields: [
       {
        name: 'hosobenhan',
        label: 'Hồ sơ bệnh án',
        type: 'relationship',
        relationTo: 'MedicalRecods',
        admin:{
          allowCreate: false,
          allowEdit: false,
          condition: (data) => data.loaiphieu === 'sudung',
        }
       },
       {
        name: 'sohoso',
        label: 'Số hồ sơ bệnh án',
        type: 'text',
       },
       {
        name: 'bacsi',
        label: 'Bác sĩ chỉ định',
        type: 'relationship',
        relationTo: 'users',
        admin:{
          allowCreate: false,
          condition: (data) => data.loaiphieu === 'sudung',
        }
       },
       {
        name: 'nguoixacnhanhuy',
        label: 'Người xác nhận hủy',
        type: 'relationship',
        relationTo: 'users',
        admin:{
          allowCreate: false,
          condition: (data) => data.loaiphieu === 'huyhang',
        }
      },
       {
        name: 'thuoc',
        label: 'Thuốc',
        type: 'array',
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'tenthuoc',
                label: 'Tên thuốc',
                type: 'relationship',
                relationTo: 'medications',
                admin:{
                  allowCreate: false
                }
              },
              { name: 'quantity', label: 'Số lượng sử dụng', type: 'number', min: 1 },
              {
                name: 'donvi',
                label: 'Đơn vị',
                type: 'select',
                options:[
                  {label: 'Hộp',value:'hop'},
                  {label: 'Viên',value:'vien' },
                  {label: 'Lọ', value: 'lo'},
                  {label: 'Chai',value: 'chai'},
                  {label:'Ống',value: 'ong'}
                ],
                defaultValue :'hop'
              },
              { name: 'unitprice', label: 'Đơn giá(VNĐ)', type: 'text' },
              {
                name: 'totalprice',
                label: 'Tổng giá trị',
                type: 'text',
                admin: { readOnly: true },
              },
            ],
          },
          {
            name: 'lido',
            label: 'Lí do sử dụng/hủy hàng',
            type: 'textarea'
          }
        ],
      },
      {
        name: 'vattutieuhao',
        label: 'Vật tư tiêu hao',
        type: 'array',
        admin: { condition: (data) => data.loaiphieu === 'sudung' || data.loaiphieu === 'huyhang' },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'supply',
                label: 'Tên vật tư y tế',
                type: 'relationship',
                relationTo: 'medicalSupplies',
                admin:{
                  allowCreate: false
                }
              },
              { name: 'quantity', label: 'Số lượng sử dụng', type: 'number', min: 1 },
              {
                name: 'donvi',
                label: 'Đơn vị',
                type: 'select',
                options:[
                  {label: 'Hộp',value:'hop'},
                  {label: 'Chai',value:'chai'},
                  {label: 'Gói', value: 'goi'},
                  {label: 'Cuộn', value: 'cuon'},
                  {label: 'Miếng',value: 'mieng'}
                ],
                defaultValue: 'hop',
              },
              { name: 'unitprice', label: 'Đơn giá(VNĐ)', type: 'text' },
              {
                name: 'totalprice',
                label: 'Tổng giá trị',
                type: 'text',
                admin: { readOnly: true },
              },
            ],
          },
          {
            name: 'lido',
            label: 'Lí do sử dụng/hủy hàng',
            type: 'textarea'
          }
        ],
      },
      {
        name: 'maymocthietbi',
        label: 'Máy móc/Thiết bị',
        type: 'array',
        admin: { condition: (data) => data.loaiphieu === 'huyhang' },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'equipment',
                label: 'Tên vật tư y tế',
                type: 'relationship',
                relationTo: 'medicalSupplies',
                admin:{
                  allowCreate: false
                }
              },
              { name: 'quantity', label: 'Số lượng sử dụng', type: 'number', min: 1 },
              {
                name: 'donvi',
                label: 'Đơn vị',
                type: 'select',
                options:[
                  {label: 'Cái',value: 'cai' },
                  {label: 'Bộ',value: 'bo'}
                ]
              },
              { name: 'unitprice', label: 'Đơn giá(VNĐ)', type: 'text' },
              {
                name: 'totalprice',
                label: 'Tổng giá trị',
                type: 'text',
                admin: { readOnly: true },
              },
            ],
          },
          {
            name: 'lido',
            label: 'Lí do sử dụng/hủy hàng',
            type: 'textarea'
          }
        ],
      },
      ],
    },
  ],
};

