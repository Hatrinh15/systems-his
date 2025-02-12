import { Import } from "lucide-react";
import { CollectionBeforeChangeHook } from "payload";
import { APIError } from "payload";
 export const checkvalueuser : CollectionBeforeChangeHook =
    async ({ data, req , operation }) => {
        if (operation === 'create'){
                const errors: string[] = [];
          
                // Kiểm tra trùng Số điện thoại
                const phoneCheck = await req.payload.find({
                  collection: 'users',
                  where: {
                    sdt: { equals: data.sdt },
                  },
                });
          
                if (phoneCheck.totalDocs > 0) {
                    errors.push('Số điện thoại đã được sử dụng.');
                }
          
          
                // Kiểm tra trùng Căn cước công dân (CCCD)
                const cccdCheck = await req.payload.find({
                  collection: 'users',
                  where: {
                    cccd: { equals: data.cccd },
                  },
                });
          
                if (cccdCheck.totalDocs > 0) {
                  errors.push('Căn cước công dân đã được sử dụng.');
                }
          
          
                // Hiển thị tất cả lỗi nếu có trùng
                if (errors.length > 0) {
                    throw new APIError(errors.map((err, index) => `${index + 1}. ${err}`).join('\n'), 400);

                }
                console.log ('check', data)
              }}