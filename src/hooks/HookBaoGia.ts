import { CollectionBeforeChangeHook } from "payload";

export const updateProductName: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (data?.category === "medications" && data?.item) {
    // Tìm thuốc theo ID
    const product = await req.payload.findByID({
      collection: "medications",
      id: data.item, 
    });

    data.sanpham = product?.name || "Không có"; // Gán tên sản phẩm
  } else if (data?.category === "medicalSupplies" && data?.items) {
    // Tìm vật tư theo ID
    const product = await req.payload.findByID({
      collection: "medicalSupplies",
      id: data.items, 
    });

    data.sanpham = product?.name || "Không có"; // Gán tên vật tư
  } else {
    data.sanpham = ""; // Để trống nếu không có sản phẩm
  }

  return data;
};
