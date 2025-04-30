import { APIError, CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionBeforeValidateHook } from 'payload'

import isEqual from 'lodash/isEqual';

export const valuemedicalrecord: CollectionBeforeValidateHook = ({ data }) => {
  if (!data || !Array.isArray(data.hoso)) {
    throw new APIError('Hãy nhập thông tin hồ sơ hợp lệ!', 400)
  }

  const error: string[] = []

  data.hoso.forEach((record, index) => {
    if (!record || typeof record !== 'object') {
      error.push(`Hồ sơ ${index + 1} không hợp lệ!`)
      return
    }

    const errorArray: string[] = []

    // if (!record.bacsi) errorArray.push('Bác sĩ')
    if (!record.ngaynhapvien) errorArray.push('Ngày nhập viện')
    if (!record.chuandoan) errorArray.push('Chuẩn đoán')

    // Kiểm tra phương pháp điều trị
    if (!record.ppdt || !record.ppdt.phuongphap) {
      errorArray.push('Phương pháp điều trị')
    }

    // Kiểm tra tình trạng (bắt buộc)
    if (!record.tinhtrang) {
      errorArray.push('Tình trạng')
    } else if (record.tinhtrang === 'yes') {
      // Nếu là "Đã xuất viện", kiểm tra mục `tinhtrangxuatvien`
      const tinhtrang = record.tinhtrangxuatvien
      if (
        !tinhtrang ||
        !tinhtrang.ngayRaVien ||
        !tinhtrang.xuatvien
      ) {
        errorArray.push('Thông tin xuất viện (ngày ra viện, tình trạng xuất viện)')
      }
    }

    if (errorArray.length > 0) {
      error.push(`Hồ sơ ${index + 1} hãy điền đủ thông tin: ${errorArray.join(', ')}`)
    }
  })

  if (error.length > 0) {
    throw new APIError(error.join('\n'), 400)
  }
}

export const valueho_so: CollectionBeforeValidateHook = ({ data, originalDoc }) => {


  if (!data) return

  // Kiểm tra nếu dữ liệu liên quan đến kết quả nội soi (ketqua) có thay đổi thì mới validate
  if (!data.ketqua && originalDoc?.ketqua) {
    data.ketqua = originalDoc.ketqua // Giữ nguyên dữ liệu cũ nếu không có thay đổi
    return
  }

  const error: string[] = []
  if (Array.isArray(data.ketqua)) {
    data.ketqua.forEach((err, index) => {
      const errorArray: string[] = []
      // if (!err.ngay) errorArray.push('Ngày thực hiện')
      // if (!err.bacsi) errorArray.push('Bác sĩ')
      if (!err.ketquanoisoi) errorArray.push('Kết quả nội soi')
      if (!err.hinhanh) errorArray.push('Hình ảnh nội soi')
      // if (!err.chuandoan) errorArray.push('Chuẩn đoán')
      if (!err.huongdieutri) errorArray.push('Hướng điều trị')

      if (errorArray.length > 0) {
        error.push(`Hồ sơ ${index + 1} hãy điền đủ thông tin: ${errorArray.join(', ')}`)
      }
    })
  }

  if (error.length > 0) {
    throw new APIError(error.map((err) => `, ${err}`).join('\n'), 400)
  }
}

export const preventDuplicateMedicalRecord: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  if (!data.thongtinbenhnhan) return // Không có thông tin bệnh nhân thì bỏ qua
  // Tìm kiếm các hồ sơ bệnh án trùng lặp (bỏ qua nếu là chính nó)
  if (data.thongtinbenhnhan !== originalDoc.thongtinbenhnhan) {
    const existingRecord = await req.payload.find({
      collection: 'MedicalRecods',
      where: {
        thongtinbenhnhan: { equals: data.thongtinbenhnhan },
        ...(data.id ? { id: { not_equals: data.id } } : {}), // Bỏ qua chính nó khi cập nhật
      },
    })

    if (existingRecord.docs.length > 0) {
      throw new APIError('Bệnh nhân này đã có hồ sơ bệnh án, không thể tạo thêm!', 400)
    }
  }
}

export const validateNhapVienOnlyOnce: CollectionBeforeValidateHook = async ({ data, originalDoc }) => {
  // Nếu tình trạng hiện tại vẫn là "Nhập viện"
  if (data?.tinhtrang === 'no') {
    // Nếu đã có hồ sơ trong originalDoc (tức là cập nhật), không cho thêm mới nếu đã tồn tại hồ sơ nhập viện
    const existingHosoba = originalDoc?.hoso || [];

    // Nếu đang thêm mới hoặc đã có nhiều hơn một hồ sơ → chặn lại
    if (existingHosoba.length >= 1) {
      throw new APIError('Không thể tạo thêm hồ sơ khi bệnh nhân đang trong tình trạng nhập viện.', 400);
    }
  }

  return data;
};

export const namePatient = async ({ data, req }) => {
  if (data.thongtinbenhnhan) {
    // Lấy thông tin bệnh nhân từ database
    const patient = await req.payload.findByID({
      collection: 'patients',
      id: data.thongtinbenhnhan,
    })

    if (patient) {
      data.tenBenhNhan = patient.ten // Cập nhật tên bệnh nhân
    }
  }
}

export const generateMedicalRecordID: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (!data) return;

  if (!data.hoso) {
    data.hoso = [];
  }

  for (let i = 0; i < data.hoso.length; i++) {
    if (!data.hoso[i].sohoso) {
      let newID;
      let isDuplicate = true;

      // Lặp cho đến khi tìm được số hồ sơ không trùng
      while (isDuplicate) {
        // Tạo số ngẫu nhiên
        const randomID = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        newID = `HS-${randomID}`;

        // Kiểm tra xem số này đã tồn tại trong database chưa
        const existingRecord = await req.payload.find({
          collection: 'MedicalRecods',
          where: { "hoso.sohoso": { equals: newID } },
          limit: 1
        });

        // Nếu không tìm thấy bản ghi nào trùng, thoát vòng lặp
        if (existingRecord.docs.length === 0) {
          isDuplicate = false;
        }
      }

      data.hoso[i].sohoso = newID;
    }
  }

  return data; 
};

export const removePatientFromRoom: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  try {
    const hoSoCu = previousDoc?.hoso || []
    const hoSoMoi = doc?.hoso || []
    const benhNhanID = doc?.thongtinbenhnhan

    if (!benhNhanID || hoSoMoi.length === 0) return

    for (let i = 0; i < hoSoMoi.length; i++) {
      const hsMoi = hoSoMoi[i]
      const hsCu = hoSoCu[i]

      const tinhTrangCu = hsCu?.tinhtrang
      const tinhTrangMoi = hsMoi?.tinhtrang
      const phongCu = hsMoi?.sophong

      // Nếu không thay đổi tình trạng hoặc không có phòng thì bỏ qua
      if (!phongCu || tinhTrangCu === tinhTrangMoi) continue

      // Chỉ xử lý khi chuyển từ nhập viện (no) sang xuất viện (yes)
      if (tinhTrangCu === 'no' && tinhTrangMoi === 'yes') {
        const roomsResult = await req.payload.find({
          collection: 'Rooms',
          where: {
            'Phong.tenphongbenh': { equals: phongCu },
            'Phong.benhnhan': { contains: benhNhanID },
          },
        })

        if (roomsResult.docs.length > 0) {
          const roomDoc = roomsResult.docs[0]

          const updatedPhong = Array.isArray(roomDoc.Phong)
  ? roomDoc.Phong.map((phong) => {
      if (phong.tenphongbenh === phongCu) {
        return {
          ...phong,
          benhnhan: phong.benhnhan?.filter(
            (id) => (typeof id === 'object' ? id.id : id) !== benhNhanID
          ),
        }
      }
      return phong
    })
  : []


          await req.payload.update({
            collection: 'Rooms',
            id: roomDoc.id,
            data: { Phong: updatedPhong },
          })
        }
      }
    }
  } catch (err) {
    console.error('❌ Lỗi khi xóa bệnh nhân khỏi phòng bệnh:', err)
  }
}

export const validatePatientRoom: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  if (operation !== 'create' && operation !== 'update') return data;

  const patientID = data?.thongtinbenhnhan;
  const hoSoArray = data?.hoso;

  if (!patientID || !hoSoArray || !Array.isArray(hoSoArray)) return data;

  for (const hoSo of hoSoArray) {
    const tenPhongHoSo = hoSo?.sophong;
    const tinhtrang = hoSo?.tinhtrang; // lấy giá trị tình trạng: 'yes' hoặc 'no'

    // Nếu không có tên phòng thì bỏ qua
    if (!tenPhongHoSo) continue;

    // Nếu tình trạng là "Đã xuất viện" thì không cần kiểm tra phòng
    if (tinhtrang === 'yes') continue;

    // Lấy tất cả phòng mà bệnh nhân đang nằm (nếu còn)
    const roomsResult = await req.payload.find({
      collection: 'Rooms',
      where: {
        'Phong.benhnhan': {
          equals: patientID,
        },
      },
    });

    const matchedRoom = roomsResult.docs.find((room) =>
      room.Phong?.some((roomDetail) =>
        roomDetail.tenphongbenh?.toLowerCase().trim() === tenPhongHoSo.toLowerCase().trim()
      )
    );

    if (!matchedRoom) {
      // Tìm tên phòng thật sự mà bệnh nhân đang nằm (nếu có)
      const matchedPatientRoom = roomsResult.docs
        .flatMap((room) =>
          room.Phong?.filter((roomDetail) =>
            roomDetail.benhnhan?.some((bn) =>
              typeof bn === 'object' ? bn.id === patientID : bn === patientID
            )
          )
        )
        .map((room) => room?.tenphongbenh)
        .filter((tenPhong): tenPhong is string => Boolean(tenPhong))[0];

      throw new APIError(
        `Tên phòng <${tenPhongHoSo}> không trùng với phòng của bệnh nhân.\n` +
        `Hiện bệnh nhân đang nằm trong phòng <${matchedPatientRoom || 'Không xác định'}>.`,
        400
      );
    }
  }

  return data;
};

export const validateSoHoSoNoiSoi: CollectionBeforeValidateHook = async ({ data }) => {
  const danhSachHoSo = data?.hoso || []
  const ketQuaNoiSoi = data?.ketqua || []

  // Lấy danh sách số hồ sơ bệnh án từ hoso
  const danhSachSoHoSo = danhSachHoSo.map((item) => item.sohoso).filter(Boolean)

  // Kiểm tra định dạng số hồ sơ (VD: HS-73624)
  const soHoSoRegex = /^HS-\d{5}$/ // HS- rồi đến 5 chữ số

  for (const sohoso of danhSachSoHoSo) {
    if (!soHoSoRegex.test(sohoso)) {
      throw new APIError(`Số hồ sơ "${sohoso}" không đúng định dạng. Vui lòng nhập theo định dạng "HS-xxxxx" (ví dụ: HS-73624).`, 400)
    }
  }

  // Nếu không có hoso, không cho nhập kết quả
  if (danhSachSoHoSo.length === 0 && ketQuaNoiSoi.length > 0) {
    throw new APIError('Không thể nhập kết quả nội soi vì chưa có số hồ sơ bệnh án.', 400)
  }

  // Kiểm tra từng ketqua.infomation.sohoso xem có trong danh sách không
  for (const ketqua of ketQuaNoiSoi) {
    const sohoso = ketqua?.infomation?.sohoso

    if (sohoso && !soHoSoRegex.test(sohoso)) {
      throw new APIError(`Số hồ sơ trong kết quả "${sohoso}" không đúng định dạng "HS-xxxxx".`, 400)
    }

    if (sohoso && !danhSachSoHoSo.includes(sohoso)) {
      throw new APIError(`Số hồ sơ "${sohoso}" không tồn tại trong danh sách hồ sơ bệnh án của bệnh nhân.`, 400)
    }
  }

  return data
}

export const validateSoHoSo: CollectionBeforeValidateHook = async ({ data, req, originalDoc, operation }) => {
  if (!data || !req.user || !originalDoc || operation !== 'update') return data;

  // Bỏ qua nếu là admin
  if (req.user.taikhoan === 'admin') return data;

  const user = req.user;

  // Tìm khoa của user
  const find = await req.payload.find({
    collection: 'departments',
    where: {
      tenkhoa: {
        equals: user.khoa,
      },
    },
  });

  const userDepartmentId = find.docs[0]?.id;
  if (!userDepartmentId) {
    throw new APIError('Không tìm thấy khoa của người dùng.', 400);
  }

  // Nếu có trường hoso là mảng
  if (Array.isArray(data.hoso) && Array.isArray(originalDoc.hoso)) {
    for (let i = 0; i < data.hoso.length; i++) {
      const newItem = data.hoso[i];
      const oldItem = originalDoc.hoso[i];

      // Nếu mục này thuộc khoa người dùng → cho thay đổi
      if (newItem.khoa === userDepartmentId) continue;

      const isDifferent = !isEqual(newItem, oldItem);
      if (isDifferent) {
        throw new APIError('Không được thay đổi dữ liệu không thuộc khoa của bạn.', 400);
      }
    }
  }

  return data;
}

export const autoDepartment: CollectionBeforeValidateHook = async ({ data, req }) => { 
  if(!data || !req.user) return data
  if (req.user.taikhoan === 'admin') return data;

  const user = req.user;

  // Tìm khoa của user
  const find = await req.payload.find({
    collection: 'departments',
    where: {
      tenkhoa: {
        equals: user.khoa,
      },
    },
  });

  const userDepartmentId = find.docs[0]?.id;
  if (!userDepartmentId) {
    throw new APIError('Không tìm thấy khoa của người dùng.', 400);
  }
  for (const item of data.hoso) {
    if (!item.khoa) {
    console.log('Gán khoa cho mục này:', item); // Ghi log để kiểm tra
      item.khoa = userDepartmentId; 
    }
    if (!item.bacsi) {
      if (user.chucvu === 'truongkhoa' || user.chucvu === 'bacsi') {
        item.bacsi = user.id; // Gán ID của bác sĩ hoặc trưởng khoa vào trường bacsi
        console.log('Tự động gán bác sĩ phụ trách:', user.name); // Ghi log để kiểm tra
      }
    }
  }

  return data; // Trả về dữ liệu đã chỉnh sửa
}