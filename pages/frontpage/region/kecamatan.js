import React from "react"
import withAuth from "../../../component/hoc/auth"
import classNames from "classnames"
import update from "immutability-helper"
import Layout from "../../../component/layout"
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
import { TbChevronLeft, TbChevronRight, TbEdit, TbPlug, TbPlus, TbTrash, TbUpload } from "react-icons/tb"
import * as yup from "yup"

class Kecamatan extends React.Component{
    state={
        region:{
            data:[],
            page:1,
            per_page:10,
            last_page:0,
            q:""
        },
        tambah_region:{
            is_open:false,
            region:{
                region:"",
                map_center:{
                    zoom:"",
                    latitude:"",
                    longitude:""
                },
                geo_json:{}
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
        this.getsRegion()
    }
    getsRegion=async (reset=false)=>{
        const {region}=this.state

        await api(access_token()).get("/region/type/kecamatan", {
            params:{
                page:reset?1:region.page,
                per_page:region.per_page,
                q:region.q,
                with_desa:0,
                with_posyandu:0
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
                Router.push("/login")
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
            case "q":
                this.setState({
                    region:update(this.state.region, {
                        [target.name]:{$set:target.value}
                    })
                }, ()=>{
                    if(this.timeout) clearTimeout(this.timeout)
                    this.timeout=setTimeout(() => {
                        this.getsRegion(true)
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
                    map_center:{
                        zoom:"",
                        latitude:"",
                        longitude:""
                    },
                    geo_json:{}
                }
            }
        })
    }
    addRegion=async (values, actions)=>{
        await api(access_token()).post("/region", {
            type:"kecamatan",
            nested:"",
            ...values
        })
        .then(res=>{
            this.getsRegion()
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
    tambahRegionSchema=()=>{
        return yup.object().shape({
            region:yup.string().required(),
            map_center:yup.object().shape({
                zoom:yup.number().optional(),
                latitude:yup.string().optional(),
                longitude:yup.string().optional()
            }),
            geo_json:yup.object().optional()
        })
    }

    //edit
    showModalEdit=(region)=>{
        const {data, ...region_data}=region

        this.setState({
            edit_region:{
                is_open:true,
                region:Object.assign({}, region_data, {
                    nested:region_data.nested===null?"":region_data.nested,
                    map_center:data.map_center,
                    geo_json:(typeof data.geo_json==='object' && data.geo_json!==null && !Array.isArray(data.geo_json))?data.geo_json:{}
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
                Router.push("/login")
            }
            
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Update Data Failed! ", {position:"bottom-center"})
        })
    }
    editRegionSchema=()=>{
        return yup.object().shape({
            region:yup.string().required(),
            map_center:yup.object().shape({
                zoom:yup.number().optional(),
                latitude:yup.string().optional(),
                longitude:yup.string().optional()
            }),
            geo_json:yup.object().optional()
        })
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
                Router.push("/login")
            }
            toast.error("Remove Data Failed!", {position:"bottom-center"})
        })
    }

    render(){
        const {region, tambah_region, edit_region, hapus_region}=this.state

        return (
            <Layout>
                <div class="page-header d-print-none">
                    <div class="container-xl">
                        <div class="row g-2 align-items-center">
                            <div class="col">
                                <div class="page-pretitle">Overview</div>
                                <h2 class="page-title">Master Region(Kecamatan)</h2>
                            </div>
                            <div class="col-12 col-md-auto ms-auto d-print-none">
                                <div class="btn-list">
                                    <button type="button" class="btn btn-primary" onClick={this.toggleModalTambah}>
                                        <TbPlus className="icon"/>
                                        Tambah Kecamatan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="page-body">
                    <div class="container-xl">
                        <div className="d-flex flex-column mt-3" style={{minHeight:"67vh"}}>
                            <div className="row">
                                <div className="col-12">
                                    <div className="d-flex mb-3 mt-3">
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
                                    <div className="card border-0 mb-3">
                                        <div className="card-body p-0">
                                            <div className="table-responsive">
                                                <table className="table table-centered table-wrap mb-0 rounded">
                                                    <thead className="thead-light">
                                                        <tr>
                                                            <th className="border-0 rounded-start" width="50">#</th>
                                                            <th className="border-0">{region.type=="sub_kriteria"&&"Sub"} Kecamatan</th>
                                                            <th className="border-0 rounded-end" width="50"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {region.data.map((list, idx)=>(
                                                            <tr key={list}>
                                                                    <td className="align-middle">{(idx+1)+((region.page-1)*region.per_page)}</td>
                                                                    <td>{list.region}</td>
                                                                    <td className="text-nowrap p-1 align-middle">
                                                                        <button type="button" className="btn btn-icon btn-link" onClick={()=>this.showModalEdit(list)}>
                                                                            <TbEdit className="icon"/>
                                                                        </button>
                                                                        <button type="button" className="btn btn-icon btn-link link-danger ms-1" onClick={()=>this.showConfirmHapus(list)}>
                                                                            <TbTrash className="icon"/>
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
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <div className="d-flex flex-column">
                                            <div>Halaman {region.page} dari {region.last_page}</div>
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
                                                className={classNames(
                                                    "btn",
                                                    "border-0",
                                                    {"btn-primary":region.page>1}
                                                )}
                                                disabled={region.page<=1}
                                                onClick={()=>this.goToPage(region.page-1)}
                                            >
                                                <TbChevronLeft/>
                                                Prev
                                            </button>
                                            <button 
                                                className={classNames(
                                                    "btn",
                                                    "border-0",
                                                    {"btn-primary":region.page<region.last_page},
                                                    "ms-2"
                                                )}
                                                disabled={region.page>=region.last_page}
                                                onClick={()=>this.goToPage(region.page+1)}
                                            >
                                                Next
                                                <TbChevronRight/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL TAMBAH */}
                <Modal show={tambah_region.is_open} className="modal-blur" onHide={this.toggleModalTambah} size="sm" backdrop="static">
                    <Modal.Header closeButton>
                        <div className="modal-title h2 fw-bold">Tambah Region</div>
                    </Modal.Header>
                    <Formik
                        initialValues={tambah_region.region}
                        onSubmit={this.addRegion}
                        validationSchema={this.tambahRegionSchema()}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Kecamatan</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            name="region"
                                            onChange={props.handleChange}
                                            value={props.values.region}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Map Center</label>
                                        <div class="input-group mb-1">
                                            <span class="input-group-text">
                                                Zoom
                                            </span>
                                            <select className="form-select" name="map_center.zoom" values={props.values.map_center.zoom} onChange={props.handleChange}>
                                                <option value="">-- Pilih Zoom</option>
                                                <option value="8">8x</option>
                                                <option value="9">9x</option>
                                                <option value="10">10x</option>
                                                <option value="11">11x</option>
                                                <option value="12">12x</option>
                                                <option value="13">13x</option>
                                                <option value="14">14x</option>
                                                <option value="15">15x</option>
                                                <option value="16">16x</option>
                                            </select>
                                        </div>
                                        <div class="input-group mb-1">
                                            <span class="input-group-text">
                                                Latitude
                                            </span>
                                            <input 
                                                type="text" 
                                                class="form-control" 
                                                autocomplete="off"
                                                name="map_center.latitude"
                                                values={props.values.map_center.latitude}
                                                onChange={props.handleChange}
                                            />
                                        </div>
                                        <div class="input-group mb-1">
                                            <span class="input-group-text">
                                                Longitude
                                            </span>
                                            <input 
                                                type="text" 
                                                class="form-control" 
                                                autocomplete="off"
                                                name="map_center.longitude"
                                                values={props.values.map_center.longitude}
                                                onChange={props.handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <div className="d-flex mb-1">
                                            <label className="my-1 me-2" for="country">Geo JSON</label>
                                            <label>
                                                <span className="btn btn-secondary btn-sm ms-2"><TbUpload className="icon"/> Pilih File</span>
                                                <input
                                                    type="file"
                                                    className="d-none"
                                                    accept=".json, .geojson"
                                                    onChange={async e=>{
                                                        const data=await e.target.files[0].text()
                                                        try{
                                                            const geo_json=JSON.parse(data)
                                                            props.setFieldValue("geo_json", geo_json)
                                                        }
                                                        catch(e){
                                                            toast.error("Geo JSON invalid!", {position:"bottom-center"})
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                        <textarea
                                            className="form-control bg-light"
                                            value={JSON.stringify(props.values.geo_json)}
                                            rows="5"
                                            readOnly
                                        />
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
                                        disabled={props.isSubmitting||!(props.dirty&&props.isValid)}
                                    >
                                        Save Changes
                                    </button>
                                </Modal.Footer>
                            </form>
                        )}
                    </Formik>
                </Modal>

                {/* MODAL EDIT */}
                <Modal show={edit_region.is_open} className="modal-blur" onHide={this.hideModalEdit} size="sm" backdrop="static">
                    <Modal.Header closeButton>
                        <div className="modal-title h2 fw-bold">Edit Region</div>
                    </Modal.Header>
                    <Formik
                        initialValues={edit_region.region}
                        onSubmit={this.updateRegion}
                        validationSchema={this.editRegionSchema()}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Kecamatan</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            name="region"
                                            onChange={props.handleChange}
                                            value={props.values.region}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="my-1 me-2" for="country">Map Center</label>
                                        <div class="input-group mb-1">
                                            <span class="input-group-text">
                                                Zoom
                                            </span>
                                            <select className="form-select" name="map_center.zoom" value={props.values.map_center.zoom} onChange={props.handleChange}>
                                                <option value="">-- Pilih Zoom</option>
                                                <option value="8">8x</option>
                                                <option value="9">9x</option>
                                                <option value="10">10x</option>
                                                <option value="11">11x</option>
                                                <option value="12">12x</option>
                                                <option value="13">13x</option>
                                                <option value="14">14x</option>
                                                <option value="15">15x</option>
                                                <option value="16">16x</option>
                                            </select>
                                        </div>
                                        <div class="input-group mb-1">
                                            <span class="input-group-text">
                                                Latitude
                                            </span>
                                            <input 
                                                type="text" 
                                                class="form-control" 
                                                autocomplete="off"
                                                name="map_center.latitude"
                                                value={props.values.map_center.latitude}
                                                onChange={props.handleChange}
                                            />
                                        </div>
                                        <div class="input-group mb-1">
                                            <span class="input-group-text">
                                                Longitude
                                            </span>
                                            <input 
                                                type="text" 
                                                class="form-control" 
                                                autocomplete="off"
                                                name="map_center.longitude"
                                                value={props.values.map_center.longitude}
                                                onChange={props.handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <div className="d-flex mb-1">
                                            <label className="my-1 me-2" for="country">Geo JSON</label>
                                            <label>
                                                <span className="btn btn-secondary btn-sm ms-2"><TbUpload className="icon"/> Pilih File</span>
                                                <input
                                                    type="file"
                                                    className="d-none"
                                                    accept=".json, .geojson"
                                                    onChange={async e=>{
                                                        const data=await e.target.files[0].text()
                                                        try{
                                                            const geo_json=JSON.parse(data)
                                                            props.setFieldValue("geo_json", geo_json)
                                                        }
                                                        catch(e){
                                                            toast.error("Geo JSON invalid!", {position:"bottom-center"})
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                        <textarea
                                            className="form-control bg-light"
                                            value={JSON.stringify(props.values.geo_json)}
                                            rows="5"
                                            readOnly
                                        />
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
                                        disabled={props.isSubmitting||!(props.isValid)}
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

            </Layout>
        )
    }
}

export default withAuth(Kecamatan)