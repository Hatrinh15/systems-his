import { CollectionAfterReadHook, CollectionBeforeChangeHook } from 'payload'
import { Access } from 'payload';
import { User } from '@/payload-types';
import { headers } from "next/headers";
export const setNgay: CollectionBeforeChangeHook = async ({ data,req }) => {
    const medicalRecordId = data.hosobenhan;  // Lấy id hồ sơ bệnh án từ dữ liệu
    if (!medicalRecordId) {
      return data;  // Nếu không có hồ sơ bệnh án, trả về dữ liệu không thay đổi
    }
     const   medicalRecord = await req.payload.findByID({
          collection: 'MedicalRecods', 
          id: medicalRecordId,
        });
    if (!medicalRecord || !Array.isArray(medicalRecord.hoso) || medicalRecord.hoso.length === 0) {
      return data;  // Kiểm tra mảng hoso có tồn tại và không rỗng
    }
    // Tìm hồ sơ có số hồ sơ khớp với dữ liệu đang cập nhật
    const matchingHoso = medicalRecord.hoso?.find(
      (hoso) => hoso.sohoso === data.sohoso  // Kiểm tra số hồ sơ giữa MedicalRecods và vienPhi
    );
    if (matchingHoso) {
      // Gán ngày nhập viện từ hồ sơ vào trường trong vienPhi nếu có
      if (matchingHoso.ngaynhapvien) {
        data.ngaynhapvien = matchingHoso.ngaynhapvien;
      }
      // Gán ngày ra viện (nếu có) từ hồ sơ vào trường trong vienPhi nếu tình trạng xuất viện là "yes"
      if (matchingHoso.tinhtrang === 'yes' && matchingHoso.tinhtrangxuatvien?.ngayRaVien) {
        data.ngayRaVien = matchingHoso.tinhtrangxuatvien.ngayRaVien;
      }
    }
    return data;
};
export const pricePhong : CollectionBeforeChangeHook = async ({data,req}) => {
  if(!data) return
  const convertToNumber = (str: any) => {
    if (str == null || str === '') return 0
    const numberValue = parseFloat(str.toString().replace(/\./g, '').replace(/,/g, '.'))
    return isNaN(numberValue) ? 0 : numberValue
  }
  const formatNumber = (value: any) => {
    if (value == null || value === '') return '0'
    if (typeof value === 'number') {
      return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 10,
      }).format(value)
    }
    const normalizedValue = value.toString().replace(/\./g, '').replace(/,/g, '.')
    const numberValue = parseFloat(normalizedValue)
    if (isNaN(numberValue)) return '0'
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 10,
    }).format(numberValue)
  }
  const medicalRecordId = data.hosobenhan
  const   medicalRecord = await req.payload.findByID({
    collection: 'MedicalRecods', 
    id: medicalRecordId,
  });
  if (!medicalRecord || !Array.isArray(medicalRecord.hoso) || medicalRecord.hoso.length === 0) {
    return data; 
  }
  const matchingHoso = medicalRecord.hoso.find(
    (hoso) => hoso.sohoso === data.sohoso 
  );
  const findRoom = await req.payload.find({
    collection: 'Rooms',
    where: {
      khoa: {equals: matchingHoso?.khoa}
    }
  })
  const ngaynhapvien = new Date(data.ngaynhapvien)
  const ngayRaVien = new Date(data.ngayRaVien)
  const diffInMs = Math.abs(ngayRaVien.getTime()-ngaynhapvien.getTime())
  const diffDay = Math.ceil(diffInMs/ (1000 * 60 * 60 * 24))
  findRoom.docs.forEach((dt) => {
    if(data.bhyt === 'co'){
      if (data.chietkhau === 'tammuoi') {
           const total = (convertToNumber(dt.giaphong)-convertToNumber(dt.giaphong)* 0.2) * diffDay 
    data.phinoitru = formatNumber(total)
      }
      else if (data.chietkhau === 'chinlam')  {
        const total = (convertToNumber(dt.giaphong)-convertToNumber(dt.giaphong)* 0.35) * diffDay 
        data.phinoitru = formatNumber(total)
      }
      else if (data.chietkhau === 'mottram'){
        const total = (convertToNumber(dt.giaphong)-convertToNumber(dt.giaphong)* 0.5) * diffDay 
        data.phinoitru = formatNumber(total)
      }
    } else {
      const total = convertToNumber(dt.giaphong) * diffDay
      data.phinoitru = formatNumber(total)
    }
 
  })
  return data
}  
export const showThuoc: CollectionBeforeChangeHook = async ({data,req}) => {
if(!data) return
const convertToNumber = (str: any) => {
  if (str == null || str === '') return 0
  const numberValue = parseFloat(str.toString().replace(/\./g, '').replace(/,/g, '.'))
  return isNaN(numberValue) ? 0 : numberValue
}
const formatNumber = (value: any) => {
  if (value == null || value === '') return '0'
  if (typeof value === 'number') {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 10,
    }).format(value)
  }
  const normalizedValue = value.toString().replace(/\./g, '').replace(/,/g, '.')
  const numberValue = parseFloat(normalizedValue)
  if (isNaN(numberValue)) return '0'
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 10,
  }).format(numberValue)
}
const dataThuoc: {
  [key: string] : {tenthuoc: any; soluong: number ; donvi: string;dongia: string ;tongtien: string} 
} = {}
const medicalRecordId = data.hosobenhan
  const   medicalRecord = await req.payload.findByID({
    collection: 'MedicalRecods', 
    id: medicalRecordId,
  });
  if (!medicalRecord || !Array.isArray(medicalRecord.hoso) || medicalRecord.hoso.length === 0) {
    return data; 
  }
  const matchingHoso = medicalRecord.hoso.find(
    (hoso) => hoso.sohoso === data.sohoso 
  );
if (matchingHoso?.thuoc && Array.isArray(matchingHoso.thuoc)) {
  for (const item of matchingHoso.thuoc) {
  const finPrice = await req.payload.find({
    collection: 'baogia',
    where: {
      item: {equals: item.tenthuoc}
    }
  })
  let price 
  finPrice.docs.forEach((item1) => { 
    if (data.bhyt === 'co' && item1.bhyt === 'co') {
      if (data.chietkhau === 'tammuoi') {
        if (item.donvi === 'hop') {
          price = item1.tam;
        } else if (item.donvi === item1.donvi) {
          price = item1.tammuoi;
        }
      } else if (data.chietkhau === 'chinlam') {
        if (item.donvi === 'hop') {
          price = item1.chin;
        } else if (item.donvi === item1.donvi) {
          price = item1.chinlam;
        }
      } else if (data.chietkhau === 'mottram') {
        if (item.donvi === 'hop') {
          price = item1.mot;
        } else if (item.donvi === item1.donvi) {
          price = item1.mottram;
        }
      }
    } else {
     
      if (item.donvi === 'hop') {
        price = item1.giaban;
      } else if (item.donvi === item1.donvi) {
        price = item1.tien;
      }
    }
   
  })
  
 const total = convertToNumber(price) * (item.quantity ?? 0)
    if (item.id && !dataThuoc[item.id]) {
      dataThuoc[item.id] = {
        tenthuoc: typeof  item.tenthuoc === 'object' && item.tenthuoc !== null ? item.tenthuoc.id : item.tenthuoc,
         soluong: item.quantity ?? 0,
          donvi: item.donvi ?? '',
          dongia: price,
          tongtien: formatNumber(total)
      }
    }
}
}
console.log(dataThuoc)
data.thuoc = Object.values(dataThuoc)
}
export const totalPrice :CollectionAfterReadHook = async ({doc}) => {
  const convertToNumber = (str: any) => {
    if (str == null || str === '') return 0
    const numberValue = parseFloat(str.toString().replace(/\./g, '').replace(/,/g, '.'))
    return isNaN(numberValue) ? 0 : numberValue
  }
  const formatNumber = (value: any) => {
    if (value == null || value === '') return '0'
    if (typeof value === 'number') {
      return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 10,
      }).format(value)
    }
    const normalizedValue = value.toString().replace(/\./g, '').replace(/,/g, '.')
    const numberValue = parseFloat(normalizedValue)
    if (isNaN(numberValue)) return '0'
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 10,
    }).format(numberValue)
  }
if(doc.thuoc.length > 0) {
  const totalThuoc = doc.thuoc.map((dt:any) => convertToNumber(dt.tongtien)).reduce((sum: number, value: number) => sum + value, 0)
  doc.chiphithuoc = formatNumber(totalThuoc)
  if(doc.phinoitru) {
    doc.tong = formatNumber(convertToNumber(doc.phinoitru) + totalThuoc)
  }
}
}
export const canReadVienPhi: Access = async ({ req }) => {

  const user = req.user as User
  if (!user) return false

  // Admin toàn quyền
  if (user.taikhoan === 'admin') return true

  const { chucvu, phong, khoa } = user

  // Người trong phòng hành chính - kế toán
  const isTaiChinhKeToan =
    phong === 'taichinhketoan' &&
    ['truongphong', 'ketoan'].includes(chucvu ?? '')

  // Người trong khoa Dược
  const isKhoaDuoc =
    khoa === 'khoaduoc' &&
    ['truongkhoa', 'duocsi'].includes(chucvu ?? '')

  return isTaiChinhKeToan || isKhoaDuoc
}
export const autoStaff: CollectionBeforeChangeHook = async ({ req, data, operation }) => {
  if (operation === 'create' && req.user) {
    const user = req.user as User;

    // Nếu chưa có sẵn giá trị từ client, sẽ tự động gán
    return {
      ...data,
      nhanvien: data?.nhanvien || user.id,             // Gán luôn ID người dùng đang đăng nhập
    };
  }

  return data;
};