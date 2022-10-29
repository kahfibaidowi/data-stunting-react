import React from "react"
import withAuth from "../../../component/hoc/auth"
import update from "immutability-helper"
import LayoutAdmin from "../../../component/LayoutAdmin"
import {AiOutlinePlus} from "react-icons/ai"
import Avatar from "../../../component/ui/avatar"
import { api } from "../../../config/api"
import { access_token } from "../../../config/config"
import { toast } from "react-toastify"
import { Formik } from "formik"
import {Modal, Spinner} from "react-bootstrap"
import {ConfirmDelete} from "../../../component/ui/confirm"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { ImFilter, ImPlus } from "react-icons/im"
import Router from "next/router"

class Desa extends React.Component{
    state={
        kecamatan_form:[],
        region:{
            data:[],
            page:1,
            per_page:10,
            last_page:0,
            district_id:"",
            q:""
        },
        tambah_region:{
            is_open:false,
            region:{
                nested:"",
                region:""
            }
        },
        edit_region:{
            is_open:false,
            region:{}
        },
        hapus_region:{
            is_open:false,
            id_region:""
        }
    }

    componentDidMount=()=>{
        this.getsKecamatanForm()
    }
    getsRegion=async (reset=false)=>{
        const {region}=this.state

        await api(access_token()).get("/region/type/desa", {
            params:{
                page:reset?1:region.page,
                per_page:region.per_page,
                q:region.q,
                district_id:region.district_id
            }
        })
        .then(res=>{
            this.setState({
                region:update(this.state.region, {
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
    getsKecamatanForm=async ()=>{
        await api(access_token()).get("/region/type/kecamatan", {
            params:{
                page:1,
                per_page:"",
                q:"",
                with_desa:0,
                with_posyandu:0
            }
        })
        .then(res=>{
            this.setState({
                kecamatan_form:res.data.data
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
            region:update(this.state.region, {
                page:{$set:page}
            })
        }, ()=>{
            this.getsRegion()
        })
    }
    setPerPage=e=>{
        const target=e.target

        this.setState({
            region:update(this.state.region, {
                per_page:{$set:target.value}
            })
        }, ()=>{
            this.getsRegion(true)
        })
    }
    typeFilter=e=>{ 
        const {target}=e

        switch(target.name){
            case "district_id":
                this.setState({
                    region:update(this.state.region, {
                        [target.name]:{$set:target.value},
                        data:{$set:[]},
                        last_page:{$set:0},
                        page:{$set:1}
                    })
                }, ()=>{
                    if(target.value!=""){
                        this.getsRegion(true)
                    }
                })
            break
            case "q":
                this.setState({
                    region:update(this.state.region, {
                        [target.name]:{$set:target.value},
                        data:{$set:[]},
                        last_page:{$set:0},
                        page:{$set:1}
                    })
                }, ()=>{
                    if(this.timeout) clearTimeout(this.timeout)
                    this.timeout=setTimeout(() => {
                        if(this.state.region.district_id!=""){
                            this.getsRegion(true)
                        }
                    }, 500);
                })
            break
        }
    }
    timeout=0

    //tambah
    toggleModalTambah=()=>{
        this.setState({
            tambah_region:{
                is_open:!this.state.tambah_region.is_open,
                region:{
                    region:"",
                    nested:this.state.region.district_id
                }
            }
        })
    }
    addRegion=async (values, actions)=>{
        await api(access_token()).post("/region", {
            type:"desa",
            nested:values.nested,
            region:values.region
        })
        .then(res=>{
            this.getsRegion()
            this.toggleModalTambah()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Insert Data Failed!", {position:"bottom-center"})
        })
        
        actions.setIsSubmitting(false)
    }

    //edit
    showModalEdit=(data)=>{
        this.setState({
            edit_region:{
                is_open:true,
                region:Object.assign({}, data, {
                    nested:data.nested===null?"":data.nested
                })
            }
        })
    }
    hideModalEdit=()=>{
        this.setState({
            edit_region:{
                is_open:false,
                region:{}
            }
        })
    }
    updateRegion=async (values, actions)=>{
        await api(access_token()).put(`/region/${values.id_region}`, values)
        .then(res=>{
            this.getsRegion()
            this.hideModalEdit()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Update Data Failed!", {position:"bottom-center"})
        })

        actions.setIsSubmitting(false)
    }

    //hapus
    showConfirmHapus=(data)=>{
        this.setState({
            hapus_region:{
                is_open:true,
                id_region:data.id_region
            }
        })
    }
    hideConfirmHapus=()=>{
        this.setState({
            hapus_region:{
                is_open:false,
                id_region:""
            }
        })
    }
    deleteRegion=()=>{
        const {hapus_region}=this.state

        api(access_token()).delete(`/region/${hapus_region.id_region}`)
        .then(res=>{
            this.getsRegion()
            this.hideConfirmHapus()
            toast.warn("Region dihapus!")
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
        const {kecamatan_form, region, tambah_region, edit_region, hapus_region}=this.state

        return (
            <LayoutAdmin
                title="Master Region Desa"
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
                                            <select name="district_id" value={region.district_id} className="form-select" onChange={this.typeFilter}>
                                                <option value="">-- Pilih Kecamatan</option>
                                                {kecamatan_form.map(kf=>(
                                                    <option key={kf} value={kf.id_region}>{kf.region}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{width:"200px"}} className="me-2">
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="q"
                                                onChange={this.typeFilter}
                                                value={region.q}
                                                placeholder="Cari ..."
                                            />
                                        </div>
                                    </div>
                                    <div className="table-responsive mt-3">
                                        <table className="table table-centered table-wrap mb-0 rounded">
                                            <thead className="thead-light">
                                                <tr>
                                                    <th className="border-0 rounded-start" width="50">#</th>
                                                    <th className="border-0">{region.type=="sub_kriteria"&&"Sub"} Kecamatan</th>
                                                    <th className="border-0 rounded-end" width="90"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {region.data.map((list, idx)=>(
                                                    <tr key={list}>
                                                            <td className="align-middle">{(idx+1)+((region.page-1)*region.per_page)}</td>
                                                            <td>{list.region}</td>
                                                            <td className="text-nowrap p-1">
                                                                <button className="btn btn-warning btn-sm" onClick={()=>this.showModalEdit(list)}>
                                                                    Edit
                                                                </button>
                                                                <button type="button" className="btn btn-danger btn-sm ms-1" onClick={()=>this.showConfirmHapus(list)}>
                                                                    Hapus
                                                                </button>
                                                            </td>
                                                    </tr>
                                                ))}
                                                {(region.data.length==0)&&
                                                    <tr>
                                                        <td colSpan={3} className="text-center text-muted">Data tidak ditemukan!</td>
                                                    </tr>
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="d-flex align-items-center mt-4">
                                        <div className="d-flex flex-column">
                                            <div>Halaman {region.page} dari {region.last_page} Halaman</div>
                                        </div>
                                        <div className="d-flex align-items-center me-auto ms-3">
                                            <select className="form-select" name="per_page" value={region.per_page} onChange={this.setPerPage}>
                                                <option value="10">10 Data</option>
                                                <option value="25">25 Data</option>
                                                <option value="50">50 Data</option>
                                                <option value="100">100 Data</option>
                                            </select>
                                        </div>
                                        <div className="d-flex ms-3">
                                            <button 
                                                className="btn btn-gray" 
                                                disabled={region.page<=1}
                                                onClick={()=>this.goToPage(region.page-1)}
                                            >
                                                <FaChevronLeft/>
                                            </button>
                                            <button 
                                                className="btn btn-gray ms-1" 
                                                disabled={region.page>=region.last_page}
                                                onClick={()=>this.goToPage(region.page+1)}
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
                <Modal show={tambah_region.is_open} onHide={this.toggleModalTambah} backdrop="static">
                    <Modal.Header closeButton>
                        <Modal.Title>Tambah Region</Modal.Title>
                    </Modal.Header>
                    <Formik
                        initialValues={tambah_region.region}
                        onSubmit={this.addRegion}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Kecamatan</label>
                                        <select name="nested" value={props.values.nested} className="form-select" onChange={props.handleChange}>
                                            <option value="">-- Pilih Kecamatan</option>
                                            {kecamatan_form.map(kf=>(
                                                <option key={kf} value={kf.id_region}>{kf.region}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Desa</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            name="region"
                                            onChange={props.handleChange}
                                            value={props.values.region}
                                        />
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
                                        disabled={props.isSubmitting}
                                    >
                                        Save Changes
                                    </button>
                                </Modal.Footer>
                            </form>
                        )}
                    </Formik>
                </Modal>

                {/* MODAL EDIT */}
                <Modal show={edit_region.is_open} onHide={this.hideModalEdit} backdrop="static">
                    <Modal.Header closeButton>
                        <Modal.Title>Edit Region</Modal.Title>
                    </Modal.Header>
                    <Formik
                        initialValues={edit_region.region}
                        onSubmit={this.updateRegion}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Kecamatan</label>
                                        <select name="nested" value={props.values.nested} className="form-select" onChange={props.handleChange}>
                                            <option value="">-- Pilih Kecamatan</option>
                                            {kecamatan_form.map(kf=>(
                                                <option key={kf} value={kf.id_region}>{kf.region}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Desa</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            name="region"
                                            onChange={props.handleChange}
                                            value={props.values.region}
                                        />
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
                                        disabled={props.isSubmitting}
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
                    show={hapus_region.is_open}
                    title="Apakah anda Yakin?"
                    sub_title="Data yang sudah dihapus tidak bisa dikembalikan lagi!"
                    toggle={()=>this.hideConfirmHapus()}
                    deleteAction={()=>this.deleteRegion()}
                />

            </LayoutAdmin>
        )
    }
}

export default withAuth(Desa)