
import { CollectionBeforeChangeHook } from "payload";
import { APIError } from "payload";
 export const checkvalue : CollectionBeforeChangeHook =
    async ({ data, req ,operation}) => {
      if (operation === 'create' ){

                const errors: string[] = [];
          
                // Kiểm tra trùng Số điện thoại
                const phoneCheck = await req.payload.find({
                  collection:'patients',
                  where: {
                    sdt: { equals: data.sdt },
                  },
                });
          
                if (phoneCheck.totalDocs > 0) {
                    errors.push('Số điện thoại đã được sử dụng.');
                }
          
                // Kiểm tra trùng Email
                const emailCheck = await req.payload.find({
                  collection: 'patients',
                  where: {
                    email: { equals: data.email },
                  },
                });
          
                if (emailCheck.totalDocs > 0) {
                  errors.push('Email đã được sử dụng.');
                }
          
                // Kiểm tra trùng Căn cước công dân (CCCD)
                const cccdCheck = await req.payload.find({
                  collection: 'patients',
                  where: {
                    cccd: { equals: data.cccd },
                  },
                });
          
                if (cccdCheck.totalDocs > 0) {
                  errors.push('Căn cước công dân đã được sử dụng.');
                }
          
                // Kiểm tra trùng Mã bảo hiểm y tế (BHYT)
                const bhytCheck = await req.payload.find({
                  collection: 'patients',
                  where: {
                    idbaohiem: { equals: data.idbaohiem },
                  },
                });
          
                if (bhytCheck.totalDocs > 0) {
                  errors.push('Mã bảo hiểm y tế đã được sử dụng.');
                }
          
                // Hiển thị tất cả lỗi nếu có trùng
                if (errors.length > 0) {
                    throw new APIError(errors.map((err, index) => `${index + 1}. ${err}`).join('\n'), 400);

                }
                console.log ('check', data)
              } }