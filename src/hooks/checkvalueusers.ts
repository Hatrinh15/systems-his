import { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionBeforeValidateHook, CollectionBeforeLoginHook } from "payload";
import { APIError } from "payload";
import { Access ,AccessArgs } from "payload";
import { User } from "@/payload-types";
import { headers } from "next/headers";

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

//điều kiện xóa nhân viên khỏi khoa 
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
    const newDoctors = (department.doctors || []).filter((user: User) =>
      typeof user === 'string' ? user !== id : user?.id !== id
    )

    const newTruongkhoa = (department.truongkhoa || []).filter((user: User) =>
      typeof user === 'string' ? user !== id : user?.id !== id
    )

    const newNurses = (department.nures || []).filter((user: User) =>
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

// Hook kiểm tra trạng thái nghỉ việc và loại bỏ người khỏi phòng
export const removeUserFromClass: CollectionAfterChangeHook = async ({ req, doc, operation }) => {
  const { id, tinhtranglamviec } = doc;

  // Nếu trạng thái không phải là nghỉ việc thì bỏ qua
  if (tinhtranglamviec !== 'nghiviec') return;

  const payload = req.payload;

  // Tìm các phòng chứa người dùng này trong trường truongphong và nhanvien
  const roomsWithUser = await payload.find({
    collection: 'class',  // Sử dụng đúng collection phòng
    where: {
      or: [
        { truongphong: { contains: id } }, // Trưởng phòng
        { nhanvien: { contains: id } },    // Nhân viên
      ],
    },
    limit: 999,
  });

  for (const room of roomsWithUser.docs) {
    const newTruongPhong = (room.truongphong || []).filter((user: User) =>
      typeof user === 'string' ? user !== id : user?.id !== id
    );

    const newNhanVien = (room.nhanvien || []).filter((user: User) =>
      typeof user === 'string' ? user !== id : user?.id !== id
    );

    // Cập nhật lại thông tin phòng sau khi xóa nhân viên
    await payload.update({
      collection: 'class',
      id: room.id,
      data: {
        truongphong: newTruongPhong,
        nhanvien: newNhanVien,
      },
    });
  }
};

export const updateBoPhanDisplay: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data // kiểm tra nếu không có data thì return luôn

  const chucvu = data.chucvu ?? ''
  if (['bacsi', 'yta', 'duocsi', 'truongkhoa'].includes(chucvu)) {
    data.boPhanDisplay = data.khoa || 'Chưa rõ khoa'
  } else if (['quanly','nhanvienkho','ketoan', 'kythuatvien', 'truongphong'].includes(chucvu)) {
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
    { label: 'Phòng công nghệ thông tin', value: 'anninh' },
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
    chucvu === 'quanly' ||
    chucvu === 'ketoan' ||
    chucvu === 'nhanvienkho' ||
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
// ✅ Trưởng khoa hoặc trưởng phòng chỉ xem được nhân sự cùng khoa hoặc cùng phòng
export const canReadUsers: Access = async ({ req,id }): Promise<any> => {
  const referer = (await headers()).get('referer');
const isFromMedicalRecodsAdmin = referer?.includes('/admin/collections/MedicalRecods') || false;

if (isFromMedicalRecodsAdmin) {
  return true;
}

  const user = req.user;
  if(id !== undefined) {
    if(user && id === user.id) {
      return true
    }
  }
  if (user?.taikhoan === 'admin') {
    return true;
  }
  if(user?.taikhoan === 'user') {
    if(user.khoa) {
      return {
        khoa: {
          equals: user.khoa,
        }
      }
    }
    if(user.phong) {
      return {
        phong: {
          equals: user.phong
        }
      }
    }
  }
}; 

export const canUpdateUser: Access = ({ req }) => {
  const user = req.user;

  if (user?.taikhoan === 'admin') {
    return true;
  }
  if(user?.id) {
    return {
      id: {
        equals: user.id,
      }
    }
  }
  return false; // Không cho phép truy cập nếu không phải admin hoặc trưởng khoa/phòng
}; 
export const canReadUsersField: Access = ({ req,id })  => {
  const user = req.user;
  if (user?.taikhoan === 'admin') {
    return true;
  }
  if(id !== undefined) {
    if(user && id !== user.id) {
      return false
    }
  }
  return true
}

// export const checkLoginStatus: CollectionBeforeLoginHook = async ({ req }) => {
//   let email: string | undefined;

//   if (req.json) {
//     const body = await req.json(); // Parse the request body as JSON
//     email = body.email; // Lấy email từ yêu cầu đăng nhập
//   } else {
//     throw new APIError('Không thể lấy dữ liệu yêu cầu.',400);
//   }

//   if (!email) {
//     throw new APIError('Email không được để trống.',400);
//   }

//   // Lấy email từ yêu cầu đăng nhập
//   const user = await req.payload.find({
//     collection: 'users',
//     where: {
//       email: {
//         equals: email,
//       },
//     },
//   });

//   // Kiểm tra nếu người dùng có trạng thái nghỉ việc
//   if (user[0]?.tinhtranglamviec === 'nghiviec') {
//     throw new APIError('Tài khoản này đã bị khóa.',400);
//   }
// };