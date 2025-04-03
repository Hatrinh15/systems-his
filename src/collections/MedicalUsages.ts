import { CollectionConfig } from 'payload';
import { hookxuatKhoKhoa,hookPhieuSuDung, autoFillUnitPrice,
   autoCalculateTotalPrice, calculateTotalValues, hookcheckvalue, checkInventoryBeforeUsage } from '@/hooks/HookMedicalUsages';

export const medicalUsages: CollectionConfig = {
  slug: 'medicalUsages',
  labels: {
    singular: 'Phiếu Sử Dụng Kho Khoa',
    plural: 'Phiếu Sử Dụng Kho Khoa',
  },
  admin: {
    useAsTitle:'department',
     group:'Dược Và Vật Tư Y Tế'
  },
  fields: [
    {
      type:'tabs',
      tabs:[
        {
          label:'Thông tin phiếu',
          fields:[
            {
              name : 'loaiphieu',
              label: 'Loại phiếu',
              type: 'radio',
              options:[ 
                {label: 'Sử dụng',value:'sudung'},
                {label:'Hủy hàng',value: 'huyhang'},
              ],
            defaultValue: 'sudung'
            },
            {
              name: 'usagedate',
              label: 'Ngày sử dụng/hủy hàng',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'dd-MM-yyy',
                },
              },
            },
            {
              name: 'department',
              label: 'Khoa sử dụng',
              type: 'relationship',
              relationTo: 'departments',
              admin:{
                allowCreate: false
              }
            },
            {
              name: 'staff',
              label: 'Nhân viên thực hiện',
              type: 'relationship',
              relationTo: 'users',
              admin: {
                allowCreate: false,
              },
              filterOptions: async ({ data, req }) => {
                if (!data?.department) return false; // Nếu chưa chọn khoa, không lọc
              
                try {
                  // Tìm thông tin khoa đã chọn
                  const department = await req.payload.findByID({
                    collection: 'departments',
                    id: data.department,
                  });
              
                  if (!department) return false;
              
                  // Lấy danh sách nhân viên thuộc khoa đó
                  const staffIds = [
                    ...(department.doctors || []).map((doc) => (typeof doc === 'string' ? doc : doc?.id)),
                    ...(department.nures || []).map((doc) => (typeof doc === 'string' ? doc : doc?.id)),
                  ];
              
                  if (staffIds.length === 0) return false; // Không có nhân viên nào phù hợp
              
                  return {
                    id: { in: staffIds },
                  };
                } catch (error) {
                  console.error('Lỗi khi lấy danh sách nhân viên của khoa:', error);
                  return false; // Nếu có lỗi, không áp dụng filter
                }
              }    
          },
          {
            name: 'nguoixacnhanhuy',
            label: 'Người xác nhận hủy',
            type: 'relationship',
            relationTo: 'users',
            admin:{
              allowCreate: false,
              condition: (data) => data.loaiphieu === 'huyhang',
            },
            filterOptions: async ({ data, req }) => {
              if (!data?.department) return false; // Nếu chưa chọn khoa, không lọc
            
              try {
                // Tìm thông tin khoa đã chọn
                const department = await req.payload.findByID({
                  collection: 'departments',
                  id: data.department,
                });
            
                if (!department) return false;
            
                // Lấy danh sách trưởng khoa 
                const truongKhoaIds = (Array.isArray(department.truongkhoa) ? department.truongkhoa : [department.truongkhoa])
                .map((tk) => (typeof tk === 'string' ? tk : tk?.id))
                .filter(Boolean); // Lọc bỏ giá trị undefined hoặc null
        
            
                if (truongKhoaIds.length === 0) return false; // Không có trưởng khoa nào
            
                return {
                  id: { in: truongKhoaIds },
                };
              } catch (error) {
                console.error('Lỗi khi lấy danh sách trưởng khoa:', error);
                return false; // Nếu có lỗi, không áp dụng filter
              }
            }  
          },
            {
              name: 'ghichu',
              label: 'Ghi chú',
              type:'textarea'
            },
            {
              name: 'danhsachsanpham',
              label: 'Danh sách sản phẩm',
              type: 'group',
              fields:[
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
                          filterOptions: async ({ data, req }) => {
                            if (!data?.department) return false; // Nếu chưa chọn khoa, không lọc
                        
                            try {
                              // Lấy thông tin khoa từ `departments`
                              const department = await req.payload.findByID({
                                collection: 'departments',
                                id: data.department,
                              });
                        
                              if (!department || !Array.isArray(department.departmentInventory)) return false;
                        
                              // Lọc ra danh sách thuốc trong kho của khoa đó với số lượng > 0
                              const availableMedications = department.departmentInventory
                              .filter((item) => item.category === 'medications' && (item.quantity ?? 0) > 0)// Chỉ lấy thuốc có số lượng > 0
                                .map((item) => (typeof item.item === 'string' ? item.item : item.item?.id))
                                .filter(Boolean); // Lọc bỏ giá trị `undefined` hoặc `null`
                        
                              if (availableMedications.length === 0) return false; // Nếu không có thuốc hợp lệ, ẩn danh sách
                        
                              return {
                                id: { in: availableMedications },
                              };
                            } catch (error) {
                              console.error('Lỗi khi lấy danh sách thuốc trong khoa:', error);
                              return false;
                            }
                          },
                        },
                        
                        
                        { name: 'quantity', label: 'Số lượng sử dụng', type: 'number', min: 1 },
                        {
                          name: 'donvi',
                          label: 'Đơn vị',
                          type: 'select',
                          options:[
                            {label: 'Hộp',value:'hop'},
                          ],
                          defaultValue :'hop'
                        },
                        { name: 'unitprice', label: 'Đơn giá(VNĐ)', type: 'text',admin:{readOnly: true  } },
                        {
                          name: 'totalprice',
                          label: 'Tổng giá trị',
                          type: 'text',
                          admin: { readOnly: true },
                        },
                      ],
                    },
                    {
                      name: 'lido',
                      label: 'Lí do sử dụng/hủy hàng',
                      type: 'textarea'
                    }
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
                          filterOptions: async ({ data, req }) => {
                            if (!data?.department) return false; // Nếu chưa chọn khoa, không lọc
                        
                            try {
                              // Lấy thông tin khoa từ `departments`
                              const department = await req.payload.findByID({
                                collection: 'departments',
                                id: data.department,
                              });
                        
                              if (!department || !Array.isArray(department.departmentInventory)) return false;
                        
                              // Lọc vật tư tiêu hao có số lượng > 0
                              const availableSupplies = department.departmentInventory
                                .filter((item) => 
                                  item.category === 'vattutieuhao' && // Đúng danh mục vật tư tiêu hao
                                  (item.quantity ?? 0) > 0 // Số lượng phải lớn hơn 0
                                )
                                .map((item) => (typeof item.items === 'string' ? item.items : item.items?.id)) // Lấy ID vật tư
                                .filter(Boolean); // Lọc bỏ giá trị `undefined` hoặc `null`
                        
                              if (availableSupplies.length === 0) return false; // Nếu không có vật tư tiêu hao nào, ẩn danh sách
                        
                              return {
                                id: { in: availableSupplies },
                              };
                            } catch (error) {
                              console.error('Lỗi khi lấy danh sách vật tư tiêu hao:', error);
                              return false;
                            }
                          },
                        },
                        
                        { name: 'quantity', label: 'Số lượng sử dụng', type: 'number', min: 1 },
                        {
                          name: 'donvi',
                          label: 'Đơn vị',
                          type: 'select',
                          options:[
                            {label: 'Hộp',value:'hop'}
                          ],
                          defaultValue: 'hop',
                        },
                        { name: 'unitprice', label: 'Đơn giá(VNĐ)', type: 'text' ,admin:{readOnly: true  } },
                        {
                          name: 'totalprice',
                          label: 'Tổng giá trị',
                          type: 'text',
                          admin: { readOnly: true },
                        },
                      ],
                    },
                    {
                      name: 'lido',
                      label: 'Lí do sử dụng/hủy hàng',
                      type: 'textarea'
                    }
                  ],
                },
                {
                  name: 'maymocthietbi',
                  label: 'Máy móc/Thiết bị',
                  type: 'array',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'equipment',
                          label: 'Tên vật tư y tế',
                          type: 'relationship',
                          relationTo: 'medicalSupplies',
                          admin:{
                            allowCreate: false
                          },
                          filterOptions: async ({ data, req }) => {
                            if (!data?.department) return false; // Nếu chưa chọn khoa, không lọc
                        
                            try {
                              // Lấy thông tin khoa từ `departments`
                              const department = await req.payload.findByID({
                                collection: 'departments',
                                id: data.department,
                              });
                        
                              if (!department || !Array.isArray(department.departmentInventory)) return false;
                        
                              // Lọc vật tư tiêu hao có số lượng > 0
                              const availableEquipment = department.departmentInventory
                                .filter((item) => 
                                  item.category === 'maymocthietbi' && // Đúng danh mục vật tư tiêu hao
                                  (item.quantity ?? 0) > 0 // Số lượng phải lớn hơn 0
                                )
                                .map((item) => (typeof item.items === 'string' ? item.items : item.items?.id)) // Lấy ID vật tư
                                .filter(Boolean); // Lọc bỏ giá trị `undefined` hoặc `null`
                        
                              if (availableEquipment.length === 0) return false; // Nếu không có vật tư tiêu hao nào, ẩn danh sách
                        
                              return {
                                id: { in: availableEquipment },
                              };
                            } catch (error) {
                              console.error('Lỗi khi lấy danh sách máy móc thiết bị:', error);
                              return false;
                            }
                          },
                        },
                        { name: 'quantity', label: 'Số lượng sử dụng', type: 'number', min: 1 },
                        {
                          name: 'donvi',
                          label: 'Đơn vị',
                          type: 'select',
                          options:[
                            {label: 'Cái',value: 'cai' },
                            {label: 'Bộ',value: 'bo'}
                          ]
                        },
                        { name: 'unitprice', label: 'Đơn giá(VNĐ)', type: 'text' ,admin:{readOnly: true  } },
                        {
                          name: 'totalprice',
                          label: 'Tổng giá trị',
                          type: 'text',
                          admin: { readOnly: true },
                        },
                      ],
                    },
                    {
                      name: 'lido',
                      label: 'Lí do sử dụng/hủy hàng',
                      type: 'textarea'
                    }
                  ],
                },
              ]
            },
          ]
        },
        {
          label: 'Báo cáo',
          fields:[
            {
              type: 'row',
              fields: [
                {
                  name: 'tong_gia_tri_thuoc',
                  label: 'Tổng giá trị - Thuốc ',
                  type: 'text',
                  admin: { readOnly: true },
                },
                {
                  name: 'tong_gia_tri_vtth',
                  label: 'Tổng giá trị - Vật tư tiêu hao',
                  type: 'text',
                  admin: { readOnly: true },
                },
                {
                  name: 'tong_gia_tri_mmtb',
                  label: 'Tổng giá trị - Máy móc thiết bị',
                  type: 'text',
                  admin: { readOnly: true },
                },
              ],
            },
            {
              name: 'tong_gia_tri',
              label: 'Tổng giá trị phiếu sử dụng/hủy hàng',
              type: 'text',
              admin: { readOnly: true },
            },
            { name: 'report_notes', label: 'Ghi chú báo cáo', type: 'textarea' },
          ]
        }
      ]
    },
  ],
  hooks:{
    beforeChange:[hookPhieuSuDung,hookxuatKhoKhoa ,autoFillUnitPrice,
      autoCalculateTotalPrice,calculateTotalValues,hookcheckvalue,checkInventoryBeforeUsage],
  }
};

