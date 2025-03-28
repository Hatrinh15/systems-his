import { CollectionBeforeChangeHook } from 'payload'

export const hookTinhGiaThuoc: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data) return data

  const formatNumber = (value: any) => {
    if (!value) return value
    const numberValue = Number(value.toString().replace(/\D/g, '')) // Loại bỏ ký tự không phải số
    return !isNaN(numberValue) ? new Intl.NumberFormat('vi-VN').format(numberValue) : value
  }

  // Duyệt qua từng thuốc trong đơn hàng
  await Promise.all(
    data.items?.map(async (sanpham) => {
      if (!sanpham) return

      // Nếu đã có giá thì không cần lấy lại
      if (sanpham.price) {
        sanpham.price = formatNumber(sanpham.price)
        return
      }

      // Lấy ID thuốc trong quầy thuốc
      const tenthuocId =
        typeof sanpham.medication === 'string' ? sanpham.medication : sanpham.medication?.id
      if (!tenthuocId) {
        return
      }

      try {
        // Tìm thuốc trong quầy thuốc
        const findThuoc = await req.payload.find({
          collection: 'pharmacies',
          where: { id: { equals: tenthuocId } },
          limit: 1,
        })

        if (findThuoc.docs.length > 0) {
          const pharmacyItem = findThuoc.docs[0] // Lấy thuốc từ quầy
          let giaXuat = '0' // Giá mặc định là 0

          // Kiểm tra đơn vị thuốc để lấy giá phù hợp
          if (sanpham?.donvi === 'hop') {
            giaXuat = pharmacyItem.price || '0' // Giá niêm yết
          } else {
            if (sanpham?.donvi === pharmacyItem.donvi) {
              giaXuat = pharmacyItem.tongtien || '0' // Giá bán lẻ
            } else if (sanpham?.donvi === pharmacyItem.units) {
              giaXuat = pharmacyItem.tongtien || '0'
            }
          }
          // Gán giá vào thuốc
          sanpham.price = formatNumber(giaXuat)

          // ✅ Tính tổng tiền
          if (sanpham.quantity) {
            const unitPrice = Number(giaXuat.toString().replace(/\D/g, ''))
            const totalPrice = unitPrice * Number(sanpham.quantity)
            sanpham.tien = formatNumber(totalPrice) // Cập nhật tổng tiền
          }
        }
      } catch (error) {
        console.error('❌ Lỗi khi lấy giá thuốc từ Quầy:', error)
      }
    }),
  )

  return data
}
