import { Formik } from "formik"
import React from "react"
import Router from "next/router"
import {toast} from "react-toastify"
import { api } from "../config/api"
import { BASE_URL, login_data } from "../config/config"
import {BsArrowRight} from "react-icons/bs"
import * as yup from "yup"

class Login extends React.Component{

    componentDidMount=()=>{
    }

    //login
    login=async (values, actions)=>{
        await api().post("/auth/login", values)
        .then(res=>{
            localStorage.setItem("login_data", JSON.stringify(res.data.data))
            Router.push("/frontpage")
        })
        .catch(err=>{
            toast.error("Login Gagal!", {position:"bottom-center"})
        })

        actions.setIsSubmitting(false)
    }
    loginValidationSchema=()=>{
        return yup.object().shape({
            username:yup.string().required(),
            password:yup.string().required()
        })
    }

    render(){
        return  (
            <div className="border-top-wide border-primary d-flex flex-column" style={{height:"100vh"}}>
                <div className="page page-center">
                    <div className="container container-normal py-4">
                        <div className="row align-items-center g-4">
                            <div className="col-lg">
                                <div className="container-tight">
                                    <div className="text-center mb-4">
                                        <a href="." className="navbar-brand navbar-brand-autodark"><img src="/logo.svg" height="36" alt=""/></a>
                                    </div>
                                    <Formik
                                        initialValues={{
                                            username:"",
                                            password:"",
                                            remember:false
                                        }}
                                        validationSchema={this.loginValidationSchema()}
                                        onSubmit={this.login}
                                    >
                                        {props=>(
                                            <form className="card card-md" onSubmit={props.handleSubmit}>
                                                <div className="card-body">
                                                    <h2 className="h2 text-center mb-4">Login Data Stunting</h2>
                                                    <div className="mb-3">
                                                        <label className="form-label">Username</label>
                                                        <input 
                                                            type="text" 
                                                            className="form-control py-2half rounded" 
                                                            placeholder="" 
                                                            name="username"
                                                            onChange={props.handleChange}
                                                            value={props.values.username}
                                                            autoComplete="off"
                                                        />
                                                    </div>
                                                    <div className="mb-2">
                                                        <label className="form-label">Password</label>
                                                        <div className="input-group input-group-flat">
                                                            <input 
                                                                type="password" 
                                                                className="form-control py-2half" 
                                                                placeholder="" 
                                                                name="password"
                                                                onChange={props.handleChange}
                                                                value={props.values.password}
                                                                autoComplete="off"
                                                            />
                                                            <span className="input-group-text">
                                                                <a href="#" className="link-secondary" title="Show password" data-bs-toggle="tooltip">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="12" cy="12" r="2" /><path d="M22 12c-2.667 4.667 -6 7 -10 7s-7.333 -2.333 -10 -7c2.667 -4.667 6 -7 10 -7s7.333 2.333 10 7" /></svg>
                                                                </a>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mb-2">
                                                        <label className="form-check">
                                                            <input 
                                                                className="form-check-input" 
                                                                type="checkbox" 
                                                                name="remember"
                                                                id="remember"
                                                                checked={props.values.remember}
                                                                onChange={()=>props.setFieldValue("remember", !props.values.remember)}
                                                            />
                                                            <span className="form-check-label">Remember me</span>
                                                        </label>
                                                    </div>
                                                    <div className="form-footer">
                                                        <button 
                                                            type="submit" 
                                                            className="btn btn-primary w-100"
                                                            disabled={!(props.dirty&&props.isValid)}
                                                        >
                                                            Sign in
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        )}
                                    </Formik>
                                    <div className="text-center text-muted mt-3">
                                        Dengan Login anda telah menyetujui <a href="">Term & Condition</a>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg d-none d-lg-block">
                                <img src="/undraw_secure_login_pdn4.svg" height="300" className="d-block mx-auto" alt=""/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Login