import { CollectionBeforeChangeHook } from "payload";

export const hookQuayThuoc: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (data.category === "medications" && data.item) {
    const medication = await req.payload.findByID({
      collection: "medications",
      id: data.item,
    });

    if (medication) {
      data.sanpham = medication.name;
    }
  } else if (data.category === "vattutieuhao" && data.items) {
    const supply = await req.payload.findByID({
      collection: "medicalSupplies",
      id: data.items,
    });

    if (supply) {
      data.sanpham = supply.name;
    }
  }
  return data;
};

