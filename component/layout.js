import React from "react"
import LayoutCombined from "./layout_combined"
import LayoutCondensed from "./layout_condensed"
import LayoutNoble from "./layout_noble"
import LayoutTransparent from "./layout_transparent"

const Layout=({type="noble", children})=>{
    if(type=="vertical-transparent"){
        return <LayoutTransparent>{children}</LayoutTransparent>
    }
    else if(type=="condensed"){
        return <LayoutCondensed>{children}</LayoutCondensed>
    }
    else if(type=="combined"){
        return <LayoutCombined>{children}</LayoutCombined>
    }
    else if(type=="noble"){
        return <LayoutNoble>{children}</LayoutNoble>
    }
}

export default Layout