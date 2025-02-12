import { APIError, CollectionConfig } from "payload";
import { Patients } from "./Patients";
import { Label } from "@radix-ui/react-select";
import { Info } from "lucide-react";
import { log } from "console";

export const Appointments: CollectionConfig = {
slug: 'appointments',
labels: {
    singular: 'ĐẶT LỊCH KHÁM',
    plural: 'ĐẶT LỊCH KHÁM',
},
fields:[
    {
      name: 'patients',
      label: 'BỆNH NHÂN',
      type: 'relationship',
      relationTo: 'patients',  // Tham chiếu tới collection 'patients'
      required: true,
    },
      // {
      //   name: 'bacsi',
      //   label: 'Chọn bác sĩ',
      //   type: 'relationship',
      //   relationTo: 'users',
      //   filterOptions: ({ user }) => {
      //     return {
      //       chucvu: { equals: 'bacsi' } ,
      //       tinhtranglamviec:{not_equals:'nghiviec'}
      //     };
      // },},
      {
        name: 'ngaykham',
        label: 'Ngày khám',
        type: 'date',
        admin: {
          date: {
            pickerAppearance: 'dayOnly',
            displayFormat: 'd MMM yyy',
          },
        },
    
        required: true,
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
        required: true,
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
        required: true,
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
        required: true,
      },
    ],
    hooks: {
      beforeChange: [
        async ({ data, operation, req }) => {
          if (operation === 'create' || operation === 'update') {
            const {  ngaykham, giokham } = data;
    
            // Kiểm tra ngày khám không được ở quá khứ
            const today = new Date();
            today.setHours(0, 0, 0, 0);  // Đặt giờ về 00:00 để chỉ so sánh ngày
    
            const appointmentDate = new Date(ngaykham);
            if (appointmentDate < today) {
              throw new APIError('Ngày khám không được ở quá khứ! Vui lòng chọn ngày hiện tại hoặc tương lai.', 400);
            }
    
            // Kiểm tra trùng lịch hẹn
            const existingAppointments = await req.payload.find({
              collection: 'appointments',  
              where: {
                ngaykham: { equals: ngaykham },
                giokham: { equals: giokham },
              },
            });
    
            if (existingAppointments.totalDocs > 0) {
            console.log('---------------');
            
              throw new APIError('Lịch hẹn đã bị trùng! Vui lòng chọn thời gian khác.',400);
            }
            const duplicatePatientAppointments = await req.payload.find({
              collection: 'appointments',
              where: {
                'patients.id': { equals: data.patients },         
                ngaykham: { equals: ngaykham },
              },
            });
    
            console.log('Số lịch trùng của bệnh nhân:', duplicatePatientAppointments.totalDocs);
    console.log('check',data.patients) //kiểm tra dữ liệu của patient 

    // khai báo console.log kiểm tra kiểu dữ liệu của biến 
    
            if (duplicatePatientAppointments.totalDocs > 0) {
              console.log('Lỗi: Bệnh nhân đặt 2 lịch trong cùng 1 ngày');
              throw new APIError('Bạn đã đặt lịch hẹn cho ngày này! Vui lòng chọn ngày khác.',400);
            }
          }
        },
      ],
  },
}