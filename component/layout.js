import React from "react"
import LayoutCombined from "./layout_combined"
import LayoutCondensed from "./layout_condensed"
import LayoutTransparent from "./layout_transparent"

const Layout=({type="combined", children})=>{
    if(type=="vertical-transparent"){
        return <LayoutTransparent>{children}</LayoutTransparent>
    }
    else if(type=="condensed"){
        return <LayoutCondensed>{children}</LayoutCondensed>
    }
    else if(type=="combined"){
        return <LayoutCombined>{children}</LayoutCombined>
    }
}

export default Layout