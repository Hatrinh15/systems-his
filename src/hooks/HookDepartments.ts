import { APIError, CollectionBeforeChangeHook, Where } from 'payload'
import { Access } from 'payload'
import { User } from '@/payload-types'

export const beforeChange: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
    const existingDepartments = await req.payload.find({
      collection: 'departments',
      where: { tenkhoa: { equals: data?.tenkhoa } },
    })
    const existingDepartmentID = existingDepartments.docs[0].id
  if (operation === 'create') {
    if (existingDepartments.docs.length > 0) {
      throw new APIError(`Khoa này đã tồn tại trong danh sách! Vui lòng chọn khoa khác.`, 400)
    }
  }
  /// cập nhật cho trưởng khoa
  if (operation === 'create' || operation === 'update') {
    if (!data?.tenkhoa) {
      return
    }

    // 🚀 Cập nhật trưởng khoa trước (nếu có)
    if (data.truongkhoa && data.truongkhoa.length > 0) {
      await Promise.all(
        data.truongkhoa.map(async (truongkhoaId) => {
          try {
            const user = await req.payload.findByID({
              collection: 'users',
              id: truongkhoaId,
            })

            if (!user) return

            if (user.khoa === data.tenkhoa && user.chucvu === 'truongkhoa') {
              return
            }

            // ✅ Cập nhật trưởng khoa mới
            await req.payload.update({
              collection: 'users',
              id: truongkhoaId,
              data: { khoa: data.tenkhoa, chucvu: 'truongkhoa' },
            })
          } catch (error) {
            console.error(`❌ Lỗi khi cập nhật trưởng khoa ${truongkhoaId}:`, error)
          }
        }),
      )
    }

    // 🚀 Cập nhật bác sĩ (không phụ thuộc vào trưởng khoa)
    if (data.doctors && data.doctors.length > 0) {
      await Promise.all(
        data.doctors.map(async (doctorId) => {
          try {
            const user = await req.payload.findByID({
              collection: 'users',
              id: doctorId,
            })

            if (!user) return

            if (user.khoa === data.tenkhoa) {
              return
            }

            // ✅ Nếu bác sĩ này là trưởng khoa cũ, hạ xuống bác sĩ
            const newRole = user.chucvu === 'truongkhoa' ? 'bacsi' : user.chucvu

            await req.payload.update({
              collection: 'users',
              id: doctorId,
              data: { khoa: data.tenkhoa, chucvu: newRole },
            })
          } catch (error) {
            console.error(`❌ Lỗi khi cập nhật khoa cho bác sĩ ${doctorId}:`, error)
          }
        }),
      )
    }
  }

  ////cập nhật cho y tá
  if (operation === 'create' || operation === 'update') {
    if (!data?.nures || data.nures.length === 0) {
      return
    }

    if (!data?.tenkhoa) {
      return
    }

    await Promise.all(
      data.nures.map(async (nuresId) => {
        try {
          // 🔍 Tìm bác sĩ hiện tại trong collection "users"
          const user = await req.payload.findByID({
            collection: 'users',
            id: nuresId,
          })

          if (!user) return // Nếu không tìm thấy bác sĩ, bỏ qua

          // 🛑 Nếu bác sĩ đã ở đúng khoa, không cần cập nhật
          if (user.khoa === data.tenkhoa) {
            return
          }

          // ✅ Cập nhật khoa mới cho bác sĩ
          await req.payload.update({
            collection: 'users',
            id: nuresId,
            data: { khoa: data.tenkhoa },
          })
        } catch (error) {
          console.error(`Lỗi khi cập nhật khoa cho Y tá ${nuresId}:`, error)
        }
      }),
    )
  }
}
export const showTitle: CollectionBeforeChangeHook = async ({ data }) => {
  if (!data) return
  const titleKhoa = [
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
  titleKhoa.map((item) => {
    if (data.tenkhoa === item.value) {
      data.title = item.label
    }
  })
  return data
}

export const hookCheckKhoa: CollectionBeforeChangeHook = async ({ data, req, originalDoc, operation }) => {
  // Kiểm tra trường "Tên Khoa"
  if (!data.tenkhoa) {
    throw new APIError('Tên khoa không được để trống.', 400);
  }

  // Kiểm tra trường "Ngày thành lập" trong group thongtin
  if (!data.thongtin?.ngaythanhlap) {
    throw new APIError('Ngày thành lập không được để trống.', 400);
  } else {
    const foundationDate = new Date(data.thongtin.ngaythanhlap);
    // Kiểm tra xem có phải là một ngày hợp lệ không
    if (isNaN(foundationDate.getTime())) {
      throw new APIError('Ngày thành lập không hợp lệ.', 400);
    }
  }

  // Kiểm tra nếu là thao tác cập nhật (update) và có sự thay đổi trong danh sách sản phẩm
  if (operation === 'update' && data?.departmentInventory) {
    data.departmentInventory.forEach((item, index) => {
      // Kiểm tra nếu danh mục đã chọn trước đó và khác với giá trị mới
      if (originalDoc.departmentInventory[index]?.category && 
          originalDoc.departmentInventory[index]?.category !== item.category) {
        throw new APIError(`Danh mục của sản phẩm tại mục số ${index + 1} không thể thay đổi.`, 400);
      }
    });
  }

  // Kiểm tra "Danh sách sản phẩm"
  data.departmentInventory?.forEach((inventoryItem, index) => {
    // Kiểm tra trường hợp nếu danh mục là "Thuốc"
    if (inventoryItem.category === 'medications') {
      if (!inventoryItem.item) {
        throw new APIError(`Mục sản phẩm thứ ${index + 1}: Hãy điền đủ tên sản phẩm khi chọn thuốc.`, 400);
      }
    }

    // Kiểm tra trường hợp nếu danh mục là "Vật tư tiêu hao"
    if (inventoryItem.category === 'vattutieuhao') {
      if (!inventoryItem.items) {
        throw new APIError(`Mục sản phẩm thứ ${index + 1}: Hãy điền đủ tên sản phẩm khi chọn vật tư tiêu hao.`, 400);
      }
    }

    // Kiểm tra trường hợp nếu danh mục là "Máy móc/Thiết bị"
    if (inventoryItem.category === 'maymocthietbi') {
      if (!inventoryItem.items) {
        throw new APIError(`Mục sản phẩm thứ ${index + 1}: Hãy điền đủ tên sản phẩm khi chọn máy móc/thiết bị.`, 400);
      }
    }
  });
};

export const readDepartmentAccess: Access = async ({ req }) => {
  const user = req.user;

  if (!user || !user.id) return false;

  if (user.taikhoan === 'admin') {
    return true;
  }

  if (user.chucvu && ['bacsi', 'yta', 'truongkhoa', 'duocsi'].includes(user.chucvu)) {
    const conditions: Where[] = [];

    if (user.chucvu === 'bacsi') {
      conditions.push({ doctors: { contains: user.id } });
    }

    if (user.chucvu === 'yta') {
      conditions.push({ nures: { contains: user.id } });
    }

    if (user.chucvu === 'truongkhoa') {
      conditions.push({ truongkhoa: { contains: user.id } });
    }

    if (user.chucvu === 'duocsi') {
      // Nếu dược sĩ cũng được liên kết với khoa qua trường khác, thêm ở đây
      // Ví dụ: { pharmacists: { contains: user.id } }
    }

    return {
      or: conditions,
    };
  }

  return false;
};







