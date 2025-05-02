import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'
import { hookcheck, hookSoHoSo, notChangeHinhThucĐT, valuemedicalorder ,checkKhoaRead, checkAutoKhoa,BacSiyTa} from '@/hooks/Hookmedicalorder'
import { isAdmin , isBacSiYTaTruongKhoa,} from '@/hooks/AccessAdmin'
export const Medicalorders: CollectionConfig = {
  slug: 'medicalorders',
  access: {
    create: (args) => isAdmin(args) || isBacSiYTaTruongKhoa(args),
    delete:  (args) => isAdmin(args) ,
    read:  checkKhoaRead,
    update:  (args) => isAdmin(args) || isBacSiYTaTruongKhoa(args),
  },
  labels: {
    singular: 'Y Lệnh',
    plural: 'Y Lệnh',
  },
  admin: {
    defaultColumns: ['hosobenhan', 'bacsi', 'ngayLap'],
    useAsTitle: 'hosobenhan',
    group:'Bệnh Nhân & Điều Trị',
    hidden: ({user}) => {
      if (user?.taikhoan === 'admin') {
        return false;
      }
      if (user?.chucvu === 'bacsi' ||user?.chucvu === 'truongkhoa' || user?.chucvu === 'yta') {
         return false
      }
return true
    }
  },
  fields: [
    {
      name: 'hosobenhan',
      label: 'Hồ sơ bệnh án',
      type: 'relationship',
      relationTo: 'MedicalRecods',
      admin: {
        allowCreate: false,
      },
    },
    {
      name: 'khoa',
      label: 'Khoa',
      type: 'relationship',
      relationTo: 'departments',
      access:{
        create: ({req}) => {
          if(req.user?.taikhoan === 'admin') {
            return true
          }
          return false
        },
        update: ({req}) => {
          if(req.user?.taikhoan === 'admin') {
            return true
          }
          return false
        }
      },
      admin: {
        allowCreate: false,
      },
    },
    {
      name: 'bacsi',
      label: 'Bác sĩ phụ trách',
      type: 'relationship',
      relationTo: 'users',
      access: {
        create: ({req}) => {
          if(req.user?.taikhoan === 'admin') {
            return true
          }
          if(req.user?.chucvu === 'yta') {
            return true
           }

          return false
        },
        update: ({req}) => {
          if(req.user?.taikhoan === 'admin') {
            return true
          }
          if(req.user?.chucvu === 'yta') {
            return true
           }

          return false
        }
      },
      admin: {
        allowCreate: false,
      },
      filterOptions: async ({ req }) => {
        const selectedKhoa = req.user?.khoa; // Lấy khoa của người dùng đang đăng nhập
      
        if (!selectedKhoa) return false;
      
        try {
          // Tìm thông tin khoa theo tên khoa
          const find = await req.payload.find({
            collection: 'departments',
            where: {
              tenkhoa: {
                equals: selectedKhoa,
              },
            },
            limit: 1,
          });
      
          const khoaData = find.docs[0];
          if (!khoaData) return false;
      
          // Lấy danh sách ID bác sĩ và trưởng khoa
          const doctorIds = (khoaData.doctors ?? []).map((doc) =>
            typeof doc === 'string' ? doc : doc.id
          );
          const truongKhoaIds = (khoaData.truongkhoa ?? []).map((doc) =>
            typeof doc === 'string' ? doc : doc.id
          );
      
          const allUserIds = [...new Set([...doctorIds, ...truongKhoaIds])];
      
          if (allUserIds.length === 0) return false;
      
          return {
            id: { in: allUserIds },
          };
        } catch (error) {
          console.error('Lỗi lọc danh sách bác sĩ và trưởng khoa:', error);
          return false;
        }
      }      
    },
    
    {
      name: 'dieuduong',
      label: 'Y tá/Điều dưỡng thực hiện',
      type: 'relationship',
      relationTo: 'users',
      access: {
        create: ({req}) => {
          if(req.user?.taikhoan === 'admin') {
            return true
          }
          if (req.user?.chucvu === 'bacsi' || req.user?.chucvu === 'truongkhoa') {
            return true
           }

          return false
        },
        update: ({req}) => {
          if(req.user?.taikhoan === 'admin') {
            return true
          }
          if (req.user?.chucvu === 'bacsi' || req.user?.chucvu === 'truongkhoa') {
            return true
           }

          return false
        }
      },
      admin: {
        allowCreate: false,
      },
      filterOptions: async ({ req, data }) => {
        const selectedKhoa = req.user?.khoa;
      
        try {
          const find = await req.payload.find({
            collection: 'departments',
           where: {
            tenkhoa: {
              equals: selectedKhoa
           } }
          })
      const khoaData = find.docs[0]
      
          if (!khoaData?.nures || khoaData.nures.length === 0) return false;
      
          const nuresIds = khoaData.nures.map((nurse) =>
            typeof nurse === 'string' ? nurse : nurse.id,
          );
      
          return {
            id: { in: nuresIds },
          };
        } catch (error) {
          console.error('Lỗi lọc danh sách y tá:', error);
          return false;
        }
      }      
    },
    {
      name: 'hinhthucdieutri',
      label: 'Hình thức điều trị',
      type: 'radio',
      options: [
        { label: 'Bệnh nhân nội trú', value: 'benhnhannoitru' },
        { label: 'Bệnh nhân ngoại trú', value: 'benhnhanngoaitru' },
      ],
    },
    {name: 'sohoso',label: 'Số hồ sơ bệnh án', type: 'text',
      admin: {
        condition: (data) => data?.hinhthucdieutri === 'benhnhannoitru',
        readOnly: true,
      },
    },
    {
      name: 'ngaynhapvien',
      label: 'Ngày nhập viện',
      type: 'date',
      admin: {
        condition: (data) => data?.hinhthucdieutri === 'benhnhannoitru',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd-MM-yyy',
        },
      },
    },    
    {
      name: 'ngayLap',
      label: 'Ngày lập y lệnh',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd-MM-yyy',
        },
      },
    },
    {
      name: 'chuandoan',
      label: 'Chuẩn đoán',
      type: 'textarea',
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Thuốc',
          fields: [
            {
              name: 'thuoc',
              label: 'Danh sách thuốc',
              type: 'array',
              fields: [
                {
                  name: 'thuocId',
                  label: 'Chọn thuốc',
                  type: 'relationship',
                  relationTo: 'medications',
                  admin: {
                    allowCreate: false,
                  },
                  filterOptions: async ({ req, data }) => {
                    try {
                      const existingPharmacyMeds = await req.payload.find({
                        collection: 'pharmacies',
                        where: {
                          category: {
                            equals: 'medications',
                          },
                        },
                        limit: 1000,
                      });
                
                      const medicationIdsInPharmacies = existingPharmacyMeds.docs
                        .map((doc) => (typeof doc.item === 'string' ? doc.item : doc.item?.id))
                        .filter(Boolean);
                
                      // Nếu đang sửa bản ghi có thuốc đã chọn mà không nằm trong danh sách thì vẫn hiển thị
                      if (data?.thuocId && !medicationIdsInPharmacies.includes(data.thuocId)) {
                        medicationIdsInPharmacies.push(data.thuocId);
                      }
                
                      if (!medicationIdsInPharmacies.length) return false;
                
                      return {
                        id: { in: medicationIdsInPharmacies },
                      };
                    } catch (err) {
                      console.error('Lỗi lọc thuốc trong quầy thuốc:', err);
                      return false;
                    }
                  },
                },     
                { name: 'hamLuong', label: 'Hàm lượng', type: 'text' },
                { name: 'lieuDung', label: 'Liều dùng', type: 'text' },
                { name: 'cachDung', label: 'Cách dùng', type: 'text' },
                { name: 'thoiGian', label: 'Thời gian', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Xét Nghiệm - Chẩn Đoán Hình Ảnh',
          fields: [
            {
              name: 'xetNghiem',
              label: 'Danh sách xét nghiệm',
              type: 'array',
              fields: [
                { name: 'loaiXetNghiem', label: 'Loại xét nghiệm', type: 'text' },
                { name: 'moTa', label: 'Mô tả', type: 'text' },
                { name: 'ngayChiDinh', label: 'Ngày chỉ định', type: 'date' },
                {
                  name: 'hinhAnh',
                  label: 'Hình ảnh/X-ray/CT Scan',
                  type: 'upload',
                  relationTo: 'media', // Collection chứa file ảnh
                },
                {
                  name: 'fileDinhKem',
                  label: 'File kết quả xét nghiệm',
                  type: 'upload',
                  relationTo: 'media', // Cho phép tải lên file PDF, DOCX,...
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'ghichu',
      label: 'Ghi chú (nếu có)',
      type: 'textarea',
    },
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [valuemedicalorder],
    beforeChange: [notChangeHinhThucĐT,hookcheck,checkAutoKhoa,BacSiyTa,hookSoHoSo],
  },
}
