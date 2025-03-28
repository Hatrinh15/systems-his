import {
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
  APIError,
  CollectionAfterChangeHook,
} from 'payload'

export const updateProductName: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (data?.category === 'medications' && data?.item) {
    // Tìm thuốc theo ID
    const product = await req.payload.findByID({
      collection: 'medications',
      id: data.item,
    })

    data.sanpham = product?.name || 'Không có' // Gán tên sản phẩm
  } else if (data?.category === 'medicalSupplies' && data?.items) {
    // Tìm vật tư theo ID
    const product = await req.payload.findByID({
      collection: 'medicalSupplies',
      id: data.items,
    })

    data.sanpham = product?.name || 'Không có' // Gán tên vật tư
  } else {
    data.sanpham = '' // Để trống nếu không có sản phẩm
  }

  return data
}

// 🟢 Hiển thị: Format số với dấu chấm ngăn cách
export const priceAfterRead: CollectionAfterReadHook = ({ doc }) => {
  const formatNumber = (value: any) => {
    if (!value) return value // Nếu không có giá trị, giữ nguyên

    // Chỉ giữ lại số, loại bỏ ký tự khác
    const numberValue = Number(value.toString().replace(/\D/g, ''))

    return !isNaN(numberValue) ? new Intl.NumberFormat('vi-VN').format(numberValue) : value
  }

  if (doc.gianhapnhacungcap && Array.isArray(doc.gianhapnhacungcap)) {
    let totalPrice = 0
    let count = 0

    doc.gianhapnhacungcap = doc.gianhapnhacungcap.map((item) => {
      const numericPrice = Number(item.gianhap?.toString().replace(/\D/g, '')) || 0

      if (numericPrice > 0) {
        totalPrice += numericPrice
        count++
      }

      return {
        ...item,
        gianhap: formatNumber(item.gianhap), // Hiển thị số có dấu chấm
      }
    })

    // Tính giá nhập trung bình
    const averagePrice = count > 0 ? Math.round(totalPrice / count) : 0
    doc.gianhaptrungbinh = formatNumber(averagePrice)

    // Tính giá bán lẻ nếu có đủ dữ liệu
    const thue = parseFloat(doc.thue) || 0 // Chuyển đổi thuế thành số
    const loinhuan = parseFloat(doc.loinhuan) || 0 // Chuyển đổi lợi nhuận thành số

    if (averagePrice > 0) {
      const giaBan = Math.round(averagePrice * (1 + thue / 100) * (1 + loinhuan / 100))
      doc.giaban = formatNumber(giaBan) // Hiển thị số có dấu chấm
    } else {
      doc.giaban = '0'
    }
    // Chuyển giá bán về số trước khi sử dụng trong phép tính
    const giaBanNumber = Number(doc.giaban?.toString().replace(/\D/g, '')) || 0
    const quychuan = Number(doc.quychuan) || 1 // Tránh chia cho 0
    const phantram = Number(doc.phantram) || 0

    if (giaBanNumber > 0 && quychuan > 0) {
      const giaTien = (giaBanNumber * (1 + phantram / 100)) / quychuan
      doc.tien = formatNumber(Math.round(giaTien))
    } else {
      doc.tien = '0'
    }
    //cho vật tư
    const giaBanNumbers = Number(doc.giaban?.toString().replace(/\D/g, '')) || 0
    const quychuans = Number(doc.quychuans) || 1 // Tránh chia cho 0
    const phantrams = Number(doc.phantrams) || 0

    if (giaBanNumbers > 0 && quychuans > 0) {
      const giaTien = (giaBanNumbers * (1 + phantrams / 100)) / quychuans
      doc.tiens = formatNumber(Math.round(giaTien))
    } else {
      doc.tien = '0'
    }
  }
}
export const thongBao: CollectionBeforeChangeHook = async ({ data }) => {
  const errors: string[] = []

  // Kiểm tra Sản phẩm (Thuốc hoặc Vật tư y tế)
  if (!data.item && !data.items) {
    errors.push('Vui lòng chọn sản phẩm (Thuốc hoặc Vật tư y tế)')
  }

  // Kiểm tra Nhà cung cấp và Giá nhập
  if (!Array.isArray(data.gianhapnhacungcap) || data.gianhapnhacungcap.length === 0) {
    errors.push('Vui lòng thêm ít nhất một Nhà cung cấp và Giá nhập')
  } else {
    data.gianhapnhacungcap.forEach((entry, index) => {
      if (!entry.nhacungcap) {
        errors.push(`Nhà cung cấp tại hàng ${index + 1} bị thiếu`)
      }
      if (!entry.gianhap || isNaN(Number(entry.gianhap)) || Number(entry.gianhap) <= 0) {
        errors.push(`Giá nhập tại hàng ${index + 1} chưa được nhập`)
      }
    })
  }
  // Nếu có lỗi, ném lỗi API
  if (errors.length > 0) {
    throw new APIError(`⚠️ Hãy kiểm tra lại:\n${errors.map((err) => `• ${err}`)}`, 400)
  }
}

export const hookPriceQuayThuoc: CollectionAfterChangeHook = async ({ doc, req }) => {
  try {
    if (!doc.item && !doc.items) return // Nếu không có sản phẩm thì bỏ qua

    const isMedication = doc.category === 'medications' // Kiểm tra loại sản phẩm
    const productId = isMedication ? doc.item : doc.items // ID của thuốc hoặc vật tư
    const pharmacyCollection = 'pharmacies'

    // 🔄 Tìm sản phẩm trong quầy thuốc
    const existingPharmacy = await req.payload.find({
      collection: pharmacyCollection,
      where: {
        [isMedication ? 'item' : 'items']: { equals: productId },
      },
      limit: 1,
    })

    if (existingPharmacy.docs.length > 0) {
      const pharmacyId = existingPharmacy.docs[0].id
      const currentQuantity = existingPharmacy.docs[0].quantity || 0 // Số lượng hiện có trong quầy thuốc
      const quyChuan = isMedication ? doc.quychuan : doc.quychuans // Quy chuẩn thuốc hoặc vật tư
      const calculatedQuantity = quyChuan ? quyChuan * currentQuantity : 0 // ✅ Tính tổng số lượng tự động

      // 🔄 Cập nhật thông tin vào quầy thuốc
      await req.payload.update({
        collection: pharmacyCollection,
        id: pharmacyId,
        data: {
          price: doc.giaban,
          donvi: doc.donvi,
          units: doc.donvis,
          quychuan: doc.quychuan,
          tongtien:doc.tien,
        },
      })
    }
  } catch (error) {
    console.error(' Lỗi khi cập nhật quầy thuốc từ bảng giá:', error)
  }
}
