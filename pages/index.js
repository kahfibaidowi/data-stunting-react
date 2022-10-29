import { Formik } from "formik"
import React from "react"
import Router from "next/router"
import {toast} from "react-toastify"
import { api } from "../config/api"
import { BASE_URL, login_data } from "../config/config"
import {BsArrowRight} from "react-icons/bs"

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

    render(){
        return  (
            <main className="d-flex align-items-center justify-content-center" style={{minHeight:"100vh"}}>
                <div class="login-form default-form p-2 px-3">
                    <div class="form-inner">
                        <h3 className="modal-title text-center mt-0">Login Data Stunting</h3>
                        <div className="mt-5">
                            <Formik
                                initialValues={{
                                    username:"",
                                    password:"",
                                    remember:false
                                }}
                                onSubmit={this.login}
                            >
                                {(props)=>(
                                    <form onSubmit={props.handleSubmit}>
                                        <div class="mb-2">
                                            <input 
                                                type="text" 
                                                class="form-control py-2half rounded" 
                                                placeholder="Username" 
                                                name="username"
                                                onChange={props.handleChange}
                                                value={props.values.username}
                                            />
                                        </div>
                                        <div class="mb-3">
                                            <input 
                                                type="password" 
                                                class="form-control py-2half rounded" 
                                                placeholder="Password" 
                                                name="password"
                                                onChange={props.handleChange}
                                                value={props.values.password}
                                            />
                                        </div>
                                        <div className="d-flex justify-content-between mb-4">
                                            <label className="form-check d-flex align-items-center cursor-pointer">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    name="remember"
                                                    id="remember"
                                                    checked={props.values.remember}
                                                    onChange={()=>props.setFieldValue("remember", !props.values.remember)}
                                                />
                                                <span className="ms-2 mt-1">Remember me</span>
                                            </label>
                                        </div>
                                        <div class="mb-3 d-flex justify-content-center">
                                            <button 
                                                type='submit' 
                                                className='btn btn-primary py-2half px-3 rounded'
                                                disabled={props.values.username===""||props.values.password===""||props.isSubmitting}
                                            >
                                                Login Sekarang
                                                <i className='ms-2'><BsArrowRight/></i>
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </Formik>
                        </div>
                        <p className="text-center fs-14px mt-4">Dengan melakukan Login anda telah menyetujui <a href="">Term & Condition</a></p>
                    </div>
                </div>
            </main>
        )
    }
}

export default Login