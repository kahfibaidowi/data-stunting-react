import React from 'react'
import classNames from "classnames"
import { akronim, BASE_URL, isUndefined } from '../../config/config'

export default function Avatar({data, circle=false}) {
    const get_avatar_url=(avatar_url)=>{
        let avatar
        if(isUndefined(avatar_url)) avatar=""
        else avatar=avatar_url

        return BASE_URL+"/file/show/"+avatar
    }

    return (
        <>
            {!isUndefined(data)&&
                <>
                    {data.avatar_url==""?
                        <>{akronim(data.nama_lengkap)}</>
                    :
                        <img 
                            src={get_avatar_url(data.avatar_url)} 
                            className={classNames({"rounded-circle":circle})}
                        />
                    }
                </>
            }
        </>
    )
}
