import { Hoso } from '@/fields/resume/ho_so'
import { CollectionConfig } from 'payload'
import { APIError } from 'payload';
import { valueho_so,valuemedicalrecord,preventDuplicateMedicalRecord } from '@/hooks/Hookmedicalrecord';
import { Medicalorders } from './Users/Medicalorders';
import { lazy } from 'react';
import { Label } from '@radix-ui/react-select';
import { join } from 'path';


const MedicalRecods: CollectionConfig = {
  slug: 'MedicalRecods', 
  labels: {
    singular: 'HỒ SƠ BỆNH ÁN',
    plural: 'HỒ SƠ BỆNH ÁN',
  },
  admin: { group: 'Quản lý nội dung', useAsTitle: 'tenBenhNhan' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hồ sơ bệnh án ',
          fields: [
            {
              name: 'tenBenhNhan',
              label: 'Tên bệnh nhân',
              type: 'text',
              admin: { readOnly: true, hidden: true }, // Chỉ đọc, không cho phép chỉnh sửa
            },
            {
              name: 'thongtinbenhnhan',
              label: 'THÔNG TIN BỆNH NHÂN',
              type: 'relationship',
              relationTo: 'patients', // Tham chiếu tới collection 'patients'
              required: true,
              hasMany: false,
            },
            {
              name: 'hoso',
              label: 'Hồ sơ',
              type: 'array',
              fields: [

                { name: 'khoa', label: 'KHoa', type: 'relationship', relationTo: 'departments' },
                { name: 'bacsi', label: 'Bác sĩ phụ trách', type: 'text' },
                {
                  name: 'dieuduong',
                  label: 'Điều dưỡng thực hiện',
                  type: 'text', 

                },
                {
                  name: 'ngaynhapvien',
                  label: 'Ngày nhập viện',
                  type: 'date',

                  admin: {
                    date: {
                      pickerAppearance: 'dayOnly',
                      displayFormat: 'd MMM yyyy',  // Đảm bảo format đúng
                    },
                  },
                },
                {
                  name: 'sophong',
                  label: 'Số phòng',
                  type: 'text',
                },
                { name: 'chuandoan', label: 'Chuẩn đoán', type: 'textarea' },
                {
                  name: 'tomtat',
                  label: 'Tóm tắt quá trình điều trị',
                  type: 'group',
                  fields: [
                    { name: 'lydo', label: 'Lý do vào viện', type: 'textarea' },
                    {
                      name: 'tomtat',
                      label: 'Tóm tắt quá trình bệnh lý( các triệu chứng bệnh, diễn biến bệnh)',
                      type: 'text',
                    },
                    { name: 'tiensu', label: 'Tiền sử bệnh án', type: 'textarea' },

                    {
                      name: 'dienBienBenh',
                      label: 'Diễn biến bệnh',
                      type: 'array',
                      labels: {
                        singular: 'Ghi nhận diễn biến',
                        plural: 'Danh sách diễn biến',
                      },
                      fields: [
                        {
                          name: 'ngay',
                          label: 'Ngày',
                          type: 'date',
        
                          admin: {
                            date: {
                              pickerAppearance: 'dayOnly',
                              displayFormat: 'dd/MM/yyyy',
                            },
                          },
                        },
                        {
                          name: 'dienBien',
                          label: 'Diễn biến bệnh',
                          type: 'textarea',
        
                        },
                        {
                          name: 'ghiChu',
                          label: 'Ghi chú',
                          type: 'text',
                        },
                        {
                          name: 'noikhoa',
                          label: 'Nội khoa',
                          admin: {
                            condition: (data) => {
                              // Kiểm tra nếu 'hoso' tồn tại và có ít nhất một phần tử
                              if (!data?.hoso || data.hoso.length === 0) return false
                              // Lấy giá trị 'phauthuat' từ nhóm 'phuongphap'
                              const phauthuat = data.hoso[0]?.tomtat?.phuongphap?.phauthuat
                              return phauthuat === 'khong'
                            },
                          },
                          type: 'text',
                        },
                      ],
                    },
                    {
                      name: 'phuongphap',
                      label: 'Phương pháp điều trị',
    
                      type: 'radio',
                      options:[
                        {label: 'Điều trị can thiệp', value: 'dieutricanthiep' },
                       { label: 'Điều trị hỗ trợ', value: 'dieutrihotro' },
                      ]
                    },
                    {
                    name: 'text',
                    label: 'Mô tả chi tiết',
                    type: 'textarea',
                    },
                   
                  ],
                },
                {
                  name: 'tinhtrang',
                  label: 'Tình trạng',
                  type: 'radio',
                  options: [
                    { label: 'Đã xuất viện ', value: 'yes' },
                    { label: 'Nhập viện', value: 'no' },
                  ],
                },
                {
                  name: 'tinhtrangxuatvien',
                  label: 'Tình trạng xuất viện',
                  admin: {
                    condition: (data) => {
                      // Kiểm tra nếu 'hoso' tồn tại và có ít nhất một phần tử
                      if (!data?.hoso || data.hoso.length === 0) return false

                      // Lấy giá trị tinhtrang từ phần tử đầu tiên trong hoso
                      const tinhtrang = data.hoso[0]?.tinhtrang
                      return tinhtrang === 'yes'
                    },
                  },
                  type: 'group',
                  fields: [
                    {
                      name: 'ngayRaVien',
                      label: 'Ngày ra viện',
                      type: 'date',
    
                      admin: {
                        date: {
                          pickerAppearance: 'dayOnly',
                          displayFormat: 'dd/MM/yyyy',
                        },
                      },
                    },
                    {
                      name: 'xuatvien', 
                      label: 'Tình trạng',
                      type :'select',
                      options :[
                        { value: 'khoi', label: 'Khỏi' },
                        { value: 'do', label: 'Đỡ' },
                        { value: 'khongthaydoi', label: 'Không thay đổi' },
                        { value: 'nang', label: 'Nặng hơn' },
                        { value: 'tuvong', label: 'Tử vong' },
                        { value: 'tienluongnang', label: 'Tiên lượng nặng xin về' },
                        { value: 'chuaxacdinh', label: 'Chưa xác định được' },
                      ],
                    },
                    {
                      name: 'ghichu',
                      label: 'Ghi chú (nếu có)',
                      type: 'textarea'
                    }
                  ],
                },
              ],
            },
          ],
        },
        {
          fields: [...Hoso],
          label: 'Kết quả nội soi',
        },
        {
          fields: [
            {
            name: 'ylenh',
            label: '',
            type: 'join',
            collection: 'medicalorders',
            on: 'hosobenhan',
            }
          ],
          label: 'Y Lệnh',
        }
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (data.thongtinbenhnhan) {
          // Lấy thông tin bệnh nhân từ database
          const patient = await req.payload.findByID({
            collection: 'patients',
            id: data.thongtinbenhnhan,
          })

          if (patient) {
            data.tenBenhNhan = patient.ten // Cập nhật tên bệnh nhân
          }
        }
      },valuemedicalrecord,valueho_so,preventDuplicateMedicalRecord
    ]
  },
  }

export default MedicalRecods
