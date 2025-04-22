import { APIError, CollectionBeforeChangeHook, CollectionBeforeValidateHook } from 'payload'
import { PayloadRequest } from 'payload'

export const hookPhieuSuDung: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  const currentDate = new Date()
  // Chỉ lấy ngày mà không quan tâm đến giờ, phút, giây
  const currentDateOnly = new Date(currentDate.setHours(0, 0, 0, 0))

  const usageDate = new Date(data.usagedate)
  const usageDateOnly = new Date(usageDate.setHours(0, 0, 0, 0))

  // Điều kiện 1: Ngày sử dụng/hủy hàng không được ở tương lai
  if (usageDateOnly > currentDateOnly) {
    throw new APIError('Ngày sử dụng/hủy hàng không được ở tương lai.', 400)
  }

  // Nếu là phiếu mới (create) → Kiểm tra ngày tạo phiếu
  if (operation === 'create') {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(currentDate.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    if (usageDateOnly < sevenDaysAgo) {
      throw new APIError('Ngày sử dụng/hủy hàng không được quá 7 ngày so với hiện tại.', 400)
    }
  }

  // Nếu là chỉnh sửa (update) → Không cho chỉnh sửa sau 7 ngày
  if (operation === 'update') {
    const createdDate = new Date(data.createdAt)
    const createdDateOnly = new Date(createdDate.setHours(0, 0, 0, 0))

    const sevenDaysAfterCreated = new Date(createdDateOnly)
    sevenDaysAfterCreated.setDate(createdDateOnly.getDate() + 7)
    sevenDaysAfterCreated.setHours(0, 0, 0, 0)

    if (currentDateOnly > sevenDaysAfterCreated) {
      throw new APIError('Phiếu đã quá 7 ngày, không thể chỉnh sửa.', 400)
    }
  }

  return data
}

export const hookxuatKhoKhoa: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!data.department) return data

  // Chỉ xử lý khi là "create" hoặc "update"
  if (operation !== 'create' && operation !== 'update') return data
  // Lấy thông tin khoa từ collection "departments"
  const department = await req.payload.findByID({
    collection: 'departments',
    id: data.department,
  })

  if (!department || !Array.isArray(department.departmentInventory)) return data

  // Clone danh sách sản phẩm trong kho khoa
  const updatedInventory = [...department.departmentInventory]

  // Hàm cập nhật số lượng trong kho
  const updateQuantity = (category: string, itemId: string, quantity: number) => {
    const index = updatedInventory.findIndex(
      (i) =>
        i.category === category &&
        ((typeof i.item === 'string' && i.item === itemId) ||
          (typeof i.item === 'object' && i.item?.id?.toString() === itemId) ||
          (typeof i.items === 'string' && i.items === itemId) ||
          (typeof i.items === 'object' && i.items?.id?.toString() === itemId)),
    )

    if (index !== -1) {
      const item = updatedInventory[index]
      const currentQuantity = item.quantity ?? 0

      if (currentQuantity + quantity >= 0) {
        item.quantity = currentQuantity + quantity // Cập nhật số lượng
      }
    }
  }

  // ✅ **Bước 1: Cộng lại số lượng từ phiếu cũ (nếu có)**
  if (operation === 'update' && originalDoc) {
    const prevProducts = originalDoc.danhsachsanpham
    if (prevProducts) {
      if (prevProducts.thuoc) {
        prevProducts.thuoc.forEach(({ tenthuoc, quantity }) => {
          updateQuantity('medications', tenthuoc, quantity) // Cộng lại thuốc cũ
        })
      }

      if (prevProducts.vattutieuhao) {
        prevProducts.vattutieuhao.forEach(({ supply, quantity }) => {
          updateQuantity('vattutieuhao', supply, quantity)
        })
      }

      if (prevProducts.maymocthietbi) {
        prevProducts.maymocthietbi.forEach(({ equipment, quantity }) => {
          updateQuantity('maymocthietbi', equipment, quantity)
        })
      }
    }
  }

  // ✅ **Bước 2: Trừ đi số lượng từ phiếu mới**
  const { danhsachsanpham } = data
  if (danhsachsanpham) {
    if (danhsachsanpham.thuoc) {
      danhsachsanpham.thuoc.forEach(({ tenthuoc, quantity }) => {
        updateQuantity('medications', tenthuoc, -quantity) // Trừ đi thuốc mới
      })
    }

    if (danhsachsanpham.vattutieuhao) {
      danhsachsanpham.vattutieuhao.forEach(({ supply, quantity }) => {
        updateQuantity('vattutieuhao', supply, -quantity)
      })
    }

    if (danhsachsanpham.maymocthietbi) {
      danhsachsanpham.maymocthietbi.forEach(({ equipment, quantity }) => {
        updateQuantity('maymocthietbi', equipment, -quantity)
      })
    }
  }

  // ✅ **Bước 3: Cập nhật kho khoa trong collection "departments"**
  await req.payload.update({
    collection: 'departments',
    id: data.department,
    data: { departmentInventory: updatedInventory },
  })

  return data // Trả về dữ liệu đã xử lý
}

export const autoFillUnitPrice = async ({ data, req }) => {
  try {
    if (data.danhsachsanpham) {
      const allProducts = [
        ...(data.danhsachsanpham.thuoc || []),
        ...(data.danhsachsanpham.vattutieuhao || []),
        ...(data.danhsachsanpham.maymocthietbi || []),
      ]

      for (const item of allProducts) {
        const productId = item.tenthuoc || item.supply || item.equipment
        if (!productId) {
          console.log('⚠️ Bỏ qua sản phẩm không có ID:', item)
          continue
        }

        let category = ''
        let fieldName = '' // Trường cần truy vấn trong bảng báo giá

        if (item.tenthuoc) {
          category = 'medications'
          fieldName = 'item' // Thuốc lưu trong 'item'
        } else if (item.supply) {
          category = 'medicalSupplies'
          fieldName = 'items' // Vật tư lưu trong 'items'
        } else if (item.equipment) {
          category = 'medicalSupplies'
          fieldName = 'items' // Máy móc cũng lưu trong 'items'
        }

        // Kiểm tra điều kiện truy vấn
        const condition = { [fieldName]: { equals: productId } }
        if (category) {
          condition['category'] = { equals: category }
        }

        // Truy vấn bảng báo giá
        const priceEntry = await req.payload.find({
          collection: 'baogia',
          where: condition,
          limit: 1,
        })

        if (priceEntry.docs.length > 0) {
          const giaNhapTrungBinh = priceEntry.docs[0].gianhaptrungbinh || 0
          item.unitprice = giaNhapTrungBinh
        }
      }
    }
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật đơn giá từ bảng giá:', error)
  }
}

export const autoCalculateTotalPrice: CollectionBeforeChangeHook = async ({ data }) => {
  if (!data) return data
  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN') // Chỉ trả về giá trị số đã định dạng
  }

  const calculateTotalForItems = (items: any[]) => {
    return (
      items?.map((item) => {
        if (!item.quantity || !item.unitprice) {
          return item
        }
        const quantity = Number(item.quantity)
        const unitPrice = parseFloat(item.unitprice.replace(/\./g, '')) // Loại bỏ dấu chấm (nếu có)
        if (isNaN(quantity) || isNaN(unitPrice)) {
          return item // Bỏ qua nếu giá trị không hợp lệ
        }

        // Tính tổng giá trị
        const totalPrice = quantity * unitPrice
        if (isNaN(totalPrice)) {
          return item
        }
        const itemName = item.name || 'Unnamed Item'
        item.totalprice = formatCurrency(totalPrice)
        return item
      }) || []
    )
  }
  if (data.danhsachsanpham) {
    if (data.danhsachsanpham.thuoc) {
      data.danhsachsanpham.thuoc = calculateTotalForItems(data.danhsachsanpham.thuoc)
    }
    if (data.danhsachsanpham.vattutieuhao) {
      data.danhsachsanpham.vattutieuhao = calculateTotalForItems(data.danhsachsanpham.vattutieuhao)
    }
    if (data.danhsachsanpham.maymocthietbi) {
      data.danhsachsanpham.maymocthietbi = calculateTotalForItems(
        data.danhsachsanpham.maymocthietbi,
      )
    }
  }

  return data
}

export const calculateTotalValues: CollectionBeforeChangeHook = async ({ data }) => {
  if (!data) return data
  const calculateTotal = (items: any[]) => {
    return (
      items?.reduce((total, item) => {
        if (!item.totalprice || !item.unitprice || !item.quantity) {
          return total
        }
        const itemTotalPrice = parseFloat(item.totalprice.replace(/\./g, '').replace('₫', ''))
        return total + (isNaN(itemTotalPrice) ? 0 : itemTotalPrice)
      }, 0) || 0
    )
  }

  // Tính tổng giá trị cho từng loại sản phẩm
  let totalThuoc = 0
  let totalVTTieuHao = 0
  let totalMMTB = 0

  if (data.danhsachsanpham) {
    if (data.danhsachsanpham.thuoc) {
      totalThuoc = calculateTotal(data.danhsachsanpham.thuoc)
    }
    if (data.danhsachsanpham.vattutieuhao) {
      totalVTTieuHao = calculateTotal(data.danhsachsanpham.vattutieuhao)
    }
    if (data.danhsachsanpham.maymocthietbi) {
      totalMMTB = calculateTotal(data.danhsachsanpham.maymocthietbi)
    }
  }

  // Hàm định dạng số với dấu ngăn cách
  const formatNumber = (number: number) => {
    return new Intl.NumberFormat('vi-VN').format(number)
  }

  // Cập nhật tổng giá trị cho từng nhóm sản phẩm
  data.tong_gia_tri_thuoc = formatNumber(totalThuoc) // Định dạng số
  data.tong_gia_tri_vtth = formatNumber(totalVTTieuHao) // Định dạng số
  data.tong_gia_tri_mmtb = formatNumber(totalMMTB) // Định dạng số

  // Cập nhật tổng giá trị của phiếu
  const totalValue = totalThuoc + totalVTTieuHao + totalMMTB
  data.tong_gia_tri = formatNumber(totalValue) // Định dạng số

  return data
}

export const hookcheckvalue: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  const errors: string[] = []

  const requiredFields = [
    { field: 'loaiphieu', label: 'Loại phiếu' },
    { field: 'usagedate', label: 'Ngày sử dụng/hủy hàng' },
    { field: 'department', label: 'Khoa sử dụng' },
    { field: 'staff', label: 'Nhân viên thực hiện' },
    { field: 'danhsachsanpham', label: 'Danh sách sản phẩm' },
  ]

  // Kiểm tra các trường bắt buộc
  for (const { field, label } of requiredFields) {
    if (!data[field]) {
      errors.push(`Hãy điền đủ thông tin ."${label}" là bắt buộc.`)
    }
  }

  // Kiểm tra trường 'danhsachsanpham' nếu có sản phẩm
  if (data.danhsachsanpham) {
    const { thuoc, vattutieuhao, maymocthietbi } = data.danhsachsanpham

    // Kiểm tra thuốc
    if (
      thuoc &&
      thuoc.some((item, index) => {
        const missingFields: string[] = [] // Chỉ định kiểu mảng là string[]
        if (!item.tenthuoc) missingFields.push('Tên thuốc')
        if (!item.quantity) missingFields.push('Số lượng')
        // if (!item.lido) missingFields.push('Lí do sử dụng/hủy hàng');
        if (missingFields.length > 0) {
          errors.push(
            `Thuốc trong mục thứ ${index + 1} không được để trống: ${missingFields.join(', ')}.`,
          )
        }
      })
    )
      return // Nếu có lỗi, dừng kiểm tra

    // Kiểm tra vật tư tiêu hao
    if (
      vattutieuhao &&
      vattutieuhao.some((item, index) => {
        const missingFields: string[] = [] // Chỉ định kiểu mảng là string[]
        if (!item.supply) missingFields.push('Tên vật tư')
        if (!item.quantity) missingFields.push('Số lượng')
        // if (!item.lido) missingFields.push('Lí do sử dụng/hủy hàng');
        if (missingFields.length > 0) {
          errors.push(
            `Vật tư tiêu hao trong mục thứ  ${index + 1} không được để trống: ${missingFields.join(', ')}.`,
          )
        }
      })
    )
      return // Nếu có lỗi, dừng kiểm tra

    // Kiểm tra máy móc thiết bị
    if (
      maymocthietbi &&
      maymocthietbi.some((item, index) => {
        const missingFields: string[] = [] // Chỉ định kiểu mảng là string[]
        if (!item.equipment) missingFields.push('Tên thiết bị')
        if (!item.quantity) missingFields.push('Số lượng')
        // if (!item.lido) missingFields.push('Lí do sử dụng/hủy hàng');
        if (missingFields.length > 0) {
          errors.push(
            `Máy móc/Thiết bị trong mục thứ  ${index + 1}không được để trống: ${missingFields.join(', ')}.`,
          )
        }
      })
    )
      return // Nếu có lỗi, dừng kiểm tra
  }

  // Kiểm tra "Người xác nhận hủy" nếu loại phiếu là hủy hàng
  if (data.loaiphieu === 'huyhang' && !data.nguoixacnhanhuy) {
    errors.push('"Người xác nhận hủy" là bắt buộc.')
  }

  // Nếu có lỗi, ném tất cả lỗi cùng một lúc
  if (errors.length > 0) {
    throw new APIError(errors.join('\n'), 400)
  }

  return data
}

export const checkInventoryBeforeUsage = async ({
  data,
  req,
}: {
  data: any
  req: PayloadRequest
}) => {
  console.log('>>> Bắt đầu kiểm tra kho khoa')

  if (!data.department) {
    console.log('❌ Không có khoa sử dụng, dừng kiểm tra.')
    return
  }

  const departmentId = data.department // Khoa sử dụng
  console.log('✅ Khoa sử dụng:', departmentId)

  // Định nghĩa kiểu dữ liệu
  type InventoryItem = {
    category: string
    itemId: string
    requiredQuantity: number
  }

  const itemsToCheck: InventoryItem[] = []

  // Thuốc
  if (data.danhsachsanpham?.thuoc?.length) {
    console.log('📌 Danh sách thuốc cần kiểm tra:', data.danhsachsanpham.thuoc)
    data.danhsachsanpham.thuoc.forEach((item) => {
      itemsToCheck.push({
        category: 'medications',
        itemId: String(item.tenthuoc) || '',
        requiredQuantity: item.quantity || 0,
      })
    })
  }

  // Vật tư tiêu hao
  if (data.danhsachsanpham?.vattutieuhao?.length) {
    console.log('📌 Danh sách vật tư tiêu hao cần kiểm tra:', data.danhsachsanpham.vattutieuhao)
    data.danhsachsanpham.vattutieuhao.forEach((item) => {
      itemsToCheck.push({
        category: 'vattutieuhao',
        itemId: String(item.supply) || '',
        requiredQuantity: item.quantity || 0,
      })
    })
  }

  // Máy móc / Thiết bị
  if (data.danhsachsanpham?.maymocthietbi?.length) {
    console.log('📌 Danh sách máy móc / thiết bị cần kiểm tra:', data.danhsachsanpham.maymocthietbi)
    data.danhsachsanpham.maymocthietbi.forEach((item) => {
      itemsToCheck.push({
        category: 'maymocthietbi',
        itemId: String(item.equipment) || '',
        requiredQuantity: item.quantity || 0,
      })
    })
  }

  console.log('📊 Tổng số mục cần kiểm tra:', itemsToCheck.length)
  console.table(itemsToCheck)

  if (itemsToCheck.length === 0) {
    console.log('❌ Không có sản phẩm để kiểm tra, dừng xử lý.')
    return
  }

  // Lấy dữ liệu kho khoa của khoa được chọn
  console.log('🔍 Đang lấy dữ liệu kho khoa của khoa ID:', departmentId)
  const department = await req.payload.findByID({
    collection: 'departments',
    id: departmentId,
  })

  if (!department || !department.departmentInventory) {
    console.log('❌ Không tìm thấy kho khoa hoặc kho trống, dừng kiểm tra.')
    return
  }

  console.log('📦 Dữ liệu kho khoa:', department.departmentInventory)
  const inventoryMap = new Map()
  department.departmentInventory.forEach((item) => {
    const medicationsId =
      typeof item.item === 'object' && item.item !== null ? item.item.id : item.item
    const supplyid =
      typeof item.items === 'object' && item.items !== null ? item.items.id : item.items
    const key = `${item.category}-${String(medicationsId || supplyid) || ''}`
    inventoryMap.set(key, item.quantity || 0)
  })

  console.log('📌 Dữ liệu kho đã được ánh xạ:')
  console.table(Array.from(inventoryMap.entries()))

  const errors: string[] = []

  // Kiểm tra từng sản phẩm có đủ số lượng không
  itemsToCheck.forEach(({ category, itemId, requiredQuantity }) => {
    const key = `${category}-${itemId}`
    const availableQuantity = inventoryMap.get(key) || 0

    console.log(
      `🔍 Kiểm tra sản phẩm: ${itemId}, cần ${requiredQuantity}, tồn kho ${availableQuantity}`,
    )

    if (requiredQuantity > availableQuantity) {
      console.log(`❌ Không đủ số lượng: ${itemId}`)
      errors.push(
        `Không đủ số lượng cho sản phẩm: ${itemId} (cần ${requiredQuantity}, tồn kho ${availableQuantity})`,
      )
    } else {
      console.log(`✅ Đủ số lượng: ${itemId}`)
    }
  })

  if (errors.length > 0) {
    console.log('⚠️ Lỗi kiểm tra kho:', errors)
    throw new APIError(errors.join('\n'), 400)
  }

  console.log('🎉 Tất cả sản phẩm đều đủ số lượng!')
}
export const lockLoaiPhieu: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  operation,
}) => {
  // Kiểm tra nếu đang update và có originalDoc và data
  if (operation === 'update' && originalDoc?.loaiphieu && data?.loaiphieu) {
    // Nếu loại phiếu đã bị thay đổi
    if (data.loaiphieu !== originalDoc.loaiphieu) {
      // ❌ Thông báo lỗi rõ ràng
      throw new APIError('Loại phiếu không thể thay đổi sau khi đã tạo.', 400)
    }
  }

  return data
}
