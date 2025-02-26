import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'
import { checkvalueuser } from '@/hooks/checkvalueusers'
import { v4 as uuidv4 } from 'uuid';
export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  labels: {
    singular: 'NHÂN SỰ',
    plural: 'NHÂN SỰ',
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
    group: 'Quản lý nội dung',
  },
  auth: true,
  fields: [
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
          label: 'THÔNG TIN CƠ BẢN',
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
              index:true,
              unique: true,
              validate: (value) => {
                const regex = /^(\d{9}|\d{12})$/; // Chấp nhận 9 hoặc 12 chữ số (hàm biểu thức chính quy)
                return regex.test(value) ? true: 'Số CCCD phải có 12 chữ số hoặc CMND phải có 9 chữ số!'
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
                  (age === 18 && monthDiff < 0)|| 
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
                const regex = /^(0[2-9])[0-9]{8}$/;  //hàm biểu thức chính quy
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
          label: 'THÔNG TIN CÔNG VIỆC',
          fields: [
            {
              name: 'chucvu',
              label: 'Chức vụ',
              type: 'select',
              options: [
                { label: 'Bác sĩ', value: 'bacsi' },
                { label: 'Y tá/Điều dưỡng', value: 'yta' },
                { label: 'Kỹ thuật viên', value: 'kythuatvien' },
                { label: 'Lễ tân', value: 'letan' },
                { label: 'Trưởng phòng', value: 'truongphong' },
                { label: 'Trưởng khoa', value: 'truongkhoa' },
                { label: 'Khác', value: 'khac' },
              ],
            },{
              name: 'vitri',
              label: 'Vị trí',
              type: 'richText',
              admin:{
                condition: (data)=> data?.chucvu==='khac',
              }
            },
            {
              name: 'khoa',
              label: ' Khoa',
              type: 'text',
              admin: { readOnly: true,
                condition: (data) => data?.chucvu === 'bacsi' || data?.chucvu === 'yta'|| data?.chucvu==='truongkhoa', // Chỉ hiển thị khi là bác sĩ hoặc y tá
              },
            },
            {
              name: 'phong',
              label: 'Phòng',
              type:'text',
              admin: { readOnly: false,
                condition: (data) => data?.chucvu === 'letan' || data?.chucvu === 'kythuatvien'|| data?.chucvu==='truongphong',
               },
            },
            {
              name: 'ngayvaolam',
              label: 'Ngày vào làm',
              type: 'date',
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
          label: 'THÔNG TIN CHUYÊN MÔN',
          fields: [
            {
              name: 'bangcap',
              label: 'Bằng cấp chuyên môn',
              type: 'textarea',
            },
            {
              name: 'kinhnghiem',
              label: 'Kinh nghiệm làm việc (năm)',
              type: 'number',
              min: 0,
              max: 100,
            },
            {
              name: 'chungchi',
              label: 'Chứng chỉ hành nghề',
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
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return

        if (!data.IDnhansu) {
          data.IDnhansu = `NS-${uuidv4()}`;
        }
      },
    ],
    beforeChange: [checkvalueuser],
  },
}
