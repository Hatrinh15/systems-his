import { CollectionBeforeChangeHook, CollectionAfterChangeHook ,APIError,PayloadRequest} from 'payload'

export const hookTinhGiaThuoc: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data) {
    console.error('🚨 Lỗi: `data` không tồn tại!')
    return data
  }

  // ✅ Format giữ đúng số thực
  const formatNumber = (value: any) => {
    if (!value) return '0'

    // Nếu giá trị là chuỗi có dấu `.`, giữ nguyên
    if (typeof value === 'string' && /^\d{1,3}(\.\d{3})*$/.test(value)) {
      return value
    }

    // Xóa dấu `.` nếu có trước khi chuyển thành số
    const numberValue = Number(value.toString().replace(/\./g, ''))

    return isNaN(numberValue) ? value : numberValue.toLocaleString('vi-VN')
  }

  // 🟢 Kiểm tra danh sách thuốc
  const danhSachThuoc = data.bhyt?.items
  if (!Array.isArray(danhSachThuoc)) {
    console.warn('⚠️ Cảnh báo: Không có danh sách thuốc hợp lệ.')
    return data
  }

  // 🟢 Lấy loại giảm giá
  const discountType = data.bhyt?.loai || ''

  try {
    await Promise.all(
      danhSachThuoc.map(async (sanpham, index) => {
        if (!sanpham) {
          console.warn(`⚠️ Sản phẩm ở index ${index} không hợp lệ.`)
          return
        }

        if (sanpham.price) {
          sanpham.price = formatNumber(sanpham.price)
          return
        }

        // Lấy ID thuốc trong quầy
        const tenthuocId =
          typeof sanpham.medication === 'string' ? sanpham.medication : sanpham.medication?.id

        if (!tenthuocId) {
          console.warn('⚠️ Không tìm thấy ID thuốc:', sanpham)
          return
        }

        // 🟢 Tìm thuốc trong quầy thuốc
        const findThuoc = await req.payload.find({
          collection: 'pharmacies',
          where: { id: { equals: tenthuocId } },
          limit: 1,
        })

        if (!findThuoc || !findThuoc.docs || findThuoc.docs.length === 0) {
          console.warn('⚠️ Không tìm thấy thuốc trong quầy:', tenthuocId)
          return
        }

        const pharmacyItem = findThuoc.docs[0] // ✅ Đã chắc chắn có giá trị
        let giaXuat: number = 0
        const donviTrung =
          sanpham.donvi === pharmacyItem.donvi || sanpham.donvi === pharmacyItem.units

        // ⚡️ Xác định giá theo loại giảm giá
        if (donviTrung) {
          let giaTri =
            discountType === 'tamtram'
              ? pharmacyItem.tammuoi
              : discountType === 'chinlam'
                ? pharmacyItem.chinlam
                : discountType === 'mottram'
                  ? pharmacyItem.mottram
                  : pharmacyItem.tongtien

          // Nếu giá trị là chuỗi có dấu `.`, loại bỏ dấu `.` trước khi chuyển thành số
          if (typeof giaTri === 'string') {
            giaTri = giaTri.replace(/\./g, '')
          }

          giaXuat = Number(giaTri) || 0
        } else if (sanpham.donvi === 'hop') {
          let giaTri =
            discountType === 'tamtram'
              ? pharmacyItem.tam
              : discountType === 'chinlam'
                ? pharmacyItem.chin
                : discountType === 'mottram'
                  ? pharmacyItem.mot
                  : pharmacyItem.price

          // Nếu giá trị là chuỗi có dấu `.`, loại bỏ dấu `.` trước khi chuyển thành số
          if (typeof giaTri === 'string') {
            giaTri = giaTri.replace(/\./g, '')
          }

          giaXuat = Number(giaTri) || 0
        }

        // Gán giá vào sản phẩm
        sanpham.price = formatNumber(giaXuat)
        sanpham.tongtien = formatNumber(giaXuat)

        if (sanpham.quantity) {
          const unitPrice = Number(giaXuat.toString().replace(/\D/g, ''))
          const totalPrice = unitPrice * Number(sanpham.quantity)
          sanpham.tien = formatNumber(totalPrice) // Cập nhật tổng tiền
        }
      }),
    )
  } catch (error) {
    console.error('❌ Lỗi hệ thống khi tính giá thuốc:', error)
  }

  return data
}

//tính giá tiền bên dịch vụ vừa bhyt, không bhyt
export const hookTinhGiaThuocSanpham: CollectionBeforeChangeHook = async ({ data, req }) => {
  // 🟢 Hàm định dạng số thành dạng `1.000.000`
  const formatNumber = (value: any) => {
    if (!value) return value
    const numberValue = Number(value.toString().replace(/\D/g, '')) // Loại bỏ ký tự không phải số
    return !isNaN(numberValue) ? new Intl.NumberFormat('vi-VN').format(numberValue) : value
  }

  // 🟢 Duyệt qua từng dịch vụ trong đơn hàng
  await Promise.all(
    data.dichvu?.item?.map(async (sanpham) => {
      if (!sanpham) return

      // Nếu đã có giá thì chỉ cần format lại
      if (sanpham.prices) {
        sanpham.prices = formatNumber(sanpham.prices)
        return
      }

      // 🟢 Lấy ID thuốc từ `sanpham` hoặc `medications`
      const tenthuocId =
        typeof sanpham.sanpham === 'string'
          ? sanpham.sanpham
          : sanpham.sanpham?.id || typeof sanpham.medications === 'string'
            ? sanpham.medications
            : sanpham.medications?.id

      if (!tenthuocId) {
        return
      }

      try {
        // 🟢 Tìm thuốc trong collection `pharmacies`
        const findThuoc = await req.payload.find({
          collection: 'pharmacies',
          where: { id: { equals: tenthuocId } },
          limit: 1,
        })

        if (findThuoc.docs.length > 0) {
          const pharmacyItem = findThuoc.docs[0] // ✅ Lấy thuốc từ quầy
          let giaBan = '0' // Mặc định giá là 0

          // 🟢 Kiểm tra đơn vị thuốc để lấy giá phù hợp
          if (sanpham?.donvis === 'hop') {
            giaBan = pharmacyItem.price || '0' // Giá hộp
          } else {
            if (sanpham?.donvis === pharmacyItem.donvi) {
              giaBan = pharmacyItem.tongtien || '0' // Giá bán lẻ
            } else if (sanpham?.donvis === pharmacyItem.units) {
              giaBan = pharmacyItem.tongtien || '0'
            }
          }

          // ✅ Cập nhật giá vào sản phẩm
          sanpham.prices = formatNumber(giaBan)

          // ✅ Tính tổng tiền nếu có số lượng
          if (sanpham.quantitys) {
            const unitPrice = Number(giaBan.toString().replace(/\D/g, ''))
            const totalPrice = unitPrice * Number(sanpham.quantitys)
            sanpham.tiens = formatNumber(totalPrice) // Cập nhật tổng tiền
          }
        }
      } catch (error) {
        console.error('❌ Lỗi khi lấy giá thuốc từ Quầy:', error)
      }
    }),
  )

  return data
}

//tính tổng tiền
export const hookTinhTongDonThuoc: CollectionBeforeChangeHook = async ({ data }) => {
  if (!data) return data

  // ✅ Hàm format số theo chuẩn Việt Nam
  const formatNumber = (value: any) => {
    if (!value) return '0'
    return new Intl.NumberFormat('vi-VN').format(Number(value))
  }

  let tongGiaTri = 0

  // 🟢 Tính tổng từ danh sách BHYT
  if (Array.isArray(data.bhyt?.items)) {
    tongGiaTri += data.bhyt.items.reduce((sum, item) => {
      return sum + (Number(item.tien?.toString().replace(/\D/g, '')) || 0)
    }, 0)
  }

  // 🟢 Tính tổng từ danh sách dịch vụ
  if (Array.isArray(data.dichvu?.item)) {
    tongGiaTri += data.dichvu.item.reduce((sum, item) => {
      return sum + (Number(item.tiens?.toString().replace(/\D/g, '')) || 0)
    }, 0)
  }

  // ✅ Gán tổng giá trị đơn thuốc
  data.totalprice = formatNumber(tongGiaTri)

  return data
}

// trừ số lượng bên quầy thuốc
export const hookTruThuocQuay: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  previousDoc,
}) => {
  try {
    const inventoryMap = new Map()
    const findInventory = await req.payload.find({
      collection: 'pharmacies',
      limit: 1000,
    })
    findInventory.docs.forEach((dc) => {
      inventoryMap.set(`${dc.id}`, { ...dc, totalQuantity: 0 })
    })

    const exportMap = new Map()
    const previousExportMap = new Map()

    // 👉 Nếu là update, hoàn lại số lượng cũ trước khi trừ số lượng mới
    if (operation === 'update' && previousDoc) {
      if (Array.isArray(previousDoc.bhyt?.items)) {
        for (const item of previousDoc.bhyt.items) {
          const key = `${item.medication}`
          previousExportMap.set(key, (previousExportMap.get(key) || 0) + item.quantity)
        }
      }
      if (Array.isArray(previousDoc.dichvu?.item)) {
        for (const item of previousDoc.dichvu.item) {
          const key = `${item.medications}`
          previousExportMap.set(key, (previousExportMap.get(key) || 0) + item.quantitys)
        }
      }
      if (Array.isArray(previousDoc.dichvu?.item)) {
        for (const item of previousDoc.dichvu.item) {
          const key = `${item.sanpham}`
          previousExportMap.set(key, (previousExportMap.get(key) || 0) + item.quantitys)
        }
      }
    }

    // 👉 Lấy số lượng mới
    if (doc.baohiemyte === 'yes') {
      if (Array.isArray(doc.bhyt?.items)) {
        for (const item of doc.bhyt.items) {
          const key = `${item.medication}`
          exportMap.set(key, (exportMap.get(key) || 0) + item.quantity)
        }
      }
      if (Array.isArray(doc.dichvu?.item)) {
        for (const item of doc.dichvu.item) {
          const key = `${item.medications}`
          exportMap.set(key, (exportMap.get(key) || 0) + item.quantitys)
        }
      }
    } else {
      if (Array.isArray(doc.dichvu?.item)) {
        for (const item of doc.dichvu.item) {
          const key = `${item.sanpham}`
          exportMap.set(key, (exportMap.get(key) || 0) + item.quantitys)
        }
      }
    }

    // 👉 Cập nhật kho (trả lại số lượng cũ + trừ số lượng mới)
    for (const [exportId, exportQuantity] of exportMap.entries()) {
      const oldQuantity = previousExportMap.get(exportId) || 0
      const delta = exportQuantity - oldQuantity

      console.log(`🔄 Xử lý sản phẩm ID: ${exportId}, Thay đổi số lượng: ${delta}`)

      if (delta !== 0) {
        const findItem = inventoryMap.get(exportId)
        console.log(findItem)
        if (findItem) {
          const {
            quantity: originalQuantity,
            soluong: originalSoluong,
            quychuan,
            unit,
            donvi,
          } = findItem

          // 🔎 Lấy đơn vị của sản phẩm trong đơn hàng
          const exportItem =
            doc.bhyt?.items?.find((item) => item.medication === exportId) ||
            doc.dichvu?.item?.find(
              (item) => item.medications === exportId || item.sanpham === exportId,
            )

          const exportUnit = exportItem?.donvi || exportItem?.donvis || '' // Đơn vị của đơn hàng

          let newQuantity = originalQuantity
          let newSoluong = originalSoluong

          if (exportUnit === 'hop') {
            // ✅ Khi chọn đơn vị HỘP, chỉ trừ quantity & soluong theo hộp
            console.log(`🟢 Chọn đơn vị HỘP - Trừ số hộp: ${delta}`)
            newQuantity = originalQuantity - delta // Giảm số hộp
            newSoluong = originalSoluong - delta * quychuan // Trừ tổng số viên
          }
          if (exportUnit === unit || exportUnit === donvi) {
            if (exportUnit !== 'hop') {
              console.log(`🔵 Chọn đơn vị VIÊN - Trừ số viên: ${delta}`)

              // 🔹 Tổng số viên sau khi trừ
              const totalUsedSoluong = originalSoluong - delta

              // 🔹 Tính số hộp có thể trừ
              const hopCanTru = Math.floor(totalUsedSoluong / quychuan)

              newQuantity = hopCanTru // Giảm hộp nếu đủ số viên
              newSoluong = totalUsedSoluong // Số viên còn lại
            }
            // ✅ Khi chọn đơn vị khác nhưng trùng với kho, trừ soluong
          }

          // Đảm bảo không có số âm
          newQuantity = Math.max(newQuantity, 0)
          newSoluong = Math.max(newSoluong, 0)

          console.log(
            `✅ Cập nhật sản phẩm ${exportId}: Quantity mới = ${newQuantity}, Số lượng mới = ${newSoluong}`,
          )

          await req.payload.update({
            collection: 'pharmacies',
            id: findItem.id,
            data: { quantity: newQuantity, soluong: newSoluong },
          })
        } else {
          console.warn(`⚠️ Không tìm thấy sản phẩm ${exportId} trong kho, bỏ qua cập nhật.`)
        }
      }
    }
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật kho:', error)
  }
}

export const hookCheckOrderDate: CollectionBeforeChangeHook = async ({ req, data, originalDoc, operation }) => {
  const isCreating = operation === 'create'

  // Điều kiện 1: Không được chọn ngày trong tương lai
  if (data.orderdate) {
    const selectedDate = new Date(data.orderdate)
    selectedDate.setHours(0, 0, 0, 0) // Cắt phần giờ

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate > today) {
      throw new APIError('Ngày mua không được ở tương lai.', 400)
    }
  }

  // Điều kiện 2: Không được chỉnh sửa phiếu đã tạo
  if (!isCreating) {
    throw new APIError('Phiếu đã được tạo, không thể chỉnh sửa.', 400)
  }

  return data
}

export const hookValidateOrderFields: CollectionBeforeChangeHook = async ({ data, operation }) => {
  const errors: string[] = []

  // 1. Bệnh nhân
  if (!data.customer) {
    errors.push('Vui lòng chọn bệnh nhân mua thuốc.')
  }

  // 2. BHYT
  if (!data.baohiemyte) {
    errors.push('Vui lòng chọn thông tin BHYT (Có / Không).')
  }

  // 3. Ngày mua
  if (!data.orderdate) {
    errors.push('Vui lòng chọn ngày mua.')
  }

  // 4. Nhân viên bán hàng
  if (!data.staff) {
    errors.push('Vui lòng chọn nhân viên bán hàng.')
  }

  // 5. Hình thức thanh toán
  if (!data.paymentmethod) {
    errors.push('Vui lòng chọn hình thức thanh toán.')
  }

  // 6. Danh sách thuốc BHYT (nếu có BHYT)
  if (data.baohiemyte === 'yes') {
    const bhytItems = data?.bhyt?.items
    if (!bhytItems || bhytItems.length === 0) {
      errors.push('Danh sách thuốc BHYT không được để trống.')
    } else {
      bhytItems.forEach((item, index) => {
        if (!item.medication) errors.push(`Thuốc BHYT hàng ${index + 1} chưa chọn sản phẩm.`)
        if (!item.quantity) errors.push(`Thuốc BHYT hàng ${index + 1} chưa nhập số lượng.`)
        if (!item.donvi) errors.push(`Thuốc BHYT hàng ${index + 1} chưa chọn đơn vị.`)
      })
    }
  }

  // 7. Danh sách thuốc dịch vụ (nếu không BHYT hoặc dịch vụ)
  const dvItems = data?.dichvu?.item
  if (!dvItems || dvItems.length === 0) {
    errors.push('Danh sách thuốc dịch vụ không được để trống.')
  } else {
    dvItems.forEach((item, index) => {
      const hasMed = item?.medications || item?.sanpham
      if (!hasMed) errors.push(`Thuốc dịch vụ hàng ${index + 1} chưa chọn sản phẩm.`)
      if (!item.quantitys) errors.push(`Thuốc dịch vụ hàng ${index + 1} chưa nhập số lượng.`)
      if (!item.donvi) errors.push(`Thuốc dịch vụ hàng ${index + 1} chưa chọn đơn vị.`)
    })
  }

  // 8. Nếu có lỗi, ném lỗi về
  if (errors.length > 0) {
    throw new APIError(errors.join('\n'), 400)
  }

  return data
}







