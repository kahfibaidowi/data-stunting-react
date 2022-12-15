import React from "react"
import update from "immutability-helper"
import classNames from "classnames"
import Animated from "../../../../component/ui/animate"
import withAuth from "../../../../component/hoc/auth"
import Layout from "../../../../component/layout"
import Link from "next/link"
import NumberFormat from 'react-number-format'
import { Formik, yupToFormErrors } from "formik"
import { api, api_kependudukan } from "../../../../config/api"
import { access_token, ceil_with_enclosure, excelToMomentDate, file_to_workbook, isUndefined, login_data } from "../../../../config/config"
import { toast } from "react-toastify"
import {ConfirmDelete} from "../../../../component/ui/confirm"
import Router, { withRouter } from "next/router"
import { ImFileExcel, ImPlus } from "react-icons/im"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import moment from "moment"
import { Button, ButtonGroup, Dropdown, Modal, OverlayTrigger, Popover, Spinner } from "react-bootstrap"
import writeXlsxFile from 'write-excel-file'
import FileSaver from "file-saver"
import readXlsxFile from "read-excel-file"
import { read, utils, writeFileXLSX } from 'xlsx';
import * as yup from "yup"
import { TbArrowLeft, TbChevronLeft, TbChevronRight, TbEdit, TbPlus, TbTrash, TbUpload } from "react-icons/tb"
import CreatableSelect from "react-select/creatable"
import Select from "react-select"

class RealisasiKegiatan extends React.Component{
    state={
        login_data:{},
        dinas_form:[],
        realisasi_kegiatan:{
            data:[],
            page:1,
            per_page:10,
            q:"",
            id_user:"",
            tahun:"",
            last_page:0
        },
        tambah_realisasi_kegiatan:{
            is_open:false,
            dinas_form:[],
            realisasi_kegiatan:{
                id_user:"",
                tahun:"",
                kegiatan:"",
                sasaran:"",
                anggaran:"",
                satuan:"",
                detail_kegiatan:""
            }
        },
        edit_realisasi_kegiatan:{
            is_open:false,
            dinas_form:[],
            realisasi_kegiatan:{}
        },
        hapus_realisasi_kegiatan:{
            is_open:false,
            id_realisasi_kegiatan:""
        }
    }

    componentDidMount=()=>{
        this.setState({
            login_data:login_data()!==null?login_data():{}
        }, ()=>{
            if(this.state.login_data.role=="dinas"){
                this.setState({
                    realisasi_kegiatan:update(this.state.realisasi_kegiatan, {
                        id_user:{$set:this.state.login_data.id_user}
                    })
                })
            }
            if(this.state.login_data.role=="admin"){
                this.getsUserDinasForm()
            }
        })
    }
    getsUserDinasForm=async()=>{
        await api(access_token()).get("/user", {
            params:{
                per_page:"",
                q:"",
                role:"dinas",
                status:"active"
            }
        })
        .then(res=>{
            this.setState({
                dinas_form:res.data.data
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
    getsRealisasiKegiatan=async(reset=false)=>{
        const {realisasi_kegiatan}=this.state

        if(realisasi_kegiatan.id_user==""||realisasi_kegiatan.tahun=="") return

        await api(access_token()).get("/intervensi_realisasi_kegiatan", {
            params:{
                page:reset?1:realisasi_kegiatan.page,
                per_page:realisasi_kegiatan.per_page,
                q:realisasi_kegiatan.q,
                id_user:realisasi_kegiatan.id_user,
                tahun:realisasi_kegiatan.tahun
            }
        })
        .then(res=>{
            this.setState({
                realisasi_kegiatan:update(this.state.realisasi_kegiatan, {
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
            skrining:update(this.state.skrining, {
                page:{$set:page}
            })
        }, ()=>{
            this.getsSkrining()
        })
    }
    setPerPage=e=>{
        const target=e.target

        this.setState({
            skrining:update(this.state.skrining, {
                per_page:{$set:target.value}
            })
        }, ()=>{
            this.getsSkrining(true)
        })
    }
    typeFilter=e=>{ 
        const {target}=e

        this.setState({
            realisasi_kegiatan:update(this.state.realisasi_kegiatan, {
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
                        this.getsRealisasiKegiatan()
                    }, 500);
                break
                default:
                    this.getsRealisasiKegiatan(true)
            }
        })
    }
    timeout=0

    //helpers
    listTahun=()=>{
        const year=(new Date()).getFullYear()

        let years=[]
        for(var i=year-5; i<=year+5; i++){
            years=years.concat([{value:i, label:i}])
        }

        return years
    }
    findTahun=(value)=>{
        if(value=="") return undefined
        return {label:value, value:value}
    }
    listDinas=(source)=>{
        return source.map(d=>{
            return {
                label:d.nama_lengkap,
                value:d.id_user
            }
        })
    }
    findDinas=(value, source)=>{
        return this.listDinas(source).find(f=>f.value==value)
    }

    //tambah
    toggleTambah=()=>{
        this.setState({
            tambah_realisasi_kegiatan:{
                is_open:!this.state.tambah_realisasi_kegiatan.is_open,
                dinas_form:this.state.dinas_form,
                realisasi_kegiatan:{
                    id_user:this.state.realisasi_kegiatan.id_user,
                    tahun:this.state.realisasi_kegiatan.tahun,
                    kegiatan:"",
                    sasaran:"",
                    anggaran:"",
                    satuan:"",
                    detail_kegiatan:""
                }
            }
        })
    }
    addRealisasiKegiatan=async (values, actions)=>{
        //params

        //insert to database
        await api(access_token()).post("/intervensi_realisasi_kegiatan", {
            id_user:values.id_user,
            tahun:values.tahun,
            kegiatan:values.kegiatan,
            sasaran:values.sasaran,
            anggaran:values.anggaran,
            satuan:values.satuan,
            detail_kegiatan:values.detail_kegiatan
        })
        .then(res=>{
            this.toggleTambah()
            this.getsRealisasiKegiatan(true)
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
    tambahRealisasiKegiatanSchema=()=>{
        return yup.object().shape({
            id_user:yup.string().required(),
            tahun:yup.string().required(),
            kegiatan:yup.string().required(),
            sasaran:yup.string().optional(),
            anggaran:yup.number().required(),
            satuan:yup.string().required(),
            detail_kegiatan:yup.string().optional()
        })
    }

    //edit
    showModalEdit=(data)=>{
        this.setState({
            edit_realisasi_kegiatan:{
                is_open:true,
                realisasi_kegiatan:data
            }
        })
    }
    hideModalEdit=()=>{
        this.setState({
            edit_realisasi_kegiatan:{
                is_open:false,
                realisasi_kegiatan:{}
            }
        })
    }
    updateRealisasiKegiatan=(values, actions)=>{
        api(access_token()).put(`/intervensi_realisasi_kegiatan/${values.id_realisasi_kegiatan}`, values)
        .then(res=>{
            this.getsRealisasiKegiatan()
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
    editRealisasiKegiatanSchema=()=>{
        return yup.object().shape({
            kegiatan:yup.string().required(),
            sasaran:yup.string().optional(),
            anggaran:yup.number().required(),
            satuan:yup.string().required(),
            detail_kegiatan:yup.string().optional()
        })
    }

    //hapus
    showConfirmHapus=(data)=>{
        this.setState({
            hapus_realisasi_kegiatan:{
                is_open:true,
                id_realisasi_kegiatan:data.id_realisasi_kegiatan
            }
        })
    }
    hideConfirmHapus=()=>{
        this.setState({
            hapus_realisasi_kegiatan:{
                is_open:false,
                id_realisasi_kegiatan:""
            }
        })
    }
    deleteRealisasiKegiatan=()=>{
        const {hapus_realisasi_kegiatan}=this.state

        api(access_token()).delete(`/intervensi_realisasi_kegiatan/${hapus_realisasi_kegiatan.id_realisasi_kegiatan}`)
        .then(res=>{
            this.getsRealisasiKegiatan()
            this.hideConfirmHapus()
            toast.warn("Realisasi Kegiatan dihapus!")
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
        const {
            login_data,
            dinas_form,
            realisasi_kegiatan,
            tambah_realisasi_kegiatan,
            edit_realisasi_kegiatan,
            hapus_realisasi_kegiatan
        }=this.state

        return (
            <>
                <Layout>
                    <div class="page-header d-print-none">
                        <div class="container-xl">
                            <div class="row g-2 align-items-center">
                                <div class="col">
                                    <div class="page-pretitle">Intervensi</div>
                                    <h2 class="page-title">Realisasi Kegiatan</h2>
                                </div>
                                <div class="col-12 col-md-auto ms-auto d-print-none">
                                    <div class="btn-list">
                                        <button 
                                            type="button" 
                                            class="btn btn-primary" 
                                            onClick={this.toggleTambah}
                                            disabled={realisasi_kegiatan.id_user==""||realisasi_kegiatan.tahun==""}
                                        >
                                            <TbPlus className="icon"/>
                                            Tambah Kegiatan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="page-body">
                        <div class="container-xl">
                            <div className='row mt-3 mb-5'>
                                <div className='col-md-12 mx-auto'>
                                    <div>
                                        <div className="d-flex mb-3 mt-3">
                                            {login_data.role!="dinas"&&
                                                <div style={{width:"200px"}} className="me-2">
                                                    <Select
                                                        options={this.listDinas(dinas_form)}
                                                        onChange={e=>{
                                                            this.typeFilter({target:{name:"id_user", value:e.value}})
                                                        }}
                                                        value={this.findDinas(realisasi_kegiatan.id_user, dinas_form)}
                                                        placeholder="Pilih Dinas"
                                                    />
                                                </div>
                                            }
                                            <div style={{width:"200px"}} className="me-2">
                                                <CreatableSelect
                                                    options={this.listTahun()}
                                                    onChange={e=>{
                                                        this.typeFilter({target:{name:"tahun", value:e.value}})
                                                    }}
                                                    value={this.findTahun(realisasi_kegiatan.tahun)}
                                                    placeholder="Pilih Tahun"
                                                />
                                            </div>
                                            <div style={{width:"200px"}} className="me-2">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="q"
                                                    onChange={this.typeFilter}
                                                    value={realisasi_kegiatan.q}
                                                    placeholder="Cari ..."
                                                />
                                            </div>
                                        </div>
                                        <div class="card border-0">
                                            <div class="card-body px-0 py-0">
                                                <div className="table-responsive">
                                                    <table className="table table-centered table-nowrap mb-0 rounded">
                                                        <thead className="thead-light">
                                                            <tr className="text-uppercase">
                                                                <th className="px-3" width="50">#</th>
                                                                <th className="px-3">Bentuk Kegiatan Koordinasi</th>
                                                                <th className="px-3">Sasaran</th>
                                                                <th className="px-3">Realisasi Anggaran</th>
                                                                <th className="px-3">Satuan</th>
                                                                <th className="px-3 text-wrap">Detail Kegiatan</th>
                                                                <th className="px-3">Jumlah</th>
                                                                <th className="px-3" width="90"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="border-top-0">
                                                            {realisasi_kegiatan.data.map((list, idx)=>(
                                                                <tr key={list}>
                                                                        <td className="align-middle px-3">{(idx+1)+((realisasi_kegiatan.page-1)*realisasi_kegiatan.per_page)}</td>
                                                                        <td className="px-3">{list.kegiatan}</td>
                                                                        <td className="px-3">{list.sasaran}</td>
                                                                        <td className="px-3">
                                                                            <NumberFormat
                                                                                value={list.anggaran}
                                                                                displayType="text"
                                                                                thousandSeparator={true}
                                                                            />
                                                                        </td>
                                                                        <td className="px-3">{list.satuan}</td>
                                                                        <td className="px-3 text-pre-wrap">{list.detail_kegiatan}</td>
                                                                        <td className="px-3">
                                                                            <NumberFormat
                                                                                value={list.jumlah}
                                                                                displayType="text"
                                                                                thousandSeparator={true}
                                                                            />
                                                                        </td>
                                                                        <td className="text-nowrap p-1 px-3">
                                                                            <button type="button" className="btn btn-link p-0" onClick={()=>this.showModalEdit(list)}>
                                                                                <TbEdit className="icon"/>
                                                                            </button>
                                                                            <button type="button" className="btn btn-link link-danger ms-2 p-0" onClick={()=>this.showConfirmHapus(list)}>
                                                                                <TbTrash className="icon"/>
                                                                            </button>
                                                                        </td>
                                                                </tr>
                                                            ))}
                                                            {realisasi_kegiatan.data.length==0&&
                                                                <tr>
                                                                    <td colSpan="8" className="text-center">Data tidak ditemukan!</td>
                                                                </tr>
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-center mt-3">
                                            <div className="d-flex flex-column">
                                                <div>Halaman {realisasi_kegiatan.page} dari {realisasi_kegiatan.last_page}</div>
                                            </div>
                                            <div className="d-flex align-items-center me-auto ms-3">
                                                <select className="form-select" name="per_page" value={realisasi_kegiatan.per_page} onChange={this.setPerPage}>
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
                                                        {"btn-primary":realisasi_kegiatan.page>1}
                                                    )}
                                                    disabled={realisasi_kegiatan.page<=1}
                                                    onClick={()=>this.goToPage(realisasi_kegiatan.page-1)}
                                                >
                                                    <TbChevronLeft/>
                                                    Prev
                                                </button>
                                                <button 
                                                    className={classNames(
                                                        "btn",
                                                        "border-0",
                                                        {"btn-primary":realisasi_kegiatan.page<realisasi_kegiatan.last_page},
                                                        "ms-2"
                                                    )}
                                                    disabled={realisasi_kegiatan.page>=realisasi_kegiatan.last_page}
                                                    onClick={()=>this.goToPage(realisasi_kegiatan.page+1)}
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
                </Layout>

                {/* MODAL TAMBAH */}
                <Modal show={tambah_realisasi_kegiatan.is_open} className="modal-blur" onHide={this.toggleTambah} backdrop="static" size="sm">
                    <Modal.Header closeButton>
                        <div className="modal-title h2 fw-bold">Tambah Kegiatan</div>
                    </Modal.Header>
                    <Formik
                        initialValues={tambah_realisasi_kegiatan.realisasi_kegiatan}
                        onSubmit={this.addRealisasiKegiatan}
                        validationSchema={this.tambahRealisasiKegiatanSchema()}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div className='w-100 d-flex flex-column'>
                                        {login_data.role!="dinas"&&
                                            <div className="mb-3">
                                                <label className="my-1 me-2 fw-semibold" for="country">Dinas</label>
                                                <Select
                                                    options={this.listDinas(tambah_realisasi_kegiatan.dinas_form)}
                                                    onChange={e=>{
                                                        props.setFieldValue("id_user", e.value)
                                                    }}
                                                    value={this.findDinas(props.values.id_user, tambah_realisasi_kegiatan.dinas_form)}
                                                    isDisabled
                                                />
                                            </div>
                                        }
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Tahun</label>
                                            <Select
                                                options={this.listTahun()}
                                                onChange={e=>{
                                                    props.setFieldValue("tahun", e.value)
                                                }}
                                                value={this.findTahun(props.values.tahun)}
                                                isDisabled
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Kegiatan</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="kegiatan"
                                                onChange={props.handleChange}
                                                value={props.values.kegiatan}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Sasaran</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="sasaran"
                                                onChange={props.handleChange}
                                                value={props.values.sasaran}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Anggaran</label>
                                            <NumberFormat
                                                displayType="input"
                                                value={props.values.anggaran}
                                                thousandSeparator
                                                onValueChange={values=>{
                                                    const {value}=values
                                                    props.setFieldValue("anggaran", value)
                                                }}
                                                className="form-control"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Satuan</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="satuan"
                                                onChange={props.handleChange}
                                                value={props.values.satuan}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Detail Kegiatan</label>
                                            <textarea
                                                rows="3"
                                                className="form-control"
                                                name="detail_kegiatan"
                                                onChange={props.handleChange}
                                                value={props.values.detail_kegiatan}
                                            />
                                        </div>
                                    </div>
                                </Modal.Body>
                                <Modal.Footer className="mt-3 border-top pt-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-link text-gray me-auto" 
                                        onClick={this.toggleTambah}
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
                <Modal show={edit_realisasi_kegiatan.is_open} className="modal-blur" onHide={this.hideModalEdit} backdrop="static" size="sm">
                    <Modal.Header closeButton>
                        <div className="modal-title h2 fw-bold">Edit Kegiatan</div>
                    </Modal.Header>
                    <Formik
                        initialValues={edit_realisasi_kegiatan.realisasi_kegiatan}
                        onSubmit={this.updateRealisasiKegiatan}
                        validationSchema={this.editRealisasiKegiatanSchema()}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div className='w-100 d-flex flex-column'>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Kegiatan</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="kegiatan"
                                                onChange={props.handleChange}
                                                value={props.values.kegiatan}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Sasaran</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="sasaran"
                                                onChange={props.handleChange}
                                                value={props.values.sasaran}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Anggaran</label>
                                            <NumberFormat
                                                displayType="input"
                                                value={props.values.anggaran}
                                                thousandSeparator
                                                onValueChange={values=>{
                                                    const {value}=values
                                                    props.setFieldValue("anggaran", value)
                                                }}
                                                className="form-control"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Satuan</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="satuan"
                                                onChange={props.handleChange}
                                                value={props.values.satuan}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Detail Kegiatan</label>
                                            <textarea
                                                rows="3"
                                                className="form-control"
                                                name="detail_kegiatan"
                                                onChange={props.handleChange}
                                                value={props.values.detail_kegiatan}
                                            />
                                        </div>
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
                    show={hapus_realisasi_kegiatan.is_open}
                    title="Apakah anda Yakin?"
                    sub_title="Data yang sudah dihapus tidak bisa dikembalikan lagi!"
                    toggle={()=>this.hideConfirmHapus()}
                    deleteAction={()=>this.deleteRealisasiKegiatan()}
                />
            </>
        )
    }
}

export default withRouter(withAuth(RealisasiKegiatan))