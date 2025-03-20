import { Hoso } from '@/fields/resume/ho_so'
import { CollectionConfig } from 'payload'
import {
  valueho_so,
  valuemedicalrecord,
  preventDuplicateMedicalRecord,
  namePatient,
} from '@/hooks/Hookmedicalrecord'

const MedicalRecods: CollectionConfig = {
  slug: 'MedicalRecods',
  labels: {
    singular: 'Hồ Sơ Bệnh Án',
    plural: 'Hồ Sơ Bệnh Án',
  },
  admin: { group: 'Bệnh Nhân Và Điều Trị', useAsTitle: 'tenBenhNhan' },
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
              relationTo: 'patients',
              required: true,
              hasMany: false,
              admin: {
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
                { name: 'khoa', label: 'KHoa', type: 'relationship', relationTo: 'departments' },
                {
                  name: 'bacsi',
                  label: 'Bác sĩ phụ trách',
                  type: 'relationship',
                  relationTo: 'users',
                  filterOptions: async ({ req, siblingData }) => {
                    try {
                      // Kiểm tra nếu siblingData không tồn tại hoặc không có khoa thì trả về danh sách rỗng
                      if (
                        !siblingData ||
                        typeof siblingData !== 'object' ||
                        !('khoa' in siblingData)
                      ) {
                        return { id: { in: [] } }
                      }

                      const khoaID = siblingData.khoa as string // Ép kiểu để TypeScript hiểu

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
                      displayFormat: 'd-MM-yyyy', // Đảm bảo format đúng
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
                      type: 'textarea',
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
                              displayFormat: 'd-MM-yyy',
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
                        // {
                        //   name: 'noikhoa',
                        //   label: 'Nội khoa',
                        //   admin: {
                        //     condition: (data) => {
                        //       // Kiểm tra nếu 'hoso' tồn tại và có ít nhất một phần tử
                        //       if (!data?.hoso || data.hoso.length === 0) return false
                        //       // Lấy giá trị 'phauthuat' từ nhóm 'phuongphap'
                        //       const phauthuat = data.hoso[0]?.tomtat?.phuongphap?.phauthuat
                        //       return phauthuat === 'khong'
                        //     },
                        //   },
                        //   type: 'text',
                        // },
                      ],
                    },
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
                  required: true,
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
                          displayFormat: 'dd/MM/yyyy',
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
            },
          ],
          label: 'Y Lệnh',
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [namePatient, preventDuplicateMedicalRecord],
    beforeValidate: [valueho_so, valuemedicalrecord],
  },
}

export default MedicalRecods
