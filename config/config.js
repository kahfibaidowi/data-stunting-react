import moment from "moment"
import { read, utils, writeFileXLSX } from 'xlsx';


//url
export const BASE_URL=process.env.NODE_ENV==="development"?
    "http://localhost/data-stunting/public":
    "https://api.stunting.garapan.id";
export const BASE_URL_KEPENDUDUKAN=process.env.NODE_ENV==="development"?
    "http://localhost/data-kependudukan/public":
    "https://api.kependudukan.garapan.id";

//login storage
export const login_data=()=>{
    const data=localStorage.getItem("login_data")
    return JSON.parse(data)
}
export const is_login=()=>{
    const user_data=localStorage.getItem("login_data")

    if(user_data!==null){
        return true
    }
    else{
        return false
    }
}
export const access_token=()=>{
    if(is_login()){
        return login_data().access_token
    }
    else{
        return ""
    }
}

//helper
export const isUndefined=v=>{
    if(typeof v==="undefined") return true
    else return false
}
export const akronim=str=>{
    if(str.trim()===""){
        return ""
    }
    else{
        const matches=str.match(/\b(\w)/g)
        return matches.join('').toUpperCase().substring(0, 2)
    }
}
export const get_file=str=>{
    const data=str.split("__")
    return data[data.length-1]
}
export const name_slice=(str)=>{
    if(isUndefined(str)){
        return ""
    }
    
    const first_name=ucwords(str.replace(/ .*/,''))

    if(first_name.length>7){
        return first_name.substring(0, 5)+"..."
    }
    else{
        return first_name
    }
}
export const ucwords=str=>{
    if(isUndefined(str)){
        return ""
    }
    const text=str.toLowerCase().replace(/\b[a-z]/g, function(letter) {
        return letter.toUpperCase();
    })

    return text
}
export const ceil_with_enclosure=(number, enclosure=0.5)=>{
    const int_number=Math.floor(number);

    if(number<=int_number+enclosure){
        return Math.floor(number);
    }
    else{
        return Math.round(number);
    }
}
export const excelToMomentDate=date=>{
    var date=moment(new Date(Date.UTC(0, 0, date-1)))
    
    return date.format('YYYY-MM-DD')
}
export const file_to_workbook=(file, callback)=>{
    var reader=new FileReader()
    reader.onload=e=>{
      callback(read(e.target.result));
    }
    reader.readAsArrayBuffer(file)
}