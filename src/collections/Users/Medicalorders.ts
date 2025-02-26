import type { CollectionConfig } from 'payload';
import { authenticated } from '@/access/authenticated';
import { Patient } from '@/payload-types';
import { text } from 'stream/consumers';
import { APIError } from 'payload';
import { valuemedicalorder } from '@/hooks/Hookmedicalorder';


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
    defaultColumns: ['hosobenhan', 'bacsi', 'ngayLap'],
    useAsTitle: 'hosobenhan',
  },
  fields: [
    {
      name: 'hosobenhan',
      label: 'Hồ sơ bệnh án',
    
      type: 'relationship',
      relationTo: 'MedicalRecods',
    },
    {
      name: 'khoa',
      label: 'Khoa',
    
      type: 'select',
      options: [
        { label: 'Khoa Tai', value: 'khoatai' },
        { label: 'Khoa Mũi', value: 'khoamui' },
        { label: 'Khoa Họng', value: 'khoahong' },
        { label: 'Khoa Cấp Cứu', value: 'khoacapcuu' },
        { label: 'Khoa Gây Mê Hồi Sức', value: 'khoagaymehoisuc' },
        { label: 'Khoa Dược', value: 'khoaduoc' },
      ],
    },
    {
      name: 'bacsi',
      label: 'Bác sĩ phụ trách',
      type: 'relationship',
      relationTo: 'users',
    
    },
    {
      name: 'dieuduong',
      label: 'Điều dưỡng thực hiện',
      type: 'text',
    
    },
    {
      name: 'ngaynhapvien',
      label: 'Ngày nhập viện',
      type: 'date',
    
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMM yyy',
        },
      },
    },
    {
      name: 'ngayLap',
      label: 'Ngày lập y lệnh',
      type: 'date',
    
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMM yyy',
        },
      },
    },
    {
      name: 'chuandoan',
      label: 'Chuẩn đoán',
    
      type: 'textarea',
    },
    { 
      name: 'hinhthucdieutri',
      label: 'Hình thức điều trị',
    
      type: 'radio',
      options:[
        {label: 'Bệnh nhân nội trú',value: 'benhnhannoitru'},
        {label: 'Bệnh nhân ngoại trú',value: 'benhnhanngoaitru'},
      ],
    },
    // {
    //   name: 'hosobenhan',
    //   label: 'Hồ sơ bệnh án',
    
    //   type: 'relationship',
    //   relationTo: 'MedicalRecods',
    // },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Thuốc',
          fields: [
            {
              name: 'thuoc',
              label: 'Danh sách thuốc',
              type: 'array',
              fields: [
                {
                  name: 'thuocId',
                  label: 'Chọn thuốc',
                  type: 'relationship',
                  relationTo: 'medications',
                
                },
                { name: 'hamLuong', label: 'Hàm lượng', type: 'text' },
                { name: 'lieuDung', label: 'Liều dùng', type: 'text' },
                { name: 'cachDung', label: 'Cách dùng', type: 'text' },
                { name: 'thoiGian', label: 'Thời gian', type: 'text'},
                {
                  name: 'trangThai',
                  label: 'Trạng thái',
                  type: 'select',
                  options: [
                    { label: 'Đang thực hiện', value: 'dangthuchien' },
                    { label: 'Đã cấp phát', value: 'dacapphat' },
                  ],
                
                },
              ],
            },
          ],
        },
        {
          label: 'Xét Nghiệm - Chẩn Đoán Hình Ảnh',
          fields: [
            {
              name: 'xetNghiem',
              label: 'Danh sách xét nghiệm',
              type: 'array',
              fields: [
                { name: 'loaiXetNghiem', label: 'Loại xét nghiệm', type: 'text'},
                { name: 'moTa', label: 'Mô tả', type: 'text' },
                { name: 'ngayChiDinh', label: 'Ngày chỉ định', type: 'date'},
                {
                  name: 'hinhAnh',
                  label: 'Hình ảnh/X-ray/CT Scan',
                  type: 'upload',
                  relationTo: 'media', // Collection chứa file ảnh
                },
                {
                  name: 'fileDinhKem',
                  label: 'File kết quả xét nghiệm',
                  type: 'upload',
                  relationTo: 'media', // Cho phép tải lên file PDF, DOCX,...
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'ghichu',
      label: 'Ghi chú (nếu có)',
      type: 'textarea',
    },
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [valuemedicalorder],
  
  },
};
