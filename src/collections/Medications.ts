import { CollectionConfig } from "payload";
import { validateMedicationData} from "@/hooks/HookMedication";

export const Medications: CollectionConfig = {
  slug: "medications",
  labels: {
    singular: "Thuốc",
    plural: "Thuốc",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["code","name", "category", "unit", "expiryDate"],
    group:'Dược Và Vật Tư Y Tế'
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
      name :'bhyt',
      label: 'Bảo hiểm y tế',
      type: 'select',
      required:true,
      options:[
        {label: 'Có',value: 'co'},
        {label: 'Không',value: 'khong'},
      ],
      defaultValue: 'co'
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
     type:'relationship',
     relationTo:'suppliers',
     hasMany:true,
    },
    {
      name: 'note',
      label: 'Ghi chú',
      type: 'textarea',
    }
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [validateMedicationData], // Áp dụng hook kiểm tra dữ liệu trước khi validate
  },
};
