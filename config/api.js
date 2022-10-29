import axios from "axios";
import { BASE_URL, BASE_URL_KEPENDUDUKAN } from "./config";


export const api=(jwt_token="")=>{
    let config={
        'content-type':'application/json'
    }

    if(jwt_token!=""){
        config.Authorization=`Bearer ${jwt_token}`
    }

    return axios.create({
        baseURL:BASE_URL,
        headers:config
    })
}
export const api_kependudukan=(jwt_token="")=>{
    let config={
        'content-type':'application/json'
    }

    if(jwt_token!=""){
        config.Authorization=`Bearer ${jwt_token}`
    }

    return axios.create({
        baseURL:BASE_URL_KEPENDUDUKAN,
        headers:config
    })
}