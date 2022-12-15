import React from "react"
import classNames from "classnames"
import { Dropdown, Navbar } from "react-bootstrap"
import { access_token, login_data, set_theme } from "../config/config"
import ThemeContext from "../store/theme_context"
import {TbAlertCircle, TbArrowsLeftRight, TbBuildingFactory, TbEdit, TbExclamationMark, TbHome, TbLogout, TbMap2, TbMoodKid, TbUsers} from "react-icons/tb"
import Avatar from "./ui/avatar"
import { api } from "../config/api"
import Router from "next/router"
import { toast } from "react-toastify"
import Link from "next/link"

class LayoutCombined extends React.Component{
    state={
        login_data:{},
        sidebar:{
            is_open:true
        }
    }

    componentDidMount=()=>{
        this.setState({
            login_data:login_data()!=null?login_data():{}
        })
    }
    toggleSidebar=()=>{
        this.setState({
            sidebar:{
                is_open:!this.state.sidebar.is_open
            }
        })
    }

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
        const {login_data, sidebar}=this.state

        return (
            <>
                <Navbar as="aside" className={classNames("navbar navbar-vertical navbar-dark", {"sidebar-collapsed":!sidebar.is_open})} expand="lg">
                    <div class="container-fluid">
                        <Navbar.Toggle className="navbar-toggler" as="button" type="button">
                            <span className="navbar-toggler-icon"></span>
                        </Navbar.Toggle>
                        <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal navbar-brand-responsive">
                            {/* <Link href={`/frontpage/${login_data.role=="dinas"?"/stunting_4118":""}`}>
                                <img src="/logo.png" alt="Stunting" className="navbar-brand-image"/>
                            </Link> */}
                        </h1>
                        <div className="navbar-nav flex-row order-md-last d-lg-none">
                            <ThemeContext.Consumer>
                                {tc_value=>(
                                    <div className="d-none d-md-flex me-3">
                                        {tc_value.theme=="light"?
                                            <a 
                                                href="" 
                                                className="nav-link px-0 toggle-theme-dark"
                                                title="Enable dark mode"
                                                onClick={e=>{
                                                    e.preventDefault()
                                                    tc_value.setDarkMode()
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" /></svg>
                                            </a>
                                        :
                                            <a 
                                                href="" 
                                                className="nav-link px-0 toggle-theme-light" 
                                                title="Enable light mode"
                                                onClick={e=>{
                                                    e.preventDefault()
                                                    tc_value.setLightMode()
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="12" cy="12" r="4" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></svg>
                                            </a>       
                                        }
                                    </div>
                                )}
                            </ThemeContext.Consumer>
                            <Dropdown as="div" className="dropdown nav-item">
                                <Dropdown.Toggle as="a" href="#" className="nav-link d-flex lh-1 text-reset p-0 no-arrow">
                                    <span className="avatar avatar-sm">
                                        <Avatar
                                            data={login_data}
                                        />
                                    </span>
                                    <div className="d-none d-xl-block ps-2">
                                        <div>{login_data.nama_lengkap}</div>
                                        <div className="mt-1 small text-muted">{login_data.role}</div>
                                    </div>
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end" className="dropdown-menu-arrow">
                                    <a href="" className="dropdown-item">
                                        <TbEdit className="icon dropdown-item-icon"/>
                                        My Profile
                                    </a>
                                    <a href="" className="dropdown-item">
                                        <TbAlertCircle className="icon dropdown-item-icon"/>
                                        Tentang Aplikasi
                                    </a>
                                    <div className="dropdown-divider"></div>
                                    <a 
                                        href="" 
                                        className="dropdown-item"
                                        onClick={e=>{
                                            e.preventDefault()
                                            this.logout()
                                        }}
                                    >
                                        <TbLogout className="icon dropdown-item-icon"/>
                                        Logout
                                    </a>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                        <Navbar.Collapse id="toggle-nav-menu">
                            <ul className="navbar-nav pt-lg-3">
                                {login_data.role!="dinas"&&
                                    <>
                                        <li className="nav-item">
                                            <Link href="/frontpage" className="nav-link">
                                                <TbHome className="nav-link-icon d-md-none d-lg-inline-block"/>
                                                <span className="nav-link-title">
                                                    Frontpage
                                                </span>
                                            </Link>
                                        </li>
                                        <Dropdown as="li" className="nav-item dropdown" autoClose={false}>
                                            <Dropdown.Toggle as="a" className="nav-link dropdown-toggle" href="#">
                                                <TbMoodKid className="nav-link-icon d-md-none d-lg-inline-block"/>
                                                <span className="nav-link-title">
                                                    Skrining Balita
                                                </span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="dropdown-menu-static">
                                                <Link href="/frontpage/skrining_balita/?action=cek_antropometri" className="dropdown-item">
                                                    Cek Antropometri
                                                </Link>
                                                <Link href="/frontpage/skrining_balita" className="dropdown-item">
                                                    Lihat Skrining
                                                </Link>
                                                <Link href="/frontpage/skrining_balita/stunting" className="dropdown-item">
                                                    Data Stunting
                                                </Link>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </>
                                }
                                {["admin", "dinas"].includes(login_data.role)&&
                                    <>
                                        <Dropdown as="li" className="nav-item dropdown" autoClose={false}>
                                            <Dropdown.Toggle as="a" className="nav-link dropdown-toggle" href="#">
                                                <TbBuildingFactory className="nav-link-icon d-md-none d-lg-inline-block"/>
                                                <span className="nav-link-title">
                                                    Rencana Intervensi
                                                </span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="dropdown-menu-static">
                                                <Link href="/frontpage/intervensi/rencana_kegiatan" className="dropdown-item">
                                                    Rencana Kegiatan
                                                </Link>
                                                <Link href="/frontpage/intervensi/rencana_bantuan" className="dropdown-item">
                                                    Rencana Bantuan
                                                </Link>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                        <Dropdown as="li" className="nav-item dropdown" autoClose={false}>
                                            <Dropdown.Toggle as="a" className="nav-link dropdown-toggle" href="#">
                                                <TbBuildingFactory className="nav-link-icon d-md-none d-lg-inline-block"/>
                                                <span className="nav-link-title">
                                                    Realisasi Intervensi
                                                </span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="dropdown-menu-static">
                                                <Link href="/frontpage/intervensi/realisasi_kegiatan" className="dropdown-item">
                                                    Realisasi Kegiatan
                                                </Link>
                                                <Link href="/frontpage/intervensi/realisasi_bantuan" className="dropdown-item">
                                                    Realisasi Bantuan
                                                </Link>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </>
                                }
                                {["admin", "dinas"].includes(login_data.role)&&
                                    <>
                                        <Dropdown as="li" className="nav-item dropdown" autoClose={false}>
                                            <Dropdown.Toggle as="a" className="nav-link dropdown-toggle" href="#">
                                                <TbMoodKid className="nav-link-icon d-md-none d-lg-inline-block"/>
                                                <span className="nav-link-title">
                                                    Stunting 4118
                                                </span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="dropdown-menu-static">
                                                <Link href="/frontpage/stunting_4118" className="dropdown-item">
                                                    Lihat Data
                                                </Link>
                                                {login_data.role=="admin"&&
                                                    <>
                                                        <Link href="/frontpage/stunting_4118/realisasi_anggaran_dinas" className="dropdown-item">
                                                            Realisasi Anggaran Dinas
                                                        </Link>
                                                        <Link href="/frontpage/stunting_4118/sebaran_bantuan_stunting" className="dropdown-item">
                                                            Sebaran Bantuan Stunting
                                                        </Link>
                                                    </>
                                                }
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </>
                                }
                                {login_data.role=="admin"&&
                                    <>
                                        <Dropdown as="li" className="nav-item dropdown" autoClose={false}>
                                            <Dropdown.Toggle as="a" className="nav-link dropdown-toggle" href="#">
                                                <TbMap2 className="nav-link-icon d-md-none d-lg-inline-block"/>
                                                <span className="nav-link-title">
                                                    Region
                                                </span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="dropdown-menu-static">
                                                <Link href="/frontpage/region/kecamatan" className="dropdown-item">
                                                    Kecamatan
                                                </Link>
                                                <Link href="/frontpage/region/desa" className="dropdown-item">
                                                    Desa
                                                </Link>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                        <li className="nav-item">
                                            <Link href="/frontpage/users" className="nav-link">
                                                <TbUsers className="nav-link-icon d-md-none d-lg-inline-block"/>
                                                <span className="nav-link-title">
                                                    Users
                                                </span>
                                            </Link>
                                        </li>
                                    </>
                                }
                            </ul>
                        </Navbar.Collapse>
                    </div>
                </Navbar>

                <Navbar as="header" className={classNames("navbar navbar-light d-none d-lg-flex", {"sidebar-collapsed":!sidebar.is_open})} expand="md">
                    <div className="container-xl">
                        <button className="btn btn-icon" type="button" onClick={this.toggleSidebar}>
                            <TbArrowsLeftRight className="icon"/>
                        </button>
                        <Navbar.Toggle className="navbar-toggler" as="button" type="button">
                            <span className="navbar-toggler-icon"></span>
                        </Navbar.Toggle>
                        <div className="navbar-nav flex-row order-md-last ms-auto">
                            <ThemeContext.Consumer>
                                {tc_value=>(
                                    <div className="d-none d-md-flex me-3">
                                        {tc_value.theme=="light"?
                                            <a 
                                                href="" 
                                                className="nav-link px-0 toggle-theme-dark"
                                                title="Enable dark mode"
                                                onClick={e=>{
                                                    e.preventDefault()
                                                    tc_value.setDarkMode()
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" /></svg>
                                            </a>
                                        :
                                            <a 
                                                href="" 
                                                className="nav-link px-0 toggle-theme-light" 
                                                title="Enable light mode"
                                                onClick={e=>{
                                                    e.preventDefault()
                                                    tc_value.setLightMode()
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="12" cy="12" r="4" /><path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" /></svg>
                                            </a>       
                                        }
                                    </div>
                                )}
                            </ThemeContext.Consumer>
                            <Dropdown as="div" className="dropdown nav-item">
                                <Dropdown.Toggle as="a" href="#" className="nav-link d-flex lh-1 text-reset p-0 no-arrow">
                                    <span className="avatar avatar-sm">
                                        <Avatar
                                            data={login_data}
                                        />
                                    </span>
                                    <div className="d-none d-xl-block ps-2">
                                        <div>{login_data.nama_lengkap}</div>
                                        <div className="mt-1 small text-muted">{login_data.role}</div>
                                    </div>
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end" className="dropdown-menu-arrow">
                                    <a href="" className="dropdown-item">
                                        <TbEdit className="icon dropdown-item-icon"/>
                                        My Profile
                                    </a>
                                    <a href="" className="dropdown-item">
                                        <TbAlertCircle className="icon dropdown-item-icon"/>
                                        Tentang Aplikasi
                                    </a>
                                    <div className="dropdown-divider"></div>
                                    <a 
                                        href="" 
                                        className="dropdown-item"
                                        onClick={e=>{
                                            e.preventDefault()
                                            this.logout()
                                        }}
                                    >
                                        <TbLogout className="icon dropdown-item-icon"/>
                                        Logout
                                    </a>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>
                </Navbar>

                <div className={classNames("page-wrapper", {"sidebar-collapsed":!sidebar.is_open})}>
                    {this.props.children}
                </div>
            </>
        )
    }
}

export default LayoutCombined