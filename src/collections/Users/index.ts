import type { CollectionConfig } from 'payload'
import {
  checkvalueuser,
  hookBoPhanHienThi,
  removeUserFromDepartments,
  canReadUsers,
  canUpdateUser,
  canReadUsersField,
  removeUserFromClass,
  BeforeLoginUser,
} from '@/hooks/checkvalueusers'
import { updateBoPhanDisplay } from '@/hooks/checkvalueusers'
import { v4 as uuidv4 } from 'uuid'
import { isAdmin } from '@/hooks/AccessAdmin'
export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: canReadUsers,
    update: canUpdateUser,
  },
  labels: {
    singular: 'Nhân Sự',
    plural: 'Nhân Sự',
  },
  admin: {
    defaultColumns: ['name', 'boPhanDisplay', 'email'],
    useAsTitle: 'name',

    group: 'Khoa & Nhân sự',
  },
  auth: true,
  fields: [
    {
      name: 'taikhoan',
      label: 'Tài khoản',
      type: 'select',
      options: [
        { label: 'Nhân viên', value: 'user' },
        { label: 'Quản trị viên', value: 'admin' },
      ],
      defaultValue: 'user',
      access: {
        read: ({ req }) => req.user?.taikhoan === 'admin',
        update: ({ req }) => req.user?.taikhoan === 'admin',
      },
    },

    {
      name: 'IDnhansu',
      label: 'ID Nhân sự',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Thông Tin Cá Nhân',
          fields: [
            {
              name: 'profilePicture',
              type: 'upload',
              label: 'Ảnh hồ sơ',
              relationTo: 'media',
            },
            {
              name: 'name',
              label: 'Họ và tên',
              type: 'text',
            },
            {
              name: 'cccd',
              label: 'Căn cước công dân',
              type: 'text',
              index: true,
              unique: true,
              validate: (value) => {
                const regex = /^(\d{9}|\d{12})$/ // Chấp nhận 9 hoặc 12 chữ số (hàm biểu thức chính quy)
                return regex.test(value)
                  ? true
                  : 'Số CCCD phải có 12 chữ số hoặc CMND phải có 9 chữ số!'
              },
              access: {
                read: async (args) => {
                  if (typeof canReadUsersField === 'function') {
                    const result = await canReadUsersField(args)
                    return typeof result === 'boolean' ? result : false
                  }
                  return !!canReadUsersField
                },
              },
            },
            {
              name: 'gioitinh',
              label: 'Giới tính',
              type: 'select',
              options: [
                { label: 'Nam', value: 'nam' },
                { label: 'Nữ', value: 'nu' },
                { label: 'Khác', value: 'khac' },
              ],
            },
            {
              name: 'ngaysinh',
              label: 'Ngày sinh',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'dd-MM-yyy',
                },
              },
              validate: (value: unknown) => {
                if (!value) {
                  return 'Không được để trống'
                }

                if (typeof value !== 'string') {
                  return 'Giá trị phải là chuỗi ngày tháng'
                }
                const birthDate = new Date(value)
                const today = new Date()
                const age = today.getFullYear() - birthDate.getFullYear()
                const monthDiff = today.getMonth() - birthDate.getMonth()
                const dayDiff = today.getDate() - birthDate.getDate()
                if (
                  age < 18 ||
                  (age === 18 && monthDiff < 0) ||
                  (age === 18 && monthDiff === 0 && dayDiff < 0)
                ) {
                  return 'Bạn phải đủ 18 tuổi'
                }
                return true
              },
            },
            {
              name: 'sdt',
              label: 'Số điện thoại',
              type: 'text',
              index: true,
              unique: true,
              validate: (value) => {
                const regex = /^(0[2-9])[0-9]{8}$/ //hàm biểu thức chính quy
                return regex.test(value) ? true : 'Số điện thoại không hợp lệ!'
              },
            },
            {
              name: 'diachi',
              label: 'Địa chỉ',
              type: 'text',
            },
            {
              name: 'notes',
              type: 'textarea',
              label: 'Ghi chú (nếu có)',
            },
          ],
        },
        {
          label: 'Thông Tin Công Việc',
          fields: [
            {
              name: 'chucvu',
              label: 'Chức vụ',
              type: 'select',
              options: [
                { label: 'Trưởng phòng', value: 'truongphong' },
                { label: 'Trưởng khoa', value: 'truongkhoa' },
                { label: 'Bác sĩ', value: 'bacsi' },
                { label: 'Y tá/Điều dưỡng', value: 'yta' },
                { label: 'Dược sĩ', value: 'duocsi' },
                { label: 'Kỹ thuật viên', value: 'kythuatvien' },
                { label: 'Kế toán', value: 'ketoan' },
                { label: 'Quản lý hệ thống', value: 'quanly' },
                { label: 'Nhân viên kho', value: 'nhanvienkho' },
                { label: 'Khác', value: 'khac' },
              ],
            },
            {
              name: 'vitri',
              label: 'Vị trí',
              type: 'textarea',
              admin: {
                condition: (data) => data?.chucvu === 'khac',
              },
            },
            {
              name: 'khoa',
              label: ' Khoa',
              type: 'select',
              options: [
                { label: 'Khoa Tai', value: 'tai' },
                { label: 'Khoa Mũi Xoang', value: 'mui' },
                { label: 'Khoa Họng-Thanh Quản', value: 'hong' },
                { label: 'Khoa Cấp Cứu', value: 'capcuu' },
                { label: 'Khoa Gây Mê Hồi Sức', value: 'gaymehoisuc' },
                { label: 'Khoa Chẩn Đoán Hình Ảnh', value: 'chandoanhinhanh' },
                { label: 'Khoa Xét Nghiệm', value: 'khoaxetnghiem' },
                { label: 'Khoa Dược', value: 'khoaduoc' },
                { label: 'Khoa khác', value: 'khoakhac' },
              ],
              admin: {
                readOnly: true,
                condition: (data) =>
                  data?.chucvu === 'bacsi' ||
                  data?.chucvu === 'yta' ||
                  data?.chucvu === 'truongkhoa' ||
                  data?.chucvu === 'duocsi', // Chỉ hiển thị khi là bác sĩ hoặc y tá
              },
            },
            {
              name: 'phong',
              label: 'Phòng',
              type: 'select',
              options: [
                { label: 'Phòng hành chính-quản trị', value: 'hanhchinhquantri' },
                { label: 'Phòng tài chính-kế toán', value: 'taichinhketoan' },
                { label: 'Phòng công nghệ thông tin ', value: 'anninh' },
              ],
              admin: {
                readOnly: true,
                condition: (data) =>
                  data?.chucvu === 'ketoan' ||
                  data?.chucvu === 'nhanvienkho' ||
                  data?.chucvu === 'kythuatvien' ||
                  data?.chucvu === 'truongphong',
              },
            },
            {
              name: 'boPhanDisplay',
              label: 'Bộ phận hiển thị',
              type: 'text',

              admin: {
                readOnly: true,
                hidden: true,
              },
            },

            {
              name: 'ngayvaolam',
              label: 'Ngày vào làm',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'dd-MM-yyy',
                },
              },
            },
            {
              name: 'tinhtranglamviec',
              label: 'Tình trạng làm việc',
              type: 'radio',
              options: [
                {
                  label: 'Đang làm',
                  value: 'danglam',
                },
                { label: 'Nghỉ việc', value: 'nghiviec' },
              ],
            },
          ],
        },
        {
          label: 'Thông Tin Chuyên Môn',
          fields: [
            {
              name: 'bangcap',
              label: 'Bằng cấp chuyên môn',
              type: 'textarea',
              access: {
                read: async (args) => {
                  if (typeof canReadUsersField === 'function') {
                    const result = await canReadUsersField(args)
                    return typeof result === 'boolean' ? result : false
                  }
                  return !!canReadUsersField
                },
              },
            },
            {
              name: 'kinhnghiem',
              label: 'Kinh nghiệm làm việc (năm)',
              type: 'number',
              min: 0,
              max: 100,
              access: {
                read: async (args) => {
                  if (typeof canReadUsersField === 'function') {
                    const result = await canReadUsersField(args)
                    return typeof result === 'boolean' ? result : false
                  }
                  return !!canReadUsersField
                },
              },
            },
            {
              name: 'chungchi',
              label: 'Chứng chỉ hành nghề',
              type: 'array',
              access: {
                read: async (args) => {
                  if (typeof canReadUsersField === 'function') {
                    const result = await canReadUsersField(args)
                    return typeof result === 'boolean' ? result : false
                  }
                  return !!canReadUsersField
                },
              },
              fields: [
                {
                  name: 'tencc',
                  label: 'Tên chứng chỉ',
                  type: 'text',
                },
                {
                  name: 'filecc',
                  label: 'File chứng chỉ',
                  type: 'upload',
                  relationTo: 'media',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return

        if (!data.IDnhansu) {
          data.IDnhansu = `NS-${uuidv4()}`
        }
      },
      updateBoPhanDisplay,
      hookBoPhanHienThi,
    ],
    beforeChange: [checkvalueuser],

    afterChange: [removeUserFromDepartments, removeUserFromClass],
    beforeLogin: [BeforeLoginUser],
  },
}
