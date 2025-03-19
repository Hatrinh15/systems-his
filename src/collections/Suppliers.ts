import { CollectionConfig } from "payload";
import { hookSupplier } from "@/hooks/HookSuppliers";

export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  labels: {
    singular: 'NHÀ CUNG CẤP',
    plural: 'NHÀ CUNG CẤP',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'email'],
  },
  fields: [
    {
      name :'idnhacungcap',
      label: 'Mã nhà cung cấp',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'name',
      label: 'Tên nhà cung cấp',
      type: 'text',
    },
    {
      name: 'address',
      label: 'Địa chỉ',
      type: 'text',
    },
    {
      name: 'phone',
      label: 'Số điện thoại',
      type: 'text',
      index: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      unique: true,
    },
    {
      name: 'businessLicense',
      label: 'Số giấy phép kinh doanh',
      type: 'text',
    },
    {
      name: 'businessLicenseFile',
      label: 'File giấy phép kinh doanh',
      type: 'upload',
      relationTo: 'media',
      required: false, 
    },
    {
      name: 'medications',
      label: 'Danh sách thuốc cung cấp',
      type: 'relationship',
      relationTo: 'medications',
      hasMany: true,
    },
    {
      name: 'medicalsupplies',
      label: 'Danh sách vật tư cung cấp',
      type: 'relationship',
      relationTo: 'medicalSupplies',
      hasMany: true,
    },
  ],
  timestamps: true,
  hooks: {
      beforeValidate: [hookSupplier], // Áp dụng hook kiểm tra dữ liệu trước khi validate
    },
};
