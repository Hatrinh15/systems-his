import { CollectionConfig } from "payload";

export const Medications: CollectionConfig = {
  slug: 'medications',
  labels: {
    singular: 'DANH SÁCH THUỐC',
    plural: 'THUỐC',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'quantity', 'expiryDate', 'status'],
  },
  fields: [
    {
      name: 'name',
      label: 'Tên thuốc',
      type: 'text',
      required: true,
    },
    {
        name: 'activeIngredient',
        label: 'Hoạt chất',
        type: 'text',
        required: true,
        minLength: 2,
      },
    {
        name: 'category',
        label: 'Nhóm thuốc',
        type: 'select',
        required: true,
        options: [
          { label: 'Kháng sinh', value: 'khangsinh' },
          { label: 'Giảm đau', value: 'giamdau' },
          { label: 'Hạ sốt', value: 'hasot' },
          { label: 'Tim mạch', value: 'timmach' },
          { label: 'Tiêu hóa', value: 'tieudhoa' },
          { label: 'Tai mũi họng', value: 'taimuihong' },
          { label: 'Kháng viêm', value: 'khangviem' },
          { label: 'Dị ứng', value: 'diung' },
          { label: 'Sát khuẩn', value: 'satkhuan' },
          { label: 'Xịt mũi', value: 'xitmui' },
          { label: 'Siro ho', value: 'siroho' },
        ],
      },
      {
        name: 'dosageForm',
        label: 'Dạng bào chế',
        type: 'select',
        required: true,
        options: [
          { label: 'Viên nén', value: 'viennen' },
          { label: 'Dung dịch tiêm', value: 'tiem' },
          { label: 'Siro', value: 'siro' },
          { label: 'Xịt mũi', value: 'xitmui' },
          { label: 'Dung dịch súc miệng', value: 'sucmieng' },
        ],
      },
      {
        name: 'strength',
        label: 'Hàm lượng',
        type: 'text',
        required: true,
        validate: (value) => {
          value = value.trim(); // Loại bỏ khoảng trắng dư thừa
          if (!/^\d+\s?(mg|g|ml|mcg)$/i.test(value) && !/^\d+(mg|g|ml|mcg)$/i.test(value)) {
            return 'Hàm lượng phải có định dạng hợp lệ (VD: 100mg, 5g, 10ml)';
          }
          return true;
        } 
      },
    {
        name: 'unit',
        label: 'Đơn vị tính',
        type: 'select',
        required: true,
        options: [
          { label: 'Viên', value: 'vien' },
          { label: 'Lọ', value: 'lo' },
          { label: 'Ống', value: 'ong' },
          { label: 'Chai', value: 'chai' },
          { label: 'Gói', value: 'goi' },
        ],
      },
    {
      name: 'manufacturer',
      label: 'Nhà sản xuất',
      type: 'relationship',
      relationTo: 'suppliers',
    },
    {
      name: 'quantity',
      label: 'Số lượng tồn kho',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'ngayNhapKho',
      label: 'Ngày nhập kho',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
    {
        name: 'expiryDate',
        label: 'Hạn sử dụng',
        type: 'date',
        required: true,
        validate: (value) => {
            if (!value) return 'Hạn sử dụng là bắt buộc.';
            const today = new Date();
            const expiry = new Date(value);
            return expiry >= today ? true : 'Hạn sử dụng phải là một ngày trong tương lai.';
          }
      },
      {
        name: 'importPrice',
        label: 'Giá nhập',
        type: 'number',
        min: 0,
        validate: (value) => (value >= 0 ? true : 'Giá nhập không thể âm.'),
      },
      {
        name: 'sellPrice',
        label: 'Giá bán',
        type: 'number',
        min: 0,
        validate: (value, { data }) => {
          if (value < 0) return 'Giá bán không thể âm.';
          if (data.importPrice && value < data.importPrice) {
            return 'Giá bán không thể nhỏ hơn giá nhập.';
          }
          return true;
        },
      },
      {
        name: 'status',
        label: 'Trạng thái',
        type: 'select',
        required: true,
        options: [
          { label: 'Còn hàng', value: 'conhang' },
          { label: 'Sắp hết', value: 'saphet' },
          { label: 'Hết hàng', value: 'hethang' },
          { label: 'Hết hạn sử dụng', value: 'expired' },
        ],
      },
  ],
  hooks: {
    beforeChange: [async ({ data }) => {
      // Kiểm tra ngày hết hạn
      if (data.expiryDate && new Date(data.expiryDate) < new Date()) {
        data.status = 'expired'; // Nếu hết hạn sử dụng
      } 
      // Cập nhật trạng thái tự động dựa trên số lượng
      else if (data.quantity === 0) {
        data.status = 'hethang'; // Nếu hết hàng
      } else if (data.quantity > 0 && data.quantity < 10 && data.status !== 'saphet') {
        data.status = 'saphet'; // Nếu số lượng dưới 10 thì trạng thái là "Sắp hết"
      } else if (data.quantity >= 10 && data.status === 'saphet') {
        data.status = 'conhang'; // Nếu số lượng đủ thì trạng thái là "Còn hàng"
      }
      return data;
    }],
  },
  
  timestamps: true,
};
