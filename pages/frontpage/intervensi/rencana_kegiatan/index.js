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
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi"
import swal from "sweetalert2"
import withReactContent from 'sweetalert2-react-content'

const MySwal=withReactContent(swal)

class RencanaKegiatan extends React.Component{
    state={
        login_data:{},
        dinas_form:[],
        rencana_kegiatan:{
            data:[],
            page:1,
            per_page:10,
            q:"",
            id_user:"",
            tahun:"",
            last_page:0
        },
        tambah_rencana_kegiatan:{
            is_open:false,
            dinas_form:[],
            rencana_kegiatan:{
                id_user:"",
                tahun:"",
                kegiatan:"",
                anggaran:"",
                satuan:"",
                detail_kegiatan:""
            }
        },
        edit_rencana_kegiatan:{
            is_open:false,
            dinas_form:[],
            rencana_kegiatan:{}
        }
    }

    componentDidMount=()=>{
        this.setState({
            login_data:login_data()!==null?login_data():{}
        }, ()=>{
            if(this.state.login_data.role=="dinas"){
                this.setState({
                    rencana_kegiatan:update(this.state.rencana_kegiatan, {
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
    getsRencanaKegiatan=async(reset=false)=>{
        const {rencana_kegiatan}=this.state

        if(rencana_kegiatan.id_user==""||rencana_kegiatan.tahun=="") return

        await api(access_token()).get("/intervensi_rencana_kegiatan", {
            params:{
                page:reset?1:rencana_kegiatan.page,
                per_page:rencana_kegiatan.per_page,
                q:rencana_kegiatan.q,
                id_user:rencana_kegiatan.id_user,
                tahun:rencana_kegiatan.tahun
            }
        })
        .then(res=>{
            this.setState({
                rencana_kegiatan:update(this.state.rencana_kegiatan, {
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
            rencana_kegiatan:update(this.state.rencana_kegiatan, {
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
                        this.getsRencanaKegiatan()
                    }, 500);
                break
                default:
                    this.getsRencanaKegiatan(true)
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
            tambah_rencana_kegiatan:{
                is_open:!this.state.tambah_rencana_kegiatan.is_open,
                dinas_form:this.state.dinas_form,
                rencana_kegiatan:{
                    id_user:this.state.rencana_kegiatan.id_user,
                    tahun:this.state.rencana_kegiatan.tahun,
                    kegiatan:"",
                    anggaran:"",
                    satuan:"",
                    detail_kegiatan:""
                }
            }
        })
    }
    addRencanaKegiatan=async (values, actions)=>{
        //params

        //insert to database
        await api(access_token()).post("/intervensi_rencana_kegiatan", {
            id_user:values.id_user,
            tahun:values.tahun,
            kegiatan:values.kegiatan,
            anggaran:values.anggaran,
            satuan:values.satuan,
            detail_kegiatan:values.detail_kegiatan
        })
        .then(res=>{
            this.toggleTambah()
            this.getsRencanaKegiatan(true)
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
    tambahRencanaKegiatanSchema=()=>{
        return yup.object().shape({
            id_user:yup.string().required(),
            tahun:yup.string().required(),
            kegiatan:yup.string().required(),
            anggaran:yup.number().required(),
            satuan:yup.string().required(),
            detail_kegiatan:yup.string().optional()
        })
    }

    //edit
    showModalEdit=(data)=>{
        this.setState({
            edit_rencana_kegiatan:{
                is_open:true,
                rencana_kegiatan:data
            }
        })
    }
    hideModalEdit=()=>{
        this.setState({
            edit_rencana_kegiatan:{
                is_open:false,
                rencana_kegiatan:{}
            }
        })
    }
    updateRencanaKegiatan=(values, actions)=>{
        api(access_token()).put(`/intervensi_rencana_kegiatan/${values.id_rencana_kegiatan}`, values)
        .then(res=>{
            this.getsRencanaKegiatan()
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
    editRencanaKegiatanSchema=()=>{
        return yup.object().shape({
            kegiatan:yup.string().required(),
            anggaran:yup.number().required(),
            satuan:yup.string().required(),
            detail_kegiatan:yup.string().optional()
        })
    }

    //hapus
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
                this.deleteRencanaKegiatan(data.id_rencana_kegiatan)
            }
        })
    }
    deleteRencanaKegiatan=(id)=>{
        api(access_token()).delete(`/intervensi_rencana_kegiatan/${id}`)
        .then(res=>{
            this.getsRencanaKegiatan()
            toast.warn("Rencana Kegiatan dihapus!")
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
            rencana_kegiatan,
            tambah_rencana_kegiatan,
            edit_rencana_kegiatan,
            hapus_rencana_kegiatan
        }=this.state

        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Rencana Kegiatan</h4>
                        </div>
                        <div class="d-flex align-items-center flex-wrap text-nowrap">
                            <button 
                                type="button" 
                                class="btn btn-primary btn-icon-text mb-2 mb-md-0"
                                onClick={this.toggleTambah}
                                disabled={rencana_kegiatan.id_user==""||rencana_kegiatan.tahun==""}
                            >
                                <FiPlus className="btn-icon-prepend"/>
                                Tambah Kegiatan
                            </button>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex mb-3 mt-3">
                                        {login_data.role!="dinas"&&
                                            <div style={{width:"200px"}} className="me-2">
                                                <Select
                                                    options={this.listDinas(dinas_form)}
                                                    onChange={e=>{
                                                        this.typeFilter({target:{name:"id_user", value:e.value}})
                                                    }}
                                                    value={this.findDinas(rencana_kegiatan.id_user, dinas_form)}
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
                                                value={this.findTahun(rencana_kegiatan.tahun)}
                                                placeholder="Pilih Tahun"
                                            />
                                        </div>
                                        <div style={{width:"200px"}} className="me-2">
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="q"
                                                onChange={this.typeFilter}
                                                value={rencana_kegiatan.q}
                                                placeholder="Cari ..."
                                            />
                                        </div>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-hover table-custom table-nowrap mb-0 rounded">
                                            <thead className="thead-light">
                                                <tr className="text-uppercase">
                                                    <th className="px-3" width="50">#</th>
                                                    <th className="px-3">Bentuk Kegiatan Koordinasi</th>
                                                    <th className="px-3">Rencana Anggaran</th>
                                                    <th className="px-3">Satuan</th>
                                                    <th className="px-3 text-wrap">Detail Kegiatan</th>
                                                    <th className="px-3">Jumlah</th>
                                                    <th className="px-3" width="90"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="border-top-0">
                                                {rencana_kegiatan.data.map((list, idx)=>(
                                                    <tr key={list}>
                                                            <td className="align-middle px-3">{(idx+1)+((rencana_kegiatan.page-1)*rencana_kegiatan.per_page)}</td>
                                                            <td className="px-3">{list.kegiatan}</td>
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
                                                {rencana_kegiatan.data.length==0&&
                                                    <tr>
                                                        <td colSpan="7" className="text-center">Data tidak ditemukan!</td>
                                                    </tr>
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="d-flex align-items-center mt-3">
                                        <div className="d-flex flex-column">
                                            <div>Halaman {rencana_kegiatan.page} dari {rencana_kegiatan.last_page}</div>
                                        </div>
                                        <div className="d-flex align-items-center me-auto ms-3">
                                            <select className="form-select" name="per_page" value={rencana_kegiatan.per_page} onChange={this.setPerPage}>
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
                                                    {"btn-primary":rencana_kegiatan.page>1}
                                                )}
                                                disabled={rencana_kegiatan.page<=1}
                                                onClick={()=>this.goToPage(rencana_kegiatan.page-1)}
                                            >
                                                <FiChevronLeft/>
                                                Prev
                                            </button>
                                            <button 
                                                className={classNames(
                                                    "btn",
                                                    "border-0",
                                                    {"btn-primary":rencana_kegiatan.page<rencana_kegiatan.last_page},
                                                    "ms-2"
                                                )}
                                                disabled={rencana_kegiatan.page>=rencana_kegiatan.last_page}
                                                onClick={()=>this.goToPage(rencana_kegiatan.page+1)}
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
                </Layout>

                {/* MODAL TAMBAH */}
                <Modal show={tambah_rencana_kegiatan.is_open} className="modal-blur" onHide={this.toggleTambah} backdrop="static" size="sm">
                    <Modal.Header closeButton>
                        <h4 className="modal-title">Tambah Kegiatan</h4>
                    </Modal.Header>
                    <Formik
                        initialValues={tambah_rencana_kegiatan.rencana_kegiatan}
                        onSubmit={this.addRencanaKegiatan}
                        validationSchema={this.tambahRencanaKegiatanSchema()}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div className='w-100 d-flex flex-column'>
                                        {login_data.role!="dinas"&&
                                            <div className="mb-3">
                                                <label className="my-1 me-2 fw-semibold" for="country">Dinas</label>
                                                <Select
                                                    options={this.listDinas(tambah_rencana_kegiatan.dinas_form)}
                                                    onChange={e=>{
                                                        props.setFieldValue("id_user", e.value)
                                                    }}
                                                    value={this.findDinas(props.values.id_user, tambah_rencana_kegiatan.dinas_form)}
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
                <Modal show={edit_rencana_kegiatan.is_open} className="modal-blur" onHide={this.hideModalEdit} backdrop="static" size="sm">
                    <Modal.Header closeButton>
                        <h4 className="modal-title">Edit Kegiatan</h4>
                    </Modal.Header>
                    <Formik
                        initialValues={edit_rencana_kegiatan.rencana_kegiatan}
                        onSubmit={this.updateRencanaKegiatan}
                        validationSchema={this.editRencanaKegiatanSchema()}
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
            </>
        )
    }
}

export default withRouter(withAuth(RencanaKegiatan))