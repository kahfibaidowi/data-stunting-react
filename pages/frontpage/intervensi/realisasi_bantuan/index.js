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
import { access_token, BASE_URL, ceil_with_enclosure, excelToMomentDate, file_to_workbook, get_file, isUndefined, login_data } from "../../../../config/config"
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
import { AsyncTypeahead } from "react-bootstrap-typeahead"

class RealisasiBantuan extends React.Component{
    state={
        login_data:{},
        dinas_form:[],
        realisasi_bantuan:{
            data:[],
            page:1,
            per_page:10,
            q:"",
            id_user:"",
            tahun:"",
            last_page:0
        },
        tambah_realisasi_bantuan:{
            is_open:false,
            dinas_form:[],
            realisasi_bantuan:{
                id_user:"",
                tahun:"",
                id_skrining_balita:"",
                id_rencana_bantuan:"",
                nominal:"",
                dokumen:""
            },
            options_skrining:[],
            options_rencana_bantuan:[],
            is_loading_skrining:false,
            is_loading_rencana_bantuan:false
        },
        edit_realisasi_bantuan:{
            is_open:false,
            dinas_form:[],
            realisasi_bantuan:{}
        },
        hapus_realisasi_bantuan:{
            is_open:false,
            id_realisasi_bantuan:""
        }
    }

    componentDidMount=()=>{
        this.setState({
            login_data:login_data()!==null?login_data():{}
        }, ()=>{
            if(this.state.login_data.role=="dinas"){
                this.setState({
                    realisasi_bantuan:update(this.state.realisasi_bantuan, {
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
                Router.push("/")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    getsRealisasiBantuan=async(reset=false)=>{
        const {realisasi_bantuan}=this.state

        if(realisasi_bantuan.id_user==""||realisasi_bantuan.tahun=="") return

        await api(access_token()).get("/intervensi_realisasi_bantuan", {
            params:{
                page:reset?1:realisasi_bantuan.page,
                per_page:realisasi_bantuan.per_page,
                q:realisasi_bantuan.q,
                id_user:realisasi_bantuan.id_user,
                tahun:realisasi_bantuan.tahun
            }
        })
        .then(res=>{
            this.setState({
                realisasi_bantuan:update(this.state.realisasi_bantuan, {
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
            realisasi_bantuan:update(this.state.realisasi_bantuan, {
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
                        this.getsRealisasiBantuan()
                    }, 500);
                break
                default:
                    this.getsRealisasiBantuan(true)
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
    uploadDokumen=async(e)=>{
        const files=e.target.files

        let formData=new FormData()
        formData.append("dokumen", files[0])

        return await api(access_token()).post("/file/upload", formData, {
            headers:{
                'Content-type':"multipart/form-data"
            }
        })
        .then(res=>res.data.data)
        .catch(err=>false)
    }

    //tambah
    toggleTambah=()=>{
        this.setState({
            tambah_realisasi_bantuan:{
                is_open:!this.state.tambah_realisasi_bantuan.is_open,
                dinas_form:this.state.dinas_form,
                realisasi_bantuan:{
                    id_user:this.state.realisasi_bantuan.id_user,
                    tahun:this.state.realisasi_bantuan.tahun,
                    id_skrining_balita:"",
                    id_rencana_bantuan:"",
                    nominal:"",
                    dokumen:""
                },
                options_skrining:[],
                options_rencana_bantuan:[],
                is_loading_skrining:false,
                is_loading_rencana_bantuan:false
            }
        })
    }
    addRealisasiBantuan=async (values, actions)=>{
        //params

        //insert to database
        await api(access_token()).post("/intervensi_realisasi_bantuan", {
            id_skrining_balita:values.id_skrining_balita,
            id_rencana_bantuan:values.id_rencana_bantuan,
            nominal:values.nominal,
            dokumen:values.dokumen
        })
        .then(res=>{
            this.toggleTambah()
            this.getsRealisasiBantuan(true)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Insert Data Failed! ", {position:"bottom-center"})
        })
    }
    tambahRealisasiBantuanSchema=()=>{
        return yup.object().shape({
            id_skrining_balita:yup.string().required(),
            id_rencana_bantuan:yup.string().required(),
            nominal:yup.number().required(),
            dokumen:yup.string().optional()
        })
    }
    //--search skrining
    searchSkrining=(q)=>{
        this.setState({
            tambah_realisasi_bantuan:update(this.state.tambah_realisasi_bantuan, {
                is_loading_skrining:{$set:true}
            })
        })

        api(access_token()).get(`/stunting_4118`, {
            params:{
                page:1,
                per_page:15,
                q:q,
                district_id:""
            }
        })
        .then(res=>{
            this.setState({
                tambah_realisasi_bantuan:update(this.state.tambah_realisasi_bantuan, {
                    options_skrining:{$set:res.data.data},
                    is_loading_skrining:{$set:false}
                })
            })
        })
        .catch(err=>false)
    }
    //--search rencana bantuan
    searchRencanaBantuan=(q, id_user, tahun)=>{
        this.setState({
            tambah_realisasi_bantuan:update(this.state.tambah_realisasi_bantuan, {
                is_loading_rencana_bantuan:{$set:true}
            })
        })

        api(access_token()).get(`/intervensi_rencana_bantuan`, {
            params:{
                page:1,
                per_page:15,
                q:q,
                id_user:id_user,
                tahun:tahun
            }
        })
        .then(res=>{
            this.setState({
                tambah_realisasi_bantuan:update(this.state.tambah_realisasi_bantuan, {
                    options_rencana_bantuan:{$set:res.data.data},
                    is_loading_rencana_bantuan:{$set:false}
                })
            })
        })
        .catch(err=>false)
    }

    //edit
    showModalEdit=(data)=>{
        this.setState({
            edit_realisasi_bantuan:{
                is_open:true,
                realisasi_bantuan:data
            }
        })
    }
    hideModalEdit=()=>{
        this.setState({
            edit_realisasi_bantuan:{
                is_open:false,
                realisasi_bantuan:{}
            }
        })
    }
    updateRealisasiBantuan=(values, actions)=>{
        api(access_token()).put(`/intervensi_realisasi_bantuan/${values.id_realisasi_bantuan}`, values)
        .then(res=>{
            this.getsRealisasiBantuan()
            this.hideModalEdit()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Update Data Failed! ", {position:"bottom-center"})
        })
    }
    editRealisasiBantuanSchema=()=>{
        return yup.object().shape({
            nominal:yup.number().required(),
            dokumen:yup.string().optional()
        })
    }

    //hapus
    showConfirmHapus=(data)=>{
        this.setState({
            hapus_realisasi_bantuan:{
                is_open:true,
                id_realisasi_bantuan:data.id_realisasi_bantuan
            }
        })
    }
    hideConfirmHapus=()=>{
        this.setState({
            hapus_realisasi_bantuan:{
                is_open:false,
                id_realisasi_bantuan:""
            }
        })
    }
    deleteRealisasiBantuan=()=>{
        const {hapus_realisasi_bantuan}=this.state

        api(access_token()).delete(`/intervensi_realisasi_bantuan/${hapus_realisasi_bantuan.id_realisasi_bantuan}`)
        .then(res=>{
            this.getsRealisasiBantuan()
            this.hideConfirmHapus()
            toast.warn("Realisasi Bantuan dihapus!")
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
        const {
            login_data,
            dinas_form,
            realisasi_bantuan,
            tambah_realisasi_bantuan,
            edit_realisasi_bantuan,
            hapus_realisasi_bantuan
        }=this.state

        return (
            <>
                <Layout>
                    <div class="page-header d-print-none">
                        <div class="container-xl">
                            <div class="row g-2 align-items-center">
                                <div class="col">
                                    <div class="page-pretitle">Intervensi</div>
                                    <h2 class="page-title">Realisasi Bantuan</h2>
                                </div>
                                <div class="col-12 col-md-auto ms-auto d-print-none">
                                    <div class="btn-list">
                                        <button 
                                            type="button" 
                                            class="btn btn-primary" 
                                            onClick={this.toggleTambah}
                                            disabled={realisasi_bantuan.id_user==""||realisasi_bantuan.tahun==""}
                                        >
                                            <TbPlus className="icon"/>
                                            Tambah Bantuan
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
                                                        value={this.findDinas(realisasi_bantuan.id_user, dinas_form)}
                                                    />
                                                </div>
                                            }
                                            <div style={{width:"200px"}} className="me-2">
                                                <CreatableSelect
                                                    options={this.listTahun()}
                                                    onChange={e=>{
                                                        this.typeFilter({target:{name:"tahun", value:e.value}})
                                                    }}
                                                    value={this.findTahun(realisasi_bantuan.tahun)}
                                                />
                                            </div>
                                            <div style={{width:"200px"}} className="me-2">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="q"
                                                    onChange={this.typeFilter}
                                                    value={realisasi_bantuan.q}
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
                                                                <th className="px-3">NIK Anak</th>
                                                                <th className="px-3">No. KK</th>
                                                                <th className="px-3">Nama Anak</th>
                                                                <th className="px-3">Kecamatan</th>
                                                                <th className="px-3">Alamat</th>
                                                                <th className="px-3">Jenis Bantuan</th>
                                                                <th className="px-3">Tanggal</th>
                                                                <th className="px-3">Nominal</th>
                                                                <th className="px-3">Dokumen</th>
                                                                <th className="px-3" width="90"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="border-top-0">
                                                            {realisasi_bantuan.data.map((list, idx)=>(
                                                                <tr key={list}>
                                                                        <td className="align-middle px-3">{(idx+1)+((realisasi_bantuan.page-1)*realisasi_bantuan.per_page)}</td>
                                                                        <td className="px-3">{list.skrining_balita.data_anak.nik}</td>
                                                                        <td className="px-3">{list.skrining_balita.data_anak.no_kk}</td>
                                                                        <td className="px-3">{list.skrining_balita.data_anak.nama_lengkap}</td>
                                                                        <td className="px-3">{list.skrining_balita.kecamatan.region}</td>
                                                                        <td className="px-3"></td>
                                                                        <td className="px-3">{list.rencana_bantuan.bantuan}</td>
                                                                        <td className="px-3">{moment(list.created_at).format("D MMM YYYY")}</td>
                                                                        <td className="px-3">
                                                                            <NumberFormat
                                                                                value={list.nominal}
                                                                                displayType="text"
                                                                                thousandSeparator={true}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            {list.dokumen!=""&&
                                                                                <div className="d-block text-truncate" style={{maxWidth:"100%"}}>
                                                                                    <a 
                                                                                        href={BASE_URL+"/file/show/"+list.dokumen} 
                                                                                        target="_blank" 
                                                                                        rel="noreferrer"
                                                                                    >
                                                                                        {get_file(list.dokumen)}
                                                                                    </a>
                                                                                </div>
                                                                            }
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
                                                            {realisasi_bantuan.data.length==0&&
                                                                <tr>
                                                                    <td colSpan="11" className="text-center">Data tidak ditemukan!</td>
                                                                </tr>
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-center mt-3">
                                            <div className="d-flex flex-column">
                                                <div>Halaman {realisasi_bantuan.page} dari {realisasi_bantuan.last_page}</div>
                                            </div>
                                            <div className="d-flex align-items-center me-auto ms-3">
                                                <select className="form-select" name="per_page" value={realisasi_bantuan.per_page} onChange={this.setPerPage}>
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
                                                        {"btn-primary":realisasi_bantuan.page>1}
                                                    )}
                                                    disabled={realisasi_bantuan.page<=1}
                                                    onClick={()=>this.goToPage(realisasi_bantuan.page-1)}
                                                >
                                                    <TbChevronLeft/>
                                                    Prev
                                                </button>
                                                <button 
                                                    className={classNames(
                                                        "btn",
                                                        "border-0",
                                                        {"btn-primary":realisasi_bantuan.page<realisasi_bantuan.last_page},
                                                        "ms-2"
                                                    )}
                                                    disabled={realisasi_bantuan.page>=realisasi_bantuan.last_page}
                                                    onClick={()=>this.goToPage(realisasi_bantuan.page+1)}
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
                <Modal show={tambah_realisasi_bantuan.is_open} className="modal-blur" onHide={this.toggleTambah} backdrop="static" size="sm">
                    <Modal.Header closeButton>
                        <div className="modal-title h2 fw-bold">Tambah Bantuan</div>
                    </Modal.Header>
                    <Formik
                        initialValues={tambah_realisasi_bantuan.realisasi_bantuan}
                        onSubmit={this.addRealisasiBantuan}
                        validationSchema={this.tambahRealisasiBantuanSchema()}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div className='w-100 d-flex flex-column'>
                                        {login_data.role!="dinas"&&
                                            <div className="mb-3">
                                                <label className="my-1 me-2 fw-semibold" for="country">Dinas</label>
                                                <Select
                                                    options={this.listDinas(tambah_realisasi_bantuan.dinas_form)}
                                                    onChange={e=>{
                                                        props.setFieldValue("id_user", e.value)
                                                    }}
                                                    value={this.findDinas(props.values.id_user, tambah_realisasi_bantuan.dinas_form)}
                                                    isDisabled
                                                />
                                            </div>
                                        }
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Tahun</label>
                                            <Select
                                                options={this.listTahun()}
                                                value={this.findTahun(props.values.tahun)}
                                                isDisabled
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Skrining Balita</label>
                                            <AsyncTypeahead
                                                filterBy={option=>true}
                                                id="search-skrining"
                                                isLoading={tambah_realisasi_bantuan.is_loading_skrining}
                                                labelKey={option=>option.data_anak.nama_lengkap}
                                                minLength="2"
                                                onSearch={this.searchSkrining}
                                                options={tambah_realisasi_bantuan.options_skrining}
                                                placeholder="Cari Data Skrining Balita..."
                                                emptyLabel="Data Skrining tidak ditemukan!"
                                                onChange={e=>{
                                                    if(e.length>0){
                                                        props.setFieldValue("id_skrining_balita", e[0].id_skrining_balita)
                                                    }
                                                    else{
                                                        props.setFieldValue("id_skrining_balita", "")
                                                    }
                                                }}
                                                renderMenuItemChildren={(option, props, index)=>(
                                                    <div className='rbt-item d-flex flex-column pb-1 w-100' style={{borderBottom:"1px solid #e1e1e1"}} key={index}>
                                                        <span className='fs-16px fw-semibold text-dark'>{option.data_anak.nama_lengkap}</span>
                                                        <span className='mt-0 text-muted'>{option.data_anak.nik}</span>
                                                    </div>
                                                )}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Rencana Bantuan</label>
                                            <AsyncTypeahead
                                                filterBy={option=>true}
                                                id="search-rencana-bantuan"
                                                isLoading={tambah_realisasi_bantuan.is_loading_rencana_bantuan}
                                                labelKey={option=>option.bantuan}
                                                minLength="2"
                                                onSearch={e=>{
                                                    this.searchRencanaBantuan(e, props.values.id_user, props.values.tahun)
                                                }}
                                                options={tambah_realisasi_bantuan.options_rencana_bantuan}
                                                placeholder="Cari Data Rencana Bantuan..."
                                                emptyLabel="Data Rencana Bantuan tidak ditemukan!"
                                                onChange={e=>{
                                                    if(e.length>0){
                                                        props.setFieldValue("id_rencana_bantuan", e[0].id_rencana_bantuan)
                                                    }
                                                    else{
                                                        props.setFieldValue("id_rencana_bantuan", "")
                                                    }
                                                }}
                                                renderMenuItemChildren={(option, props, index)=>(
                                                    <div className='rbt-item d-flex flex-column pb-1 w-100' style={{borderBottom:"1px solid #e1e1e1"}} key={index}>
                                                        <span className='fs-16px fw-semibold text-dark'>{option.bantuan}</span>
                                                        <span className='mt-0 text-muted'>{option.detail_kegiatan}</span>
                                                    </div>
                                                )}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Nominal</label>
                                            <NumberFormat
                                                displayType="input"
                                                value={props.values.nominal}
                                                thousandSeparator
                                                onValueChange={values=>{
                                                    const {value}=values
                                                    props.setFieldValue("nominal", value)
                                                }}
                                                className="form-control"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Dokumen</label>
                                            <div className="p-0">
                                                {props.values.dokumen!=""&&
                                                    <div className="d-block text-truncate" style={{maxWidth:"100%"}}>
                                                        <a 
                                                            href={BASE_URL+"/file/show/"+props.values.dokumen} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                        >
                                                            {get_file(props.values.dokumen)}
                                                        </a>
                                                    </div>
                                                }
                                                <div className="mt-1">
                                                    <label>
                                                        <input
                                                            type="file"
                                                            style={{display:"none"}}
                                                            accept=".pdf, .doc, .docx"
                                                            onChange={async e=>{
                                                                const data=await this.uploadDokumen(e)
                                                                if(data!==false){
                                                                    props.setFieldValue("dokumen", data.file)
                                                                }
                                                                else{
                                                                    toast.error("Upload File Failed!", {position:"bottom-center"})
                                                                }
                                                            }}
                                                        />
                                                        <div
                                                            className="btn btn-secondary"
                                                            type="button"
                                                        >
                                                            <TbUpload className="icon"/> Pilih Dokumen
                                                        </div>
                                                    </label>
                                                    {props.values.dokumen!=""&&
                                                        <button 
                                                            className="btn btn-icon btn-danger ms-1" 
                                                            type="button"
                                                            onClick={e=>{
                                                                props.setFieldValue("dokumen", "")
                                                            }}
                                                        >
                                                            <TbTrash className="icon"/>
                                                        </button>
                                                    }
                                                </div>
                                            </div>
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
                <Modal show={edit_realisasi_bantuan.is_open} className="modal-blur" onHide={this.hideModalEdit} backdrop="static" size="sm">
                    <Modal.Header closeButton>
                        <div className="modal-title h2 fw-bold">Edit Bantuan</div>
                    </Modal.Header>
                    <Formik
                        initialValues={edit_realisasi_bantuan.realisasi_bantuan}
                        onSubmit={this.updateRealisasiBantuan}
                        validationSchema={this.editRealisasiBantuanSchema()}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div className="mb-3">
                                        <label className="my-1 me-2 fw-semibold" for="country">Nominal</label>
                                        <NumberFormat
                                            displayType="input"
                                            value={props.values.nominal}
                                            thousandSeparator
                                            onValueChange={values=>{
                                                const {value}=values
                                                props.setFieldValue("nominal", value)
                                            }}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="my-1 me-2 fw-semibold" for="country">Dokumen</label>
                                        <div className="p-0">
                                            {props.values.dokumen!=""&&
                                                <div className="d-block text-truncate" style={{maxWidth:"100%"}}>
                                                    <a 
                                                        href={BASE_URL+"/file/show/"+props.values.dokumen} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                    >
                                                        {get_file(props.values.dokumen)}
                                                    </a>
                                                </div>
                                            }
                                            <div className="mt-1">
                                                <label>
                                                    <input
                                                        type="file"
                                                        style={{display:"none"}}
                                                        accept=".pdf, .doc, .docx"
                                                        onChange={async e=>{
                                                            const data=await this.uploadDokumen(e)
                                                            if(data!==false){
                                                                props.setFieldValue("dokumen", data.file)
                                                            }
                                                            else{
                                                                toast.error("Upload File Failed!", {position:"bottom-center"})
                                                            }
                                                        }}
                                                    />
                                                    <div
                                                        className="btn btn-secondary"
                                                        type="button"
                                                    >
                                                        <TbUpload className="icon"/> Pilih Dokumen
                                                    </div>
                                                </label>
                                                {props.values.dokumen!=""&&
                                                    <button 
                                                        className="btn btn-icon btn-danger ms-1" 
                                                        type="button"
                                                        onClick={e=>{
                                                            props.setFieldValue("dokumen", "")
                                                        }}
                                                    >
                                                        <TbTrash className="icon"/>
                                                    </button>
                                                }
                                            </div>
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
                    show={hapus_realisasi_bantuan.is_open}
                    title="Apakah anda Yakin?"
                    sub_title="Data yang sudah dihapus tidak bisa dikembalikan lagi!"
                    toggle={()=>this.hideConfirmHapus()}
                    deleteAction={()=>this.deleteRealisasiBantuan()}
                />
            </>
        )
    }
}

export default withRouter(withAuth(RealisasiBantuan))