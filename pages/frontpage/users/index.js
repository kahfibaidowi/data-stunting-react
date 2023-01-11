import React from "react"
import update from "immutability-helper"
import classNames from "classnames"
import Layout from "../../../component/layout"
import {AiOutlinePlus} from "react-icons/ai"
import Avatar from "../../../component/ui/avatar"
import { api } from "../../../config/api"
import { access_token } from "../../../config/config"
import { toast } from "react-toastify"
import { Formik } from "formik"
import {Modal} from "react-bootstrap"
import {ConfirmDelete} from "../../../component/ui/confirm"
import { FaChevronLeft, FaChevronRight, FaSadCry } from "react-icons/fa"
import { FiChevronLeft, FiChevronRight, FiPlus, FiTrash, FiTrash2, FiUpload } from "react-icons/fi" 
import { ImPlus } from "react-icons/im"
import Router from "next/router"
import axios from "axios"
import withAuth from "../../../component/hoc/auth"
import { TbPlus, TbChevronLeft, TbChevronRight, TbTrash, TbUpload, TbEdit } from "react-icons/tb"
import * as yup from "yup"
import swal from "sweetalert2"
import withReactContent from 'sweetalert2-react-content'


const MySwal=withReactContent(swal)

class Users extends React.Component{
    state={
        kecamatan_desa_form:[],
        users:{
            data:[],
            page:1,
            per_page:10,
            q:"",
            role:"",
            status:"",
            last_page:0
        },
        tambah_user:{
            is_open:false,
            user:{
                username:"",
                nama_lengkap:"",
                password:"",
                role:"admin",
                avatar_url:"",
                status:"active",
                id_region:""
            }
        },
        edit_user:{
            is_open:false,
            user:{}
        }
    }

    componentDidMount=()=>{
        this.getsUser()
        this.getsKecamatanDesa()
    }
    getsKecamatanDesa=()=>{
        api(access_token()).get("/region/type/kecamatan", {
            params:{
                page:1,
                per_page:"",
                q:"",
                with_desa:1,
                with_posyandu:0
            }
        })
        .then(res=>{
            this.setState({
                kecamatan_desa_form:res.data.data
            })
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    getsUser=(reset=false)=>{
        const {users}=this.state

        api(access_token()).get("/user", {
            params:{
                page:reset?1:users.page,
                per_page:users.per_page,
                q:users.q,
                role:users.role,
                status:users.status
            }
        })
        .then(res=>{
            this.setState({
                users:update(this.state.users, {
                    data:{$set:res.data.data},
                    last_page:{$set:res.data.last_page},
                    page:{$set:res.data.current_page}
                })
            })
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    goToPage=page=>{
        this.setState({
            users:update(this.state.users, {
                page:{$set:page}
            })
        }, ()=>{
            this.getsUser()
        })
    }
    setPerPage=e=>{
        const target=e.target

        this.setState({
            users:update(this.state.users, {
                per_page:{$set:target.value}
            })
        }, ()=>{
            this.getsUser(true)
        })
    }
    typeFilter=e=>{ 
        const {target}=e

        this.setState({
            users:update(this.state.users, {
                [target.name]:{$set:target.value},
                data:{$set:[]},
                last_page:{$set:0},
                page:{$set:1}
            })
        }, ()=>{
            switch(target.name){
                case "q":
                    if(this.timeout) clearTimeout(this.timeout)
                    this.timeout=setTimeout(() => {
                        this.getsUser(true)
                    }, 500);
                break
                default:
                    this.getsUser(true)
            }
        })
    }
    uploadAvatar=async e=>{
        const files=e.target.files

        let formData=new FormData()
        formData.append("image", files[0])

        const res=await api(access_token()).post("/file/upload_avatar", formData, {
            headers:{
                'content-type':"multipart/form-data"
            }
        })

        return res
    }
    timeout=0

    //data
    userStatus=status=>{
        switch(status){
            case "active":
                return <span className="badge bg-success">Aktif</span>
            break;
            case "suspend":
                return <span className="badge bg-danger">Disuspend</span>
            break;
        }
    }

    //tambah user
    toggleModalTambah=()=>{
        this.setState({
            tambah_user:{
                is_open:!this.state.tambah_user.is_open,
                user:{
                    username:"",
                    nama_lengkap:"",
                    password:"",
                    role:"admin",
                    avatar_url:"",
                    status:"active",
                    id_region:""
                }
            }
        })
    }
    addUser=(values, actions)=>{
        api(access_token()).post("/user", values)
        .then(res=>{
            this.getsUser(true)
            this.toggleModalTambah()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Insert Data Failed! ", {position:"bottom-center"})
        })
    }
    tambahUserSchema=()=>{
        return yup.object().shape({
            username:yup.string().required(),
            nama_lengkap:yup.string().required(),
            password:yup.string().min(5).required(),
            role:yup.string().required(),
            status:yup.string().required()
        })
    }

    //edit user
    showModalEdit=(data)=>{
        this.setState({
            edit_user:{
                is_open:true,
                user:{...data, ...{password:""}}
            }
        })
    }
    hideModalEdit=()=>{
        this.setState({
            edit_user:{
                is_open:false,
                user:{}
            }
        })
    }
    updateUser=(values, actions)=>{
        api(access_token()).put(`/user/${values.id_user}`, values)
        .then(res=>{
            this.getsUser()
            this.hideModalEdit()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Update Data Failed! ", {position:"bottom-center"})
        })
    }
    editUserSchema=()=>{
        return yup.object().shape({
            username:yup.string().required(),
            nama_lengkap:yup.string().required(),
            password:yup.string().optional(),
            role:yup.string().required(),
            status:yup.string().required()
        })
    }

    //hapus user
    showConfirmHapus=(data)=>{
        MySwal.fire({
            title: "Apakah anda Yakin?",
            text: "Data yang sudah dihapus mungkin tidak bisa dikembalikan lagi!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus Data!',
            cancelButtonText: 'Batal!',
            reverseButtons: true,
            customClass:{
                popup:"w-auto"
            }
        })
        .then(result=>{
            if(result.isConfirmed){
                this.deleteUser(data.id_user)
            }
        })
    }
    deleteUser=(id)=>{
        api(access_token()).delete(`/user/${id}`)
        .then(res=>{
            this.getsUser()
            toast.warn("User dihapus!")
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Remove Data Failed!", {position:"bottom-center"})
        })
    }

    render(){
        const {kecamatan_desa_form, users, edit_user, tambah_user, hapus_user}=this.state

        return (
            <Layout>
                <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                    <div>
                        <h4 class="mb-3 mb-md-0">Master Users</h4>
                    </div>
                    <div class="d-flex align-items-center flex-wrap text-nowrap">
                        <button 
                            type="button" 
                            class="btn btn-primary btn-icon-text mb-2 mb-md-0"
                            onClick={this.toggleModalTambah}
                        >
                            <FiPlus className="btn-icon-prepend"/>
                            Tambah User
                        </button>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex mb-3 mt-3">
                                    <div style={{width:"200px"}} className="me-2">
                                        <select name="role" value={users.role} className="form-select" onChange={this.typeFilter}>
                                            <option value="">-- Semua Role</option>
                                            <option value="admin">Super Admin</option>
                                            <option value="dinkes">Dinas Kesehatan</option>
                                            <option value="dinas">Dinas</option>
                                            <option value="posyandu">Posyandu</option>
                                        </select>
                                    </div>
                                    <div style={{width:"200px"}} className="me-2">
                                        <select name="status" value={users.status} className="form-select" onChange={this.typeFilter}>
                                            <option value="">-- Semua Status</option>
                                            <option value="active">Aktif</option>
                                            <option value="suspend">Disuspend</option>
                                        </select>
                                    </div>
                                    <div style={{width:"200px"}} className="me-2">
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="q"
                                            onChange={this.typeFilter}
                                            value={users.q}
                                            placeholder="Cari ..."
                                        />
                                    </div>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-hover table-custom table-wrap mb-0 rounded">
                                        <thead className="thead-light">
                                            <tr>
                                                <th className="border-0 rounded-start" width="50">#</th>
                                                <th className="border-0">User/Pengguna</th>
                                                <th className="border-0">Username</th>
                                                <th className="border-0" width="100">Role</th>
                                                <th className="border-0" width="150">Status</th>
                                                <th className="border-0 rounded-end" width="50"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.data.map((list, idx)=>(
                                                <tr key={list}>
                                                        <td className="align-middle">{(idx+1)+((users.page-1)*users.per_page)}</td>
                                                        <td className="py-1 align-middle">
                                                            <div className="d-flex align-items-center">
                                                                <div className="d-flex align-items-center">
                                                                    <span className="avatar avatar-sm">
                                                                        <Avatar 
                                                                            data={list}
                                                                        />
                                                                    </span>
                                                                </div>
                                                                <span className="fw-semibold text-capitalize ms-2">{list.nama_lengkap}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {list.username}
                                                        </td>
                                                        <td>
                                                            {list.role}
                                                        </td>
                                                        <td>
                                                            {this.userStatus(list.status)}
                                                        </td>
                                                        <td className="text-nowrap p-1 align-middle">
                                                            <button type="button" className="btn btn-link p-0" onClick={()=>this.showModalEdit(list)}>
                                                                <TbEdit className="icon"/>
                                                            </button>
                                                            <button type="button" className="btn btn-link link-danger ms-2 p-0" onClick={()=>this.showConfirmHapus(list)}>
                                                                <TbTrash className="icon"/>
                                                            </button>
                                                        </td>
                                                </tr>
                                            ))}
                                            {users.data.length==0&&
                                                <tr>
                                                    <td colSpan={6} className="text-center">Data tidak ditemukan!</td>
                                                </tr>
                                            }
                                        </tbody>
                                    </table>
                                </div>
                                <div className="d-flex align-items-center mt-3">
                                    <div className="d-flex flex-column">
                                        <div>Halaman {users.page} dari {users.last_page}</div>
                                    </div>
                                    <div className="d-flex align-items-center me-auto ms-3">
                                        <select className="form-select" name="per_page" value={users.per_page} onChange={this.setPerPage}>
                                            <option value="10">10 Data</option>
                                            <option value="25">25 Data</option>
                                            <option value="50">50 Data</option>
                                            <option value="100">100 Data</option>
                                        </select>
                                    </div>
                                    <div className="d-flex ms-3">
                                        <button 
                                            className={classNames(
                                                "btn",
                                                "border-0",
                                                {"btn-primary":users.page>1}
                                            )}
                                            disabled={users.page<=1}
                                            onClick={()=>this.goToPage(users.page-1)}
                                        >
                                            <FiChevronLeft/>
                                            Prev
                                        </button>
                                        <button 
                                            className={classNames(
                                                "btn",
                                                "border-0",
                                                {"btn-primary":users.page<users.last_page},
                                                "ms-2"
                                            )}
                                            disabled={users.page>=users.last_page}
                                            onClick={()=>this.goToPage(users.page+1)}
                                        >
                                            Next
                                            <FiChevronRight/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL TAMBAH */}
                <Modal show={tambah_user.is_open} className="modal-blur" onHide={this.toggleModalTambah} backdrop="static" size="sm">
                    <Modal.Header closeButton>
                        <h4 className="modal-title">Tambah User</h4>
                    </Modal.Header>
                    <Formik
                        initialValues={tambah_user.user}
                        onSubmit={this.addUser}
                        validationSchema={this.tambahUserSchema()}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Role/Level</label>
                                        <select 
                                            className="form-select" 
                                            name="role"
                                            onChange={e=>{
                                                props.handleChange(e)
                                                props.setFieldValue("id_region", "")
                                            }}
                                            value={props.values.role}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="dinkes">Dinas Kesehatan</option>
                                            <option value="dinas">Dinas</option>
                                            <option value="posyandu">Posyandu</option>
                                        </select>
                                    </div>
                                    {props.values.role=="posyandu"&&
                                        <div className="mb-3">
                                            <label className="my-1 me-2" for="country">Desa</label>
                                            <select 
                                                className="form-select" 
                                                name="id_region"
                                                onChange={props.handleChange}
                                                value={props.values.id_region}
                                            >
                                                <option value="">-- Pilih Desa</option>
                                                {kecamatan_desa_form.map(kdf=>(
                                                    <optgroup label={kdf.region} key={kdf}>
                                                        {kdf.desa.map(ds=>(
                                                            <option value={ds.id_region} key={ds}>{ds.region}</option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </div>
                                    }
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Username</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            name="username"
                                            onChange={props.handleChange}
                                            value={props.values.username}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Nama Lengkap</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            name="nama_lengkap"
                                            onChange={props.handleChange}
                                            value={props.values.nama_lengkap}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Password</label>
                                        <input 
                                            type="password" 
                                            className="form-control"
                                            name="password"
                                            onChange={props.handleChange}
                                            value={props.values.password}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Avatar/Foto</label>
                                        <div className="d-flex flex-column">
                                            <div>
                                                <label>
                                                    <div className="btn btn-secondary cursor-pointer">
                                                        <TbUpload className="icon"/> Upload
                                                    </div>
                                                    <input
                                                        type="file"
                                                        style={{display:"none"}}
                                                        accept=".jpg, .png"
                                                        onChange={e=>{
                                                            this.uploadAvatar(e)
                                                            .then(res=>{
                                                                props.setFieldValue("avatar_url", res.data.data.file)
                                                            })
                                                            .catch(err=>{
                                                                if(err.response.status===401){
                                                                    localStorage.removeItem("login_data")
                                                                    Router.push("/login")
                                                                }
                                                                toast.error("Upload File Failed!", {position:"bottom-center"})
                                                            })
                                                        }}
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    className="btn btn-icon btn-danger ms-2 px-3"
                                                    onClick={e=>props.setFieldValue("avatar_url", "")}
                                                >
                                                    <TbTrash className="icon"/>
                                                </button>
                                            </div>
                                            <div className="mt-2">
                                                <span className="avatar avatar-lg">
                                                    <Avatar 
                                                        data={props.values}
                                                        circle
                                                    />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Status</label>
                                        <select 
                                            className="form-select" 
                                            name="status"
                                            onChange={props.handleChange}
                                            value={props.values.status}
                                        >
                                            <option value="active">Aktif</option>
                                            <option value="suspend">Disuspend</option>
                                        </select>
                                    </div>
                                </Modal.Body>
                                <Modal.Footer className="mt-3 border-top pt-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-link text-gray me-auto" 
                                        onClick={this.toggleModalTambah}
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={!(props.dirty&&props.isValid)}
                                    >
                                        Save Changes
                                    </button>
                                </Modal.Footer>
                            </form>
                        )}
                    </Formik>
                </Modal>

                {/* MODAL EDIT */}
                <Modal show={edit_user.is_open} className="modal-blur" onHide={this.hideModalEdit} backdrop="static" size="sm">
                    <Modal.Header closeButton>
                        <h4 className="modal-title">Edit User</h4>
                    </Modal.Header>
                    <Formik
                        initialValues={edit_user.user}
                        onSubmit={this.updateUser}
                        validationSchema={this.editUserSchema()}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Role/Level</label>
                                        <select 
                                            className="form-select" 
                                            name="role"
                                            value={props.values.role}
                                            disabled
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="dinkes">Dinas Kesehatan</option>
                                            <option value="posyandu">Posyandu</option>
                                        </select>
                                    </div>
                                    {props.values.role=="posyandu"&&
                                        <div className="mb-3">
                                            <label className="my-1 me-2" for="country">Desa</label>
                                            <select 
                                                className="form-select" 
                                                name="id_region"
                                                onChange={props.handleChange}
                                                value={props.values.id_region}
                                            >
                                                <option value="">-- Pilih Desa</option>
                                                {kecamatan_desa_form.map(kdf=>(
                                                    <optgroup label={kdf.region} key={kdf}>
                                                        {kdf.desa.map(ds=>(
                                                            <option value={ds.id_region} key={ds}>{ds.region}</option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </div>
                                    }
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Username</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            name="username"
                                            onChange={e=>{
                                                props.handleChange(e)
                                                props.setFieldValue("id_region", "")
                                            }}
                                            value={props.values.username}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Nama Lengkap</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            name="nama_lengkap"
                                            onChange={props.handleChange}
                                            value={props.values.nama_lengkap}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Password</label>
                                        <input 
                                            type="password" 
                                            className="form-control"
                                            name="password"
                                            onChange={props.handleChange}
                                            value={props.values.password}
                                        />
                                        <small className="form-text text-muted">Kosongkan apabila tidak dirubah.</small>
                                    </div>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Avatar/Foto</label>
                                        <div className="d-flex flex-column">
                                            <div>
                                                <label>
                                                    <div className="btn btn-secondary cursor-pointer">
                                                        <TbUpload className="icon"/> Pilih Foto
                                                    </div>
                                                    <input
                                                        type="file"
                                                        style={{display:"none"}}
                                                        accept=".jpg, .png"
                                                        onChange={e=>{
                                                            this.uploadAvatar(e)
                                                            .then(res=>{
                                                                props.setFieldValue("avatar_url", res.data.data.file)
                                                            })
                                                            .catch(err=>{
                                                                if(err.response.status===401){
                                                                    localStorage.removeItem("login_data")
                                                                    Router.push("/login")
                                                                }
                                                                toast.error("Upload File Failed!", {position:"bottom-center"})
                                                            })
                                                        }}
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    className="btn btn-icon btn-danger ms-2 px-3"
                                                    onClick={e=>props.setFieldValue("avatar_url", "")}
                                                >
                                                    <TbTrash className="icon"/>
                                                </button>
                                            </div>
                                            <div className="mt-2">
                                                <span className="avatar avatar-lg">
                                                    <Avatar 
                                                        data={props.values}
                                                        circle
                                                    />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Status</label>
                                        <select 
                                            className="form-select" 
                                            name="status"
                                            onChange={props.handleChange}
                                            value={props.values.status}
                                        >
                                            <option value="active">Aktif</option>
                                            <option value="suspend">Disuspend</option>
                                        </select>
                                    </div>
                                </Modal.Body>
                                <Modal.Footer className="mt-3 border-top pt-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-link text-gray me-auto" 
                                        onClick={this.hideModalEdit}
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={!(props.isValid)}
                                    >
                                        Save Changes
                                    </button>
                                </Modal.Footer>
                            </form>
                        )}
                    </Formik>
                </Modal>
            </Layout>
        )
    }
}

export default withAuth(Users)