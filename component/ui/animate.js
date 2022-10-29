import React from 'react'
import classNames from "classnames"

const Animated=({isVisible, animationIn, animationOut, animationInDuration="100ms", animationInDelay="0ms", animationOutDuration="100ms", animationOutDelay="0ms", infinite=false, children})=>{
    return (
        <div
            className={classNames("animate__animated", {[animationIn]:isVisible, [animationOut]:!isVisible, "animate__infinite":infinite})}
            style={{
                animationDuration:isVisible?animationInDuration:animationOutDuration,
                animationDelay:isVisible?animationInDelay:animationOutDelay
            }}
        >
            {children}
        </div>
    )
}

export default Animated