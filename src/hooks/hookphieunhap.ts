/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CollectionBeforeValidateHook,
  APIError,
  CollectionBeforeChangeHook,
  CollectionAfterChangeHook,
} from 'payload'

//<> Thông báo ngày, và điều kiện của ngày
export const checkDate: CollectionBeforeValidateHook = async ({ req, data, operation }) => {
  if (operation === 'create') {
    const existingTransaction = await req.payload.find({
      collection: 'inventorytransactions',
      where: { transactiondate: { equals: data?.transactiondate } },
    })
    if (existingTransaction.docs.length > 0) {
      throw new APIError('Ngày giao dịch đã tồn tại trong hệ thống!', 400)
    }
  }
  if (!data) {
    throw new APIError('Dữ liệu không hợp lệ!', 400)
  }
  if (!data.transactiondate) {
    throw new APIError('Ngày giao dịch không được để trống!', 400)
  }

  if (operation === 'create' || operation === 'update') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const selectedDate = new Date(data.transactiondate)
    selectedDate.setHours(0, 0, 0, 0)

    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)

    if (selectedDate > today) {
      throw new APIError('Ngày giao dịch không thể là ngày trong tương lai!', 400)
    }

    if (selectedDate < sevenDaysAgo) {
      throw new APIError('Ngày giao dịch chỉ có thể trong vòng 7 ngày trở lại đây!', 400)
    }
  }
}

//<> Định dạng giá tiền và tính tiền
export const showPrice: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data) return data

  const formatNumber = (value: any) => {
    if (!value) return value
    const numberValue = Number(value.toString().replace(/\D/g, '')) // Loại bỏ ký tự không phải số
    return !isNaN(numberValue) ? new Intl.NumberFormat('vi-VN').format(numberValue) : value
  }
  let tongGiaTri = 0
  let tongGiaTriThuoc = 0
  let tongGiaTriVatTu = 0
  let tongGiaTriMayMoc = 0

  await Promise.all(
    data?.giaodich?.map(async (giaodich) => {
      // Xử lý thuốc
      await Promise.all(
        giaodich.thuoc?.map(async (thuoc) => {
          // Định dạng lại đơn giá khi lưu
          if (thuoc.unitprice) {
            thuoc.unitprice = formatNumber(thuoc.unitprice)
          }
        }),
      )

      // Xử lý vật tư
      await Promise.all(
        giaodich.vattu?.map(async (vattu) => {
          if (vattu.unitprice) {
            vattu.unitprice = formatNumber(vattu.unitprice)
          }
        }),
      )
      // Xử lý máy móc
      await Promise.all(
        giaodich.maymoc?.map(async (maymoc) => {
          if (maymoc.unitprice) {
            maymoc.unitprice = formatNumber(maymoc.unitprice)
          }
        }),
      )
    }),
  )

  if (!data?.giaodich) return data

  data.giaodich = data.giaodich.map((giaodich) => {
    // Xử lý cho thuốc
    if (giaodich.thuoc) {
      giaodich.thuoc = giaodich.thuoc.map((thuoc) => {
        if (thuoc.donvi === 'thung' && thuoc.quychuan) {
          thuoc.tongsohop = thuoc.quantity * parseInt(thuoc.quychuan, 10)
        } else {
          thuoc.tongsohop = thuoc.quantity
        }

        if (thuoc.unitprice !== undefined && thuoc.unitprice !== null && thuoc.unitprice !== '') {
          thuoc.unitprice = formatNumber(thuoc.unitprice)
        }

        return thuoc
      })
    }
    if (giaodich.vattu) {
      giaodich.vattu = giaodich.vattu.map((vattu) => {
        if (vattu.donvi === 'thung' && vattu.quychuan) {
          vattu.tongsohop = vattu.quantity * parseInt(vattu.quychuan, 10)
        } else {
          vattu.tongsohop = vattu.quantity
        }

        if (vattu.unitprice !== undefined && vattu.unitprice !== null && vattu.unitprice !== '') {
          vattu.unitprice = formatNumber(vattu.unitprice)
        }

        return vattu
      })
    }
    return giaodich
  })

  // Lấy giá nhập từ Bảng Giá
  await Promise.all(
    data?.giaodich?.map(async (giaodich) => {
      // Xử lý giá cho thuốc
      await Promise.all(
        giaodich.thuoc?.map(async (thuoc) => {
          if (!thuoc.unitprice) {
            const tenthuocId =
              typeof thuoc.tenthuoc === 'string' ? thuoc.tenthuoc : thuoc.tenthuoc?.id
            if (!tenthuocId) return

            try {
              const findthuoc = await req.payload.find({
                collection: 'baogia',
                where: { item: { equals: tenthuocId } },
                limit: 1,
              })

              if (findthuoc.docs.length > 0) {
                const gianhapList = findthuoc.docs[0]?.gianhapnhacungcap
                if (Array.isArray(gianhapList)) {
                  const supplierId =
                    typeof giaodich.nhacungcap === 'string'
                      ? giaodich.nhacungcap
                      : giaodich.nhacungcap?.id

                  const gianhap = gianhapList.find(
                    (nhacungcap: any) => nhacungcap?.nhacungcap?.id === supplierId,
                  )

                  if (gianhap && gianhap.gianhap) {
                    thuoc.unitprice = formatNumber(gianhap.gianhap)
                  }
                }
              }
            } catch (error) {
              console.error('Lỗi khi lấy giá nhập từ Bảng Giá:', error)
            }
          }

          if (thuoc.unitprice) {
            const unitPriceNumber = Number(thuoc.unitprice.toString().replace(/\D/g, ''))
            let totalPrice = 0

            if (thuoc.donvi === 'thung' && thuoc.tongsohop) {
              totalPrice = unitPriceNumber * Number(thuoc.tongsohop)
            } else if (thuoc.donvi === 'hop' && thuoc.quantity) {
              totalPrice = unitPriceNumber * Number(thuoc.quantity)
            }

            thuoc.totalprice = formatNumber(totalPrice)
          }
        }),
      )

      // Xử lý giá cho vật tư
      await Promise.all(
        giaodich.vattu?.map(async (vattu) => {
          if (!vattu.unitprice) {
            const tenvattuId =
              typeof vattu.tenvattu === 'string' ? vattu.tenvattu : vattu.tenvattu?.id
            if (!tenvattuId) return

            try {
              const findvattu = await req.payload.find({
                collection: 'baogia',
                where: { items: { equals: tenvattuId } },
                limit: 1,
              })

              if (findvattu.docs.length > 0) {
                const gianhapList = findvattu.docs[0]?.gianhapnhacungcap
                if (Array.isArray(gianhapList)) {
                  const supplierId =
                    typeof giaodich.nhacungcap === 'string'
                      ? giaodich.nhacungcap
                      : giaodich.nhacungcap?.id

                  const gianhap = gianhapList.find(
                    (nhacungcap: any) => nhacungcap?.nhacungcap?.id === supplierId,
                  )

                  if (gianhap && gianhap.gianhap) {
                    vattu.unitprice = formatNumber(gianhap.gianhap)
                  }
                }
              }
            } catch (error) {
              console.error('Lỗi khi lấy giá nhập từ Bảng Giá:', error)
            }
          }

          if (vattu.unitprice) {
            const unitPriceNumber = Number(vattu.unitprice.toString().replace(/\D/g, ''))
            let totalPrice = 0

            if (vattu.donvi === 'thung' && vattu.tongsohop) {
              totalPrice = unitPriceNumber * Number(vattu.tongsohop)
            } else if (vattu.donvi === 'hop' && vattu.quantity) {
              totalPrice = unitPriceNumber * Number(vattu.quantity)
            }

            vattu.totalprice = formatNumber(totalPrice)
          }
        }),
      )
      await Promise.all(
        giaodich.maymoc.map(async (maymoc) => {
          if (!maymoc.unitprice) {
            const tenmaymocId =
              typeof maymoc.tenmaymoc === 'string' ? maymoc.tenmaymoc : maymoc.tenmaymoc?.id
            if (!tenmaymocId) return

            try {
              const findmaymoc = await req.payload.find({
                collection: 'baogia',
                where: { items: { equals: tenmaymocId } },
                limit: 1,
              })

              if (findmaymoc.docs.length > 0) {
                const gianhapList = findmaymoc.docs[0]?.gianhapnhacungcap
                if (Array.isArray(gianhapList)) {
                  const supplierId =
                    typeof giaodich.nhacungcap === 'string'
                      ? giaodich.nhacungcap
                      : giaodich.nhacungcap?.id

                  const gianhap = gianhapList.find(
                    (nhacungcap: any) => nhacungcap?.nhacungcap?.id === supplierId,
                  )

                  if (gianhap && gianhap.gianhap) {
                    maymoc.unitprice = formatNumber(gianhap.gianhap)
                  }
                }
              }
            } catch (error) {
              console.error('Lỗi khi lấy giá nhập từ Bảng Giá:', error)
            }
          }
          if (maymoc.unitprice) {
            const unitPriceNumber = Number(maymoc.unitprice.toString().replace(/\D/g, ''))
            let totalPrice = 0
            if (maymoc.quantity) {
              totalPrice = unitPriceNumber * Number(maymoc.quantity)
            }
            maymoc.totalprice = formatNumber(totalPrice)
          }
        }),
      )
      // Tính tổng tiền cho giao dịch
      let tongtien = 0
      giaodich.thuoc?.forEach((thuoc) => {
        if (thuoc.totalprice) {
          tongtien += Number(thuoc.totalprice.toString().replace(/\D/g, ''))
        }
      })
      giaodich.vattu?.forEach((vattu) => {
        if (vattu.totalprice) {
          tongtien += Number(vattu.totalprice.toString().replace(/\D/g, ''))
        }
      })
      giaodich.maymoc?.forEach((maymoc) => {
        if (maymoc.totalprice) {
          tongtien += Number(maymoc.totalprice.toString().replace(/\D/g, ''))
        }
      })
      giaodich.tongtien = formatNumber(tongtien)
    }),
  )
  data.giaodich?.forEach((giaodich) => {
    giaodich.thuoc?.forEach((item) => {
      const value = parseFloat(item.totalprice?.toString().replace(/\D/g, '') || '0')
      tongGiaTriThuoc += isNaN(value) ? 0 : value
    })
    giaodich.vattu?.forEach((item) => {
      const value = parseFloat(item.totalprice?.toString().replace(/\D/g, '') || '0')
      tongGiaTriVatTu += isNaN(value) ? 0 : value
    })
    giaodich.maymoc?.forEach((item) => {
      const value = parseFloat(item.totalprice?.toString().replace(/\D/g, '') || '0')
      tongGiaTriMayMoc += isNaN(value) ? 0 : value
    })
  })

  tongGiaTri = tongGiaTriThuoc + tongGiaTriVatTu + tongGiaTriMayMoc

  data.tong_gia_tri_thuoc = formatNumber(tongGiaTriThuoc)
  data.tong_gia_tri_vtth = formatNumber(tongGiaTriVatTu)
  data.tong_gia_tri_mmtb = formatNumber(tongGiaTriMayMoc)
  data.tong_gia_tri = formatNumber(tongGiaTri)

  return data
}

//<> Tự động điền số lượng vào bên kho
export const hookNhapKho: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  previousDoc,
}) => {
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

      for (const item of doc.giaodich) {
        for (const thuoc of item.thuoc) {
          const key = `${thuoc.tenthuoc}`
          const multiplier = thuoc.donvi === 'thung' ? thuoc.quychuan || 1 : 1
          const tien = thuoc.quantity * multiplier
          exportMap.set(key, (exportMap.get(key) || 0) + tien)
        }
      }
      for (const item of doc.giaodich) {
        for (const vattu of item.vattu) {
          const key = `${vattu.tenvattu}`
          const mutiplier = vattu.donvi === 'thung' ? vattu.quychuan || 1 : 1
          const tien = vattu.quantity * mutiplier
          exportMap.set(key, (exportMap.get(key) || 0) + tien)
        }
      }
      for (const item of doc.giaodich) {
        for (const thietbi of item.maymoc) {
          const key = `${thietbi.tenmaymoc}`
          const tien = exportMap.get(key) || 0
          exportMap.set(key, tien + thietbi.quantity)
        }
      }
      for (const [exportId, exportQuantity] of exportMap.entries()) {
        const findthuoc = inventoryMap.get(exportId)
        if (findthuoc) {
          const soluong = findthuoc.quantity + exportQuantity
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
      for (const dc of previousDoc.giaodich) {
        for (const pc of dc.thuoc) {
          previousSet.add(pc.id)
        }
      }
      for (const dc of previousDoc.giaodich) {
        for (const pc of dc.vattu) {
          previousSet.add(pc.id)
        }
      }
      for (const dc of previousDoc.giaodich) {
        for (const pc of dc.maymoc) {
          previousSet.add(pc.id)
        }
      }
      for (const item of doc.giaodich) {
        for (const thuoc of item.thuoc) {
          if (!previousSet.has(thuoc.id)) {
            const key = `${thuoc.tenthuoc}`
            const multiplier = thuoc.donvi === 'thung' ? thuoc.quychuan || 1 : 1
            const tien = thuoc.quantity * multiplier
            exportMap.set(key, (exportMap.get(key) || 0) + tien)
          }
        }
      }
      for (const item of doc.giaodich) {
        for (const vattu of item.vattu) {
          if (!previousSet.has(vattu.id)) {
            const key = `${vattu.tenvattu}`
            const mutiplier = vattu.donvi === 'thung' ? vattu.quychuan || 1 : 1
            const tien = vattu.quantity * mutiplier
            exportMap.set(key, (exportMap.get(key) || 0) + tien)
          }
        }
      }
      for (const item of doc.giaodich) {
        for (const thietbi of item.maymoc) {
          if (!previousSet.has(thietbi.id)) {
            const key = `${thietbi.tenmaymoc}`
            const tien = exportMap.get(key) || 0
            exportMap.set(key, tien + thietbi.quantity)
          }
        }
      }
      for (const [exportId, exportQuantity] of exportMap.entries()) {
        console.log(`🟢 Xử lý sản phẩm ID: ${exportId}`)

        const findItem = inventoryMap.get(exportId)

        if (findItem) {
          // Nếu sản phẩm đã có trong kho, cập nhật số lượng
          const newQuantity = (findItem.quantity || 0) + exportQuantity
          await req.payload.update({
            collection: 'inventory',
            id: findItem.id,
            data: { quantity: newQuantity >= 0 ? newQuantity : 0 },
          })
          console.log(`✅ Cập nhật số lượng sản phẩm: ${exportId}, Số lượng mới: ${newQuantity}`)
        } else {
          // 🛠 Kiểm tra xem exportId có phải là thuốc không
          const medicationResult = await req.payload.find({
            collection: 'medications',
            where: { id: { equals: exportId } },
            limit: 1,
          })

          // 🛠 Kiểm tra xem exportId có phải là vật tư không
          const medicalSupplyResult = await req.payload.find({
            collection: 'medicalSupplies',
            where: { id: { equals: exportId } },
            limit: 1,
          })

          const medication = medicationResult.docs[0]
          const medicalSupply =
            typeof medicalSupplyResult.docs[0] === 'object' && medicalSupplyResult.docs[0] !== null
              ? medicalSupplyResult.docs[0]
              : []
          const loaivattu = Array.isArray(medicalSupply) ? undefined : medicalSupply.loaivattu
          if (medication) {
            // Nếu là thuốc
            await req.payload.create({
              collection: 'inventory',
              data: {
                item: exportId,
                category: 'medications',
                quantity: exportQuantity,
                stockstatus: 'conhang', // or any appropriate value
              },
            })
            console.log(`✅ Tạo mới thuốc ID: ${exportId}, Số lượng: ${exportQuantity}`)
          } else if (medicalSupply) {
            // Nếu là vật tư hoặc máy móc thiết bị
            const category =
              typeof loaivattu === 'string' && ['vattutieuhao', 'maymocthietbi'].includes(loaivattu)
                ? loaivattu
                : 'vattutieuhao' // Mặc định nếu category null
            await req.payload.create({
              collection: 'inventory',
              data: {
                items: exportId,
                category: category || 'vattutieuhao',
                quantity: exportQuantity,
                stockstatus: 'conhang', // or any appropriate value
              },
            })
            console.log(
              `✅ Tạo mới vật tư ID: ${exportId}, Loại: ${category}, Số lượng: ${exportQuantity}`,
            )
          } else {
            console.error(
              `🚨 Không tìm thấy sản phẩm với ID: ${exportId} trong medications hoặc medicalSupplies.`,
            )
          }
        }
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật kho:', error)
    }
  }
}
