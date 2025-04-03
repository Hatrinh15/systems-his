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
    if (doc.bhyt === 'co' && giaBanNumber > 0) {
      const formatNumberSafe = (value: number) => {
        return value === 0 ? '0' : formatNumber(value)
      }

      // Nhóm 1: Tính theo giá bán
      doc.tam = formatNumber(Math.round(giaBanNumber - giaBanNumber * 0.8)) // 80%
      doc.chin = formatNumber(Math.round(giaBanNumber - giaBanNumber * 0.95)) // 95%
      doc.mot = formatNumberSafe(Math.round(giaBanNumber - giaBanNumber * 1)) // 100%

      // Nhóm 2: Tính theo tổng tiền
      const tienNumber = Number(doc.tien?.toString().replace(/\D/g, '')) || 0
      doc.tammuoi = formatNumber(Math.round(tienNumber - tienNumber * 0.8))
      doc.chinlam = formatNumber(Math.round(tienNumber - tienNumber * 0.95))
      doc.mottram = formatNumberSafe(Math.round(tienNumber - tienNumber * 1))
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

      // 🔄 Dữ liệu cập nhật
      const updateData: Record<string, any> = {
        price: doc.giaban,
        donvi: doc.donvi,
        units: doc.donvis,
        quychuan: doc.quychuan,
        tongtien: doc.tien,
        bhyt: doc.bhyt, // Tự động chọn BHYT khi có
      }

      // Nếu BHYT === 'co', thêm các mục 80%, 95%, 100%
      if (doc.bhyt === 'co') {
        updateData.tammuoi = doc.tammuoi
        updateData.chinlam = doc.chinlam
        updateData.mottram = doc.mottram

        updateData.tam = doc.tam
        updateData.chin = doc.chin
        updateData.mot = doc.mot
      }
      if (isMedication) {
        updateData['item'] = productId
      } else {
        updateData['items'] = productId
      }
      // 🔄 Cập nhật vào quầy thuốc
      await req.payload.update({
        collection: pharmacyCollection,
        id: pharmacyId,
        data: updateData,
      })
    }
  } catch (error) {
    console.error('🚨 Lỗi khi cập nhật quầy thuốc từ bảng giá:', error)
  }
}
