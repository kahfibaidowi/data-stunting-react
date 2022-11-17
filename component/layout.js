import React from "react"
import LayoutCondensed from "./layout_condensed"
import LayoutTransparent from "./layout_transparent"

const Layout=({type="vertical-transparent", children})=>{
    if(type=="vertical-transparent"){
        return <LayoutTransparent>{children}</LayoutTransparent>
    }
    else if(type=="condensed"){
        return <LayoutCondensed>{children}</LayoutCondensed>
    }
}

export default Layout