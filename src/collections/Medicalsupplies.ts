import { CollectionConfig } from "payload";
import { hookMedicalSupplies} from "@/hooks/HookMedicalSupplies";

export const medicalSupplies: CollectionConfig = {
  slug: "medicalSupplies",
  labels: {
    singular: "VẬT TƯ Y TẾ",
    plural: "VẬT TƯ Y TẾ",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["code", "name", "category", "unit", "expirydate"],
  },
  fields: [
    {
      name: "code",
      label: "Mã vật tư",
      type: "text",
      unique: true,
    },
    {
      name: "name",
      label: "Tên vật tư y tế",
      type: "text",
    },
    {
      name: "category",
      label: "Loại vật tư",
      type: "select",
      options: [
        { label: "Dùng chung", value: "dungchung" },
        { label: "Phẫu thuật", value: "phauthuat" },
        { label: "Khử khuẩn & Tiệt trùng", value: "khukhuantiettrung" },
        { label: "Chăm sóc vết thương", value: "chamsocvetthuong" },
        { label: "Thiết bị chẩn đoán", value: "thietbichandoan" },
        { label: "Dụng cụ tiêm & truyền dịch", value: "dungcutiemvatruyendich" },
        { label: "Vật tư phòng mổ", value: "vattuphongmo" },
      ],
    },
    {
      name: "description",
      label: "Công dụng",
      type: "textarea",
    },
    {
      name: "unit",
      label: "Đơn vị tính",
      type: "select",
      options: [
        { label: "Cái", value: "cai" },
        { label: "Hộp", value: "hop" },
        { label: "Túi", value: "tui" },
        { label: "Vỉ", value: "vi" },
        { label: "Ống", value: "ong" },
        { label: "Chai", value: "chai" },
        { label: "Lít (L)", value: "lit" },
        { label: "Mililit (ml)", value: "ml" },
        { label: "Kg", value: "kg" },
        { label: "Gram", value: "gram" },
      ],
    },
    {
      name: "packaging",
      label: "Quy cách đóng gói",
      type: "text",
    },
    {
      name: "manufacturer",
      label: "Hãng sản xuất",
      type: "text",
    },
    {
      name: "supplier",
      label: "Nhà cung cấp",
      type: 'join',
      collection: 'suppliers',
      on:'medicalsupplies',
    },
    {
      name: "expirydate",
      label: "Hạn sử dụng",
      type: "date",
      required: false,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMM yyy',
        },
      },
    },
    {
      name: "notes",
      label: "Ghi chú đặc biệt",
      type: "textarea",
    },

  ],
  timestamps: true,
  hooks: {
      beforeValidate: [hookMedicalSupplies], // Áp dụng hook kiểm tra dữ liệu trước khi validate
    },
};
