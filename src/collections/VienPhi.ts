import { CollectionConfig } from "payload";
import { setNgay,pricePhong,showThuoc , totalPrice, autoStaff, canReadVienPhi} from "@/hooks/HookVienPhi";
import { isAdmin,isAdminDuocSi } from "@/hooks/AccessAdmin";

export const vienPhi: CollectionConfig = {
    slug: 'vienphi',
     access: { 
        create: isAdminDuocSi,
        update: isAdminDuocSi,
        delete: isAdminDuocSi,
        read : canReadVienPhi
      },
    labels: {
      singular: 'Viện Phí',
      plural: 'Viện Phí',
    },
    admin: {
        useAsTitle: 'hosobenhan',
        group: 'Quản Lý Phiếu & Bảng Giá',
      },
    fields:[
        {
            name: 'hosobenhan',
            label:'Tên bệnh nhân',
            type:'relationship',
            relationTo:'MedicalRecods',
            admin: {
                allowCreate: false
            }
        },
        {
            name: 'sohoso',
            label:'Số hồ sơ bênh án',
            type: 'text'
        },
        {
            name:'bhyt',
            label:'Bảo hiểm y tế',
            type :'radio',
            options:[
                {label:'Có',value:'co'},
                {label:'Không',value:'khong'}
            ]
        },
        {
            name:'chietkhau',
            label: 'Chiết khấu BHYT',
            type: 'select',
            admin: { condition: (data) => data?.bhyt === 'co' },
            options:[
                {label:'80',value:'tammuoi' },
                {label: '95', value: 'chinlam'},
                {label: '100',value: 'mottram'}
            ]
        },
        {
            name:'ngaynhapvien',
            label:'Ngày nhập viện',
            type:'date',
            admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'dd-MM-yyy',
                },
              },
        },
        {
            name:'ngayRaVien',
            label:'Ngày ra viện',
            type:'date',
            admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'dd-MM-yyy',
                },
              },
        },
        {
            name:'phinoitru',
            label: 'Chi phí nội trú',
            type:'text',
        },
        {
            name: 'thuoc',
            label: 'Thuốc điều trị',
            type:'array',
            admin: {
                readOnly: true
                
            },
            fields:[
                {
                    type:'row',
                    fields:[
                        {
                            name: 'tenthuoc',
                            label:'Tên thuốc',
                            type: 'relationship',
                            relationTo: 'medications',
                            admin: {
                                allowCreate: false
                            }
                        },
                        {
                            name: 'soluong',
                            label: 'Số lượng',
                            type: 'number'
                        },
                        {
                            name: 'donvi',
                            label: 'Đơn vị',
                            type: 'select',
                            options:[
                                { label: 'Viên', value: 'vien' },
                                { label: 'Ống', value: 'ong' },
                                { label: 'Lọ', value: 'lo' },
                                { label: 'Gói', value: 'goi' },
                                { label: 'Hộp', value: 'hop' },
                            ]
                        },
                        {
                            name:'dongia',
                            label:'Đơn giá',
                            type: 'text',
                        },
                        {
                            name: 'tongtien',
                            label: 'Tổng tiền',
                            type: 'text',
                        },
                    ]
                },
            ]
        },
        {
            name:'chiphithuoc',
            label:'Chi phí thuốc',
            type: 'text',
        },
        {
            name: 'tong',
            label:'Tổng viện phí',
            type: 'text',
        },
        {
            name: 'ngaythu',
            label:'Ngày thu',
            type: 'date',
            admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                  displayFormat: 'dd-MM-yyy',
                },
              },
        },
        {
            name:'nhanvien',
            label: 'Nhân viên thu',
            type:'relationship',
            relationTo: 'users',
            admin: {
                allowCreate: false
            },
            filterOptions: () => ({
                khoa: { equals: 'khoaduoc' },
              }),
        },
        {
            name: 'thanhtoan',
            label: 'Hình thức thanh toán',
            type: 'select',
            options: [
              { label: 'Tiền mặt', value: 'cash' },
              { label: 'Thẻ', value: 'card' },
            ]
        },
        {
            name:'ghichu',
            label: 'Ghi chú',
            type: 'textarea'
        }
    ],
    hooks:{
        beforeChange: [setNgay,pricePhong,showThuoc,autoStaff],
        afterRead: [ totalPrice]
    }
}