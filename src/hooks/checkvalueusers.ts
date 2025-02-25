import { CollectionBeforeChangeHook } from 'payload';
import { APIError } from 'payload';

export const checkvalueuser: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === 'create') {
    const errors: { [key: string]: string } = {};
    if (data.sdt) {
      const phoneCheck = await req.payload.find({
        collection: 'users',
        where: { sdt: { equals: data.sdt } },
      });
      if (phoneCheck.totalDocs > 0) {
        errors['sdt'] = 'Số điện thoại đã được sử dụng.';
      }
    }

    if (data.cccd) {
      const cccdCheck = await req.payload.find({
        collection: 'users',
        where: { cccd: { equals: data.cccd } },
      });
      if (cccdCheck.totalDocs > 0) {
        errors['cccd'] = 'Căn cước công dân đã được sử dụng.';
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new APIError(JSON.stringify(errors),400); // Dùng Error thông thường để báo lỗi
    }
  }
  
  
};
