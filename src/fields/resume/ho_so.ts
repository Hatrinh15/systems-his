import { Field } from "payload";
export const Hoso: Field[]=[
   
      {
        name: 'ketqua',
        label: 'Kết quả',
        type: 'array',
        fields: [
          {
            name: 'infomation',
            label: 'THÔNG TIN NỘI SOI',
            type: 'group',
            fields: [
              { name: 'ngay', label: 'Ngày thực hiện', type: 'date' },
              { name: 'bacsi', label: 'Bác sĩ thực hiện', type: 'text' },
              {
                name: 'lydo',
                label: 'Lý do nội soi',
                type: 'group',
                fields: [
                  { name: 'nghetmui', label: 'Nghẹt mũi', type: 'checkbox' },
                  { name: 'dauhong', label: 'Đau họng', type: 'checkbox' },
                  { name: 'chaymui', label: 'Chảy mũi', type: 'checkbox' },
                  { name: 'utai', label: ' Ù tai', type: 'checkbox' },
                  { name: 'khantieng', label: 'Khàn tiếng', type: 'checkbox' },
                  { name: 'kiemtrasaudieutri', label: 'Kiểm tra sau điều trị', type: 'checkbox' },
                  { name: 'khac', label: 'Khác', type: 'text' },
                ],
              },
            ],
          },
          {
            name: 'ketqua',
            label: 'KẾT QUẢ NỘI SOI ',
            type: 'blocks',
            blocks: [
              {
                slug: 'primaryhero',
                labels: { singular: 'TAi', plural: 'TAI' },
                fields: [
                  { name: 'binhthuong', label: 'Bình thường', type: 'checkbox' },
                  { name: 'viemtaingoai', label: 'Viêm tai ngoài', type: 'checkbox' },
                  { name: 'viemtaigiua', label: 'Viêm tai giữa', type: 'checkbox' },
                  { name: 'khac', label: 'Khác ( Mô tả chi tiết) ', type: 'text' },
                ],
              },
              {
                slug: 'secondaryHero',
                labels: { singular: 'MŨI', plural: 'MŨI' },
                fields: [
                  { name: 'binhthuong', label: 'Bình thường', type: 'checkbox' },
                  { name: 'viemmuidiung', label: 'Viêm mũi dị ứng', type: 'checkbox' },
                  { name: 'viemxoang', label: 'Viêm xoang', type: 'checkbox' },
                  { name: 'khac', label: 'Khác ( Mô tả chi tiết)', type: 'text' },
                ],
              },
              {
                slug: 'Hero',
                labels: { singular: 'HỌNG-THANH QUẢN', plural: 'HỌNG-THANH QUẢN' },
                fields: [
                  { name: 'binhthuong', label: 'Bình thường', type: 'checkbox' },
                  { name: 'viehongcap', label: 'Viêm họng cấp/mạn', type: 'checkbox' },
                  { name: 'viemamidan', label: 'Viêm amidan', type: 'checkbox' },
                  { name: 'khantieng', label: 'Khàn tiếng do viêm thanh quản', type: 'checkbox' },
                  { name: 'tonthuong', label: 'Tổn thương nghi ngờ u', type: 'checkbox' },
                  { name: 'khac', label: 'Khác ( Mô tả chi tiết)', type: 'text' },
                ],
              },
            ],
          },
          {
            name: 'hinhanh',
            label: 'HÌNH ẢNH NỘI SOI',
            type: 'upload',
            relationTo: 'media',
          },
          {
            type: 'tabs',
            tabs: [
              {
                label: 'Chẩn đoán',
                fields: [
                  { name: 'chandoan', label: ' Chẩn đoán', type: 'text' },
                  {
                    name: 'mucdo',
                    label: 'Mức độ tổn thương',
                    type: 'group',
                    fields: [
                      { name: 'binhthuong', label: 'Bình thường', type: 'checkbox' },
                      { name: 'nhe', label: 'Nhẹ', type: 'checkbox' },
                      { name: 'trungbinh', label: 'Trung bình', type: 'checkbox' },
                      { name: 'nang', label: 'Nặng', type: 'checkbox' },
                      { name: 'cantheodoithem', label: 'Cần theo dõi thêm', type: 'checkbox' },
                      { name: 'khac', label: 'Khác', type: 'text' },
                    ],
                  },
                ],
              },
              {
                label: 'Kết luận và hướng điều trị',
                fields: [
                    { name: 'huongdieutri', label: 'Hướng điều trị', type: 'text' },
                  {
                    name: 'sosanh',
                    label: 'So sánh',
                    type: 'group',
                    fields: [
                      { name: 'caithien', label: 'Cải thiện', type: 'checkbox' },
                      { name: 'khongthaydoi', label: 'Không thay đổi', type: 'checkbox' },
                      { name: 'tinhtrang', label: 'Nhận xét tình trạng', type: 'text' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]
