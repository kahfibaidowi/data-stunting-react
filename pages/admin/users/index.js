import React from "react"
import update from "immutability-helper"
import LayoutAdmin from "../../../component/LayoutAdmin"
import {AiOutlinePlus} from "react-icons/ai"
import Avatar from "../../../component/ui/avatar"
import { api } from "../../../config/api"
import { access_token } from "../../../config/config"
import { toast } from "react-toastify"
import { Formik } from "formik"
import {Modal} from "react-bootstrap"
import {ConfirmDelete} from "../../../component/ui/confirm"
import { FaChevronLeft, FaChevronRight, FaSadCry } from "react-icons/fa"
import { FiTrash, FiTrash2, FiUpload } from "react-icons/fi" 
import { ImPlus } from "react-icons/im"
import Router from "next/router"
import axios from "axios"

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
        },
        hapus_user:{
            is_open:false,
            id_user:""
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
                Router.push("/")
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
                Router.push("/")
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
                    email:"",
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
                Router.push("/")
            }
            toast.error("Insert Data Failed!", {position:"bottom-center"})
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
                Router.push("/")
            }
            toast.error("Update Data Failed!", {position:"bottom-center"})
        })
    }

    //hapus user
    showConfirmHapus=(data)=>{
        this.setState({
            hapus_user:{
                is_open:true,
                id_user:data.id_user
            }
        })
    }
    hideConfirmHapus=()=>{
        this.setState({
            hapus_user:{
                is_open:false,
                id_user:""
            }
        })
    }
    deleteUser=()=>{
        const {hapus_user}=this.state

        api(access_token()).delete(`/user/${hapus_user.id_user}`)
        .then(res=>{
            this.getsUser()
            this.hideConfirmHapus()
            toast.warn("User dihapus!")
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Remove Data Failed!", {position:"bottom-center"})
        })
    }

    render(){
        const {kecamatan_desa_form, users, edit_user, tambah_user, hapus_user}=this.state

        return (
            <LayoutAdmin
                title="Master Users"
            >
                <div className="d-flex flex-column mt-5" style={{minHeight:"67vh"}}>
                    <div className="row">
                        <div className="col-12">
                            <div className="card border-0 shadow mb-4">
                                <div className="card-header py-3">
                                    <div className="row align-items-center justify-content-start">
                                        <div className="col">
                                            <button 
                                                className="btn btn-primary text-nowrap" 
                                                onClick={this.toggleModalTambah}
                                            >
                                                <ImPlus/> Tambah
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <div className="d-flex mb-3">
                                        <div style={{width:"200px"}} className="me-2">
                                            <select name="role" value={users.role} className="form-select" onChange={this.typeFilter}>
                                                <option value="">-- Semua Role</option>
                                                <option value="admin">Super Admin</option>
                                                <option value="dinkes">Dinas Kesehatan</option>
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
                                        <table className="table table-centered table-wrap mb-0 rounded">
                                            <thead className="thead-light">
                                                <tr>
                                                    <th className="border-0 rounded-start" width="50">#</th>
                                                    <th className="border-0">User/Pengguna</th>
                                                    <th className="border-0">Username</th>
                                                    <th className="border-0" width="100">Role</th>
                                                    <th className="border-0" width="150">Status</th>
                                                    <th className="border-0 rounded-end" width="90"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.data.map((list, idx)=>(
                                                    <tr key={list}>
                                                            <td className="align-middle">{(idx+1)+((users.page-1)*users.per_page)}</td>
                                                            <td className="py-1">
                                                                <div className="d-flex align-items-center">
                                                                    <div className="d-flex align-items-center">
                                                                        <span className="avatar">
                                                                            <Avatar 
                                                                                data={list}
                                                                                circle
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
                                                            <td className="text-nowrap p-1">
                                                                <button className="btn btn-warning btn-sm" onClick={()=>this.showModalEdit(list)}>
                                                                    Edit
                                                                </button>
                                                                <button type="button" className="btn btn-danger btn-sm ms-2" onClick={()=>this.showConfirmHapus(list)}>
                                                                    Hapus
                                                                </button>
                                                            </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="d-flex align-items-center mt-4">
                                        <div className="d-flex flex-column">
                                            <div>Halaman {users.page} dari {users.last_page} Halaman</div>
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
                                                className="btn btn-gray" 
                                                disabled={users.page<=1}
                                                onClick={()=>this.goToPage(users.page-1)}
                                            >
                                                <FaChevronLeft/>
                                            </button>
                                            <button 
                                                className="btn btn-gray ms-1" 
                                                disabled={users.page>=users.last_page}
                                                onClick={()=>this.goToPage(users.page+1)}
                                            >
                                                <FaChevronRight/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL TAMBAH */}
                <Modal show={tambah_user.is_open} onHide={this.toggleModalTambah} backdrop="static">
                    <Modal.Header closeButton>
                        <Modal.Title>Tambah User</Modal.Title>
                    </Modal.Header>
                    <Formik
                        initialValues={tambah_user.user}
                        onSubmit={this.addUser}
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
                                                        <FiUpload/> Pilih Foto
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
                                                                    Router.push("/")
                                                                }
                                                                toast.error("Upload File Failed!", {position:"bottom-center"})
                                                            })
                                                        }}
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger ms-2 px-3"
                                                    onClick={e=>props.setFieldValue("avatar_url", "")}
                                                >
                                                    <FiTrash2/>
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
                                <Modal.Footer className="mt-3">
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
                                    >
                                        Save Changes
                                    </button>
                                </Modal.Footer>
                            </form>
                        )}
                    </Formik>
                </Modal>

                {/* MODAL EDIT */}
                <Modal show={edit_user.is_open} onHide={this.hideModalEdit} backdrop="static">
                    <Modal.Header closeButton>
                        <Modal.Title>Edit User</Modal.Title>
                    </Modal.Header>
                    <Formik
                        initialValues={edit_user.user}
                        onSubmit={this.updateUser}
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
                                                        <FiUpload/> Pilih Foto
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
                                                                    Router.push("/")
                                                                }
                                                                toast.error("Upload File Failed!", {position:"bottom-center"})
                                                            })
                                                        }}
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger ms-2 px-3"
                                                    onClick={e=>props.setFieldValue("avatar_url", "")}
                                                >
                                                    <FiTrash2/>
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
                                <Modal.Footer className="mt-3">
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
                                    >
                                        Save Changes
                                    </button>
                                </Modal.Footer>
                            </form>
                        )}
                    </Formik>
                </Modal>

                {/* CONFIRM HAPUS */}
                <ConfirmDelete
                    show={hapus_user.is_open}
                    title="Apakah anda Yakin?"
                    sub_title="Data yang sudah dihapus tidak bisa dikembalikan lagi!"
                    toggle={()=>this.hideConfirmHapus()}
                    deleteAction={()=>this.deleteUser()}
                />
            </LayoutAdmin>
        )
    }
}

export default Users