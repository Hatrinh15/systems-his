import { CollectionConfig } from 'payload'

import { hookBaoGia, hookNhapQuayThuoc, hookxuatkho, showPrice ,hookNhapKhoKhoa, checkInventoryBeforeExport ,hookCheckinfo} from '@/hooks/Hook_Xuat_Kho'

export const PhieuXuat: CollectionConfig = {
  slug: 'phieuxuat',
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
          label: 'Giao Dịch',
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
              filterOptions: () => ({
                khoa: { equals: 'khoaduoc' },
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
                    condition: (_, siblingData) => siblingData?.loai_xuat === 'khoa',
                  },
                },
                {
                  name: 'nguoinhan',
                  label: 'Người nhận',
                  type: 'relationship',
                  relationTo: 'users',
                  admin: {
                    condition: (_, siblingData) =>
                      siblingData?.loai_xuat === 'khoa' && siblingData?.destination,
                  },
                  filterOptions: async ({ req, data, siblingData }) => {
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
                        ...(department.truongkhoa || []),
                        ...(department.doctors || []),
                        ...(department.nures || []),
                      ]

                      return {
                        id: {
                          in: staffList.map((staff) =>
                            typeof staff === 'object' && staff != null ? staff.id : staff,
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
                        },
                        { name: 'quantity', label: 'Số lượng', type: 'number', min: 1 },
                        {
                          name: 'donvi',
                          label: 'Đơn vị',
                          type: 'text',
                          defaultValue: 'Hộp'
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
                          filterOptions: {
                            loaivattu: { equals: 'vattutieuhao' },
                          },
                        },
                        { name: 'quantity', label: 'Số lượng', type: 'number', min: 1 },
                        {
                          name: 'donvi',
                          label: 'Đơn vị',
                          type: 'text',
                          defaultValue:'Hộp'
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
                          filterOptions: {
                            loaivattu: { equals: 'maymocthietbi' },
                          },
                        },
                        { name: 'quantity', label: 'Số lượng', type: 'number', min: 1 },
                        {
                          name: 'donvi',
                          label: 'Đơn vị',
                          type: 'select',
                          options:[
                            {label: 'Cái',value: 'cai' },
                            {label: 'Bộ',value: 'bo'}
                          ]
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
          label: 'Báo cáo',
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
    beforeChange: [hookBaoGia,checkInventoryBeforeExport,hookCheckinfo,showPrice],
    afterRead: [showTotalPrice],
    afterChange: [hookxuatkho,hookNhapQuayThuoc, hookNhapKhoKhoa],
  },
}
