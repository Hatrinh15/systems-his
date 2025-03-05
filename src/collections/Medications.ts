import { CollectionConfig } from "payload";
import { validateMedicationData} from "@/hooks/HookMedication";

export const Medications: CollectionConfig = {
  slug: "medications",
  labels: {
    singular: "THUỐC",
    plural: "THUỐC",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["code","name", "category", "unit", "expiryDate"],
  },
  fields: [
    {
      name: 'medicationpicture',
      type: 'upload',
      label: 'Ảnh thuốc',
      relationTo: 'media',
    },
    {
      name: "code",
      label: "Mã thuốc",
      type: "text",
      unique: true,
    },
    {
      name: "name",
      label: "Tên thuốc",
      type: "text",
    },
    {
      name: "category",
      label: "Loại thuốc",
      type: "select",
      options: [
        { label: "Kháng sinh", value: "khangsinh" },
        { label: "Giảm đau", value: "giamdau" },
        { label: "Huyết áp", value: "huyetap" },
        { label: "Tiêu hóa", value: "tieuhoa" },
        { label: "Tai mũi họng", value: "taimuihong" },
        { label: "Kháng viêm", value: "khangviem" },
        { label: "Dị ứng", value: "diung" },
        { label: "Sát khuẩn", value: "satkhuan" },
        { label: "Xịt mũi", value: "xitmui" },
        { label: "Siro ho", value: "siroho" },
        { label: "Khác", value: "khac" },
      ],
    },
    {
      name: "description",
      label: "Mô tả thuốc",
      type: "textarea",
    },
    {
      name: "dosage",
      label: "Liều lượng sử dụng",
      type: "textarea",
    },
    {
      name: "unit",
      label: "Đơn vị tính",
      type: "select",
      options: [
        { label: "Viên", value: "pill" },
        { label: "Lọ", value: "bottle" },
        { label: "Ống", value: "ampoule" },
        { label: "Chai", value: "flask" },
        { label: "Gói", value: "sachet" },
        { label: "Hộp", value: "box" },
      ],
    },
    {
      name: "activeIngredient",
      label: "Hoạt chất chính",
      type: "text",
    },
    {
      name: "sideEffects",
      label: "Tác dụng phụ",
      type: "textarea",
    },
    {
      name: "contraindications",
      label: "Chống chỉ định",
      type: "textarea",
    },
    {
      name: "supplier",
      label: "Nhà cung cấp",
      type: 'join',
      collection: 'suppliers',
      on: 'medications'
    },
    {
      name: "expiryDate",
      label: "Hạn sử dụng",
      type: "date",
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMM yyy',
        },
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [validateMedicationData], // Áp dụng hook kiểm tra dữ liệu trước khi validate
  },
};
