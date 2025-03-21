import {
  CollectionBeforeChangeHook,
  CollectionAfterChangeHook,
  CollectionAfterReadHook,
} from 'payload'
import { APIError } from 'payload'

// Trước khi lưu: Kiểm tra ngày, trùng khoa
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

// Sau khi lưu: Cập nhật kho hàng, quầy thuốc, kho khoa
export const hookxuatkho: CollectionAfterChangeHook = async ({doc,req,operation,previousDoc,}) => {
  if (operation === 'create') {
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
      for (const [exportId, exportQuantity] of exportMap.entries()) {
        const findthuoc = inventoryMap.get(exportId)
        if (findthuoc) {
          const soluong = findthuoc.quantity - exportQuantity
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
  if (operation === 'update') {
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
      const exportMap = new Map()

      const previousSet = new Set()
      for (const dc of previousDoc.exports) {
        for (const pc of dc.thuoc) {
          previousSet.add(pc.id)
        }
      }
      for (const dc of previousDoc.exports) {
        for (const pc of dc.vattutieuhao) {
          previousSet.add(pc.id)
        }
      }
      for (const dc of previousDoc.exports) {
        for (const pc of dc.maymocthietbi) {
          previousSet.add(pc.id)
        }
      }
      for (const item of doc.exports) {
        for (const thuoc of item.thuoc) {
          if (!previousSet.has(thuoc.id)) {
            const key = `${thuoc.tenthuoc}`
            const existingQuantity = exportMap.get(key) || 0
            exportMap.set(key, existingQuantity + thuoc.quantity)
          }
        }
      }
      for (const item of doc.exports) {
        for (const vattu of item.vattutieuhao) {
          if (!previousSet.has(vattu.id)) {
            const key = `${vattu.supply}`
            const existingQuantity = exportMap.get(key) || 0
            exportMap.set(key, existingQuantity + vattu.quantity)
          }
        }
      }
      for (const item of doc.exports) {
        for (const thietbi of item.maymocthietbi) {
          if (!previousSet.has(thietbi.id)) {
            const key = `${thietbi.equipment}`
            const existingQuantity = exportMap.get(key) || 0
            exportMap.set(key, existingQuantity + thietbi.quantity)
          }
        }
      }
      for (const [exportId, exportQuantity] of exportMap.entries()) {
        const findthuoc = inventoryMap.get(exportId)
        if (findthuoc) {
          const soluong = findthuoc.quantity - exportQuantity
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
}

export const hookNhapQuayThuoc: CollectionAfterChangeHook = async ({ doc, req, operation,previousDoc }) => {
  if (operation === 'create') {
    try {
      const pharmacyMap = new Map();
      // Lấy danh sách sản phẩm trong quầy thuốc
      const findPharmacies = await req.payload.find({
        collection: 'pharmacies',
        limit: 1000,
      });
      findPharmacies.docs.forEach((pharmacy) => {
        const itemId = typeof pharmacy.item === 'object' && pharmacy.item !== null ? pharmacy.item.id : pharmacy.item;
        const supplyId = typeof pharmacy.items === 'object' && pharmacy.items !== null ? pharmacy.items.id : pharmacy.items;
        pharmacyMap.set(`${itemId}`, { ...pharmacy, totalQuantity: pharmacy.quantity || 0 });
        pharmacyMap.set(`${supplyId}`, { ...pharmacy, totalQuantity: pharmacy.quantity || 0 });
      });
      if (!Array.isArray(doc.exports)) {
        console.error('Lỗi: doc.exports không phải là một mảng', doc.exports);
        return;
      }
      const importMap = new Map();
      for (const item of doc.exports) {
        if (item.thuoc && Array.isArray(item.thuoc)) {
          for (const thuoc of item.thuoc) {
            const key = `${thuoc.tenthuoc}`;
            const existingQuantity = importMap.get(key) || 0;
            importMap.set(key, existingQuantity + thuoc.quantity);
          }
        }
        if (item.vattutieuhao && Array.isArray(item.vattutieuhao)) {
          for (const vattu of item.vattutieuhao) {
            const key = `${vattu.supply}`;
            const existingQuantity = importMap.get(key) || 0;
            importMap.set(key, existingQuantity + vattu.quantity);
          }
        }
      }
      for (const [importId, importQuantity] of importMap.entries()) {
        const findItem = pharmacyMap.get(importId);
        if (findItem) {
          // Nếu sản phẩm đã có trong quầy thuốc, cập nhật số lượng
          const newQuantity = (findItem.totalQuantity || 0) + importQuantity;
          await req.payload.update({
            collection: 'pharmacies',
            id: findItem.id,
            data: { quantity: newQuantity },
          });
        } else {
          // Nếu sản phẩm chưa có, thêm mới
          const category = doc.exports.some(item => item.thuoc?.some(t => t.tenthuoc === importId)) 
              ? 'medications' 
              : 'vattutieuhao';

              await req.payload.create({
                collection: 'pharmacies',
                data: {
                  [category === 'medications' ? 'item' : 'items']: importId,
                  category,
                  quantity: importQuantity,
                },
              });
        }
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật quầy thuốc:', error);
    }
  }
  if (operation === 'update') {
    try {
      const pharmacyMap = new Map();
      // Lấy danh sách sản phẩm trong quầy thuốc
      const findPharmacies = await req.payload.find({
        collection: 'pharmacies',
        limit: 1000,
      });
      findPharmacies.docs.forEach((pharmacy) => {
        const itemId = typeof pharmacy.item === 'object' && pharmacy.item !== null ? pharmacy.item.id : pharmacy.item;
        const supplyId = typeof pharmacy.items === 'object' && pharmacy.items !== null ? pharmacy.items.id : pharmacy.items;
        pharmacyMap.set(`${itemId}`, { ...pharmacy, totalQuantity: pharmacy.quantity || 0 });
        pharmacyMap.set(`${supplyId}`, { ...pharmacy, totalQuantity: pharmacy.quantity || 0 });
      });
  
      if (!Array.isArray(doc.exports) || !Array.isArray(previousDoc.exports)) {
        console.error('Lỗi: doc.exports hoặc previousDoc.exports không hợp lệ', doc.exports, previousDoc.exports);
        return;
      }
  
      const importMap = new Map();
      const previousImportMap = new Map();
      
      for (const item of doc.exports) {
        if (item.thuoc && Array.isArray(item.thuoc)) {
          for (const thuoc of item.thuoc) {
            const key = `${thuoc.tenthuoc}`;
            const existingQuantity = importMap.get(key) || 0;
            importMap.set(key, existingQuantity + thuoc.quantity);
          }
        }
        if (item.vattutieuhao && Array.isArray(item.vattutieuhao)) {
          for (const vattu of item.vattutieuhao) {
            const key = `${vattu.supply}`;
            const existingQuantity = importMap.get(key) || 0;
            importMap.set(key, existingQuantity + vattu.quantity);
          }
        }
      }
      
      for (const item of previousDoc.exports) {
        if (item.thuoc && Array.isArray(item.thuoc)) {
          for (const thuoc of item.thuoc) {
            const key = `${thuoc.tenthuoc}`;
            const existingQuantity = previousImportMap.get(key) || 0;
            previousImportMap.set(key, existingQuantity + thuoc.quantity);
          }
        }
        if (item.vattutieuhao && Array.isArray(item.vattutieuhao)) {
          for (const vattu of item.vattutieuhao) {
            const key = `${vattu.supply}`;
            const existingQuantity = previousImportMap.get(key) || 0;
            previousImportMap.set(key, existingQuantity + vattu.quantity);
          }
        }
      }
  
      for (const [importId, newQuantity] of importMap.entries()) {
        const oldQuantity = previousImportMap.get(importId) || 0;
        const difference = newQuantity - oldQuantity;
        if (difference !== 0) {
          const findItem = pharmacyMap.get(importId);
          if (findItem) {
            const updatedQuantity = (findItem.totalQuantity || 0) + difference;
            await req.payload.update({
              collection: 'pharmacies',
              id: findItem.id,
              data: { quantity: updatedQuantity },
            });
          }
        }
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật quầy thuốc:', error);
    }
  }

};

// export const hookNhapKhoKhoa : CollectionAfterChangeHook 

export const showPrice: CollectionAfterReadHook = async ({ doc }) => {
  const formatNumber = (value: any) => {
    if (value == null || value === '') return '0'
    const numberValue = parseFloat(value.toString().replace(/\./g, ''))
    return new Intl.NumberFormat('vi-VN').format(numberValue)
  }

  const convertToNumber = (str: any) => {
    if (str == null || str === '') return 0
    return parseFloat(str.toString().replace(/\./g, '')) || 0
  }

  let tongGiaTriThuoc = 0
  let tongGiaTriVTTH = 0
  let tongGiaTriMMTB = 0

  if (doc.exports && Array.isArray(doc.exports)) {
    doc.exports.forEach((item) => {
      let tongTien = 0

      // Tính tổng giá trị thuốc
      if (Array.isArray(item.thuoc)) {
        item.thuoc.forEach((thuoc) => {
          if (thuoc.unitprice && thuoc.quantity) {
            const unitPriceNumber = convertToNumber(thuoc.unitprice)
            const quantityNumber = convertToNumber(thuoc.quantity)
            thuoc.totalprice = formatNumber(unitPriceNumber * quantityNumber)
            tongTien += unitPriceNumber * quantityNumber
            tongGiaTriThuoc += unitPriceNumber * quantityNumber
          }
          thuoc.unitprice = formatNumber(thuoc.unitprice)
        })
      }

      // Tính tổng giá trị vật tư tiêu hao
      if (Array.isArray(item.vattutieuhao)) {
        item.vattutieuhao.forEach((vattu) => {
          if (vattu.unitprice && vattu.quantity) {
            const unitPriceNumber = convertToNumber(vattu.unitprice)
            const quantityNumber = convertToNumber(vattu.quantity)
            vattu.totalprice = formatNumber(unitPriceNumber * quantityNumber)
            tongTien += unitPriceNumber * quantityNumber
            tongGiaTriVTTH += unitPriceNumber * quantityNumber
          }
          vattu.unitprice = formatNumber(vattu.unitprice)
        })
      }
      // Tính tổng giá trị máy móc thiết bị
      if (Array.isArray(item.maymocthietbi)) {
        item.maymocthietbi.forEach((maymoc) => {
          if (maymoc.unitprice && maymoc.quantity) {
            const unitPriceNumber = convertToNumber(maymoc.unitprice)
            const quantityNumber = convertToNumber(maymoc.quantity)
            maymoc.totalprice = formatNumber(unitPriceNumber * quantityNumber)
            tongTien += unitPriceNumber * quantityNumber
            tongGiaTriMMTB += unitPriceNumber * quantityNumber
          }
          maymoc.unitprice = formatNumber(maymoc.unitprice)
        })
      }
      item.tongtien = formatNumber(tongTien)
    })
  }

  doc.tong_gia_tri_thuoc = formatNumber(tongGiaTriThuoc)
  doc.tong_gia_tri_vtth = formatNumber(tongGiaTriVTTH)
  doc.tong_gia_tri_mmtb = formatNumber(tongGiaTriMMTB)
  doc.tong_gia_tri = formatNumber(tongGiaTriThuoc + tongGiaTriVTTH + tongGiaTriMMTB)
}
