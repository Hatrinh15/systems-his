import { CollectionBeforeChangeHook } from 'payload';

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

