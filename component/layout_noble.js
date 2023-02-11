import classNames from "classnames"
import Link from "next/link"
import Router, { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import { Collapse, Dropdown } from "react-bootstrap"
import {FiChevronDown, FiCloudRain, FiEdit, FiEye, FiHelpCircle, FiHome, FiLogOut, FiMail, FiMapPin, FiMenu, FiShoppingBag, FiSmile, FiTruck, FiUser} from "react-icons/fi"
import {api} from "../config/api"
import { access_token, login_data as user_data } from "../config/config"
import Avatar from "./ui/avatar"

const LayoutNoble=(props)=>{
    const [login_data, setLoginData]=useState({})
    const [collapse, setCollapse]=useState("")
    const [sidebar_toggler, setSidebarToggler]=useState({
        is_open:false,
        is_folded:false
    })
    const [sidebar_mobile_toggler, setSidebarMobileToggler]=useState(false)
    const [active_page, setActivePage]=useState("")
    const router=useRouter()

    useEffect(()=>{
        setLoginData(user_data()!=null?user_data():{})
        setActivePage(router.pathname)

        //collapse
        if(["/frontpage/skrining_balita", "/frontpage/skrining_balita/stunting"].includes(router.pathname)){
            setCollapse("skrining_balita")
        }
        if(["/frontpage/intervensi/rencana_kegiatan", "/frontpage/intervensi/rencana_bantuan"].includes(router.pathname)){
            setCollapse("intervensi_rencana")
        }
        if(["/frontpage/intervensi/realisasi_kegiatan", "/frontpage/intervensi/realisasi_bantuan"].includes(router.pathname)){
            setCollapse("intervensi_realisasi")
        }
        if(["/frontpage/stunting_4118", "/frontpage/stunting_4118/realisasi_anggaran_dinas", "/frontpage/stunting_4118/sebaran_bantuan_stunting"].includes(router.pathname)){
            setCollapse("stunting_4118")
        }
        if(["/frontpage/region/kecamatan", "/frontpage/region/desa"].includes(router.pathname)){
            setCollapse("region")
        }
    }, [])

    //sidebar toggler
    const toggleSidebar=()=>{
        if(sidebar_toggler.is_open){
            setSidebarToggler({
                is_open:false,
                is_folded:false
            })
            setSidebarMobileToggler(!sidebar_mobile_toggler)
        }
        else{
            if(!sidebar_mobile_toggler){
                setSidebarToggler({
                    is_open:true,
                    is_folded:false
                })
            }
            setSidebarMobileToggler(!sidebar_mobile_toggler)
        }
    }
    const toggleSidebarFolded=value=>{
        if(sidebar_toggler.is_open){
            setSidebarToggler({
                is_open:true,
                is_folded:value
            })
        }
    }

    //logout
    const logout=()=>{
        api(access_token()).delete("/auth/logout")
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
        })
    }
    

    return (
        <div 
            className={classNames(
                "main-wrapper", 
                {"sidebar-folded":sidebar_toggler.is_open}, 
                {"open-sidebar-folded overflow-hidden":sidebar_toggler.is_folded},
                {"sidebar-open":sidebar_mobile_toggler}
            )}
        >
            <nav className="sidebar" style={{zIndex:1001}}>
                <div className="sidebar-header">
                    <Link href="" className="sidebar-brand">
                        <img src="/logo.png" alt="Stunting" className="navbar-brand-image"/>
                    </Link>
                    <div 
                        className={classNames(
                            "sidebar-toggler", 
                            {"active":sidebar_toggler.is_open||sidebar_mobile_toggler}, 
                            {"not-active":!sidebar_toggler.is_open&&!sidebar_mobile_toggler}
                        )} 
                        onClick={e=>toggleSidebar()}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
                <div className="sidebar-body ps" onMouseOver={e=>toggleSidebarFolded(true)} onMouseOut={e=>toggleSidebarFolded(false)}>
                    <ul className="nav">
                        <li className="nav-item nav-category">Main</li>
                        {login_data.role!="dinas"&&
                            <>
                                <li 
                                    className={classNames(
                                        "nav-item", 
                                        {"active":active_page=="/frontpage"}
                                    )}
                                >
                                    <Link href="/frontpage" className="nav-link">
                                        <FiHome className="link-icon"/>
                                        <span className="link-title">Dashboard</span>
                                    </Link>
                                </li>
                                <li 
                                    className={classNames(
                                        "nav-item",
                                        {"active":["/frontpage/skrining_balita", "/frontpage/skrining_balita/stunting"].includes(active_page)}
                                    )}
                                >
                                    <a 
                                        className="nav-link cursor-pointer" 
                                        onClick={e=>setCollapse(collapse=="skrining_balita"?"":"skrining_balita")} 
                                        aria-expanded={collapse=="skrining_balita"}
                                    >
                                        <FiSmile className="link-icon"/>
                                        <span className="link-title">Skrining Balita</span>
                                        <FiChevronDown className="link-arrow"/>
                                    </a>
                                    <Collapse in={collapse=="skrining_balita"}>
                                        <div>
                                            <ul className="nav sub-menu">
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/frontpage/skrining_balita/?action=cek_antropometri" 
                                                        className={classNames("nav-link")}
                                                    >
                                                        Cek Antropometri
                                                    </Link>
                                                </li>
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/frontpage/skrining_balita" 
                                                        className={classNames("nav-link", {"active":active_page=="/frontpage/skrining_balita"})}
                                                    >
                                                        Rekap Timbangan
                                                    </Link>
                                                </li>
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/frontpage/skrining_balita/stunting" 
                                                        className={classNames("nav-link", {"active":active_page=="/frontpage/skrining_balita/stunting"})}
                                                    >
                                                        Data Stunting
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </Collapse>
                                </li>
                            </>
                        }
                        {["admin", "dinas"].includes(login_data.role)&&
                            <>
                                <li 
                                    className={classNames(
                                        "nav-item",
                                        {"active":["/frontpage/intervensi/rencana_kegiatan", "/frontpage/intervensi/rencana_bantuan"].includes(active_page)}
                                    )}
                                >
                                    <a 
                                        className="nav-link cursor-pointer" 
                                        onClick={e=>setCollapse(collapse=="intervensi_rencana"?"":"intervensi_rencana")} 
                                        aria-expanded={collapse=="intervensi_rencana"}
                                    >
                                        <FiShoppingBag className="link-icon"/>
                                        <span className="link-title">Rencana Intervensi</span>
                                        <FiChevronDown className="link-arrow"/>
                                    </a>
                                    <Collapse in={collapse=="intervensi_rencana"}>
                                        <div>
                                            <ul className="nav sub-menu">
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/frontpage/intervensi/rencana_kegiatan" 
                                                        className={classNames("nav-link", {"active":active_page=="/frontpage/intervensi/rencana_kegiatan"})}
                                                    >
                                                        Rencana Kegiatan
                                                    </Link>
                                                </li>
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/frontpage/intervensi/rencana_bantuan" 
                                                        className={classNames("nav-link", {"active":active_page=="/frontpage/intervensi/rencana_bantuan"})}
                                                    >
                                                        Rencana Bantuan
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </Collapse>
                                </li>
                                <li 
                                    className={classNames(
                                        "nav-item",
                                        {"active":["/frontpage/intervensi/realisasi_kegiatan", "/frontpage/intervensi/realisasi_bantuan"].includes(active_page)}
                                    )}
                                >
                                    <a 
                                        className="nav-link cursor-pointer" 
                                        onClick={e=>setCollapse(collapse=="intervensi_realisasi"?"":"intervensi_realisasi")} 
                                        aria-expanded={collapse=="intervensi_realisasi"}
                                    >
                                        <FiShoppingBag className="link-icon"/>
                                        <span className="link-title">Realisasi Intervensi</span>
                                        <FiChevronDown className="link-arrow"/>
                                    </a>
                                    <Collapse in={collapse=="intervensi_realisasi"}>
                                        <div>
                                            <ul className="nav sub-menu">
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/frontpage/intervensi/realisasi_kegiatan" 
                                                        className={classNames("nav-link", {"active":active_page=="/frontpage/intervensi/realisasi_kegiatan"})}
                                                    >
                                                        Realisasi Kegiatan
                                                    </Link>
                                                </li>
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/frontpage/intervensi/realisasi_bantuan" 
                                                        className={classNames("nav-link", {"active":active_page=="/frontpage/intervensi/realisasi_bantuan"})}
                                                    >
                                                        Realisasi Bantuan
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </Collapse>
                                </li>
                                <li 
                                    className={classNames(
                                        "nav-item",
                                        {"active":["/frontpage/stunting_4118", "/frontpage/stunting_4118/realisasi_anggaran_dinas", "/frontpage/stunting_4118/sebaran_bantuan_stunting"].includes(active_page)}
                                    )}
                                >
                                    <a 
                                        className="nav-link cursor-pointer" 
                                        onClick={e=>setCollapse(collapse=="stunting_4118"?"":"stunting_4118")} 
                                        aria-expanded={collapse=="stunting_4118"}
                                    >
                                        <FiSmile className="link-icon"/>
                                        <span className="link-title">Stunting 4118</span>
                                        <FiChevronDown className="link-arrow"/>
                                    </a>
                                    <Collapse in={collapse=="stunting_4118"}>
                                        <div>
                                            <ul className="nav sub-menu">
                                                <li className="nav-item">
                                                    <Link 
                                                        href="/frontpage/stunting_4118" 
                                                        className={classNames("nav-link", {"active":active_page=="/frontpage/stunting_4118"})}
                                                    >
                                                        Lihat Data
                                                    </Link>
                                                </li>
                                                {login_data.role=="admin"&&
                                                    <>
                                                        <li className="nav-item">
                                                            <Link 
                                                                href="/frontpage/stunting_4118/realisasi_anggaran_dinas" 
                                                                className={classNames("nav-link", {"active":active_page=="/frontpage/stunting_4118/realisasi_anggaran_dinas"})}
                                                            >
                                                                Realisasi Anggaran Dinas
                                                            </Link>
                                                        </li>
                                                        <li className="nav-item">
                                                            <Link 
                                                                href="/frontpage/stunting_4118/sebaran_bantuan_stunting" 
                                                                className={classNames("nav-link", {"active":active_page=="/frontpage/stunting_4118/sebaran_bantuan_stunting"})}
                                                            >
                                                                Sebaran Bantuan Stunting
                                                            </Link>
                                                        </li>
                                                    </>
                                                }
                                            </ul>
                                        </div>
                                    </Collapse>
                                </li>
                            </>
                        }
                        {login_data.role=="admin"&&
                            <>
                                <li className="nav-item nav-category">Master Data</li>
                                    <li 
                                        className={classNames(
                                            "nav-item",
                                            {"active":["/frontpage/region/kecamatan", "/frontpage/region/desa"].includes(active_page)}
                                        )}
                                    >
                                        <a 
                                            className="nav-link cursor-pointer" 
                                            onClick={e=>setCollapse(collapse=="region"?"":"region")} 
                                            aria-expanded={collapse=="region"}
                                        >
                                            <FiMapPin className="link-icon"/>
                                            <span className="link-title">Region/Wilayah</span>
                                            <FiChevronDown className="link-arrow"/>
                                        </a>
                                        <Collapse in={collapse=="region"}>
                                            <div>
                                                <ul className="nav sub-menu">
                                                    <li className="nav-item">
                                                        <Link 
                                                            href="/frontpage/region/kecamatan" 
                                                            className={classNames("nav-link", {"active":active_page=="/frontpage/region/kecamatan"})}
                                                        >
                                                            Kecamatan
                                                        </Link>
                                                    </li>
                                                    <li className="nav-item">
                                                        <Link 
                                                            href="/frontpage/region/desa" 
                                                            className={classNames("nav-link", {"active":active_page=="/frontpage/region/desa"})}
                                                        >
                                                            Desa
                                                        </Link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </Collapse>
                                    </li>
                                    <li 
                                        className={classNames(
                                            "nav-item",
                                            {"active":active_page=="/frontpage/users"}
                                        )}
                                    >
                                        <Link href="/frontpage/users" className="nav-link">
                                            <FiUser className="link-icon"/>
                                            <span className="link-title">Users</span>
                                        </Link>
                                    </li>
                            </>
                        }
                    </ul>
                <div className="ps__rail-x" style={{left:0,bottom:0}}><div className="ps__thumb-x" tabindex="0" style={{left:0,width:0}}></div></div><div className="ps__rail-y" style={{top:0,right:0}}><div className="ps__thumb-y" tabindex="0" style={{top:0,height:0}}></div></div></div>
            </nav>

            <div className="page-wrapper">
                <nav className="navbar">
                    <a 
                        href="#" 
                        className="sidebar-toggler"
                        onClick={e=>{
                            e.preventDefault()
                            setSidebarMobileToggler(true)
                        }}
                    >
                        <FiMenu/>
                    </a>
                    <div className="navbar-content">
                        <ul className="navbar-nav">
                            <Dropdown className="dropdown nav-item" as="li">
                                <Dropdown.Toggle as="a" className="nav-link dropdown-toggle" href="#">
                                    <span className="avatar text-secondary rounded-circle bg-gray-300">
                                        <Avatar data={login_data}/>
                                    </span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="p-0" style={{minWidth:"233px", marginRight:"-20px", marginTop:"59px"}}>
                                    <div className="d-flex flex-column align-items-center border-bottom px-5 py-3">
                                        <div className="mb-3">
                                            <span className="avatar avatar-lg text-secondary rounded-circle bg-gray-300">
                                                <Avatar data={login_data} size="lg"/>
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <p className="tx-16 fw-bolder">{login_data.nama_lengkap}</p>
                                            <p className="tx-12 text-muted">{login_data.role}</p>
                                        </div>
                                    </div>
                                    <ul className="list-unstyled p-1">
                                        <li className="dropdown-item py-2">
                                            <a href="" className="text-body ms-0">
                                                <FiUser className="me-2 icon-md"/>
                                                <span>Profile</span>
                                            </a>
                                        </li>
                                        <li className="dropdown-item py-2">
                                            <a href="javascript:;" className="text-body ms-0">
                                                <FiEdit className="me-2 icon-md"/>
                                                <span>Edit Profile</span>
                                            </a>
                                        </li>
                                        <li className="dropdown-item py-2">
                                            <a className="text-body ms-0 cursor-pointer" onClick={e=>logout()}>
                                                <FiLogOut className="me-2 icon-md"/>
                                                <span>Log Out</span>
                                            </a>
                                        </li>
                                    </ul>
                                </Dropdown.Menu>
                            </Dropdown>
                        </ul>
                    </div>
                </nav>

                <div className="page-content">
                    {props.children}
                </div>
            </div>
        </div>
    )
}

export default LayoutNoble