import { Khoa } from "@/fields/sky/tai_mui_hong";
import { APIError, CollectionConfig } from "payload";

const Rooms: CollectionConfig = {
    slug: "Rooms",
    labels: {
        singular: "PHÒNG BỆNH",
        plural: "PHÒNG BỆNH",
    },
    fields: [
        ...Khoa,
        {
            name:'Loaiphong',label:'Loại phòng',
            type:'radio',
            options:[
                {label:'Phòng thường(500.000/đêm)',value:'phongthuong',},
                {label:'Phòng Vip(1.200.000/đêm)',value:'phongvip'},
            ]
        },
        {
            name: "Sogiuong",
            label: "Số giường",
            type: "number",
            required: true,
            min: 1,
            max: 50,
        },

        {
            name: "Trangthai",
            label: "Trạng thái",
            type: "select",
            options: [
                { label: "Đang được sử dụng", value: "dang-su-dung" },
                { label: "Đã đầy", value: "da-day" },
            ],
            admin: {
                readOnly: true,
            },
        },
    ],

    hooks: { 
        beforeChange: [
            async ({ data, req, operation }) => {
                const { Sogiuong, id } = data;

                // Nếu là thao tác "create" hoặc "update"
                if (operation === "create" || operation === "update") {
                    const query: any = {
                        collection: "Rooms",
                        where: {
                            Sogiuong: {
                                equals: Sogiuong,
                            },
                        },
                    };

                    // Nếu đang cập nhật, bỏ qua phòng hiện tại
                    if (id) {
                        query.where.id = { not_equals: id };
                    }

                    // Kiểm tra số giường đã tồn tại chưa
                    const existingRoom = await req.payload.find(query);

                    if (existingRoom.docs.length > 0) {
                        throw new APIError("❌ Phòng này đã được chọn, vui lòng chọn số giường khác!",400);
                    }
                }
            },
        ],
    },
    
}
export default Rooms;
