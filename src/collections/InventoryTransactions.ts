import { checkDate, hookNhapKho, showPrice, thongBaotrong } from '@/hooks/hookphieunhap'
import { CollectionConfig } from 'payload'

export const InventoryTransactions: CollectionConfig = {
  slug: 'inventorytransactions',
  labels: {
    singular: 'Phiếu Nhập Kho',
    plural: 'Phiếu Nhập Kho',
  },
  admin: {
    useAsTitle: 'transactiondate',
    defaultColumns: ['receiverorsender', 'transactiondate', 'giaodich'],
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
              label: 'Ngày giao dịch',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'd-MM-yyy',
                },
              },
            },
            {
              name: 'giaodich',
              label: 'Giao Dịch',
              type: 'array',
              fields: [
                {
                  name: 'nhacungcap',
                  label: 'Nhà cung cấp',
                  type: 'relationship',
                  relationTo: 'suppliers',
                },
                {
                  name: 'thoigian',
                  label: 'Thời gian nhận hàng',
                  type: 'group',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'gio', label: 'Giờ', type: 'number', min: 0, max: 24 },
                        { name: 'phut', label: 'Phút', type: 'number', min: 0, max: 60 },
                      ],
                    },
                  ],
                },
                {
                  name: 'receiverorsender',
                  label: 'Người nhận',
                  type: 'relationship',
                  relationTo: 'users',
                  filterOptions: async ({ data, req }) => {
                    try {
                      // Lấy danh sách bác sĩ thuộc Khoa Dược
                      const khoaDuoc = await req.payload.find({
                        collection: 'departments',
                        where: { tenkhoa: { equals: 'khoaduoc' } },
                        limit: 1, // Chỉ lấy khoa Dược
                      })

                      const khoaDuocData = khoaDuoc?.docs?.[0] // Lấy khoa đầu tiên (nếu có)
                      const doctorsInKhoaDuoc =
                        khoaDuocData?.doctors?.map((doc) =>
                          typeof doc === 'string' ? doc : doc?.id,
                        ) || []

                      // Kiểm tra nếu đã chọn bác sĩ trước đó
                      const selectedUser = data?.receiverorsender
                      const selectedUserId =
                        typeof selectedUser === 'string' ? selectedUser : selectedUser?.id

                      return {
                        and: [
                          { chucvu: { equals: 'duocsi' } }, // Chỉ lấy dược sĩ
                          {
                            or: [
                              { id: { in: doctorsInKhoaDuoc } }, // Chỉ lấy bác sĩ thuộc khoa Dược
                              { id: { equals: selectedUserId } }, // Giữ lại người đã chọn trước đó
                            ],
                          },
                        ],
                      } as any
                    } catch (error) {
                      console.error('Lỗi khi lọc Người nhận/Người xuất:', error)
                      return {}
                    }
                  },
                },
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
                          filterOptions: async ({ req, siblingData, data }) => {
                            if (!data) return false

                            const id = siblingData as { id?: string }

                            // Lưu danh sách nhà cung cấp từ giao dịch
                            const supplierMap = new Map<string, string>()
                            data?.giaodich?.forEach((dt: any) => {
                              if (dt.nhacungcap) {
                                supplierMap.set(dt.nhacungcap, dt.nhacungcap)
                              }
                            })

                            // Lấy danh sách thuốc
                            const findthuoc = await req.payload.find({
                              collection: 'medications',
                            })

                            if (!findthuoc?.docs || findthuoc.docs.length === 0) {
                              console.warn('Không tìm thấy thuốc nào trong cơ sở dữ liệu.')
                              return {}
                            }

                            // Tạo map nhóm thuốc theo nhà cung cấp
                            const thuocMap = new Map<string, string[]>()
                            findthuoc.docs.forEach((dc) => {
                              if (!dc.supplier) return
                              dc.supplier.forEach((pc) => {
                                const supplierId =
                                  typeof pc === 'object' && pc !== null ? pc.id : pc
                                const thuocId = typeof dc === 'object' && dc !== null ? dc.id : dc
                                if (!supplierId || !thuocId) return

                                if (!thuocMap.has(supplierId)) {
                                  thuocMap.set(supplierId, [])
                                }
                                thuocMap.get(supplierId)?.push(thuocId)
                              })
                            })

                            // Lọc thuốc dựa trên danh sách giao dịch
                            for (const dt of data?.giaodich ?? []) {
                              const findthuoc = thuocMap.get(dt.nhacungcap)

                              // Kiểm tra nếu dt.thuoc không phải là mảng
                              if (!Array.isArray(dt.thuoc)) continue

                              for (const pc of dt.thuoc) {
                                if (pc.id === id.id) {
                                  return {
                                    id: { in: findthuoc },
                                  } as any
                                }
                              }
                            }

                            return true
                          },
                        },
                        { name: 'quantity', label: 'Số lượng', type: 'number', min: 1 },
                        {
                          name: 'donvi',
                          label: 'Đơn vị',
                          type: 'select',
                          options: [
                            { value: 'thung', label: 'Thùng' },
                            { value: 'hop', label: 'Hộp' },
                          ],
                        },
                        {
                          name: 'quychuan',
                          label: 'Quy chuẩn (Hộp/Thùng)',
                          type: 'text',
                          admin: {
                            condition: (data, siblingData) => {
                              // Kiểm tra nếu 'hoso' tồn tại và có ít nhất một phần tử
                              if (siblingData.donvi === 'thung') {
                                return true
                              }
                              return false
                            },
                          },
                        },
                        {
                          name: 'tongsohop',
                          label: ' Tổng số hộp',
                          type: 'number',
                          admin: {
                            condition: (data, siblingData) => {
                              // Kiểm tra nếu 'hoso' tồn tại và có ít nhất một phần tử
                              if (siblingData.donvi === 'thung') {
                                return true
                              }
                              return false
                            },
                            readOnly: true,
                          },
                        },
                        { name: 'unitprice', label: 'Đơn giá (VNĐ)', type: 'text' },
                        {
                          name: 'totalprice',
                          label: 'Tổng tiền',
                          type: 'text',
                          admin: { readOnly: true },
                        },
                      ],
                    },
                  ],
                },
                {
                  name: 'vattu',
                  label: 'Vật tư tiêu hao',
                  type: 'array',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'tenvattu',
                          label: ' Tên vật tư tiêu hao',
                          type: 'relationship',
                          relationTo: 'medicalSupplies',
                          filterOptions: async ({ req, siblingData, data }) => {
                            if (!data) return false

                            const id = siblingData as { id?: string }

                            // Lưu danh sách nhà cung cấp từ giao dịch
                            const supplierMap = new Map<string, string>()
                            data?.giaodich?.forEach((dt: any) => {
                              if (dt.nhacungcap) {
                                supplierMap.set(dt.nhacungcap, dt.nhacungcap)
                              }
                            })

                            // Lấy danh sách vật tư
                            const findvattu = await req.payload.find({
                              collection: 'medicalSupplies',
                              where: {
                                loaivattu: { equals: 'vattutieuhao' },
                              },
                            })

                            if (!findvattu?.docs || findvattu.docs.length === 0) {
                              console.warn('Không tìm thấy thuốc nào trong cơ sở dữ liệu.')
                              return {}
                            }

                            // Tạo map nhóm thuốc theo nhà cung cấp
                            const vattuMap = new Map<string, string[]>()
                            findvattu.docs.forEach((dc) => {
                              if (!dc.supplier) return
                              dc.supplier.forEach((pc) => {
                                const supplierId =
                                  typeof pc === 'object' && pc !== null ? pc.id : pc
                                const vattuId = typeof dc === 'object' && dc !== null ? dc.id : dc
                                if (!supplierId || !vattuId) return

                                if (!vattuMap.has(supplierId)) {
                                  vattuMap.set(supplierId, [])
                                }
                                vattuMap.get(supplierId)?.push(vattuId)
                              })
                            })

                            // Lọc thuốc dựa trên danh sách giao dịch
                            for (const dt of data?.giaodich ?? []) {
                              const findvattu = vattuMap.get(dt.nhacungcap)

                              // Kiểm tra nếu dt.thuoc không phải là mảng
                              if (!Array.isArray(dt.vattu)) continue

                              for (const pc of dt.vattu) {
                                if (pc.id === id.id) {
                                  return {
                                    id: { in: findvattu },
                                  } as any
                                }
                              }
                            }

                            return true
                          },
                        },
                        { name: 'quantity', label: 'Số lượng', type: 'number', min: 1 },
                        {
                          name: 'donvi',
                          label: 'Đơn vị',
                          type: 'select',
                          options: [
                            { value: 'thung', label: 'Thùng' },
                            { value: 'hop', label: 'Hộp' },
                          ],
                        },
                        {
                          name: 'quychuan',
                          label: 'Quy chuẩn (Hộp/Thùng)',
                          type: 'number',
                          admin: {
                            condition: (data, siblingData) => {
                              // Kiểm tra nếu 'hoso' tồn tại và có ít nhất một phần tử
                              if (siblingData.donvi === 'thung') {
                                return true
                              }
                              return false
                            },
                          },
                        },
                        {
                          name: 'tongsohop',
                          label: ' Tổng số hộp',
                          type: 'number',
                          admin: {
                            condition: (data, siblingData) => {
                              // Kiểm tra nếu 'hoso' tồn tại và có ít nhất một phần tử
                              if (siblingData.donvi === 'thung') {
                                return true
                              }
                              return false
                            },
                            readOnly: true,
                          },
                        },
                        { name: 'unitprice', label: 'Đơn giá (VNĐ)', type: 'text' },
                        {
                          name: 'totalprice',
                          label: 'Tổng tiền',
                          type: 'text',
                          admin: { readOnly: true },
                        },
                      ],
                    },
                  ],
                },
                {
                  name: 'maymoc',
                  label: 'Máy móc thiết bị',
                  type: 'array',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'tenmaymoc',
                          label: 'Tên máy móc - thiết bị',
                          type: 'relationship',
                          relationTo: 'medicalSupplies',
                          filterOptions: async ({ req, siblingData, data }) => {
                            if (!data) return false

                            const id = siblingData as { id?: string }

                            // Lưu danh sách nhà cung cấp từ giao dịch
                            const supplierMap = new Map<string, string>()
                            data?.giaodich?.forEach((dt: any) => {
                              if (dt.nhacungcap) {
                                supplierMap.set(dt.nhacungcap, dt.nhacungcap)
                              }
                            })

                            // Lấy danh sách vật tư
                            const findmaymoc = await req.payload.find({
                              collection: 'medicalSupplies',
                              where: {
                                loaivattu: { equals: 'maymocthietbi' },
                              },
                            })

                            if (!findmaymoc?.docs || findmaymoc.docs.length === 0) {
                              console.warn('Không tìm thấy thuốc nào trong cơ sở dữ liệu.')
                              return {}
                            }

                            // Tạo map nhóm thuốc theo nhà cung cấp
                            const maymocMap = new Map<string, string[]>()
                            findmaymoc.docs.forEach((dc) => {
                              if (!dc.supplier) return
                              dc.supplier.forEach((pc) => {
                                const supplierId =
                                  typeof pc === 'object' && pc !== null ? pc.id : pc
                                const maymocId = typeof dc === 'object' && dc !== null ? dc.id : dc
                                if (!supplierId || !maymocId) return

                                if (!maymocMap.has(supplierId)) {
                                  maymocMap.set(supplierId, [])
                                }
                                maymocMap.get(supplierId)?.push(maymocId)
                              })
                            })

                            // Lọc thuốc dựa trên danh sách giao dịch
                            for (const dt of data?.giaodich ?? []) {
                              const findmaymoc = maymocMap.get(dt.nhacungcap)

                              // Kiểm tra nếu dt.thuoc không phải là mảng
                              if (!Array.isArray(dt.maymoc)) continue

                              for (const pc of dt.maymoc) {
                                if (pc.id === id.id) {
                                  return {
                                    id: { in: findmaymoc },
                                  } as any
                                }
                              }
                            }

                            return true
                          },
                        },
                        { name: 'quantity', label: 'Số lượng', type: 'number', min: 1 },
                        {
                          name: 'donvi',
                          label: 'Đơn vị',
                          type: 'select',
                          options: [
                            { value: 'cai', label: 'Cái' },
                            { value: 'bo', label: 'Bộ' },
                          ],
                        },
                        { name: 'unitprice', label: 'Đơn giá', type: 'text' },
                        {
                          name: 'totalprice',
                          label: 'Tổng tiền',
                          type: 'text',
                          admin: { readOnly: true },
                        },
                      ],
                    },
                  ],
                },
                {
                  name: 'tongtien',
                  label: 'Tổng giá trị ',
                  type: 'text',
                  admin: { readOnly: true },
                },
              ],
            },
          ],
        },
        {
          label: 'Báo cáo',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'tong_gia_tri_thuoc',
                  label: 'Giá trị nhập - Thuốc',
                  type: 'text',
                  admin: { readOnly: true },
                },
                {
                  name: 'tong_gia_tri_vtth',
                  label: 'Giá trị nhâp - Vật Tư Tiêu Hao',
                  type: 'text',
                  admin: { readOnly: true },
                },
                {
                  name: 'tong_gia_tri_mmtb',
                  label: 'Giá trị nhập - Máy Móc/Thiết Bị',
                  type: 'text',
                  admin: { readOnly: true },
                },
              ],
            },
            {
              name: 'tong_gia_tri',
              label: 'Tổng giá trị nhập',
              type: 'text',
              admin: { readOnly: true },
            },
            { name: 'report_notes', label: 'Ghi chú báo cáo', type: 'textarea' },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [showPrice, thongBaotrong],
    beforeValidate: [checkDate],
    afterChange: [hookNhapKho],
  },
}
export default InventoryTransactions
