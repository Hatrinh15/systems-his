import type { CollectionConfig } from 'payload';
import { authenticated } from '@/access/authenticated';

export const Medicalsupplies: CollectionConfig = {
  slug: 'medicalsupplies',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  labels: {
    singular: 'VẬT TƯ Y TẾ',
    plural: 'VẬT TƯ Y TẾ',
  },
  admin: {
    defaultColumns: ['tenVatTu', 'loaiVatTu', 'soLuongTon', 'trangThai'],
    useAsTitle: 'tenVatTu',
  },
  fields: [
    {
      name: 'tenVatTu',
      label: 'Tên vật tư',
      type: 'text',
      required: true,
    },
    {
      name: 'loaiVatTu',
      label: 'Loại vật tư',
      type: 'select',
      required: true,
      options: [
        { label: 'Tiêu hao', value: 'tieuhao' },
        { label: 'Tái sử dụng', value: 'taisudung' },
        { label: 'Dùng một lần', value: 'dungmotlan' },
        { label: 'Vật tư cấp cứu', value: 'vattucapcuu' },
        { label: 'Vật tư phẫu thuật', value: 'vattuphautuat' },
      ],
    },
    {
      name: 'donViTinh',
      label: 'Đơn vị tính',
      type: 'select',
      options: [
        { label: 'Hộp', value: 'hop' },
        { label: 'Cái', value: 'cai' },
        { label: 'Gói', value: 'goi' },
        { label: 'Lọ', value: 'lo' },
        { label: 'Bịch', value: 'bich' },
        { label: 'Thùng', value: 'thung' },
      ],
    },
    {
      name: 'nhaCungCap',
      label: 'Nhà cung cấp',
      type: 'relationship',
      relationTo: 'suppliers',
    },
    {
      name: 'soLuongTon',
      label: 'Số lượng tồn kho',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'ngayNhapKho',
      label: 'Ngày nhập kho',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
    {
      name: 'hanSuDung',
      label: 'Hạn sử dụng',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
    {
      name: 'giaNhap',
      label: 'Giá nhập',
      type: 'number',
    },
    {
      name: 'trangThai',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { label: 'Còn hàng', value: 'conhang' },
        { label: 'Sắp hết', value: 'saphet' },
        { label: 'Hết hàng', value: 'hethang' },
        { label: 'Hết hạn sử dụng', value: 'hethansudung' },
      ],
      required: true,
    },
  ],
  hooks: {
    beforeChange: [async ({ data }) => {
      // Kiểm tra ngày hết hạn
      if (data.hanSuDung && new Date(data.hanSuDung) < new Date()) {
        data.trangThai = 'hethansudung'; 
      } 
      // Cập nhật trạng thái tự động dựa trên số lượng tồn kho
      else if (data.soLuongTon === 0) {
        data.trangThai = 'hethang'; // Cập nhật trạng thái nếu số lượng tồn kho là 0
      } else if (data.soLuongTon > 0 && data.trangThai === 'hethang') {
        data.trangThai = 'conhang'; // Nếu có hàng, cập nhật lại trạng thái
      }
      // Cập nhật trạng thái "Sắp hết" khi số lượng tồn kho dưới 10
      if (data.soLuongTon > 0 && data.soLuongTon < 10 && data.trangThai !== 'saphet') {
        data.trangThai = 'saphet';
      }
      return data;
    }],
  },
  timestamps: true,
};
