import { Hoso } from '@/fields/resume/ho_so'

import { CollectionConfig } from 'payload'

const MedicalRecods: CollectionConfig = {
  slug: 'MedicalRecods', // Đường dẫn API: /api/products

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
                { name: 'chandoan', label: 'Chẩn đoán', type: 'text' },
                {
                  name: 'tomtat',
                  label: 'Tóm tắt quá trình điều trị',
                  type: 'group',
                  fields: [
                    { name: 'lydo', label: 'Lý do vào viện', type: 'text' },
                    {
                      name: 'tomtat',
                      label: 'Tóm tắt quá trình bệnh lý( các triệu chứng bệnh, diễn biến bệnh)',
                      type: 'text',
                    },
                    { name: 'tiensu', label: 'Tiền sử bệnh án', type: 'text', required: true },
                    {
                      name: 'phuongphap',
                      label: 'Phương pháp điều trị',
                      type: 'group',
                      fields: [
                        {
                          name: 'phauthuat',
                          label: 'Phẫu thuật, thủ thuật',
                          type: 'radio',
                          options: [
                            { label: 'Có', value: 'co' },
                            { label: 'Không', value: 'khong' },
                          ],
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
                    { name: 'khoi', label: 'Khỏi', type: 'checkbox' },
                    { name: 'do', label: 'Đỡ', type: 'checkbox' },
                    { name: 'khongthaydoi', label: 'Không thay đổi', type: 'checkbox' },
                    { name: 'nang', label: 'Nặng hơn', type: 'checkbox' },
                    { name: 'tuvong', label: 'Tử vong', type: 'checkbox' },
                    { name: 'tienluongnang', label: 'Tiên lượng nặng xin về', type: 'checkbox' },
                    { name: 'chuaxacdinh', label: 'Chưa xác định được', type: 'checkbox' },
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
      },
    ],
  },
}

export default MedicalRecods
