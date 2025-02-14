import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'
import { checkvalueuser } from '@/hooks/checkvalueusers'
// import { lichlamviec } from '@/fields/sky/look'

export const Khoahscc: CollectionConfig = {
  slug: 'khoahscc',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  labels: {
    singular: 'KHOA HỒI SỨC-CẤP CỨU',
    plural: 'KHOA HỒI SỨC-CẤP CỨU',
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'IDnhansu',
      label: 'ID Nhân sự',
      type: 'text',
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'THÔNG TIN CƠ BẢN',
          fields: [
            {
              name: 'profilePicture',
              type: 'upload',
              label: 'Ảnh hồ sơ',
              required: true,
              relationTo: 'media',
            },
            {
              name: 'name',
              label: 'Họ và tên',
              type: 'text',
              required: true,
            },
            {
              name: 'cccd',
              label: 'Căn cước công dân',
              type: 'text',
              required: true,
              unique: true,
              validate: (value) => {
                const regex = /^(0\d{8}|\d{11}$)/ // Chấp nhận 9 hoặc 12 chữ số (hàm biểu thức chính quy)
                return regex.test(value)
                  ? true
                  : 'Số CCCD phải có 12 chữ số hoặc CMND phải có 9 chữ số!'
              },
            },
            {
              name: 'gioitinh',
              label: 'Giới tính',
              type: 'select',
              options: [
                {
                  label: 'Nam',
                  value: 'nam',
                },
                {
                  label: 'Nữ',
                  value: 'nu',
                },
                {
                  label: 'Khác',
                  value: 'khac',
                },
              ],
            },
            {
              name: 'ngaysinh',
              label: 'Ngày sinh',
              type: 'date',
              required: true,
            },
            {
              name: 'sdt',
              label: 'Số điện thoại',
              type: 'text',
              unique: true,
              required: true,
              validate: (value) => {
                const regex = /^0\d{9}$/ //hàm biểu thức chính quy
                return regex.test(value) ? true : 'Số điện thoại không hợp lệ!'
              },
            },
            {
              name: 'diachi',
              label: 'Địa chỉ',
              type: 'text',
              required: true,
            },
            {
              name: 'notes',
              type: 'richText',
              label: 'Ghi chú (nếu có)',
            },
          ],
        },
        {
          label: 'THÔNG TIN CÔNG VIỆC',
          fields: [
            {
              name: 'chucvu',
              label: 'Chức vụ',
              type: 'select',
              required: true,
              options: [
                {
                  label: 'Bác sĩ',
                  value: 'bacsi',
                },
                {
                  label: 'Y tá/Điều dưỡng',
                  value: 'yta',
                },
              ],
            },
            {
              name: 'ngayvaolam',
              label: 'Ngày vào làm',
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
              name: 'tinhtranglamviec',
              label: 'Tình trạng làm việc',
              type: 'radio',
              required: true,
              options: [
                {
                  label: 'Đang làm',
                  value: 'danglam',
                },
                {
                  label: 'Nghỉ việc',
                  value: 'nghiviec',
                },
              ],
            },
          ],
        },
        {
          label: 'THÔNG TIN CHUYÊN MÔN',
          fields: [
            {
              name: 'bangcap',
              label: 'Bằng cấp chuyên môn',
              type: 'richText',
              required: true,
            },
            {
              name: 'kinhnghiem',
              label: 'Kinh nghiệm làm việc (năm)',
              type: 'number',
              required: true,
              min: 0,
              max: 100,
            },
            {
              name: 'chungchi',
              label: 'Chứng chỉ hành nghề',
              required: true,
              type: 'array',
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
        // {
        //   label: 'LỊCH LÀM VIỆC',
        //   fields: [lichlamviec],
        // },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return

        if (!data.IDnhansu) {
          data.IDnhansu = `ID-${Date.now()}-${Math.floor(Math.random() * 10000)}`
        }
      },
    ],
    beforeChange: [checkvalueuser],
  },
}
