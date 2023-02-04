import React from "react"
import update from "immutability-helper"
import classNames from "classnames"
import Animated from "../../../component/ui/animate"
import withAuth from "../../../component/hoc/auth"
import Layout from "../../../component/layout"
import Link from "next/link"
import NumberFormat from 'react-number-format'
import { Formik, yupToFormErrors } from "formik"
import { api, api_kependudukan } from "../../../config/api"
import { access_token, BASE_URL, BASE_URL_KEPENDUDUKAN, ceil_with_enclosure, excelToMomentDate, file_to_workbook, isUndefined, login_data } from "../../../config/config"
import { toast } from "react-toastify"
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
import { TbArrowLeft, TbChevronLeft, TbChevronRight, TbPlus, TbUpload } from "react-icons/tb"
import axios from "axios"
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi"

class Skrining extends React.Component{
    state={
        login_data:{},
        kecamatan_form:[],
        skrining:{
            data:[],
            page:1,
            per_page:10,
            q:"",
            posyandu_id:"",
            nik:"",
            last_page:0,
            is_loading:false
        },
        tambah_skrining:{
            is_open:false,
            kecamatan_form:[],
            skrining:{
                id_user:"",
                nik_anak:"",
                data_anak:{},
                berat_badan_lahir:"",
                tinggi_badan_lahir:"",
                berat_badan:"",
                tinggi_badan:""
            },
            search_data:{
                nik_anak:{},
                old_data:{}
            }
        },
        detail_kk:{
            is_open:false,
            data:[]
        }
    }

    componentDidMount=()=>{
        if(this.props.router.isReady){
            if(this.props.router.query?.action=="cek_antropometri"){
                this.toggleTambah()
            }
            else{
                this.setState({
                    login_data:login_data()!==null?login_data():{}
                }, ()=>{
                    if(this.state.login_data.role=="posyandu"){
                        this.setState({
                            skrining:update(this.state.skrining, {
                                posyandu_id:{$set:this.state.login_data.id_user}
                            })
                        }, ()=>{
                            this.getsSkrining()
                        })
                    }
                    else{
                        this.getsSkrining()
                    }
                })
            }
        }
        
        this.getsKecamatanForm()
    }
    componentDidUpdate=(prevProps)=>{
        if(prevProps.router.isReady!==this.props.router.isReady){
            if(this.props.router.isReady){
                if(this.props.router.query?.action=="cek_antropometri"){
                    this.toggleTambah()
                }
                else{
                    this.setState({
                        login_data:login_data()!==null?login_data():{}
                    }, ()=>{
                        if(this.state.login_data.role=="posyandu"){
                            this.setState({
                                skrining:update(this.state.skrining, {
                                    posyandu_id:{$set:this.state.login_data.id_user}
                                })
                            }, ()=>{
                                this.getsSkrining()
                            })
                        }
                        else{
                            this.getsSkrining()
                        }
                    })
                }
            }
        }
        if(JSON.stringify(prevProps.router)!=JSON.stringify(this.props.router)){
            if(this.props.router.isReady){
                if(this.props.router.query?.action=="cek_antropometri"){
                    this.toggleTambah()
                }
                else{
                    this.setState({
                        login_data:login_data()!==null?login_data():{}
                    }, ()=>{
                        if(this.state.login_data.role=="posyandu"){
                            this.setState({
                                skrining:update(this.state.skrining, {
                                    posyandu_id:{$set:this.state.login_data.id_user}
                                })
                            }, ()=>{
                                this.getsSkrining()
                            })
                        }
                        else{
                            this.getsSkrining()
                        }
                    })
                }
            }
        }
    }
    getsKecamatanForm=async()=>{
        api(access_token()).get("/region/type/kecamatan", {
            params:{
                per_page:"",
                q:"",
                with_desa:1,
                with_posyandu:1
            }
        })
        .then(res=>{
            const kecamatan_form=res.data.data.map(kec=>{
                const {desa, ...kecamatan}=kec

                const posyandu=desa.reduce((r, node)=>r.concat(node.posyandu), [])

                return Object.assign({}, kecamatan, {
                    posyandu:posyandu
                })
            })

            this.setState({
                kecamatan_form:kecamatan_form
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
    getsSkrining=(reset=false)=>{
        const {skrining}=this.state

        this.setLoading(true)
        api(access_token()).get("/skrining_balita", {
            params:{
                page:reset?1:skrining.page,
                per_page:skrining.per_page,
                q:skrining.q,
                posyandu_id:skrining.posyandu_id
            }
        })
        .then(res=>{
            this.setState({
                skrining:update(this.state.skrining, {
                    data:{$set:res.data.data},
                    last_page:{$set:res.data.last_page},
                    page:{$set:res.data.current_page},
                    is_loading:{$set:false}
                })
            })
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
            this.setLoading(false)
        })
    }
    getPenduduk=async(penduduk_id)=>{
        return await api(access_token()).post("/auth/request_stunting_madiunkab", {
            endpoint:"/view-penduduk",
            methods:"POST",
            params:{
                query:"nik",
                data:penduduk_id
            }
        }).then(res=>res.data)
    }
    getKK=async(kk_id)=>{
        return await api(access_token()).post("/auth/request_stunting_madiunkab", {
            endpoint:"/view-penduduk",
            methods:"POST",
            params:{
                query:"kk",
                data:kk_id
            }
        }).then(res=>res.data)
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
            skrining:update(this.state.skrining, {
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
                        this.getsSkrining(true)
                    }, 500);
                break
                default:
                    this.getsSkrining(true)
            }
        })
    }
    setLoading=loading=>{
        this.setState({
            skrining:update(this.state.skrining, {
                is_loading:{$set:loading}
            })
        })
    }
    timeout=0

    //helpers
    jenkel=val=>{
        if(val=="L"){
            return "Laki Laki"
        }
        else if(val=="P"){
            return "Perempuan"
        }
    }
    jenkelReverse=val=>{
        if(val=="Laki Laki"){
            return "L"
        }
        else if(val=="Perempuan"){
            return "P"
        }
    }
    getBulan=bln=>{
        if(bln>60){
            return "60+ Bulan"
        }
        else{
            return bln+" Bulan"
        }
    }
    generateColumnPenduduk=(data, with_ayah_ibu=true)=>{
        let data_penduduk={
            id_penduduk:data.id_penduduk,
            nik:data.nik,
            no_kk:data.kartu_keluarga!==null?data.kartu_keluarga.no_kk:"",
            nama_lengkap:data.nama_lengkap,
            tempat_lahir:data.tempat_lahir,
            tgl_lahir:data.tgl_lahir,
            jenis_kelamin:data.jenis_kelamin,
            provinsi:data.provinsi.region,
            kabupaten_kota:data.kabupaten_kota.region,
            kecamatan:data.kecamatan.region,
            desa:data.desa.region,
            alamat_detail:data.alamat_detail
        }

        if(with_ayah_ibu){
            data_penduduk=Object.assign({}, data_penduduk, {
                ibu:data.ibu!==null?{
                    id_penduduk:data.ibu.id_penduduk,
                    nik:data.ibu.nik,
                    nama_lengkap:data.ibu.nama_lengkap
                }:"",
                ayah:data.ayah!==null?{
                    id_penduduk:data.ayah.id_penduduk,
                    nik:data.ayah.nik,
                    nama_lengkap:data.ayah.nama_lengkap
                }:""
            })
        }

        return data_penduduk
    }

    //tambah
    toggleTambah=()=>{
        this.setState({
            tambah_skrining:{
                is_open:!this.state.tambah_skrining.is_open,
                kecamatan_form:this.state.kecamatan_form,
                skrining:{
                    id_user:this.state.skrining.posyandu_id,
                    nik_anak:"",
                    data_anak:{},
                    berat_badan_lahir:"",
                    tinggi_badan_lahir:"",
                    berat_badan:"",
                    tinggi_badan:""
                },
                search_data:{
                    nik_anak:{},
                    old_data:{}
                }
            }
        })
    }
    getsSkriningNIK=async(nik)=>{
        return await api(access_token()).get(`/skrining_balita/${nik}?type=nik`).then(res=>res.data.data)
    }
    addSkrining=async (values, actions)=>{
        //params
        //const data_anak=this.generateColumnPenduduk(values.data_anak)

        //insert to database
        await api(access_token()).post("/skrining_balita", {
            id_user:values.id_user,
            data_anak:values.data_anak,
            berat_badan_lahir:values.berat_badan_lahir,
            tinggi_badan_lahir:values.tinggi_badan_lahir,
            berat_badan:values.berat_badan,
            tinggi_badan:values.tinggi_badan
        })
        .then(res=>{
            this.toggleTambah()
            this.getsSkrining(true)
            toast.success("Berhasil menambahkan data skrining!")
            Router.push("/frontpage/skrining_balita")
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
    tambahSkriningSchema=()=>{
        return yup.object().shape({
            nik_anak:yup.string().required(),
            berat_badan_lahir:yup.number().required(),
            tinggi_badan_lahir:yup.number().required(),
            berat_badan:yup.number().required(),
            tinggi_badan:yup.number().required(),
            data_anak:yup.object().shape({
                ibu:yup.mixed().optional(),
                ayah:yup.mixed().optional()
            })
        })
    }

    //detail kk
    showDetailKK=async no_kk=>{
        const kk=await this.getKK(no_kk).catch(err=>false)
        
        if(kk!==false&&kk.data.length>0){
            this.setState({
                detail_kk:{
                    is_open:true,
                    data:kk.data
                }
            })
        }
        else{
            toast.error(`No. KK tidak ditemukan!`, {position:"bottom-center"})
        }
    }
    hideDetailKK=()=>{
        this.setState({
            detail_kk:update(this.state.detail_kk, {
                is_open:{$set:false}
            })
        })

        setTimeout(() => {
            this.setState({
                detail_kk:{
                    is_open:false,
                    data:[]
                }
            })
        }, 200);
    }

    render(){
        const {
            import_skrining,
            download_template,
            kecamatan_form, 
            login_data, 
            skrining,
            tambah_skrining,
            detail_kk
        }=this.state

        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Skrining Balita</h4>
                        </div>
                        <div class="d-flex align-items-center flex-wrap text-nowrap">
                            <button 
                                type="button" 
                                class="btn btn-primary btn-icon-text mb-2 mb-md-0"
                                onClick={this.toggleTambah}
                            >
                                <FiPlus className="btn-icon-prepend"/>
                                Cek Antropometri
                            </button>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div class="card">
                                <div class="card-body">
                                    <div className="d-flex mb-3 mt-3">
                                        {login_data.role!="posyandu"&&
                                            <div style={{width:"200px"}} className="me-2">
                                                <select 
                                                    name="posyandu_id" 
                                                    value={skrining.posyandu_id} 
                                                    className="form-select" 
                                                    onChange={this.typeFilter}
                                                >
                                                    <option value="">-- Pilih Posyandu</option>
                                                    {kecamatan_form.map(kec=>(
                                                        <optgroup label={kec.region} key={kec}>
                                                            {kec.posyandu.map(pos=>(
                                                                <option value={pos.id_user} key={pos}>{pos.nama_lengkap}</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            </div>
                                        }
                                        <div style={{width:"200px"}} className="me-2">
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="q"
                                                onChange={this.typeFilter}
                                                value={skrining.q}
                                                placeholder="Cari ..."
                                            />
                                        </div>
                                    </div>
                                    <div className="table-responsive">
                                        <table className="table table-hover table-custom table-nowrap mb-0 rounded">
                                            <thead className="thead-light">
                                                <tr className="text-uppercase">
                                                    <th className="px-3" width="50">#</th>
                                                    <th className="px-3">NIK</th>
                                                    <th className="px-3">No. KK</th>
                                                    <th className="px-3">Nama</th>
                                                    <th className="px-3">Jenis Kelamin</th>
                                                    <th className="px-3">Tgl Lahir</th>
                                                    <th className="px-3">BB Lahir</th>
                                                    <th className="px-3">TB Lahir</th>
                                                    <th className="px-3">Orang Tua</th>
                                                    <th className="px-3">Prov</th>
                                                    <th className="px-3">Kab/Kota</th>
                                                    <th className="px-3">Kec</th>
                                                    <th className="px-3">Desa/Kel</th>
                                                    <th className="px-3">Posyandu</th>
                                                    <th className="px-3">Alamat</th>
                                                    <th className="px-3">Usia Saat Ukur</th>
                                                    <th className="px-3">Tanggal</th>
                                                    <th className="px-3">Berat Badan </th>
                                                    <th className="px-3">Tinggi Badan</th>
                                                    <th className="px-3">TB/U</th>
                                                    <th className="px-3">BB/U</th>
                                                    <th className="px-3">BB/TB</th>
                                                    <th className="px-3" width="90"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="border-top-0">
                                                {!skrining.is_loading?
                                                    <>
                                                        {skrining.data.map((list, idx)=>(
                                                            <tr key={list}>
                                                                    <td className="align-middle px-3">{(idx+1)+((skrining.page-1)*skrining.per_page)}</td>
                                                                    <td className="px-3">{list.data_anak.nik}</td>
                                                                    <td className="px-3">
                                                                        <button 
                                                                            type="button" 
                                                                            className="btn btn-link link-primary p-0"
                                                                            onClick={e=>this.showDetailKK(list.data_anak.no_kk)}
                                                                        >
                                                                            {list.data_anak.no_kk}
                                                                        </button>
                                                                    </td>
                                                                    <td className="px-3">{list.data_anak.nama_lengkap}</td>
                                                                    <td className="px-3">{this.jenkel(list.data_anak.jenis_kelamin)}</td>
                                                                    <td className="px-3">{list.data_anak.tgl_lahir}</td>
                                                                    <td className="px-3">{list.berat_badan_lahir}</td>
                                                                    <td className="px-3">{list.tinggi_badan_lahir}</td>
                                                                    <td className="px-3">
                                                                        {list.data_anak.ibu?.nama_lengkap}, {list.data_anak.ayah?.nama_lengkap}
                                                                    </td>
                                                                    <td className="px-3">JAWA TIMUR</td>
                                                                    <td className="px-3">MADIUN</td>
                                                                    <td className="px-3">{list.user_posyandu.kecamatan}</td>
                                                                    <td className="px-3">{list.user_posyandu.desa}</td>
                                                                    <td className="px-3">{list.user_posyandu.nama_lengkap}</td>
                                                                    <td className="px-3">Desa {list.user_posyandu.desa} - Posy. {list.user_posyandu.nama_lengkap}</td>
                                                                    <td className="px-3">{this.getBulan(list.usia_saat_ukur)}</td>
                                                                    <td className="px-3">{moment(list.created_at).format("YYYY-MM-DD")}</td>
                                                                    <td className="px-3">{list.berat_badan}</td>
                                                                    <td className="px-3">{list.tinggi_badan}</td>
                                                                    <td className="px-3">{list.hasil_tinggi_badan_per_umur.split("_").join(" ")}</td>
                                                                    <td className="px-3">{list.hasil_berat_badan_per_umur.split("_").join(" ")}</td>
                                                                    <td className="px-3">{list.hasil_berat_badan_per_tinggi_badan.split("_").join(" ")}</td>
                                                                    <td className="text-nowrap p-1 px-3">
                                                                    </td>
                                                            </tr>
                                                        ))}
                                                        {skrining.data.length==0&&
                                                            <tr>
                                                                <td colSpan="22" className="text-center">Data tidak ditemukan!</td>
                                                            </tr>
                                                        }
                                                    </>
                                                :
                                                    <tr>
                                                        <td colSpan={22} className="text-center">
                                                            <div className="d-flex align-items-center justify-content-center">
                                                                <Spinner
                                                                    as="span"
                                                                    animation="border"
                                                                    size="sm"
                                                                    role="status"
                                                                    aria-hidden="true"
                                                                    className="me-2"
                                                                />
                                                                Loading...
                                                            </div>
                                                        </td>
                                                    </tr>
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="d-flex align-items-center mt-3">
                                        <div className="d-flex flex-column">
                                            <div>Halaman {skrining.page} dari {skrining.last_page}</div>
                                        </div>
                                        <div className="d-flex align-items-center me-auto ms-3">
                                            <select className="form-select" name="per_page" value={skrining.per_page} onChange={this.setPerPage}>
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
                                                    {"btn-primary":skrining.page>1}
                                                )}
                                                disabled={skrining.page<=1}
                                                onClick={()=>this.goToPage(skrining.page-1)}
                                            >
                                                <FiChevronLeft/>
                                                Prev
                                            </button>
                                            <button 
                                                className={classNames(
                                                    "btn",
                                                    "border-0",
                                                    {"btn-primary":skrining.page<skrining.last_page},
                                                    "ms-2"
                                                )}
                                                disabled={skrining.page>=skrining.last_page}
                                                onClick={()=>this.goToPage(skrining.page+1)}
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
                <Modal show={tambah_skrining.is_open} className="modal-blur" onHide={this.toggleTambah} backdrop="static" size="sm">
                    <Modal.Header closeButton>
                        <h4 className="modal-title">Cek Antropometri</h4>
                    </Modal.Header>
                    <Formik
                        initialValues={tambah_skrining.skrining}
                        onSubmit={this.addSkrining}
                        validationSchema={this.tambahSkriningSchema()}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div className='w-100 d-flex flex-column'>
                                        {login_data.role!="posyandu"&&
                                            <div className="mb-3">
                                                <label className="my-1 me-2 fw-semibold" for="country">Posyandu</label>
                                                <div class="input-group">
                                                    <select 
                                                        name="id_user" 
                                                        value={props.values.id_user} 
                                                        className="form-select" 
                                                        onChange={props.handleChange}
                                                    >
                                                        <option value="">-- Pilih Posyandu</option>
                                                        {kecamatan_form.map(kec=>(
                                                            <optgroup label={kec.region} key={kec}>
                                                                {kec.posyandu.map(pos=>(
                                                                    <option value={pos.id_user} key={pos}>{pos.nama_lengkap}</option>
                                                                ))}
                                                            </optgroup>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        }
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">NIK Anak<span className="text-danger">*</span></label>
                                            <div class="input-group">
                                                <input 
                                                    type="text" 
                                                    className="form-control"
                                                    name="nik_anak"
                                                    onChange={props.handleChange}
                                                    value={props.values.nik_anak}
                                                    disabled={!isUndefined(props.values.data_anak.nik)?true:false}
                                                />
                                                {!isUndefined(props.values.data_anak.nik)?
                                                    <button 
                                                        class="btn btn-danger"
                                                        type="button"
                                                        onClick={e=>{
                                                            this.setState({
                                                                tambah_skrining:update(this.state.tambah_skrining, {
                                                                    search_data:{
                                                                        nik_anak:{$set:{}},
                                                                        old_data:{$set:{}}
                                                                    }
                                                                })
                                                            })
                                                            props.setFieldValue("berat_badan_lahir", "")
                                                            props.setFieldValue("tinggi_badan_lahir", "")
                                                            props.setFieldValue("data_anak", {})
                                                            props.setFieldValue("berat_badan", "")
                                                            props.setFieldValue("tinggi_badan", "")
                                                        }}
                                                    >
                                                        Batal
                                                    </button>
                                                :
                                                    <button 
                                                        class="btn btn-secondary"
                                                        type="button"
                                                        onClick={async e=>{
                                                            const resetForm=new Promise((resolve, reject)=>{
                                                                props.setFieldValue("berat_badan_lahir", "")
                                                                props.setFieldValue("tinggi_badan_lahir", "")
                                                                props.setFieldValue("data_anak", {})
                                                                props.setFieldValue("berat_badan", "")
                                                                props.setFieldValue("tinggi_badan", "")

                                                                resolve(true)
                                                            })

                                                            resetForm.then(async res=>{
                                                                const data=await this.getPenduduk(props.values.nik_anak).catch(err=>false)
                                                                
                                                                if(data!==false&&!isUndefined(data.data.nik)){
                                                                    //data
                                                                    let data_anak={}
                                                                    data_anak={
                                                                        id_penduduk:null,
                                                                        nik:data.data.nik,
                                                                        no_kk:data.data.kk,
                                                                        nama_lengkap:data.data.nama,
                                                                        tempat_lahir:data.data.tempat_lahir,
                                                                        tgl_lahir:data.data.tanggal_lahir,
                                                                        jenis_kelamin:this.jenkelReverse(data.data.jenis_kelamin.nama),
                                                                        provinsi:data.data.provinsi.nama,
                                                                        kabupaten_kota:data.data.kota.nama,
                                                                        kecamatan:data.data.kecamatan.nama,
                                                                        desa:data.data.desa.nama,
                                                                        alamat_detail:{
                                                                            dusun:"",
                                                                            jalan:"",
                                                                            rt:data.data.rt,
                                                                            rw:data.data.rw
                                                                        },
                                                                        ibu:data.data.ibu!==null?{
                                                                            id_penduduk:"",
                                                                            nik:data.data.ibu.nik,
                                                                            nama_lengkap:data.data.ibu.nama
                                                                        }:"",
                                                                        ayah:data.data.ayah!==null?{
                                                                            id_penduduk:"",
                                                                            nik:data.data.ayah.nik,
                                                                            nama_lengkap:data.data.ayah.nama
                                                                        }:""
                                                                    }

                                                                    //data nik
                                                                    const data2=await this.getsSkriningNIK(props.values.nik_anak).catch(err=>false)

                                                                    let old_data={}
                                                                    if(data2!==false){
                                                                        if(!isUndefined(data2.id_skrining_balita)){
                                                                            props.setFieldValue("berat_badan_lahir", data2.berat_badan_lahir)
                                                                            props.setFieldValue("tinggi_badan_lahir", data2.tinggi_badan_lahir)
                                                                            old_data=data2
                                                                        }
                                                                    }
                                                                    props.setFieldValue("data_anak", data_anak)

                                                                    this.setState({
                                                                        tambah_skrining:update(this.state.tambah_skrining, {
                                                                            search_data:{
                                                                                nik_anak:{$set:data_anak},
                                                                                old_data:{$set:old_data}
                                                                            }
                                                                        })
                                                                    })
                                                                }
                                                                else{
                                                                    this.setState({
                                                                        tambah_skrining:update(this.state.tambah_skrining, {
                                                                            search_data:{
                                                                                nik_anak:{$set:{}},
                                                                                old_data:{$set:{}}
                                                                            }
                                                                        })
                                                                    })
                                                                    toast.error(`NIK Anak tidak ditemukan!`, {position:"bottom-center"})
                                                                }
                                                            })
                                                            
                                                        }}
                                                    >
                                                        Gunakan
                                                    </button>
                                                }
                                            </div>
                                            {!isUndefined(tambah_skrining.search_data.nik_anak.id_penduduk)&&
                                                <table className="mt-2">
                                                    <tr>
                                                        <th valign="top" className="fw-semibold" width="150">Nama Lengkap </th>
                                                        <td valign="top" width="15"> : </td>
                                                        <td>{tambah_skrining.search_data.nik_anak.nama_lengkap}</td>
                                                    </tr>
                                                    <tr>
                                                        <th valign="top" className="fw-semibold">NIK</th>
                                                        <td valign="top"> : </td>
                                                        <td>{tambah_skrining.search_data.nik_anak.nik}</td>
                                                    </tr>
                                                    <tr>
                                                        <th valign="top" className="fw-semibold">Nama Ibu</th>
                                                        <td valign="top"> : </td>
                                                        <td>{tambah_skrining.search_data.nik_anak.ibu?.nama_lengkap}</td>
                                                    </tr>
                                                    <tr>
                                                        <th valign="top" className="fw-semibold">NIK Ibu</th>
                                                        <td valign="top"> : </td>
                                                        <td>{tambah_skrining.search_data.nik_anak.ibu?.nik}</td>
                                                    </tr>
                                                    <tr>
                                                        <th valign="top" className="fw-semibold">Alamat </th>
                                                        <td valign="top"> : </td>
                                                        <td>{' '}
                                                            {tambah_skrining.search_data.nik_anak.desa}, {' '}
                                                            {tambah_skrining.search_data.nik_anak.kecamatan}, {' '}
                                                            {tambah_skrining.search_data.nik_anak.kabupaten_kota}
                                                        </td>
                                                    </tr>
                                                </table>
                                            }
                                        </div>
                                        {!isUndefined(props.values.data_anak.nik)&&
                                            <>
                                                {isUndefined(tambah_skrining.search_data.old_data.id_skrining_balita)&&
                                                    <>
                                                        <div className="mb-3">
                                                            <label className="my-1 me-2 fw-semibold" for="country">Berat Badan Lahir<span className="text-danger">*</span></label>
                                                            <NumberFormat
                                                                displayType="input"
                                                                suffix=" Kg"
                                                                value={props.values.berat_badan_lahir}
                                                                onValueChange={values=>{
                                                                    const {value}=values
                                                                    props.setFieldValue("berat_badan_lahir", value)
                                                                }}
                                                                className="form-control"
                                                                placeholder="Kg"
                                                            />
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="my-1 me-2 fw-semibold" for="country">Tinggi Badan Lahir<span className="text-danger">*</span></label>
                                                            <NumberFormat
                                                                displayType="input"
                                                                suffix=" Cm"
                                                                value={props.values.tinggi_badan_lahir}
                                                                onValueChange={values=>{
                                                                    const {value}=values
                                                                    props.setFieldValue("tinggi_badan_lahir", value)
                                                                }}
                                                                className="form-control"
                                                                placeholder="Cm"
                                                            />
                                                            <span className="text-muted">Ukur dalam keadaan telentang!</span>
                                                        </div>
                                                    </>
                                                }
                                                <div className="mb-3">
                                                    <label className="my-1 me-2 fw-semibold" for="country">Berat Badan Saat Timbang<span className="text-danger">*</span></label>
                                                    <NumberFormat
                                                        displayType="input"
                                                        suffix=" Kg"
                                                        value={props.values.berat_badan}
                                                        onValueChange={values=>{
                                                            const {value}=values
                                                            props.setFieldValue("berat_badan", value)
                                                        }}
                                                        className="form-control"
                                                        placeholder="Kg"
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="my-1 me-2 fw-semibold" for="country">Tinggi Badan Saat Timbang<span className="text-danger">*</span></label>
                                                    <NumberFormat
                                                        displayType="input"
                                                        suffix=" Cm"
                                                        value={props.values.tinggi_badan}
                                                        onValueChange={values=>{
                                                            const {value}=values
                                                            props.setFieldValue("tinggi_badan", value)
                                                        }}
                                                        className="form-control"
                                                        placeholder="Cm"
                                                    />
                                                    <span className="text-muted">Umur 24 Bulan ukur dalam keadaan telentang! contoh isian : 45, 45.5, 46</span>
                                                </div>
                                            </>
                                        }
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

                {/* MODAL DETAIL KK */}
                <Modal show={detail_kk.is_open} className="modal-blur" onHide={this.hideDetailKK} backdrop="static" size="lg">
                    <Modal.Header closeButton>
                        <h4 className="modal-title">Detail Kartu Keluarga</h4>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="mb-3">
                            <label className="my-1 me-2 fw-semibold" for="country">Detail/Anggota</label>
                            <div className="table-responsive">
                                <table className="table table-nowrap">
                                    <thead>
                                        <tr>
                                            <th>NIK</th>
                                            <th>Nama Lengkap</th>
                                            <th>Provinsi</th>
                                            <th>Kabupaten/Kota</th>
                                            <th>Kecamatan</th>
                                            <th>Desa</th>
                                            <th>Alamat</th>
                                            <th>Hubungan Dalam Keluarga</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detail_kk.data.map(row=>(
                                            <tr key={row}>
                                                <td className="">{row.nik}</td>
                                                <td className="">{row.nama}</td>
                                                <td className="">{row.provinsi.nama}</td>
                                                <td className="">{row.kota.nama}</td>
                                                <td className="">{row.kecamatan.nama}</td>
                                                <td className="">{row.desa.nama}</td>
                                                <td className="">
                                                    {" "},  RT/RW {row.rt}/{row.rw}, Jalan {""}
                                                </td>
                                                <td className="">{row.hubungan_keluarga.nama}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="mt-3 border-top pt-2">
                        <button 
                            type="button" 
                            class="btn btn-link text-gray me-auto" 
                            onClick={this.hideDetailKK}
                        >
                            Tutup
                        </button>
                    </Modal.Footer>
                </Modal>
            </>
        )
    }
}

export default withRouter(withAuth(Skrining))