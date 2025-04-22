import { APIError, CollectionConfig } from "payload";
import { validateAppointment } from "@/hooks/hookappointment";
import { isAdmin, isBacSiYTaTruongKhoa } from "@/hooks/AccessAdmin";

export const Appointments: CollectionConfig = {
slug: 'appointments',
access: {
  create: (args) => isAdmin(args) || isBacSiYTaTruongKhoa(args),
  delete:  (args) => isAdmin(args) || isBacSiYTaTruongKhoa(args),
  update:  (args) => isAdmin(args) || isBacSiYTaTruongKhoa(args),
  read: (args) => isAdmin(args) || isBacSiYTaTruongKhoa(args),
},
labels: {
    singular: 'Đặt Lịch Khám',
    plural: 'Đặt Lịch Khám',
},
admin: {  group: 'Bệnh Nhân & Điều Trị' },
fields:[
    {
      name: 'patients',
      label: 'Bệnh nhân',
      type: 'relationship',
      relationTo: 'patients',  // Tham chiếu tới collection 'patients'
    },
      {
        name: 'bacsi',
        label: 'Chọn bác sĩ',
        type: 'relationship',
        relationTo: 'users',
        admin: {
          allowCreate: false,
        },
        filterOptions: ({ user }) => {
          return {
            chucvu: { equals: 'bacsi' } ,
            tinhtranglamviec:{not_equals:'nghiviec'}
          };
      },
    },
      {
        name: 'ngaykham',
        label: 'Ngày khám',
        type: 'date',
        admin: {
          date: {
            pickerAppearance: 'dayOnly',
            displayFormat: 'dd-MM-yyy',
          },
        },
      },
      {
        name: 'giokham',
        label: 'Giờ khám',
        type: 'select',
        options: [
          { label: '08:00 - 09:00', value: '08:00' },
          { label: '09:00 - 10:00', value: '09:00' },
          { label: '10:00 - 11:00', value: '10:00' },
          { label: '13:00 - 14:00', value: '13:00' },
          { label: '14:00 - 15:00', value: '14:00' },
          { label: '15:00 - 16:00', value: '15:00' },
        ],

      },
      {
        name: 'trieuchung',
        label: 'Triệu chứng hiện tại',
        type: 'select',
        hasMany: true,
        options: [
          { label: 'Đau họng', value: 'dau_hong' },
          { label: 'Nghẹt mũi', value: 'nghet_mui' },
          { label: 'Chảy máu cam', value: 'chay_mau_cam' },
          { label: 'Ù tai', value: 'u_tai' },
          { label: 'Khác', value: 'khac' },
        ],

      },
      {
        name: 'yeucaudacbiet',
        label: 'Yêu cầu đặc biệt',
        type: 'textarea',
      },
      {
        name: 'xacnhanthongtin',
        label: 'Tôi xác nhận các thông tin trên là chính xác.',
        type: 'checkbox',

      },
    ],
    hooks: {
      beforeChange: [validateAppointment],
  },
}