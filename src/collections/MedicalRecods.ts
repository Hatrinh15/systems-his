import { Hoso } from '@/fields/resume/ho_so'

import { CollectionConfig } from 'payload'

const MedicalRecods: CollectionConfig = {
  slug: 'MedicalRecods', // Đường dẫn API: /api/products

  labels: {
    singular: 'HỒ SƠ BỆNH ÁN',
    plural: 'HỒ SƠ BỆNH ÁN',
  },   
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hồ sơ bệnh án ',
          fields: [ 
            {
              name: 'lichsubenhan',
              label: 'THÔNG TIN BỆNH NHÂN',
              type: 'relationship',
              relationTo: 'patients', // Tham chiếu tới collection 'patients'
              required: true,
            },
            {
              name: 'hoso',
              label: 'Hồ sơ',
              type: 'array',
              fields: [
                { name: 'khoa', label: 'KHoa', type: 'text' },
                { name: 'bacsi', label: 'Bác sĩ phụ trách', type: 'text' },
                { name: 'chandoan', label: 'Chẩn đoán', type: 'text' },
                {
                  name: 'tomtat',
                  label: 'Tóm tắt quá trình điều trị',
                  type: 'group',
                  fields: [
                    { name: 'lydo', label: 'Lý do vào viện', type: 'text' },
                    {
                      name:'tomtat',  label: 'Tóm tắt quá trình bệnh lý( các triệu chứng bệnh, diễn biến bệnh)',type:'text',
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
                        { name: 'noikhoa', label: 'Nội khoa', type: 'text' },
                      ],
                    },
                  ],
                },
                {
                  name: 'tinhtrang',
                  label: 'Tình trạng xuất viện',
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
}

export default MedicalRecods
