import { CollectionConfig } from 'payload'
import { hookMedicalSupplies } from '@/hooks/HookMedicalSupplies'

export const medicalSupplies: CollectionConfig = {
  slug: 'medicalSupplies',
  labels: {
    singular: 'Vật Tư Y Tế',
    plural: 'Vật Tư Y Tế',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['code', 'name', 'category', 'unit', 'expirydate'],
    group:'Dược Và Vật Tư Y Tế'
  },
  fields: [
    {
      name: 'loaivattu',
      label: 'Loại vật tư',
      type: 'radio',
      options:[
        {label: 'Vật tư tiêu hao',value: 'vattutieuhao'},
        {label: 'Máy móc/Thiết bị',value: 'maymocthietbi'},
      ]
    },
    {
      name: "code",
      label: "Mã vật tư",
      type: "text",
      unique: true,
    },
    {name:'option',
      label:'Tùy chọn',
      type:'radio',
      options:[
        {label:'Vật tư tiêu hao',value:'vattutieuhao',},
        {label:"Máy móc thiết bị",value:'maymocthietbi'},
      ],
      required:true,
    },
    {
      name: 'name',
      label: 'Tên ',
      type: 'text',
    },
    {
      name: 'category',
      label: 'Loại vật tư',
      type: 'select',
      options: [
        { label: 'Dùng chung', value: 'dungchung' },
        { label: 'Phẫu thuật', value: 'phauthuat' },
        { label: 'Khử khuẩn & Tiệt trùng', value: 'khukhuantiettrung' },
        { label: 'Chăm sóc vết thương', value: 'chamsocvetthuong' },
        { label: 'Thiết bị chẩn đoán', value: 'thietbichandoan' },
        { label: 'Dụng cụ tiêm & truyền dịch', value: 'dungcutiemvatruyendich' },
        { label: 'Vật tư phòng mổ', value: 'vattuphongmo' },
      ],
    },
    {
      name: 'description',
      label: 'Công dụng',
      type: 'textarea',
    },
    {
      name: 'unit',
      label: 'Đơn vị tính',
      type: 'select',
      options: [
        { label: 'Cái', value: 'cai' },
        { label: 'Hộp', value: 'hop' },
        { label: 'Túi', value: 'tui' },
        { label: 'Vỉ', value: 'vi' },
        { label: 'Ống', value: 'ong' },
        { label: 'Chai', value: 'chai' },
        { label: 'Lít (L)', value: 'lit' },
        { label: 'Mililit (ml)', value: 'ml' },
        { label: 'Kg', value: 'kg' },
        { label: 'Gram', value: 'gram' },
      ],
    },
    {
      name: 'packaging',
      label: 'Quy cách đóng gói',
      type: 'text',
    },
    {
      name: 'manufacturer',
      label: 'Hãng sản xuất',
      type: 'text',
    },
    {
      name: 'supplier',
      label: 'Nhà cung cấp',
     type: 'relationship',
     relationTo: 'suppliers',
     hasMany:true,
    },
    {
      name: "notes",
      label: "Ghi chú",
      type: "textarea",
    },
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [hookMedicalSupplies], // Áp dụng hook kiểm tra dữ liệu trước khi validate
  },
}
