import { CollectionConfig } from 'payload'
import { lichkham } from '@/fields/sky/look'
import { checkvalue } from '@/hooks/checkvaluepatients'
import { APIError } from 'payload'
export const Patients: CollectionConfig = {
  slug: 'patients',
  labels: {
    singular: 'BỆNH NHÂN',
    plural: 'BỆNH NHÂN',
  },
  admin: {
    useAsTitle: 'ten',
  },
  fields: [
    {
      name: 'IDbenhnhan',
      label: 'ID Bệnh nhân',
      type: 'text',

      admin: {
        readOnly: true,
      },
    },
    {
      name: 'ten',
      label: 'Họ và tên',
      type: 'text',
      required: true,
    },
    {
      name: 'bhyt',
      label: 'Bảo hiểm y tế',
      type: 'radio',
      required: true,
      options: [
        { label: 'Có', value: 'co' },
        { label: 'Không', value: 'khong' },
      ],
    },
    {
      name: 'idbaohiem',
      label: 'Mã số BHYT',
      type: 'text',
      admin: {
        condition: (data) => data?.bhyt === 'co',
      },
      validate: (value, { siblingData }) => {
        if (siblingData?.bhyt === 'co') {
          if (!value || value.trim() === '') {
            return ''
          }
          const regex = /^[A-Z]{2}\d{1}\d{12}$/ // Kiểm tra định dạng mã BHYT
          if (!regex.test(value)) {
            return 'Số thẻ BHYT không hợp lệ!'
          }
        }
        return true
      },
    },
    {
      name: 'cccd',
      label: 'Căn cước công dân',
      type: 'text',
      required: true,
      validate: (value) => {
        const regex = /^(0\d{8}|\d{11}$)/ // Chấp nhận 9 hoặc 12 chữ số (hàm biểu thức chính quy)
        return regex.test(value) ? true : 'Số CCCD phải có 12 chữ số hoặc CMND phải có 9 chữ số!'
      },
    },
    {
      name: 'tuoi',
      label: 'Tuổi',
      type: 'number',
      required: true,
      min: 0,
      max: 120,
      validate: (value) => {
        if (!Number.isInteger(value)) {
          //giá trị nhập phải là số nguyên
          return 'Tuổi phải là số nguyên!'
        }
        return true
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
      name: 'nghenghiep',
      label: 'Nghề nghiệp',
      type: 'text',
    },
    {
      name: 'diachi',
      label: 'Địa chỉ',
      type: 'text',
    },
    {
      name: 'sdt',
      label: 'Số điện thoại',
      type: 'text',

      required: true,
      validate: (value) => {
        const regex = /^0\d{9}$/ //hàm biểu thức chính quy
        return regex.test(value) ? true : 'Số điện thoại không hợp lệ!'
      },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',

      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [lichkham],
          label: 'LỊCH KHÁM',
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return

        if (!data.IDbenhnhan) {
          data.IDbenhnhan = `ID-${Date.now()}-${Math.floor(Math.random() * 10000)}`
        }
        // Kiểm tra trường Bảo hiểm y tế và Mã số BHYT
        if (data.bhyt === 'co' && (!data.idbaohiem || data.idbaohiem.trim() === '')) {
          throw new APIError('Hãy nhập đủ thông tin mã số BHYT!', 400)
        }
      },
    ],
    beforeChange: [checkvalue],
  },
}
