import React from "react"
import classNames from "classnames"

export const CustomRadioPicker=({info="", label, checked, value, isInvalid=false, name, onChange})=>{
    return (
        <label class={classNames("form-selectgroup-item", {"is-invalid":isInvalid})}>
            <input 
                type="radio" 
                class="form-selectgroup-input" 
                name={name}
                checked={checked}
                value={value}
                onChange={e=>onChange(e)}
            />
            <span class="form-selectgroup-label d-flex align-items-center text-start p-3">
                <span class="me-3">
                    <span class="form-selectgroup-check"></span>
                </span>
                <span class="d-flex flex-column justify-content-start align-items-start">
                    <span class="form-selectgroup-title fw-semibold">{label}</span>
                    {info!==""&&<span class="text-muted text-start fs-8 mt-1">{info}</span>}
                </span>
            </span>
        </label>
    )
}

export const RadioPicker=({label, checked, onChange, id="", disabled=true})=>{
    return (
        <div class="form-check">
            <input 
                class="form-check-input" 
                type="radio" 
                checked={checked}
                onChange={onChange}
                id={id}
                disabled={disabled}
            />
            <label class="form-check-label" for={id}>{label}</label>
        </div>
    )
}

export const CustomCheckboxPicker=({info, label, checked, name, onChange})=>{
    return (
        <label class="form-selectgroup-item flex-fill">
            <input 
                type="checkbox" 
                name={name} 
                class="form-selectgroup-input"  
                checked={checked}
                onChange={(e)=>onChange()}
            />
            <div class="form-selectgroup-label d-flex align-items-center text-left p-3">
                <div class="mr-3">
                    <span class="form-selectgroup-check"></span>
                </div>
                <div class="form-selectgroup-label-content">
                    <span class="form-selectgroup-title strong mb-1">{label}</span>
                    <span class="d-block text-muted">{info}</span>
                </div>
            </div>
        </label>
    )
}
export const CheckItem=({label, active, onChange, className, autoWidth=false})=>{
    return (
        <div className={classNames('option-item mb-2', className, {"w-auto":autoWidth}, {"active":active})} onClick={onChange}>
            {label}
        </div>
    )
}
export const SwitchBox=({label, checked=true, onChange, id=""})=>{
    return (
        <div class="form-check form-switch">
            <input 
                class="form-check-input" 
                type="checkbox" 
                checked={checked}
                onChange={e=>onChange(e)}
                id={id}
            />
            <label 
                class="form-check-label" 
                for={id}
            >
                {label}
            </label>
        </div>
    )
}