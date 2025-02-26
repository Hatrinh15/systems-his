import { CollectionConfig } from 'payload'
import { lichkham } from '@/fields/sky/look'
import { checkvalue } from '@/hooks/checkvaluepatients'
import { v4 as uuidv4 } from 'uuid'
export const Patients: CollectionConfig = {
  slug: 'patients',
  labels: {
    singular: 'BỆNH NHÂN',
    plural: 'BỆNH NHÂN',
  },
  admin: {
    useAsTitle: 'ten',
    group: 'Quản lý nội dung',
  },
  fields: [
    {
      name: 'IDbenhnhan',
      label: 'ID Bệnh nhân',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'ten',
      label: 'Họ và tên',
      type: 'text',
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
      index: true,
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
      index: true,
      validate: (value) => {
        const regex = /^(\d{9}|\d{12})$/ // Chấp nhận 9 hoặc 12 chữ số
        return regex.test(value) ? true : 'Số CCCD phải có 12 chữ số hoặc CMND phải có 9 chữ số!'
      },
    },
    {
      name: 'ngaysinh',
      label: 'Ngày sinh',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMM yyy',
        },
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
      index: true,
      validate: (value) => {
        const regex = /^(0[2-9])[0-9]{8}$/ // Chỉ cho phép các đầu số từ 02 đến 09
        return regex.test(value) ? true : 'Số điện thoại không hợp lệ!'
      },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [lichkham],
          label: 'Lịch Khám',
        },
        {
          fields: [
            {
              name: 'hosobenhan',
              label: '',
              type: 'join',
              collection: 'MedicalRecods',
              on: 'thongtinbenhnhan',
            },
          ],
          label: 'Hồ Sơ Bệnh Án',
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return

        if (!data.IDbenhnhan) {
          data.IDbenhnhan = `BN-${uuidv4()}`
        }
      },
    ],
    beforeChange: [checkvalue],
  },
}
