import { CollectionConfig } from "payload";

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
      validate: (value: unknown) => {
        if (typeof value !== 'string') {
          return 'Giá trị phải là chuỗi số'
        }
        const regex = /^0\d{9}$/
        return regex.test(value) ? true : 'Số điện thoại không hợp lệ!'
      },
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
      name: 'medical_supplies',
      label: 'Danh sách vật tư cung cấp',
      type: 'text',
    //   type: 'relationship',
    //   relationTo: 'medical_supplies',
    //   hasMany: true,
    },
  ],
  timestamps: true,
};
