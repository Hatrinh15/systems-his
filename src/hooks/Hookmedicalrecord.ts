import { APIError,CollectionBeforeValidateHook,CollectionBeforeChangeHook } from "payload";
import { set } from "react-hook-form";
 
export const valuemedicalrecord : CollectionBeforeValidateHook= ({data})=> {
    if(!data)return

    const error : string[] = []
    // if(data.hoso.length === 0){
    // error.push('Hãy nhập thông tin hồ sơ!')
    // console.log('run')
    // }
    console.log('check:',data)
    data?.hoso.forEach((err,index) => {
        const errorArray: string[] =[]
        if(!err.khoa){
            errorArray.push('Khoa')
        }
        if(!err.bacsi) {
            errorArray.push('bác sĩ')
        }
        if(!err.dieuduong) {
            errorArray.push('điều dưỡng')
        }
        if(!err.ngaynhapvien) {
            errorArray.push('ngày nhập viện')
        }
        // if(!err.tomtat.dienBienBenh) {
        //     errorArray.push('diễn biến bệnh')
        // }
        if(!err.chuandoan) {
            errorArray.push('chuẩn đoán')
        }
        // if(!err.phuongphap) {
        //     errorArray.push('phương pháp điều trị')
        // }
        const throwErrorArray = errorArray.map((err)=>err).join(',')
        error.push(`Hồ sơ ${index+1} hãy điền đủ thông tin: ${throwErrorArray}`)
    });
   
    const throwError = error.map((err) => `• ${err}`).join('\n'); 
    if (error.length > 0) {
        throw new APIError(throwError.trim(), 400);
    }
    

}
export const valueho_so : CollectionBeforeValidateHook= ({data})=> {
    if(!data)return

    const error : string[] = []
    data?.ketqua.forEach((err,index) => {
        const errorArray: string[] =[]
        if(!err.ngay){
            errorArray.push('ngày thực hiện')
        }
        if(!err.bacsi) {
            errorArray.push('bác sĩ')
        }
        if(!err.ketquanoisoi) {
            errorArray.push('kết quả nội soi')
        }
        if(!err.hinhanh) {
            errorArray.push('hình ảnh nội soi')
        }
        if(!err.chuandoan) {
            errorArray.push('chuẩn đoán')
        }
        if(!err.huongdieutri) {
            errorArray.push('hướng điều trị')
        }
        const throwErrorArray = errorArray.map((err)=>err).join(',')
        error.push(`Hồ sơ ${index+1} hãy điền đủ thông tin: ${throwErrorArray}`)
    });
   
    const throwError = error.map((err) => `• ${err}`).join('\n'); // Mỗi lỗi trên một dòng
    if (error.length > 0) {
        throw new APIError(throwError.trim(), 400);
    }
    
}

 export const preventDuplicateMedicalRecord = async ({ data, req }) => {
    if (!data.lichsubenhan) return; // Nếu không có thông tin bệnh nhân thì không cần kiểm tra
  
    const existingRecord = await req.payload.find({
      collection: 'MedicalRecods',
      where: {
        'lichsubenhan': {
          equals: data.lichsubenhan, // Kiểm tra nếu bệnh nhân đã có hồ sơ
        },
      },
    });
  
    if (existingRecord.docs.length > 0) {
      throw new APIError('Bệnh nhân này đã có hồ sơ bệnh án, không thể tạo thêm!',400);
    }
  };
