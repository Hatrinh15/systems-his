import { CollectionConfig, Where } from 'payload'
import { hookBaoGia, hookNhapQuayThuoc, hookxuatkho, showPrice ,
  hookNhapKhoKhoa, checkInventoryBeforeExport ,hookCheckinfo,showTotalPrice,autoAssignNguoiLapPhieu} from '@/hooks/Hook_Xuat_Kho'
import { isAdmin,isAdminNhanVienKho ,isAdminKeToanNhanVienKho} from '@/hooks/AccessAdmin'
import { User } from 'payload'

export const PhieuXuat: CollectionConfig = {
  slug: 'phieuxuat',
  access: {
    create: isAdminNhanVienKho,
    delete: isAdminNhanVienKho,
    update: isAdminNhanVienKho,
    read: isAdminKeToanNhanVienKho,
  },
  labels: {
    singular: 'Phiếu Xuất Kho',
    plural: 'Phiếu Xuất Kho',
  },
  admin: {
    useAsTitle: 'transactiondate',
    group: 'Quản Lý Phiếu & Bảng Giá',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Thông Tin Giao Dịch',
          fields: [
            {
              name: 'transactiondate',
              label: 'Ngày tạo phiếu',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'dd-MM-yyy',
                },
              },
            },
            {
              name: 'receiverorsender',
              label: 'Người lập phiếu',
              type: 'relationship',
              relationTo: 'users',
              access: {
                create: ({ req }) => {
                  const user = req.user as User
                  return user?.taikhoan === 'admin'
                },
                update: ({ req }) => {
                  const user = req.user as User
                  return user?.taikhoan === 'admin'
                },
              },
              filterOptions: () => ({
                phong: { equals: 'hanhchinhquantri' },
              }),
            },
            {
              name: 'exports',
              label: 'Danh sách xuất hàng',
              type: 'array',
              fields: [
                {
                  name: 'loai_xuat',
                  label: 'Loại xuất',
                  type: 'select',
                  options: [
                    { label: 'Khoa', value: 'khoa' },
                    { label: 'Quầy Thuốc', value: 'quaythuoc' },
                    { label: 'Hủy hàng', value: 'huy' },
                  ],
                  required: true,
                },
                {
                  name: 'destination',
                  label: 'Nơi nhận',
                  type: 'relationship',
                  relationTo: 'departments',
                  admin: {
                    allowCreate: false,
                    condition: (_, siblingData) => siblingData?.loai_xuat === 'khoa',
                  },
                },
                {
                  name: 'nguoinhan',
                  label: 'Người nhận',
                  type: 'relationship',
                  relationTo: 'users',
                  admin: {
                    allowCreate: false,
                    condition: (_, siblingData) =>
                      siblingData?.loai_xuat === 'khoa' && siblingData?.destination,
                  },
                  filterOptions: async ({ req, data, siblingData }): Promise<Where> => {
                    if (
                      !data?.exports ||
                      !Array.isArray(data.exports) ||
                      data.exports.length === 0
                    ) {
                      return { id: { in: [] } } // Nếu chưa chọn khoa, không hiển thị nhân sự nào
                    }

                    try {
                      const destinationData = siblingData as { destination: string }
                      if (!destinationData.destination) {
                        return { id: { in: [] } }
                      }
                      // Lấy danh sách nhân sự từ khoa đã chọn trong Departments
                      const department = await req.payload.findByID({
                        collection: 'departments',
                        id: destinationData.destination,
                      })

                      if (!department) {
                        return { id: { in: [] } }
                      }

                      const staffList = [
                        (department.truongkhoa || []),
                        ...(department.doctors || []),
                        ...(department.nures || []),
                      ]

                      return {
                        id: {
                          in: staffList.map((staff) =>
                            typeof staff === 'object' && staff != null && 'id' in staff ? staff.id : staff,
                          ),
                        },
                      }
                    } catch (error) {
                      console.error('Lỗi khi lọc nhân sự:', error)
                      return { id: { in: [] } }
                    }
                  },
                },
                {
                  name: 'reason_cancel',
                  label: 'Lý do hủy',
                  type: 'textarea',
                  admin: {
                    condition: (_, siblingData) => siblingData?.loai_xuat === 'huy',
                  },
                },
                {
                  name: 'thuoc',
                  label: 'Thuốc',
                  type: 'array',
                  admin: {
                    condition: (_, siblingData) =>
                      siblingData?.loai_xuat === 'khoa' ||
                      siblingData?.loai_xuat === 'quaythuoc' ||
                      siblingData?.loai_xuat === 'huy',
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'tenthuoc',
                          label: 'Tên thuốc',
                          type: 'relationship',
                          relationTo: 'medications',
                          filterOptions: async ({ req, data, siblingData }) : Promise<Where> => {
                            try {
                              const ids = siblingData as {tenthuoc: string}
                              const khoaMap = new Map<string, string>();
                              const thuocKhoa = new Map<string, string[]>();
                              // Kiểm tra nếu data.exports không phải là mảng
                              if (!Array.isArray(data.exports)) {
                                return { id: { in: null } };
                              }
                          
                              // Lấy ID của siblingData (nếu có)
                              const id = siblingData && typeof siblingData === "object" && "id" in siblingData ? siblingData.id : null;
                              const tenthuoc = siblingData && typeof siblingData === "object" && "tenthuoc" in siblingData
                                ? siblingData.tenthuoc
                                : null;
                          
                              // Tìm parentExport
                              const parentExport = data.exports.find((exp) => 
                                Array.isArray(exp.thuoc) && exp.thuoc.some(item => item.id === id)
                              );
                          
                              if (!parentExport) {
                                console.error("Không tìm thấy parentExport, kiểm tra lại dữ liệu.");
                                return { id: { in: null } };
                              }
                          
                              // Lấy danh sách thuốc trong kho có số lượng > 0
                              const inventory = await req.payload.find({
                                collection: "inventory",
                                where: { quantity: { greater_than: 0 } },
                              });
                          
                              const availableMedications = inventory.docs.map((item) => 
                                typeof item.item === "object" && item.item !== null ? item.item.id : item.item
                              );
                          
                              if (parentExport.loai_xuat === "khoa") {
                                data.exports.forEach((dt) => {
                                  khoaMap.set(dt.destination, dt.destination);
                                });
                          
                                const findKhoa = await req.payload.find({ collection: "departments" });
                          
                                findKhoa.docs.forEach((dt) => {
                                  dt.departmentInventory?.forEach((pc) => {
                                    const thuocId = typeof pc.item === "object" && pc.item !== null ? pc.item.id : pc.item;
                                    if (dt.id && thuocId) {
                                      if (!thuocKhoa.has(dt.id)) {
                                        thuocKhoa.set(dt.id, []);
                                      }
                                      thuocKhoa.get(dt.id)?.push(thuocId);
                                    }
                                  });
                                });
                          
                                for (const item of data.exports) {
                                  if (!Array.isArray(item.thuoc)) continue;
                          
                                  const commonMedications = new Set(availableMedications);
                                  const findThuoc = thuocKhoa.get(item.destination);
                                  const showThuoc = findThuoc?.filter((dt) => commonMedications.has(dt)) || [];
                          
                                  for (const pc of item.thuoc) {
                                    if (pc.id === id) {
                                      const conditions: Array<{ id: { in?: string[]; equals?: string } }> = [];
                                      if (showThuoc.length > 0) {
                                        conditions.push({ id: { in: showThuoc.filter((item): item is string => item != null) } });
                                      }
                                      if (tenthuoc) {
                                        conditions.push({ id: { equals: String(tenthuoc) } });
                                      }
                          
                                      return conditions.length > 0 ? { or: [{or: conditions },{id: {equals:ids.tenthuoc}}]} : { id: { in: null } } as any; 
                                    } 
                                  }
                                }
                              }
                              if(parentExport.loai_xuat === "quaythuoc") {
                                const findQuay = await req.payload.find({ collection: 'pharmacies' });
                               const thuocId= findQuay.docs.map((dt) => {
                                  const thuocId = typeof dt.item === 'object' && dt.item !== null ? dt.item.id : dt.item
                                  return thuocId
                                })
                                for (const item of data.exports) {
                                  const commonMedications = new Set(availableMedications);
                                  const showThuoc = thuocId?.filter((dt) => commonMedications.has(dt)) 
                                  console.log(showThuoc)
                                  
                                  for (const pc of item.thuoc) {
                                    if (pc.id === id) {
                                      const conditions: Array<{ id: { in?: string[]; equals?: string } }> = [];
                                      if (showThuoc.length > 0) {
                                        conditions.push({ id: { in: showThuoc.filter((item): item is string => item != null) } });
                                      }
                                      if (tenthuoc) {
                                        conditions.push({ id: { equals: String(tenthuoc) } });
                                      }
                          
                                      return conditions.length > 0 ? { or: [{or: conditions },{id: {equals:ids.tenthuoc}}]} : { id: { in: null } } as any;
                                    } 
                                  }
                                }
                              }
                              return { id: { in: availableMedications } };
                            } catch (error) {
                              console.error("Lỗi khi lọc thuốc trong kho:", error);
                              return { id: { in: null } };
                            }
                          },
                          admin:{
                            allowCreate: false
                          }
                        },
                        { name: 'quantity', label: 'Số lượng', type: 'number', min: 1 },
                        {
                          name: 'donvi',
                          label: 'Đơn vị',
                          type: 'select',
                          options:[
                            {label: 'Hộp',value:'hop'},
                          ],
                          defaultValue :'hop'
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
                  admin: {
                    condition: (_, siblingData) =>
                      siblingData?.loai_xuat === 'khoa' ||
                      siblingData?.loai_xuat === 'quaythuoc' ||
                      siblingData?.loai_xuat === 'huy',
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'supply',
                          label: 'Tên vật tư y tế',
                          type: 'relationship',
                          relationTo: 'medicalSupplies',
                          filterOptions: async ({ req, data, siblingData }) : Promise<Where> => {
                            try {
                              const khoaMap = new Map<string, string>();
                              const vattuKhoa = new Map<string, string[]>();
                              const ids = siblingData as {supply: string}
                              // Kiểm tra nếu data.exports không phải là mảng
                              if (!Array.isArray(data.exports)) {
                                return { id: { in: null } };
                              }
                          
                              // Lấy ID của siblingData (nếu có)
                              const id = siblingData && typeof siblingData === "object" && "id" in siblingData ? siblingData.id : null;
                              if (!id) {
                                console.error("ID của siblingData không hợp lệ!");
                                return { id: { in: null } };
                              }
                          
                              // Tìm parentExport trong danh sách exports
                              const parentExport = data.exports.find((exp) => 
                                Array.isArray(exp.vattutieuhao) && exp.vattutieuhao.some(item => item.id === id)
                              );
                          
                              if (!parentExport) {
                                console.error("Không tìm thấy parentExport, kiểm tra lại dữ liệu.");
                                return { id: { in: null } };
                              }
                          
                              // Lấy danh sách vật tư tiêu hao có số lượng > 0 từ kho hàng (inventory)
                              const inventory = await req.payload.find({
                                collection: "inventory",
                                where: { 
                                  quantity: { greater_than: 0 },
                                  category: { equals: "vattutieuhao" } 
                                },
                              });
                          
                              const availableSupplies = inventory.docs.map((item) => 
                                typeof item.items === "object" && item.items !== null ? item.items.id : item.items
                              );
                          
                              if (parentExport.loai_xuat === "khoa") {
                                // Lưu thông tin khoa từ danh sách exports
                                data.exports.forEach((dt) => {
                                  khoaMap.set(dt.destination, dt.destination);
                                });
                          
                                // Tìm danh sách khoa và vật tư khoa sở hữu
                                const findKhoa = await req.payload.find({ collection: "departments" });
                          
                                findKhoa.docs.forEach((dt) => {
                                  dt.departmentInventory?.forEach((pc) => {
                                    if (pc.category === "vattutieuhao") {
                                      const vattuId = typeof pc.items === "object" && pc.items !== null ? pc.items.id : pc.items;
                                      if (dt.id && vattuId) {
                                        if (!vattuKhoa.has(dt.id)) {
                                          vattuKhoa.set(dt.id, []);
                                        }
                                        vattuKhoa.get(dt.id)?.push(vattuId);
                                      }
                                    }
                                  });
                                });
                          
                                // Lọc danh sách vật tư khoa có trong kho
                                for (const item of data.exports) {
                                  if (!Array.isArray(item.vattutieuhao)) continue;
                          
                                  const commonSupplies = new Set(availableSupplies);
                                  const findVattu = vattuKhoa.get(item.destination);
                                  const showVattu = findVattu?.filter((dt) => commonSupplies.has(dt)) || [];
                          
                                  for (const pc of item.vattutieuhao) {
                                    if (pc.id === id) {
                                      const conditions: { id: { in?: string[]; equals?: string } }[] = [];
                                      if (showVattu.length > 0) {
                                        conditions.push({ id: { in: showVattu as string[] } });
                                      }
                                      return conditions.length > 0 ? { or:[{or: conditions},{id: {equals: ids.supply}}] } : { id: { in: null } }
                                    }
                                  }
                                }
                              }
                              if(parentExport.loai_xuat === "quaythuoc") {
                                const findQuay = await req.payload.find({ collection: 'pharmacies' });
                               const thuocId= findQuay.docs.map((dt) => {
                                  const thuocId = typeof dt.items === 'object' && dt.items !== null ? dt.items.id : dt.item
                                  return thuocId
                                })
                                for (const item of data.exports) {
                                  const commonSupplies = new Set(availableSupplies);
                                  const showVattu = thuocId
                                    ?.filter((dt): dt is string => typeof dt === 'string' && dt != null)
                                    .filter((dt) => commonSupplies.has(dt)) || [];
                                    console.log(showVattu)
                                  for (const pc of item.vattutieuhao) {
                                    if (pc.id === id) {
                                      const conditions: Array<{ id: { in?: string[]; equals?: string } }> = [];
                                      if (showVattu.length > 0) {
                                        conditions.push({ id: { in: showVattu.filter((item): item is string => item != null) } });
                                      }                       
                                      return conditions.length > 0 ? { or:[{or: conditions},{id: {equals: ids.supply}}] } : { id: { in: null } }
                                    } 
                                  }
                                }
                              }
                              return { id: { in: availableSupplies } };
                            } catch (error) {
                              console.error("❌ Lỗi khi lọc vật tư tiêu hao trong kho:", error);
                              return { id: { in: null } };
                            }
                          },
                          
                          admin:{
                            allowCreate: false
                          }
                        },
                        { name: 'quantity', label: 'Số lượng', type: 'number', min: 1 },
                        {
                          name: 'donvi',
                          label: 'Đơn vị',
                          type: 'select',
                          options:[
                            {label: 'Hộp',value:'hop'}
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
                  name: 'maymocthietbi',
                  label: 'Máy móc/Thiết bị',
                  type: 'array',
                  admin: {
                    condition: (_, siblingData) =>
                      siblingData?.loai_xuat === 'khoa' || siblingData?.loai_xuat === 'huy',
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'equipment',
                          label: 'Tên vật tư y tế',
                          type: 'relationship',
                          relationTo: 'medicalSupplies',
                          filterOptions: async ({ req, data, siblingData }) : Promise<Where>=> {
                            try {
                              const khoaMap = new Map<string, string>();
                              const maymocKhoa = new Map<string, string[]>();
                              const ids = siblingData as {equipment: string}
                              // Kiểm tra nếu data.exports không phải là mảng
                              if (!Array.isArray(data.exports)) {
                                return { id: { in: [] } };
                              }
                          
                              // Lấy ID của siblingData (nếu có)
                              const id = siblingData && typeof siblingData === "object" && "id" in siblingData ? siblingData.id : null;
                              if (!id) {
                                console.error("❌ ID của siblingData không hợp lệ!");
                                return { id: { in: null } };
                              }
                          
                              // Tìm parentExport trong danh sách exports
                              const parentExport = data.exports.find((exp) => 
                                Array.isArray(exp.maymocthietbi) && exp.maymocthietbi.some(item => item.id === id)
                              );
                          
                              if (!parentExport) {
                                console.error("❌ Không tìm thấy parentExport, kiểm tra lại dữ liệu.");
                                return { id: { in: [] } };
                              }
                          
                              // Lấy danh sách máy móc thiết bị có số lượng > 0 từ kho hàng (inventory)
                              const inventory = await req.payload.find({
                                collection: "inventory",
                                where: { 
                                  quantity: { greater_than: 0 },
                                  category: { equals: "maymocthietbi" } 
                                },
                              });
                          
                              const availableMachines = inventory.docs.map((item) => 
                                typeof item.items === "object" && item.items !== null ? item.items.id : item.items
                              );
                          
                              if (parentExport.loai_xuat === "khoa") {
                                // Lưu thông tin khoa từ danh sách exports
                                data.exports.forEach((dt) => {
                                  khoaMap.set(dt.destination, dt.destination);
                                });
                          
                                // Tìm danh sách khoa và máy móc thiết bị mà khoa sở hữu
                                const findKhoa = await req.payload.find({ collection: "departments" });
                          
                                findKhoa.docs.forEach((dt) => {
                                  dt.departmentInventory?.forEach((pc) => {
                                    if (pc.category === "maymocthietbi") {
                                      const maymocId = typeof pc.items === "object" && pc.items !== null ? pc.items.id : pc.items;
                                      if (dt.id && maymocId) {
                                        if (!maymocKhoa.has(dt.id)) {
                                          maymocKhoa.set(dt.id, []);
                                        }
                                        maymocKhoa.get(dt.id)?.push(maymocId);
                                      }
                                    }
                                  });
                                });
                          
                                // Lọc danh sách máy móc của khoa có trong kho
                                for (const item of data.exports) {
                                  if (!Array.isArray(item.maymocthietbi)) continue;
                          
                                  const commonMachines = new Set(availableMachines);
                                  const findMaymoc = maymocKhoa.get(item.destination);
                                  const showMaymoc = findMaymoc?.filter((dt) => commonMachines.has(dt)) || [];
                          
                                  for (const pc of item.maymocthietbi) {
                                    if (pc.id === id) {
                                      const conditions: { id: { in?: string[]; equals?: string } }[] = [];
                                      if (showMaymoc.length > 0) {
                                        conditions.push({ id: { in: showMaymoc as string[] } });
                                      }
                                      return conditions.length > 0 ? { or: [{or: conditions },{id: {equals: ids.equipment}}]} : { id: { in: null } } ;
                                    }
                                  }
                                }
                              }
                          
                              return { id: { in: availableMachines } };
                            } catch (error) {
                              console.error("❌ Lỗi khi lọc máy móc thiết bị trong kho:", error);
                              return { id: { in: null } };
                            }
                          },
                          
                          admin:{
                            allowCreate: false
                          }
                        },
                        { name: 'quantity', label: 'Số lượng', type: 'number', min: 1 },
                        {
                          name: 'donvi',
                          label: 'Đơn vị',
                          type: 'select',
                          options: [
                            { label: 'Cái', value: 'cai' },
                            { label: 'Bộ', value: 'bo' },
                          ],
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
                  name: 'tongtien',
                  label: 'Tổng giá trị xuất',
                  type: 'text',
                  admin: { readOnly: true },
                },
              ],
            },
          ],
        },
        {
          label: 'Báo Cáo',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'tong_gia_tri_quaythuoc',
                  label: 'Giá trị xuất - Quầy Thuốc ',
                  type: 'text',
                  admin: { readOnly: true },
                },
                {
                  name: 'tong_gia_tri_khoa',
                  label: 'Giá trị xuất - Khoa',
                  type: 'text',
                  admin: { readOnly: true },
                },
                {
                  name: 'tong_gia_tri_huyhang',
                  label: 'Giá trị xuất - Hủy Hàng',
                  type: 'text',
                  admin: { readOnly: true },
                },
              ],
            },
            {
              name: 'tong_gia_tri',
              label: 'Tổng giá trị phiếu xuất',
              type: 'text',
              admin: { readOnly: true },
            },
            { name: 'report_notes', label: 'Ghi chú báo cáo', type: 'textarea' },
          ],
        },
      ],
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [hookBaoGia, checkInventoryBeforeExport, hookCheckinfo, showPrice,autoAssignNguoiLapPhieu],
    afterRead: [showTotalPrice],
    afterChange: [hookxuatkho, hookNhapQuayThuoc, hookNhapKhoKhoa],
  },
}
