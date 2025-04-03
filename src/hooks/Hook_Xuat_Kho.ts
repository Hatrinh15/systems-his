/* eslint-disable prefer-const */

import {
  CollectionBeforeChangeHook,
  CollectionAfterChangeHook,
  CollectionAfterReadHook,
} from 'payload'
import { APIError } from 'payload'
import { PayloadRequest } from 'payload'

export const hookBaoGia: CollectionBeforeChangeHook = async ({ data, req, originalDoc }) => {
  const now = new Date()

  // Hàm định dạng tiền tệ
  const formatNumber = (number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number)
  }

  // Kiểm tra nếu phiếu đã tồn tại
  if (originalDoc?.transactiondate) {
    const transactionDate = new Date(originalDoc.transactiondate)
    const sevenDaysAfter = new Date(transactionDate)
    sevenDaysAfter.setDate(transactionDate.getDate() + 7)

    if (now > sevenDaysAfter) {
      throw new APIError('Phiếu đã quá 7 ngày và không thể chỉnh sửa.', 400)
    }
  }

  // Kiểm tra ngày tạo phiếu
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(startOfToday)
  sevenDaysAgo.setDate(startOfToday.getDate() - 7)

  if (data.transactiondate) {
    const transactionDate = new Date(data.transactiondate)
    transactionDate.setHours(0, 0, 0, 0)

    if (transactionDate > startOfToday) {
      throw new APIError('Ngày tạo phiếu không được ở tương lai.', 400)
    }

    if (transactionDate < sevenDaysAgo) {
      throw new APIError('Ngày tạo phiếu không được quá 7 ngày trước.', 400)
    }
  }

  // Kiểm tra trùng khoa trong danh sách xuất
  if (data.exports && Array.isArray(data.exports)) {
    const khoaSet = new Set()

    for (const item of data.exports) {
      if (item.loai_xuat === 'khoa' && item.destination) {
        try {
          const khoaDoc = await req.payload.findByID({
            collection: 'departments',
            id: item.destination,
          })

          const khoaName = khoaDoc?.title || `ID: ${item.destination}`

          if (khoaSet.has(item.destination)) {
            throw new APIError(`${khoaName} đã bị tạo trùng, hãy kiểm tra lại.`, 400)
          }
          khoaSet.add(item.destination)
        } catch (error) {
          throw new APIError(`Lỗi khi kiểm tra khoa: ${error.message}`, 400)
        }
      }
    }
  }
  return data
}

export const hookCheckinfo: CollectionBeforeChangeHook = async ({ data, req }) => {
  let errors: string[] = [];

  if (!data.transactiondate) {
    errors.push('Ngày tạo phiếu không được để trống.');
  }
  if (!data.receiverorsender) {
    errors.push('Người lập phiếu không được để trống.');
  }
  if (!data.exports || data.exports.length === 0) {
    errors.push('Danh sách xuất hàng không được để trống.');
  }

  data.exports?.forEach((exportItem, index) => {
    if (!exportItem.loai_xuat) {
      errors.push(`Mục xuất hàng thứ ${index + 1}: Loại xuất không được để trống.`);
    }
    if (exportItem.loai_xuat === 'khoa' && !exportItem.destination) {
      errors.push(`Mục xuất hàng thứ ${index + 1}: Nơi nhận không được để trống khi xuất cho khoa.`);
    }

    if (exportItem.loai_xuat === 'khoa' && !exportItem.nguoinhan) {
      errors.push(`Mục xuất hàng thứ ${index + 1}: Người nhận không được để trống khi xuất cho khoa.`);
    }
    
    if (exportItem.loai_xuat === 'huy' && !exportItem.reason_cancel) {
      errors.push(`Mục xuất hàng thứ ${index + 1}: Lý do hủy không được để trống khi hủy hàng.`);
    }

    if (
      (!exportItem.thuoc || exportItem.thuoc.length === 0) &&
      (!exportItem.vattutieuhao || exportItem.vattutieuhao.length === 0) &&
      (!exportItem.maymocthietbi || exportItem.maymocthietbi.length === 0)
    ) {
      errors.push(`Mục xuất hàng thứ ${index + 1}: Phải có ít nhất một sản phẩm để xuất.`);
    }

    exportItem.thuoc?.forEach((thuoc, thuocIndex) => {
      if (!thuoc.tenthuoc) {
        errors.push(`Thuốc ${thuocIndex + 1} trong mục xuất thứ ${index + 1}: Tên thuốc không được để trống.`);
      }
      if (thuoc.quantity === undefined || thuoc.quantity === null) {
        errors.push(`Thuốc ${thuocIndex + 1} trong mục xuất thứ ${index + 1}: Số lượng phải được nhập.`);
      }
      if (thuoc.quantity <= 0) {
        errors.push(`Thuốc ${thuocIndex + 1} trong mục xuất thứ ${index + 1}: Số lượng phải lớn hơn 0.`);
      }
    })

    exportItem.vattutieuhao?.forEach((vattu, vattuIndex) => {
      if (!vattu.supply) {
        errors.push(`Vật tư tiêu hao ${vattuIndex + 1} trong mục xuất thứ ${index + 1}: Tên vật tư không được để trống.`);
      }
      if (vattu.quantity === undefined || vattu.quantity === null) {
        errors.push(`Vật tư tiêu hao ${vattuIndex + 1} trong mục xuất thứ ${index + 1}: Số lượng phải được nhập.`);
      }
      if (vattu.quantity <= 0) {
        errors.push(`Vật tư tiêu hao ${vattuIndex + 1} trong mục xuất thứ ${index + 1}: Số lượng phải lớn hơn 0.`);
      }
    })

    exportItem.maymocthietbi?.forEach((equipment, equipmentIndex) => {
      if (!equipment.equipment) {
        errors.push(`Thiết bị ${equipmentIndex + 1} trong mục xuất thứ ${index + 1}: Tên thiết bị không được để trống.`);
      }
      if (equipment.quantity === undefined || equipment.quantity === null) {
        errors.push(`Thiết bị ${equipmentIndex + 1} trong mục xuất thứ ${index + 1}: Số lượng phải được nhập.`);
      }
      if (equipment.quantity <= 0) {
        errors.push(`Thiết bị ${equipmentIndex + 1} trong mục xuất thứ ${index + 1}: Số lượng phải lớn hơn 0.`);
      }
    });
  });

  // Nếu có lỗi, ném tất cả lỗi cùng một lúc
  if (errors.length > 0) {
    throw new APIError(errors.join("\n"), 400);
  }
};

export const hookxuatkho: CollectionAfterChangeHook = async ({doc,req,operation,previousDoc,}) => {
    try {
      const inventoryMap = new Map()
      const findInventory = await req.payload.find({
        collection: 'inventory',
        limit: 1000,
      })

      findInventory.docs.forEach((dc) => {
        const thuocId = typeof dc.item === 'object' && dc.item !== null ? dc.item.id : dc.item
        const vattuId = typeof dc.items === 'object' && dc.items !== null ? dc.items.id : dc.items
        inventoryMap.set(`${thuocId}`, { ...dc, totalQuantity: 0 })
        inventoryMap.set(`${vattuId}`, { ...dc, totalQuantity: 0 })
      })
      const previousSet = new Map()
      const exportMap = new Map()
      for (const item of doc.exports) {
        for (const thuoc of item.thuoc) {
          const key = `${thuoc.tenthuoc}`
          const existingQuantity = exportMap.get(key) || 0
          exportMap.set(key, existingQuantity + thuoc.quantity)
        }
      }
      for (const item of doc.exports) {
        for (const vattu of item.vattutieuhao) {
          const key = `${vattu.supply}`
          const existingQuantity = exportMap.get(key) || 0
          exportMap.set(key, existingQuantity + vattu.quantity)
        }
      }
      for (const item of doc.exports) {
        for (const thietbi of item.maymocthietbi) {
          const key = `${thietbi.equipment}`
          const existingQuantity = exportMap.get(key) || 0
          exportMap.set(key, existingQuantity + thietbi.quantity)
        }
      }
   
    
  if (operation === 'update') {
      
      for (const dc of previousDoc.exports) {
        for (const pc of dc.thuoc) {
          const key = `${pc.tenthuoc}`
          const existingQuantity = previousSet.get(key) || 0
          previousSet.set(key, existingQuantity + pc.quantity)
        }
      }
      for (const dc of previousDoc.exports) {
        for (const pc of dc.vattutieuhao) {
          const key = `${pc.supply}`
          const existingQuantity = previousSet.get(key) || 0
          previousSet.set(key, existingQuantity + pc.quantity)
        }
      }
      for (const dc of previousDoc.exports) {
        for (const pc of dc.maymocthietbi) {
          const key = `${pc.equipment}`
          const existingQuantity = previousSet.get(key) || 0
          previousSet.set(key, existingQuantity + pc.quantity)
        }
      }
  }
   for (const [exportId, exportQuantity] of exportMap.entries()) {
        const old = previousSet.get(exportId) || 0
        const findthuoc = inventoryMap.get(exportId)
        const delta = exportQuantity - old
        if (findthuoc) {
          const soluong = findthuoc.quantity - delta
          await req.payload.update({
            collection: 'inventory',
            id: findthuoc.id,
            data: { quantity: soluong >= 0 ? soluong : 0 },
          })
        } else {
          console.warn(`Không tìm thấy thuốc trong kho: ${exportId}`)
        }
      }
  } catch (error) {
      console.error('Lỗi khi cập nhật kho:', error)
    }
}

export const hookNhapQuayThuoc: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  previousDoc,
}) => {
  const exportItems = doc.exports?.filter((item) => item.loai_xuat === 'quaythuoc') || []
  if (exportItems.length === 0) return

  try {
    const pharmacyMap = new Map()

    // Lấy danh sách sản phẩm trong quầy thuốc
    const findPharmacies = await req.payload.find({
      collection: 'pharmacies',
      limit: 1000,
    })

    findPharmacies.docs.forEach((pharmacy) => {
      const itemId =
        typeof pharmacy.item === 'object' && pharmacy.item !== null
          ? pharmacy.item.id
          : pharmacy.item
      const supplyId =
        typeof pharmacy.items === 'object' && pharmacy.items !== null
          ? pharmacy.items.id
          : pharmacy.items
      pharmacyMap.set(`${itemId}`, { ...pharmacy, totalQuantity: pharmacy.quantity || 0 })
      pharmacyMap.set(`${supplyId}`, { ...pharmacy, totalQuantity: pharmacy.quantity || 0 })
    })

    const importMap = new Map()
    const previousImportMap = new Map()

    // Hàm xử lý dữ liệu nhập (hiện tại và trước khi cập nhật)
    const processExports = (exportsArray, map) => {
      if (!Array.isArray(exportsArray)) return
      for (const item of exportsArray) {
        if (item.loai_xuat !== 'quaythuoc') continue // ✅ Chỉ xử lý quầy thuốc
        if (Array.isArray(item.thuoc)) {
          for (const thuoc of item.thuoc) {
            const key = `${thuoc.tenthuoc}`
            map.set(key, (map.get(key) || 0) + thuoc.quantity)
          }
        }
        if (Array.isArray(item.vattutieuhao)) {
          for (const vattu of item.vattutieuhao) {
            const key = `${vattu.supply}`
            map.set(key, (map.get(key) || 0) + vattu.quantity)
          }
        }
      }
    }

    processExports(doc.exports, importMap)
    if (operation === 'update') {
      processExports(previousDoc.exports, previousImportMap)
    }

    // Xử lý cập nhật số lượng
    await Promise.all(
      [...importMap.entries()].map(async ([importId, importQuantity]) => {
        const previousQuantity = previousImportMap.get(importId) || 0
        const quantityChange = importQuantity - previousQuantity
        const findItem = pharmacyMap.get(importId)

        if (findItem) {
          const newQuantity = (findItem.totalQuantity || 0) + quantityChange
          const newSoluong = (findItem.soluong || 0) + (findItem.quychuan || 1) * quantityChange

          console.log(findItem)
          await req.payload.update({
            collection: 'pharmacies',
            id: findItem.id,
            data: { quantity: newQuantity, soluong: newSoluong },
          })
        } else if (importQuantity > 0) {
          const category = exportItems.some((item) =>
            item.thuoc?.some((t) => t.tenthuoc === importId),
          )
            ? 'medications'
            : 'vattutieuhao'

          await req.payload.create({
            collection: 'pharmacies',
            data: {
              [category === 'medications' ? 'item' : 'items']: importId,
              category,
              quantity: importQuantity,
            },
          })
        }
      }),
    )
  } catch (error) {
    console.error('Lỗi khi cập nhật quầy thuốc:', error)
  }
}

export const hookNhapKhoKhoa = async ({ doc, req, operation, previousDoc }) => {
  if (operation !== 'create' && operation !== 'update') {
    return
  }
  const departmentImportMap = new Map()
  for (const item of doc.exports) {
    if (item.loai_xuat !== 'khoa') continue

    const khoaId = item.destination
    if (!khoaId) {
      console.error('❌ Không tìm thấy khoaId trong doc.exports! Dữ liệu:', item)
      continue
    }
    if (!departmentImportMap.has(khoaId)) {
      departmentImportMap.set(khoaId, new Map())
    }
    const importMap = departmentImportMap.get(khoaId)
    if (Array.isArray(item.thuoc)) {
      for (const thuoc of item.thuoc) {
        const key = thuoc.tenthuoc
        importMap.set(key, (importMap.get(key) || 0) + thuoc.quantity)
      }
    }
    if (Array.isArray(item.vattutieuhao)) {
      for (const vattu of item.vattutieuhao) {
        const key = vattu.supply
        importMap.set(key, (importMap.get(key) || 0) + vattu.quantity)
      }
    }
    if (Array.isArray(item.maymocthietbi)) {
      for (const maymoc of item.maymocthietbi) {
        const key = maymoc.equipment
        importMap.set(key, (importMap.get(key) || 0) + maymoc.quantity)
      }
    }
  }
  if (operation === 'update' && previousDoc) {
    for (const prevItem of previousDoc.exports) {
      const khoaId = prevItem.destination
      if (!khoaId || !departmentImportMap.has(khoaId)) {
        continue
      }
      const importMap = departmentImportMap.get(khoaId)
      if (Array.isArray(prevItem.thuoc)) {
        for (const thuoc of prevItem.thuoc) {
          const key = thuoc.tenthuoc
          importMap.set(key, (importMap.get(key) || 0) - thuoc.quantity)
        }
      }
      if (Array.isArray(prevItem.vattutieuhao)) {
        for (const vattu of prevItem.vattutieuhao) {
          const key = vattu.supply
          importMap.set(key, (importMap.get(key) || 0) - vattu.quantity)
        }
      }
      if (Array.isArray(prevItem.maymocthietbi)) {
        for (const maymoc of prevItem.maymocthietbi) {
          const key = maymoc.equipment
          importMap.set(key, (importMap.get(key) || 0) - maymoc.quantity)
        }
      }
    }
  }
  for (const [khoaId, importMap] of departmentImportMap.entries()) {
    try {
      const department = await req.payload.findByID({
        collection: 'departments',
        id: khoaId,
      })
      if (!department) {
        continue
      }
      const departmentInventory = department.departmentInventory || [];
      for (const [importId, importQuantity] of importMap.entries()) {
        const exportItem = doc.exports.find(exp =>
          exp.thuoc?.some(t => String(t.tenthuoc) === String(importId)) ||
          exp.vattutieuhao?.some(v => String(v.supply) === String(importId)) ||
          exp.maymocthietbi?.some(m => String(m.equipment) === String(importId))
        );
      
        if (!exportItem) {
          console.error(`⚠️ Không tìm thấy sản phẩm ${importId} trong phiếu xuất, bỏ qua.`);
          continue;
        }
      
        // Xác định danh mục (category)
        const category = exportItem.thuoc?.some(t => String(t.tenthuoc) === String(importId)) ? 'medications'
          : exportItem.vattutieuhao?.some(v => String(v.supply) === String(importId)) ? 'vattutieuhao'
            : exportItem.maymocthietbi?.some(m => String(m.equipment) === String(importId)) ? 'maymocthietbi'
              : null;
      
        if (!category) {
          console.error(`⚠️ Không xác định được danh mục cho sản phẩm ${importId}, bỏ qua.`)
          continue
        }
        // 🔹 Lấy đơn vị trực tiếp từ Phiếu Xuất thay vì gọi DB
        let unit = 'N/A';
        if (category === 'medications') {
          const thuocItem = exportItem.thuoc.find(t => String(t.tenthuoc) === String(importId));
          if (thuocItem) unit = thuocItem.donvi || 'N/A';
        } else if (category === 'vattutieuhao') {
          const vatTuItem = exportItem.vattutieuhao.find(v => String(v.supply) === String(importId));
          if (vatTuItem) unit = vatTuItem.donvi || 'N/A';
        } else if (category === 'maymocthietbi') {
          const mayMocItem = exportItem.maymocthietbi.find(m => String(m.equipment) === String(importId));
          if (mayMocItem) unit = mayMocItem.donvi || 'N/A';
        }
      
        const existingItem = departmentInventory.find(inv =>
          (typeof inv.item === 'object' ? String(inv.item.id) : String(inv.item)) === String(importId) ||
          (typeof inv.items === 'object' ? String(inv.items.id) : String(inv.items)) === String(importId)
        );
      
        if (existingItem) {
          existingItem.quantity += importQuantity;
          if (!existingItem.unit || existingItem.unit === 'N/A') {
          existingItem.unit = unit;
        }
        }  
        
        else {
          departmentInventory.push({
            [category === 'medications' ? 'item' : 'items']: importId,
            category,
            quantity: importQuantity,
            unit: unit, // Thêm đơn vị lấy từ phiếu xuất
          });
        }
      }
      
      
      await req.payload.update({
        collection: 'departments',
        id: khoaId,
        data: { departmentInventory },
      })
    } catch (error) {
      console.error('Lỗi khi cập nhật quầy thuốc:', error)
    }
  }
}

export const showPrice: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data) return data

  const formatNumber = (value: any) => {
    if (!value) return value
    const numberValue = Number(value.toString().replace(/\D/g, '')) // Loại bỏ ký tự không phải số
    return !isNaN(numberValue) ? new Intl.NumberFormat('vi-VN').format(numberValue) : value
  }
  // theo thuốc
  await Promise.all(
    data?.exports?.map(async (giaodich) => {
      const loaiXuat = giaodich?.loai_xuat || '' // Lấy loại xuất (có thể là 'khoa' hoặc 'quay')

      await Promise.all(
        giaodich.thuoc?.map(async (thuoc) => {
          if (thuoc.unitprice) {
            thuoc.unitprice = formatNumber(thuoc.unitprice)
          } else {
            const tenthuocId =
              typeof thuoc.tenthuoc === 'string' ? thuoc.tenthuoc : thuoc.tenthuoc?.id
            if (!tenthuocId) return

            try {
              const findThuoc = await req.payload.find({
                collection: 'baogia',
                where: { item: { equals: tenthuocId } },
                limit: 1,
              })

              if (findThuoc.docs.length > 0) {
                const baogia = findThuoc.docs[0]

                let giaXuat = thuoc.unitprice || '0' // Mặc định giữ nguyên giá nếu không chọn khoa/quầy

                if (loaiXuat === 'khoa') {
                  giaXuat = baogia.gianhaptrungbinh || '0' // Giá nhập trung bình cho Khoa
                } else {
                  if (loaiXuat === 'quaythuoc') {
                    giaXuat = baogia.giaban || '0' // Giá bán lẻ cho Quầy
                  } else if (loaiXuat === 'huy') {
                    giaXuat = baogia.gianhaptrungbinh || '0'
                  }
                }
                thuoc.unitprice = formatNumber(giaXuat) // Định dạng lại số
              }
            } catch (error) {
              console.error('❌ Lỗi khi lấy giá thuốc từ Bảng Giá:', error)
            }
          }

          // Tính totalprice nếu đã có unitprice
          if (thuoc.unitprice) {
            const unitPriceNumber = Number(thuoc.unitprice.toString().replace(/\D/g, ''))
            let totalPrice = 0
            if (thuoc.quantity) {
              totalPrice = unitPriceNumber * Number(thuoc.quantity)
            }
            thuoc.totalprice = formatNumber(totalPrice)
          }
        }),
      )
    }),
  )
  // theo vật tư
  await Promise.all(
    data?.exports?.map(async (giaodich) => {
      const loaiXuat = giaodich?.loai_xuat || '' // Lấy loại xuất (có thể là 'khoa' hoặc 'quay')

      await Promise.all(
        giaodich.vattutieuhao?.map(async (vattutieuhao) => {
          if (!vattutieuhao.unitprice) {
            const tenthuocId =
              typeof vattutieuhao.supply === 'string'
                ? vattutieuhao.supply
                : vattutieuhao.supply?.id
            if (!tenthuocId) return

            try {
              const findVattutieuhao = await req.payload.find({
                collection: 'baogia',
                where: { items: { equals: tenthuocId } },
                limit: 1,
              })

              if (findVattutieuhao.docs.length > 0) {
                const baogia = findVattutieuhao.docs[0]

                let giaXuat = vattutieuhao.unitprice || '0' // Mặc định giữ nguyên giá nếu không chọn khoa/quầy

                if (loaiXuat === 'khoa') {
                  giaXuat = baogia.gianhaptrungbinh || '0' // Giá nhập trung bình cho Khoa
                } else {
                  if (loaiXuat === 'quaythuoc') {
                    giaXuat = baogia.giaban || '0' // Giá bán lẻ cho Quầy
                  } else if (loaiXuat === 'huy') {
                    giaXuat = baogia.gianhaptrungbinh || '0'
                  }
                }

                vattutieuhao.unitprice = formatNumber(giaXuat) // Định dạng lại số
              }
            } catch (error) {
              console.error('❌ Lỗi khi lấy giá thuốc từ Bảng Giá:', error)
            }
          }

          // Tính totalprice nếu đã có unitprice
          if (vattutieuhao.unitprice) {
            const unitPriceNumber = Number(vattutieuhao.unitprice.toString().replace(/\D/g, ''))
            let totalPrice = 0
            if (vattutieuhao.quantity) {
              totalPrice = unitPriceNumber * Number(vattutieuhao.quantity)
            }
            vattutieuhao.totalprice = formatNumber(totalPrice)
          }
        }),
      )
    }),
  )
  //theo máy móc
  await Promise.all(
    data?.exports?.map(async (giaodich) => {
      const loaiXuat = giaodich?.loai_xuat || '' // Lấy loại xuất (có thể là 'khoa' hoặc 'quay')

      await Promise.all(
        giaodich.maymocthietbi?.map(async (vattutieuhao) => {
          if (!vattutieuhao.unitprice) {
            const tenthuocId =
              typeof vattutieuhao.equipment === 'string'
                ? vattutieuhao.equipment
                : vattutieuhao.equipment?.id
            if (!tenthuocId) return

            try {
              const findVattutieuhao = await req.payload.find({
                collection: 'baogia',
                where: { items: { equals: tenthuocId } },
                limit: 1,
              })

              if (findVattutieuhao.docs.length > 0) {
                const baogia = findVattutieuhao.docs[0]

                let giaXuat = vattutieuhao.unitprice || '0' // Mặc định giữ nguyên giá nếu không chọn khoa/quầy

                if (loaiXuat === 'khoa') {
                  giaXuat = baogia.gianhaptrungbinh || '0' // Giá nhập trung bình cho Khoa
                } else {
                  if (loaiXuat === 'quaythuoc') {
                    giaXuat = baogia.giaban || '0' // Giá bán lẻ cho Quầy
                  } else if (loaiXuat === 'huy') {
                    giaXuat = baogia.gianhaptrungbinh || '0'
                  }
                }
                vattutieuhao.unitprice = formatNumber(giaXuat) // Định dạng lại số
              }
            } catch (error) {
              console.error('❌ Lỗi khi lấy giá thuốc từ Bảng Giá:', error)
            }
          }

          // Tính totalprice nếu đã có unitprice
          if (vattutieuhao.unitprice) {
            const unitPriceNumber = Number(vattutieuhao.unitprice.toString().replace(/\D/g, ''))
            let totalPrice = 0
            if (vattutieuhao.quantity) {
              totalPrice = unitPriceNumber * Number(vattutieuhao.quantity)
            }
            vattutieuhao.totalprice = formatNumber(totalPrice)
          }
        }),
      )
    }),
  )

  return data
}

export const showTotalPrice: CollectionAfterReadHook = async ({ doc }) => {
  const formatNumber = (value: any) => {
    if (value == null || value === '') return '0'
    const numberValue = parseFloat(value.toString().replace(/\D/g, ''))
    return new Intl.NumberFormat('vi-VN').format(numberValue)
  }

  const convertToNumber = (str: any) => {
    if (str == null || str === '') return 0
    return parseFloat(str.toString().replace(/\D/g, '')) || 0
  }

  let tongGiaTriQuayThuoc = 0
  let tongGiaTriKhoa = 0
  let tongGiaTriHuy = 0 // Thêm giá trị hàng hủy

  if (doc.exports && Array.isArray(doc.exports)) {
    doc.exports.forEach((item) => {
      let tongTien = 0

      const sumTotal = (array) => {
        return array?.reduce((sum, item) => {
          const unitPrice = convertToNumber(item.unitprice)
          const quantity = convertToNumber(item.quantity)
          item.totalprice = formatNumber(unitPrice * quantity)
          item.unitprice = formatNumber(unitPrice) // Định dạng unitprice
          return sum + unitPrice * quantity
        }, 0)
      }

      tongTien += sumTotal(item.thuoc || [])
      tongTien += sumTotal(item.vattutieuhao || [])
      tongTien += sumTotal(item.maymocthietbi || [])

      item.tongtien = formatNumber(tongTien)

      if (item.loai_xuat === 'quaythuoc') {
        tongGiaTriQuayThuoc += tongTien
      } else if (item.loai_xuat === 'khoa') {
        tongGiaTriKhoa += tongTien
      } else if (item.loai_xuat === 'huy') {
        // Xử lý loại xuất "hủy"
        tongGiaTriHuy += tongTien
      }
    })
  }

  doc.tong_gia_tri_quaythuoc = formatNumber(tongGiaTriQuayThuoc)
  doc.tong_gia_tri_khoa = formatNumber(tongGiaTriKhoa)
  doc.tong_gia_tri_huyhang = formatNumber(tongGiaTriHuy) // Gán tổng giá trị hàng hủy vào doc
  doc.tong_gia_tri = formatNumber(tongGiaTriQuayThuoc + tongGiaTriKhoa + tongGiaTriHuy)
}

export const checkInventoryBeforeExport: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (operation !== 'create' && operation !== 'update') return data
  if (!data.exports || !Array.isArray(data.exports)) return data

  let errorMessages = new Set<string>() // Set chứa các thông báo lỗi
  const dataOld = originalDoc?.exports || []

  for (let exportIndex = 0; exportIndex < data.exports.length; exportIndex++) {
    const exportItem = data.exports[exportIndex]
    const exportItemOld = dataOld[exportIndex] || {}

    if (exportItem.loai_xuat === 'huy') continue // Nếu là hủy hàng, bỏ qua kiểm tra tồn kho 

    // Gom tất cả sản phẩm từ các danh mục khác nhau
    const allItems = [
      ...(exportItem.thuoc || []).map((item) => ({ ...item, category: 'Thuốc' })),
      ...(exportItem.vattutieuhao || []).map((item) => ({ ...item, category: 'Vật tư tiêu hao' })),
      ...(exportItem.maymocthietbi || []).map((item) => ({ ...item, category: 'Máy móc thiết bị' })),
    ]

    const allItemsOld = [
      ...(exportItemOld.thuoc || []),
      ...(exportItemOld.vattutieuhao || []),
      ...(exportItemOld.maymocthietbi || []),
    ]

    for (let itemIndex = 0; itemIndex < allItems.length; itemIndex++) {
      const item = allItems[itemIndex]
      const old = allItemsOld.find((dt) => dt.id === item.id) || null

      if (!old) {
        // Xác định ID sản phẩm theo danh mục
        const productId = item.tenthuoc || item.supply || item.equipment
        const quantityToExport = item.quantity
        const category = item.category // Lưu loại danh mục của sản phẩm

        if (!productId) continue

        // Tìm sản phẩm trong kho theo đúng danh mục của nó
        const inventoryItems = await req.payload.find({
          collection: 'inventory',
          where: {
            or: [
              { item: { equals: productId } }, // Kiểm tra thuốc
              { items: { equals: productId } }, // Kiểm tra vật tư tiêu hao & máy móc thiết bị
            ],
          },
        })

        if (!inventoryItems.docs.length) {
          errorMessages.add(
            `[Mục số ${exportIndex + 1}, sản phẩm số ${itemIndex + 1}] - Sản phẩm "${productId}" thuộc danh mục "${category}" không có trong kho.`
          )
          continue
        }

        // Tính tổng số lượng tồn kho của sản phẩm này
        const totalStockQuantity = inventoryItems.docs.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        )
        const productName = inventoryItems.docs[0].sanpham || `ID: ${productId}` // Lấy tên sản phẩm

        if (totalStockQuantity === undefined || totalStockQuantity === null) {
          errorMessages.add(
            `[Mục số ${exportIndex + 1}, sản phẩm số ${itemIndex + 1}] - Số lượng tồn kho của sản phẩm "${productName}" trong danh mục "${category}" không hợp lệ.`
          )
          continue
        }

        if (quantityToExport > totalStockQuantity) {
          errorMessages.add(
            `[Mục số ${exportIndex + 1}, sản phẩm số ${itemIndex + 1}] - Danh mục: ${category}  sản phẩm ${productName} ( Kho: ${totalStockQuantity} , Xuất: ${quantityToExport})`
          )
        }
      }
    }
  }

  // Nếu có lỗi, ném lỗi một lần với tất cả thông báo
  if (errorMessages.size > 0) {
    console.error('❗ Lỗi kiểm tra tồn kho:', Array.from(errorMessages))
    throw new APIError(Array.from(errorMessages).join('\n'), 400)
  }

  return data
}

