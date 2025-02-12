import { Field } from 'payload'
export const lichkham: Field = {
  name: 'benhan',
  label: ' ',
  type: 'join',
  collection: 'appointments',
  on: 'patients',
}
export const lichsu: Field = {
    name: 'lichsu',
    label: ' ',
    type: 'join',
    collection: 'MedicalRecods',
    on:'lichsubenhan',
    }
 export const lichlamviec: Field= {
      name: 'lichlamviec',
      label: ' ',
      type: 'join',
      collection: 'appointments',
       on: 'bacsi',
  }
  

