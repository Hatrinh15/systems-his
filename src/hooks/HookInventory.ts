import { CollectionBeforeChangeHook } from 'payload';
import { APIError } from 'payload';

export const inventoryHook: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data) return data;

  let productName = '';

  // Xử lý cập nhật tên sản phẩm cho trường 'sanpham'
  if (data.category === 'medications' && data.item) {
    const medication = await req.payload.findByID({
      collection: 'medications',
      id: data.item,
    });
    productName = medication?.name || '';
  }

  if (
    (data.category === 'vattutieuhao' || data.category === 'maymocthietbi') &&
    data.items
  ) {
    const medicalSupply = await req.payload.findByID({
      collection: 'medicalSupplies',
      id: data.items,
    });
    productName = medicalSupply?.name || '';
  }

  return {
    ...data,
    sanpham: productName, // Cập nhật giá trị cho 'sanpham'
  };
};

export const hookCheckInfo: CollectionBeforeChangeHook = async ({ data, req, operation, originalDoc }) => {
  // 📌 1. Không cho thay đổi danh mục khi cập nhật
  if (operation === 'update') {
    if (originalDoc?.category && data?.category && originalDoc.category !== data.category) {
      throw new APIError('Danh mục đã chọn không thể thay đổi.', 400)
    }
  }

  // 🔁 2. Mapping tên field sang label tiếng Việt
  const fieldLabels: Record<string, string> = {
    unit: 'Đơn vị tính',
    // quantity: 'Số lượng tồn kho',
    stockstatus: 'Tình trạng hàng hóa',
    reorderlevel: 'Mức cảnh báo tồn kho',
    // supplier: 'Nhà cung cấp',
  }

  // ✅ 3. Kiểm tra các trường bắt buộc
  const requiredFields = Object.keys(fieldLabels)
  for (const field of requiredFields) {
    if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
      throw new APIError(`Hãy điền đầy đủ thông tin ${fieldLabels[field]}.`, 400)
    }
  }

  // 🔍 4. Kiểm tra sản phẩm theo danh mục
  if (data.category === 'medications' && !data.item) {
    throw new APIError('Vui lòng chọn Sản phẩm thuốc.', 400)
  }

  if (
    (data.category === 'vattutieuhao' || data.category === 'maymocthietbi') &&
    !data.items
  ) {
    throw new APIError('Vui lòng chọn Sản phẩm vật tư hoặc thiết bị.', 400)
  }

  return data
}

export const hookQuantity: CollectionBeforeChangeHook = async ({ data }) => {
  const quantity = data.quantity ?? 0
  const reorderLevel = data.reorderlevel ?? 10

  if (quantity === 0) {
    data.stockstatus = 'hethang'
  } else if (quantity <= reorderLevel) {
    data.stockstatus = 'saphet'
  } else {
    data.stockstatus = 'conhang'
  }

  return data
}