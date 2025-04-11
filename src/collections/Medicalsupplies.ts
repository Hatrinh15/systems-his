import { CollectionConfig } from 'payload'
import { hookMedicalSupplies, notChangeLoaiVatTu } from '@/hooks/HookMedicalSupplies'

export const medicalSupplies: CollectionConfig = {
  slug: 'medicalSupplies',
  labels: {
    singular: 'Vật Tư Y Tế',
    plural: 'Vật Tư Y Tế',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['code', 'name', 'category', 'unit', 'expirydate'],
    group: 'Dược & Vật Tư Y Tế',
  },
  fields: [
    {
      name: 'loaivattu',
      label: 'Loại vật tư',
      type: 'radio',
      options: [
        { label: 'Vật tư tiêu hao', value: 'vattutieuhao' },
        { label: 'Máy móc/Thiết bị', value: 'maymocthietbi' },
      ],
    },
    {
      name: 'code',
      label: 'Mã vật tư',
      type: 'text',
      unique: true,
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
        {label: 'Bộ', value: 'bo'},
        { label: 'Hộp', value: 'hop' },
        { label: 'Cuộn', value: 'cuon' },
        { label: 'Miếng', value: 'mieng' },
        { label: 'Gói', value: 'goi' },
        { label: 'Chai', value: 'chai' },
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
      hasMany: true,
    },
    {
      name: 'notes',
      label: 'Ghi chú',
      type: 'textarea',
    },
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [hookMedicalSupplies,notChangeLoaiVatTu], // Áp dụng hook kiểm tra dữ liệu trước khi validate
  },
}
