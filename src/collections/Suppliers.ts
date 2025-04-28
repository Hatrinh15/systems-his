import { CollectionConfig } from 'payload'
import { hookSupplier ,canReadSuppliers} from '@/hooks/HookSuppliers'
import { isAdmin ,isBacSiYTaTruongKhoa} from '@/hooks/AccessAdmin'
export const Suppliers: CollectionConfig = {
  slug: 'suppliers',
  access: {
        create: (args) => isAdmin(args),
        delete:  (args) => isAdmin(args) ,
        update:  (args) => isAdmin(args) ,
        read:  (args) => canReadSuppliers(args),
      },
  labels: {
    singular: 'Nhà Cung Cấp',
    plural: 'Nhà Cung Cấp',
  },
  admin: {
    useAsTitle: 'nhacungcap',
    defaultColumns: ['nhacungcap', 'phone', 'email'],
    group: 'Dược & Vật Tư Y Tế',
  },
  fields: [
    {
      name: 'nhacungcap',
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
      type:'join',
      collection:'medications',
      on:'supplier',
    },
    {
      name: 'medicalsupplies',
      label: 'Danh sách vật tư cung cấp',
      type:'join',
      collection:'medicalSupplies',
      on:'supplier',
    },
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [hookSupplier], // Áp dụng hook kiểm tra dữ liệu trước khi validate
  },
}
