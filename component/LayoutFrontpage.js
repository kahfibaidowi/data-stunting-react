import React from "react"
import { Accordion, Dropdown, Offcanvas } from "react-bootstrap"
import Avatar from "./ui/avatar"
import {IoHomeOutline, IoPersonOutline, IoAlertCircleOutline, IoLogOutOutline} from "react-icons/io5"
import {CgMenuRight} from "react-icons/cg"
import { api } from "../config/api"
import { access_token, login_data, name_slice } from "../config/config"
import Link from "next/link"
import Router from "next/router"

class LayoutFrontpage extends React.Component{
    state={
        login_data:{},
        active_mobile_menu:false
    }

    componentDidMount=()=>{
        this.setState({
            login_data:login_data()!=null?login_data():{}
        })
    }

    toggleMobilemenu=()=>{
        this.setState({
            active_mobile_menu:!this.state.active_mobile_menu
        })
    }

    //action
    logout=()=>{
        api(access_token()).delete("/auth/logout")
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
        })
    }


    render(){
        const {login_data}=this.state

        return (
            <>
                <header className="navbar-header fixed-top p-3 py-2 px-0 mb-0">
                    <div className="container px-md-4">
                        <div className="d-flex flex-wrap align-items-center justify-content-md-between">
                            <a href="/frontpage" className="d-flex align-items-center mb-2 mb-lg-0 me-4 text-dark text-decoration-none">
                                <img src="" className="img-fluid" style={{maxHeight:"35px"}}/>
                            </a>
                            {/* <ul className="d-none d-lg-flex nav col-12 col-lg-auto me-lg-auto ms-lg-auto mb-2 justify-content-center mb-md-0 mx-auto">
                                <li>
                                    <Link href="/admin" className="nav-link px-3 link-dark">
                                        Dashboard
                                    </Link>
                                </li>
                            </ul> */}
                            <div className="d-flex align-items-center ms-auto ms-md-0" style={{minHeight:"3rem"}}>
                                <Dropdown align="end" className='ms-3'>
                                    <Dropdown.Toggle as="a" className="d-flex align-items-center text-dark text-decoration-none cursor-pointer no-caret-small">
                                        <span className="avatar">
                                            <Avatar
                                                data={login_data}
                                            />
                                        </span>
                                        <span className="ms-2 d-none d-md-flex">{name_slice(login_data.nama_lengkap)}</span>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="dropdown-menu-profile dropdown-menu-animated p-2" renderOnMount>
                                        {login_data.role!="posyandu"&&
                                            <Link href="/admin" className="dropdown-item">
                                                <i><IoHomeOutline/></i>Dashboard
                                            </Link>
                                        }
                                        <Link href="/admin/profile" className="dropdown-item">
                                            <i><IoPersonOutline/></i>Profile Saya
                                        </Link>
                                        <Link href="" className="dropdown-item">
                                            <i><IoAlertCircleOutline/></i>Tentang Aplikasi
                                        </Link>
                                        <Dropdown.Divider/>
                                        <a className="dropdown-item cursor-pointer border-0" onClick={this.logout}><i><IoLogOutOutline/></i>Logout</a>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                            <button className="d-flex d-lg-none navbar-toggler ms-3 px-0" onClick={this.toggleMobilemenu}>
                                <CgMenuRight/>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="d-flex flex-column" style={{marginTop:"60px", position:"relative"}}>
                    {this.props.children}
                </div>

                {/* <Offcanvas show={this.state.active_mobile_menu} onHide={this.toggleMobilemenu} className="mobile-menu">
                    <Offcanvas.Header closeButton>
                        <div className="logo">
                            <Link href="/"><img src="" className="img-fluid" style={{maxHeight:"35px"}}/></Link>
                        </div>
                    </Offcanvas.Header>
                    <Offcanvas.Body className="p-0 px-4">
                        <Accordion activeKey={this.state.active_menu_collapse} as="div" className="mt-5">
                            <ul className="nav flex-column">
                                <li>
                                    <Link href="/frontpage" className='nav-link link-dark'>Dashboard</Link>
                                </li>
                            </ul>
                        </Accordion>
                    </Offcanvas.Body>
                </Offcanvas> */}
            </>
        )
    }
}

export default LayoutFrontpage