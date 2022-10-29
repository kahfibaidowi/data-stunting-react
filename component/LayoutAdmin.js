import React, { useState } from "react"
import classNames from "classnames"
import Link from "next/link"
import { Accordion, Dropdown, Offcanvas } from "react-bootstrap"
import Avatar from "./ui/avatar"
import { access_token, akronim, isUndefined, login_data, name_slice } from "../config/config"
import {ImAidKit, ImBookmarks, ImCog, ImDisplay, ImFileText2, ImHome, ImLab, ImList2, ImLocation, ImLocation2, ImMug, ImNewspaper, ImQuestion, ImStack, ImTicket, ImUsers} from "react-icons/im"
import {FaHospitalAlt} from "react-icons/fa"
import { api } from "../config/api"
import Router, { withRouter } from "next/router"
import { IoAlertCircleOutline, IoHomeOutline, IoLogOutOutline, IoPersonOutline } from "react-icons/io5"
import { CgMenuRight } from "react-icons/cg"
import {MdArrowBack, MdOutlineDashboard, MdOutlineChat, MdDvr} from "react-icons/md"
import {IoIosArrowDown, IoIosArrowDropright, IoIosArrowForward} from "react-icons/io"


class LayoutAdmin extends React.Component{
    state={
        login_data:{},
        active_accordion:"",
        active_mobile_menu:false
    }

    componentDidMount=()=>{
        this.setState({
            login_data:login_data()!==null?login_data():{}
        })
    }

    //menu
    toggleAccordion=menu=>{
        let accordion
        if(menu===this.state.active_accordion) accordion=""
        else accordion=menu

        this.setState({
            active_accordion:accordion
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
        const {active_accordion, mobile_menu_show, login_data}=this.state

        return (
            <>
                {!isUndefined(login_data.id_user)&&
                    <>
                        <header className="navbar-header fixed-top p-3 py-2 px-0 mb-0 border-bottom">
                            <div className="container-fluid px-md-4 ps-md-3">
                                <div className="d-flex flex-wrap align-items-center justify-content-md-between">
                                    <a href="/" className="d-flex align-items-center mb-2 mb-lg-0 me-4 text-dark text-decoration-none">
                                        <img src={`/622b2441572a9_1.png`} className="img-fluid" style={{maxHeight:"35px"}}/>
                                    </a>
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
                                                <Link href="/admin" className="dropdown-item">
                                                    <i><IoHomeOutline/></i>Dashboard
                                                </Link>
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
            
                        <section className="block-widget bg-gray-lt" style={{minHeight:"100vh"}}>
                            {isUndefined(this.props.router.query.hide_menu)?
                                <div className="container-fluid">
                                    <div className='row' style={{minHeight:"100%"}}>
                                        <nav id="sidebarMenu" className="col-md-3 col-lg-2 d-md-block mobile-menu sidebar-menu collapse" style={{overflowX:"hidden"}}>
                                            <SidebarAdmin role={login_data.role}/>
                                        </nav>
                                        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 ps-md-5" style={{marginBottom:"50px", marginTop:"100px"}}>
                                            {this.props.children}
                                        </main>
                                    </div>
                                </div>
                            :
                                <div className="container">
                                    <div className="row mt-5">
                                        <main className="col-12 px-md-4 ps-md-5 mt-5" style={{marginBottom:"50px"}}>
                                            {this.props.children}
                                        </main>
                                    </div>
                                </div>
                            }
                        </section>
                        
                        
                        <Offcanvas show={this.state.active_mobile_menu} onHide={this.toggleMobilemenu} className="mobile-menu">
                            <Offcanvas.Header closeButton>
                                <div className="logo">
                                    <Link href="/">
                                        <img src={`/622b2441572a9_1.png`} className="img-fluid" style={{maxHeight:"35px"}}/>
                                    </Link>
                                </div>
                            </Offcanvas.Header>
                            <Offcanvas.Body className="p-0 px-4">
                                <Accordion activeKey={this.state.active_menu_collapse} as="div" className="mt-5">
                                    <SidebarAdmin role={login_data.role}/>
                                </Accordion>
                            </Offcanvas.Body>
                        </Offcanvas>
                    </>
                }
            </>
        )
    }
}

class SidebarAdmin extends React.Component{
    state={
        active_menu_collapse:"",
        menu_dropdown:{
            region:[
                {
					id_menu: 1,
					text:"Kecamatan",
					link_to: "/admin/region/kecamatan",
					dropdown: []
				},
                {
					id_menu: 1,
					text:"Desa",
					link_to: "/admin/region/desa",
					dropdown: []
				}
            ]
        }
    }
    
    setActiveMenuCollapse=(e, menu)=>{
        e.preventDefault()

        let accordion
        if(menu===this.state.active_menu_collapse) accordion=""
        else accordion=menu

        this.setState({
            active_menu_collapse:accordion
        })
    }

    render(){
        const {menu_dropdown}=this.state
        const {role}=this.props

        let role_dokter=""
        if(role.level==="dokter"){
            role_dokter=role.data.level_dokter
        }

        return (
            <>
                <ul className="nav flex-column px-2" style={{marginTop:"100px"}}>
                    <li className="nav-item d-grid grip-1">
                        <Link href="/frontpage" className="btn btn-light">
                            <i className='me-2 fs-18px'><MdArrowBack/></i>
                            Kembali ke Frontpage
                        </Link>
                    </li>
                </ul>
                <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-2 mt-5 mb-1 text-muted fw-normal fs-14px">
                    <span>Main Menu</span>
                </h6>
                <Accordion activeKey={this.state.active_menu_collapse} as="div" className="mt-1">
                    <ul className="nav flex-column px-2">
                        <li className="nav-item">
                            <Link href="/admin" className="nav-link link-dark d-flex">
                                <div><span className='icon-nav'><MdOutlineDashboard/></span></div>
                                Dashboard
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link href="/admin/users" className="nav-link link-dark d-flex">
                                <div><span className='icon-nav'><MdOutlineChat/></span></div>
                                Master Users
                            </Link>
                        </li>
                        <li className="nav-item css-dropdown">
                            <a className="nav-link link-dark d-flex" href="" onClick={e=>this.setActiveMenuCollapse(e, "menu_region")}>
                                <div><span className='icon-nav'><MdDvr/></span></div>
                                Master Region
                                <i className={classNames({"rotate-90":this.state.active_menu_collapse==="menu_region"})}><IoIosArrowForward/></i>
                            </a>
                            <SubMenu 
                                navMenu={menu_dropdown.region} 
                                menuId="menu_region" 
                                isMobile 
                                withIcon
                            />
                        </li>
                    </ul>
                </Accordion>
            </>
        )
    }
}

const SubMenu=({navMenu, menuId="", isMobile=false, withIcon=false})=>{

    //desktop menu
    if(!isMobile){
        return (
            <ul className="css-dropdown-menu nav flex-column py-2">
                {navMenu.map(nav=>(
                    <li>
                        <Link href={nav.link_to} className='nav-link link-dark'>
                            {nav.text}
                            {nav.dropdown.length>0&&<i><IoIosArrowForward/></i>}
                        </Link>
                        {nav.dropdown.length>0&&
                            <SubMenu navMenu={nav.dropdown} isMobile={isMobile}/>
                        }
                    </li>
                ))}
            </ul>
        )
    }

    //mobile menu
    return (
        <Accordion.Collapse as="div" className="collapse-menu" eventKey={menuId}>
            <ul className="css-dropdown-menu nav flex-column">
                {navMenu.map(nav=>(
                    <li>
                        <Link href={nav.link_to} className={classNames('nav-link link-dark')}>
                            {withIcon&&<span style={{paddingLeft:"20px"}}></span>}
                            {nav.text}
                        </Link>
                    </li>
                ))}
            </ul>
        </Accordion.Collapse>
    )
}

export default withRouter(LayoutAdmin)