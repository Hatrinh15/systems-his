import { APIError,CollectionBeforeValidateHook,CollectionBeforeChangeHook } from "payload";
 
export const valuemedicalorder : CollectionBeforeValidateHook= ({data})=> {
    if(!data)return

    const error : string[] = []

    
    if(!data.khoa) {
        error.push('khoa')
    }
    if(!data.bacsi) {
        error.push('bác sĩ')
    }
    if(!data.dieuduong) {
        error.push('điều dưỡng')
    }
    if(!data.ngaynhapvien) {
        error.push('ngày nhập viện')
    }
    if(!data.ngayLap) {
        error.push('ngày lập')
    }
    if(!data.chuandoan) {
        error.push('chuẩn đoán')
    }
    if(!data.hinhthucdieutri) {
        error.push('hình thức điều trị')
    }
    if(data.hinhthucdieutri === 'benhnhannoitru'&& !data.hosobenhan) {
        error.push('hồ sơ bệnh án')
    }
    

    data?.thuoc.forEach((err,index) => {
        const errorArray: string[] =[]
        if(!err.thuocId){
            errorArray.push('chọn thuốc')
        }
        if(!err.hamLuong) {
            errorArray.push('hàm lượng')
        }
        if(!err.lieuDung) {
            errorArray.push('liều dùng')
        }
        if(!err.cachDung) {
            errorArray.push('cách dùng')
        }
        if(!err.thoiGian) {
            errorArray.push('thời gian')
        }
        const throwErrorArray = errorArray.map((err)=>err).join(',')
        error.push(`Thuốc ${index+1} hãy điền đủ thông tin: ${throwErrorArray}`)
    });  

    data?.xetNghiem.forEach((err,index) => {
        const errorArray: string[] =[]
        if(!err.loaiXetNghiem){
            errorArray.push('loại xét nghiệm')
        }
        if(!err.ngayChiDinh) {
            errorArray.push('ngày chỉ định')
        }
        if(!err.hinhAnh) {
            errorArray.push('hình ảnh')
        }
        if(!err.fileDinhKem) {
            errorArray.push('File kết quả')
        }
        const throwErrorArray = errorArray.map((err)=>err).join(',')
        error.push(`Xét nghiệm ${index+1} hãy điền đủ thông tin: ${throwErrorArray}`)
    });  



    const throwError = error.map((err) => `• ${err}`).join('\n');

    if (error.length > 0) {
        throw new APIError(`Hãy điền đủ thông tin:\n${throwError}`, 400);
    }
    
    

}


