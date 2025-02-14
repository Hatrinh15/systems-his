import type { CollectionConfig } from 'payload';
import { authenticated } from '@/access/authenticated';
import { Patient } from '@/payload-types';
export const Medicalorders: CollectionConfig = {
  slug: 'medicalorders',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  labels: {
    singular: 'Y LỆNH',
    plural: 'Y LỆNH',
  },
  admin: {
    defaultColumns: ['benhnhan', 'bacsi', 'ngayLap'],
    useAsTitle: 'benhnhan',
  },
  fields: [
    {
      name: 'benhnhan',
      label: 'Bệnh nhân',
      type: 'relationship',
      relationTo: 'patients',
      required: true,
    },
    {name:'khoa,',
    label: 'Khoa',
    required: true,
    type: 'select',
    options:[
        {label: 'Khoa Tai',  value: 'khoatai' },
        {label: 'Khoa Mũi', value: 'khoamui' },
        {label: 'Khoa Họng' , value: 'khoahong'},
        {label: 'Khoa Câp Cứu', value: 'khoacapcuu'},
        {label: 'Khoa Gây Mê Hồi Sức', value: 'khoagaymehoisuc'},
        {label: 'Khoa Dược', value: 'khoaduoc'},
    ]
    },
    {
      name: 'bacsi',
      label: 'Bác sĩ phụ trách',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'ngayLap',
      label: 'Ngày lập y lệnh',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMM yyy',
        },
      },
    },
    {
      name: 'chiDinh',
      label: 'Chỉ định',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'loaiChiDinh',
          label: 'Loại chỉ định',
          type: 'select',
          options: [
            { label: 'Xét nghiệm', value: 'xetnghiem' },
            { label: 'Chẩn đoán hình ảnh', value: 'chanDoanHinhAnh' },
            { label: 'Thuốc', value: 'thuoc' },
            { label: 'Khác', value: 'khac' },
          ],
          required: true,
        },
        {
          name: 'moTa',
          label: 'Mô tả chi tiết',
          type: 'richText',
          required: true,
        },
      ],
    },
    {
      name: 'ghiChu',
      label: 'Ghi chú bổ sung',
      type: 'richText',
    },
  ],
  timestamps: true,
};
