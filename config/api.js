import axios from "axios";
import axiosRetry from "axios-retry";
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
        'content-type':'application/json',
        'secret-key':"Rxm6pJwmx1Zrs?Lv5EHx4HSJfdgxNVYqeKbR=JeZuoCJ5Sis?LoYQMhnVYMS6wYHxCGgi98jgipMi0Tl3?/ybxClOYOlQb/lcyz!4Hakw95=rIh/FQezg!lJQxOVu=Hl8kln/QUlc-D0Xnnuj2g=6SRe6rw0pfuhfdP7NAHefDh25e-RKcwT6KvO4FeTBOUszChVBbP5zbXu72NzF2DOP!vEIjnZRY5noYxEQO3S/XVq4MRbIHbLzuZkBm0j309h"
    }

    if(jwt_token!=""){
        config.Authorization=`Bearer ${jwt_token}`
    }

    return axios.create({
        baseURL:BASE_URL_KEPENDUDUKAN,
        headers:config
    })
}
