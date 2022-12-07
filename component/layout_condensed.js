import React from "react"
import { Dropdown, Navbar } from "react-bootstrap"
import { access_token, login_data, set_theme } from "../config/config"
import ThemeContext from "../store/theme_context"
import {TbAlertCircle, TbBuildingFactory, TbEdit, TbExclamationMark, TbHome, TbLogout, TbMap2, TbMoodKid, TbUsers} from "react-icons/tb"
import Avatar from "./ui/avatar"
import { api } from "../config/api"
import Router from "next/router"
import { toast } from "react-toastify"
import Link from "next/link"

class LayoutCondensed extends React.Component{
    state={
        login_data:{}
    }

    componentDidMount=()=>{
        this.setState({
            login_data:login_data()!=null?login_data():{}
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
        const {login_data}=this.state

        return (
            <>
                <Navbar as="header" className="navbar navbar-light d-print-none fixed-top" expand="md">
                    <div className="container-xl">
                        <Navbar.Toggle className="navbar-toggler" as="button" type="button">
                            <span className="navbar-toggler-icon"></span>
                        </Navbar.Toggle>
                        <h1 className="navbar-brand navbar-brand-layout-condensed navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
                            <Link href="/frontpage">
                                <img src="/logo.png" alt="Stunting" className="navbar-brand-image"/>
                            </Link>
                        </h1>
                        <div className="navbar-nav flex-row order-md-last">
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
                            <div className="d-flex flex-column flex-md-row flex-fill align-items-stretch align-items-md-center">
                                <ul className="navbar-nav">
                                    <li className="nav-item">
                                        <Link href="/frontpage" className="nav-link">
                                            <TbHome className="nav-link-icon d-md-none d-lg-inline-block"/>
                                            <span className="nav-link-title">
                                                Frontpage
                                            </span>
                                        </Link>
                                    </li>
                                    <Dropdown as="li" className="nav-item dropdown">
                                        <Dropdown.Toggle as="a" className="nav-link dropdown-toggle" href="#">
                                            <TbMoodKid className="nav-link-icon d-md-none d-lg-inline-block"/>
                                            <span className="nav-link-title">
                                                Skrining Balita
                                            </span>
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu className="dropdown-menu-arrow">
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
                                    {["admin", "dinas"].includes(login_data.role)&&
                                        <Dropdown as="li" className="nav-item dropdown">
                                            <Dropdown.Toggle as="a" className="nav-link dropdown-toggle" href="#">
                                                <TbBuildingFactory className="nav-link-icon d-md-none d-lg-inline-block"/>
                                                <span className="nav-link-title">
                                                    Intervensi
                                                </span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="dropdown-menu-arrow">
                                                <Link href="/frontpage/intervensi/rencana_kegiatan" className="dropdown-item">
                                                    Rencana Kegiatan
                                                </Link>
                                                <Link href="/frontpage/intervensi/rencana_bantuan" className="dropdown-item">
                                                    Rencana Bantuan
                                                </Link>
                                                <Link href="/frontpage/intervensi/realisasi_bantuan" className="dropdown-item">
                                                    Realisasi Bantuan
                                                </Link>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    }
                                    {login_data.role=="admin"&&
                                        <>
                                            <Dropdown as="li" className="nav-item dropdown">
                                                <Dropdown.Toggle as="a" className="nav-link dropdown-toggle" href="#">
                                                    <TbMoodKid className="nav-link-icon d-md-none d-lg-inline-block"/>
                                                    <span className="nav-link-title">
                                                        Stunting 4118
                                                    </span>
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="dropdown-menu-arrow">
                                                    <Link href="/frontpage/stunting_4118" className="dropdown-item">
                                                        Lihat Data
                                                    </Link>
                                                    {/* <Link href="/frontpage/stunting_4118/graph_chart" className="dropdown-item">
                                                        Graph & Chart
                                                    </Link> */}
                                                </Dropdown.Menu>
                                            </Dropdown>
                                            <Dropdown as="li" className="nav-item dropdown">
                                                <Dropdown.Toggle as="a" className="nav-link dropdown-toggle" href="#">
                                                    <TbMap2 className="nav-link-icon d-md-none d-lg-inline-block"/>
                                                    <span className="nav-link-title">
                                                        Region
                                                    </span>
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="dropdown-menu-arrow">
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
                            </div>
                        </Navbar.Collapse>
                    </div>
                </Navbar>

                <div className="page-wrapper mt-5">
                    {this.props.children}
                </div>
            </>
        )
    }
}

export default LayoutCondensed