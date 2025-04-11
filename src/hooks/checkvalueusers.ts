import { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionBeforeValidateHook } from "payload";
import { APIError } from "payload";

export const checkvalueuser: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === "create") {
    const errors: string[] = [];

    // Danh sách các trường bắt buộc
    const requiredFields = [
      { field: "name", message: "Họ và tên không được để trống." },
      { field: "sdt", message: "Số điện thoại không được để trống." },
      { field: "cccd", message: "Căn cước công dân không được để trống." },
      { field: "ngaysinh", message: "Ngày sinh không được để trống." },
      { field: "chucvu", message: "Chức vụ không được để trống." },
      { field: "tinhtranglamviec", message: "Tình trạng làm việc không được để trống." },
      { field: "ngayvaolam", message: "Ngày vào làm không được để trống." }, // ✅ Thêm ngày vào làm
    ];

    // Kiểm tra các trường bắt buộc
    requiredFields.forEach(({ field, message }) => {
      if (!data[field]) {
        errors.push(message);
      }
    });

    // Kiểm tra theo chức vụ
    if (["bacsi", "yta", "kythuatvien"].includes(data.chucvu)) {
      if (!data.bangcap) {
        errors.push("Bằng cấp chuyên môn không được để trống.");
      }
    }

    if (data.chucvu === "bacsi" && (!data.chungchi || data.chungchi.length === 0)) {
      errors.push("Bác sĩ bắt buộc phải có ít nhất một chứng chỉ hành nghề.");
    }

    // Kiểm tra trùng Số điện thoại
    const phoneCheck = await req.payload.find({
      collection: "users",
      where: { sdt: { equals: data.sdt } },
    });

    if (phoneCheck.totalDocs > 0) {
      errors.push("Số điện thoại đã được sử dụng.");
    }

    // Kiểm tra trùng Căn cước công dân (CCCD)
    const cccdCheck = await req.payload.find({
      collection: "users",
      where: { cccd: { equals: data.cccd } },
    });

    if (cccdCheck.totalDocs > 0) {
      errors.push("Căn cước công dân đã được sử dụng.");
    }

    // Nếu có lỗi, hiển thị thông báo lỗi chi tiết
    if (errors.length > 0) {
      throw new APIError(errors.join("\n"), 400);
    }
    

    console.log("check", data);
  }
};
export const removeUserFromDepartments: CollectionAfterChangeHook = async ({ req, doc }) => {
  const { id, tinhtranglamviec } = doc

  // Nếu không nghỉ việc thì bỏ qua
  if (tinhtranglamviec !== 'nghiviec') return

  const payload = req.payload

  // Tìm các khoa chứa user này trong truongkhoa, doctors hoặc nurses
  const departmentsWithUser = await payload.find({
    collection: 'departments',
    where: {
      or: [
        { truongkhoa: { contains: id } },
        { doctors: { contains: id } },
        { nures: { contains: id } },
      ],
    },
    limit: 999,
  })

  for (const department of departmentsWithUser.docs) {
    const newDoctors = (department.doctors || []).filter((user: any) =>
      typeof user === 'string' ? user !== id : user?.id !== id
    )

    const newTruongkhoa = (department.truongkhoa || []).filter((user: any) =>
      typeof user === 'string' ? user !== id : user?.id !== id
    )

    const newNurses = (department.nures || []).filter((user: any) =>
      typeof user === 'string' ? user !== id : user?.id !== id
    )

    await payload.update({
      collection: 'departments',
      id: department.id,
      data: {
        doctors: newDoctors,
        truongkhoa: newTruongkhoa,
        nures: newNurses,
      },
    })
  }
}
export const updateBoPhanDisplay: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data // kiểm tra nếu không có data thì return luôn

  const chucvu = data.chucvu ?? ''
  if (['bacsi', 'yta', 'duocsi', 'truongkhoa'].includes(chucvu)) {
    data.boPhanDisplay = data.khoa || 'Chưa rõ khoa'
  } else if (['letan', 'kythuatvien', 'truongphong'].includes(chucvu)) {
    data.boPhanDisplay = data.phong || 'Chưa rõ phòng'
  } else {
    data.boPhanDisplay = 'Không xác định'
  }

  return data
}

export const hookBoPhanHienThi: CollectionBeforeValidateHook = async ({ data }) => {
  const chucvu = data?.chucvu

  const khoaOptions = [
    { label: 'Khoa Tai', value: 'tai' },
    { label: 'Khoa Mũi Xoang', value: 'mui' },
    { label: 'Khoa Họng-Thanh Quản', value: 'hong' },
    { label: 'Khoa Cấp Cứu', value: 'capcuu' },
    { label: 'Khoa Gây Mê Hồi Sức', value: 'gaymehoisuc' },
    { label: 'Khoa Chẩn Đoán Hình Ảnh', value: 'chandoanhinhanh' },
    { label: 'Khoa Xét Nghiệm', value: 'khoaxetnghiem' },
    { label: 'Khoa Dược', value: 'khoaduoc' },
    { label: 'Khoa khác', value: 'khoakhac' },
  ]

  const phongOptions = [
    { label: 'Phòng hành chính-quản trị', value: 'hanhchinhquantri' },
    { label: 'Phòng tài chính-kế toán', value: 'taichinhketoan' },
    { label: 'Phòng an ninh', value: 'anninh' },
  ]

  let label = ''

  if (
    chucvu === 'bacsi' ||
    chucvu === 'yta' ||
    chucvu === 'duocsi' ||
    chucvu === 'truongkhoa'
  ) {
    label = khoaOptions.find((opt) => opt.value === data?.khoa)?.label || ''
  } else if (
    chucvu === 'letan' ||
    chucvu === 'kythuatvien' ||
    chucvu === 'truongphong'
  ) {
    label = phongOptions.find((opt) => opt.value === data?.phong)?.label || ''
  }

  return {
    ...data,
    boPhanDisplay: label,
  }
}