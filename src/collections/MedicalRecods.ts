import { Hoso } from '@/fields/resume/ho_so'
import { CollectionConfig } from 'payload'
import {
  valueho_so,
  valuemedicalrecord,
  preventDuplicateMedicalRecord,
  namePatient,
  generateMedicalRecordID,
  removePatientFromRoom,
  validatePatientRoom,
  validateSoHoSoNoiSoi,
  validateSoHoSo,
  autoDepartment
} from '@/hooks/Hookmedicalrecord'
import { isAdmin, isBacSiYTaTruongKhoa } from '@/hooks/AccessAdmin'
const MedicalRecods: CollectionConfig = {
  slug: 'MedicalRecods',
  access: {
      create: (args) => isAdmin(args) || isBacSiYTaTruongKhoa(args),
      delete:  (args) => isAdmin(args) ,
      update:  (args) => isAdmin(args) || isBacSiYTaTruongKhoa(args),
      read:  (args) => isAdmin(args) || isBacSiYTaTruongKhoa(args),
    },
  labels: {
    singular: 'Hồ Sơ Bệnh Án',
    plural: 'Hồ Sơ Bệnh Án',
  },
  admin: { group: 'Bệnh Nhân & Điều Trị', useAsTitle: 'tenBenhNhan' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hồ Sơ Bệnh Án ',
          fields: [
            {
              name: 'tenBenhNhan',
              label: 'Tên bệnh nhân',
              type: 'text',
              admin: { readOnly: true, hidden: true }, // Chỉ đọc, không cho phép chỉnh sửa
            },
            {
              name: 'thongtinbenhnhan',
              label: 'Thông tin bệnh nhân',
              type: 'relationship',
              relationTo: 'patients',
              hasMany: false,
              admin: {
                allowCreate: false, // Không cho phép tạo mới bệnh nhân từ đây
                condition: (data) => {
                  return !data?.id // Nếu đang tạo mới thì hiển thị, nếu cập nhật thì ẩn
                },
              },
              filterOptions: async ({ req }) => {
                const existingRecords = await req.payload.find({
                  collection: 'MedicalRecods',
                  where: {},
                })
                // Lấy danh sách bệnh nhân đã có hồ sơ bệnh án
                const usedPatientIDs = new Set(
                  existingRecords.docs.map((record) => record.thongtinbenhnhan),
                )
                return {
                  id: {
                    not_in: Array.from(usedPatientIDs), // Chỉ lấy bệnh nhân chưa có hồ sơ bệnh án
                  },
                }
              },
            },
            {
              name: 'hoso',
              label: 'Hồ sơ',
              type: 'array',
              fields: [
                {
                  name: 'sohoso',
                  label: 'Số hồ sơ bệnh án',
                  type: 'text',
                  admin: {
                    readOnly: true,
                  },
                },
                {
                  name: 'khoa',
                  label: 'Khoa',
                  type: 'relationship',
                  relationTo: 'departments',
                  admin: { allowCreate: false,readOnly: true },
                },
                {
                  name: 'bacsi',
                  label: 'Bác sĩ phụ trách',
                  type: 'relationship',
                  relationTo: 'users',
                  admin: { allowCreate: false },
                  filterOptions: async ({ req, siblingData }) => {
                    try {                    
                     const user = req.user;
                      // Kiểm tra nếu siblingData không tồn tại hoặc không có khoa thì trả về danh sách rỗng
                      if (
                        !siblingData ||
                        typeof siblingData !== 'object' ||
                        !('khoa' in siblingData)
                      ) {
                        return { id: { in: [] } }
                      }

                      const find = await req.payload.find({
                        collection: 'departments',
                        where: {
                          tenkhoa: {
                            equals: user?.khoa,
                          },
                        },
                      });
                    
                      const khoaID= find.docs[0]?.id;

                      if (!khoaID) {
                        return { id: { in: [] } }
                      }

                      
                      // Truy vấn thông tin khoa từ collection `departments`
                      const department = await req.payload.findByID({
                        collection: 'departments',
                        id: khoaID,
                      })

                      // Nếu không tìm thấy khoa hoặc không có nhân sự, trả về danh sách rỗng
                      if (!department || (!department.truongkhoa && !department.doctors)) {
                        return { id: { in: [] } }
                      }

                      // Đảm bảo `truongkhoa` và `doctors` luôn là mảng trước khi map
                      const staffList = [
                        ...(Array.isArray(department.truongkhoa) ? department.truongkhoa : []),
                        ...(Array.isArray(department.doctors) ? department.doctors : []),
                      ]

                      return {
                        id: {
                          in: staffList
                            .filter((staff) => staff && typeof staff === 'object' && 'id' in staff) // Kiểm tra kỹ
                            .map((staff) => (staff as { id: string }).id), // Ép kiểu để tránh lỗi TypeScript
                        },
                      }
                    } catch (error) {
                      console.error('Lỗi khi lọc nhân sự theo khoa:', error)
                      return { id: { in: [] } }
                    }
                  },
                },
                {
                  name: 'ngaynhapvien',
                  label: 'Ngày nhập viện',
                  type: 'date',

                  admin: {
                    date: {
                      pickerAppearance: 'dayOnly',
                      displayFormat: 'dd-MM-yyyy', // Đảm bảo format đúng
                    },
                  },
                },
                {
                  name: 'sophong',
                  label: 'Tên phòng',
                  type: 'text',
                },
                { name: 'chuandoan', label: 'Chuẩn đoán', type: 'textarea' },
                {
                  type: 'tabs',
                  tabs: [
                    {
                      label: 'Tóm tắt bệnh lý',
                      fields: [
                        { name: 'lydo', label: 'Lý do vào viện', type: 'textarea' },
                        {
                          name: 'tomtat',
                          label: 'Tóm tắt quá trình bệnh lý (các triệu chứng bệnh, diễn biến bệnh)',
                          type: 'textarea',
                        },
                        { name: 'tiensu', label: 'Tiền sử bệnh án', type: 'textarea' },
                      ],
                    },
                    {
                      label: 'Thuốc điều trị',
                      fields: [
                        {
                          name: 'thuoc',
                          label: 'Thuốc',
                          type: 'array',
                          fields: [
                            {
                              type: 'row',
                              fields: [
                                {
                                  name: 'tenthuoc',
                                  label: 'Tên thuốc',
                                  type: 'relationship',
                                  relationTo: 'medications',
                                  admin: {
                                    allowCreate: false,
                                  },
                                },
                                {
                                  name: 'quantity',
                                  label: 'Số lượng sử dụng',
                                  type: 'number',
                                  min: 1,
                                },
                                {
                                  name: 'donvi',
                                  label: 'Đơn vị',
                                  type: 'select',
                                  options: [
                                    { label: 'Hộp', value: 'hop' },
                                    { label: 'Viên', value: 'vien' },
                                    { label: 'Lọ', value: 'lo' },
                                    { label: 'Chai', value: 'chai' },
                                    { label: 'Ống', value: 'ong' },
                                  ],
                                  defaultValue: 'hop',
                                },
                                { name: 'unitprice', label: 'Đơn giá(VNĐ)', type: 'text' },
                                {
                                  name: 'totalprice',
                                  label: 'Tổng giá trị',
                                  type: 'text',
                                  admin: { readOnly: true },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          name: 'vattutieuhao',
                          label: 'Vật tư tiêu hao',
                          type: 'array',
                          fields: [
                            {
                              type: 'row',
                              fields: [
                                {
                                  name: 'supply',
                                  label: 'Tên vật tư y tế',
                                  type: 'relationship',
                                  relationTo: 'medicalSupplies',
                                  admin: {
                                    allowCreate: false,
                                  },
                                },
                                {
                                  name: 'quantity',
                                  label: 'Số lượng sử dụng',
                                  type: 'number',
                                  min: 1,
                                },
                                {
                                  name: 'donvi',
                                  label: 'Đơn vị',
                                  type: 'select',
                                  options: [
                                    { label: 'Hộp', value: 'hop' },
                                    { label: 'Chai', value: 'chai' },
                                    { label: 'Gói', value: 'goi' },
                                    { label: 'Cuộn', value: 'cuon' },
                                    { label: 'Miếng', value: 'mieng' },
                                  ],
                                  defaultValue: 'hop',
                                },
                                { name: 'unitprice', label: 'Đơn giá(VNĐ)', type: 'text' },
                                {
                                  name: 'totalprice',
                                  label: 'Tổng giá trị',
                                  type: 'text',
                                  admin: { readOnly: true },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      label: 'Diễn biến bệnh',
                      fields: [
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
                                  displayFormat: 'dd-MM-yyy',
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
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  name: 'ppdt',
                  label: '',
                  type: 'group',
                  fields: [
                    {
                      name: 'phuongphap',
                      label: 'Phương pháp điều trị',
                      type: 'radio',
                      options: [
                        { label: 'Điều trị can thiệp', value: 'dieutricanthiep' },
                        { label: 'Điều trị hỗ trợ', value: 'dieutrihotro' },
                      ],
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
                    condition: (data, siblingData) => {
                      // Kiểm tra nếu 'hoso' tồn tại và có ít nhất một phần tử
                      if (siblingData.tinhtrang === 'yes') {
                        return true
                      }
                      return false
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
                          displayFormat: 'dd-MM-yyy',
                        },
                      },
                    },
                    {
                      name: 'xuatvien',
                      label: 'Tình trạng',
                      type: 'select',
                      options: [
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
                      type: 'textarea',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          fields: [Hoso],
          label: 'Kết Quả Nội Soi',
        },
        {
          fields: [
            {
              name: 'ylenh',
              label: '',
              type: 'join',
              collection: 'medicalorders',
              on: 'hosobenhan',
            },
          ],
          label: 'Y Lệnh',
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [namePatient, preventDuplicateMedicalRecord],
    beforeValidate: [
      valueho_so,
      valuemedicalrecord,
      generateMedicalRecordID,
      validatePatientRoom,
      validateSoHoSoNoiSoi,
      autoDepartment,
      validateSoHoSo
    ],
    afterChange: [removePatientFromRoom],
  },
}

export default MedicalRecods
