import { CollectionBeforeChangeHook,APIError } from 'payload'

export const hookQuayThuoc: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (data.category === 'medications' && data.item) {
    const medication = await req.payload.findByID({
      collection: 'medications',
      id: data.item,
    })

    if (medication) {
      data.sanpham = medication.name
    }
  } else if (data.category === 'vattutieuhao' && data.items) {
    const supply = await req.payload.findByID({
      collection: 'medicalSupplies',
      id: data.items,
    })

    if (supply) {
      data.sanpham = supply.name
    }
  }
  return data
}
export const hookcheck: CollectionBeforeChangeHook = async ({ data, originalDoc, operation }) => {
  if (!data.category) {
    throw new APIError('Vui lòng chọn danh mục (Thuốc hoặc Vật tư tiêu hao).',400)
  }
  // ⚠️ Chỉ áp dụng khi cập nhật (not create)
  if (operation === 'update') {
    // Nếu đã có danh mục và người dùng cố gắng đổi danh mục → báo lỗi
    if (originalDoc?.category && data?.category && data.category !== originalDoc.category) {
      throw new APIError('Không được thay đổi Danh mục sau khi đã chọn.',400)
    }
  }

  // 🔒 Bắt buộc phải chọn sản phẩm tương ứng với danh mục
  if (data?.category === 'medications' && !data?.item) {
    throw new APIError('Hãy điền đủ tên sản phẩm thuốc.',400)
  }

  if (data?.category === 'vattutieuhao' && !data?.items) {
    throw new APIError('Hãy điền đủ tên sản phẩm vật tư tiêu hao.',400)
  }

  return data
}

export const hookTinhTrangHang: CollectionBeforeChangeHook = async ({ data }) => {
  const quantity = data.quantity || 0
  const reorderLevel = data.reorderlevel || 10 // mặc định nếu không nhập

  if (quantity === 0) {
    data.stockstatus = 'hethang'
  } else if (quantity <= reorderLevel) {
    data.stockstatus = 'saphet'
  } else {
    data.stockstatus = 'conhang'
  }

  return data
}