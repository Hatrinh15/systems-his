import { Field } from "payload";
export const Khoa: Field[]=
[
    {name:'tenbenhnhan',label:'Tên bệnh nhân',type:'relationship',
        relationTo:'patients',
        required:true,
    },
    {name:'khoa',label:'Khoa',type:'text',},
    {name:'bacsiphutrach',label:'Bác sĩ phụ trách',type:'text'},
   
]