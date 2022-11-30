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
import { access_token, ceil_with_enclosure, excelToMomentDate, file_to_workbook, isUndefined, login_data } from "../../../config/config"
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

class Stunting extends React.Component{
    state={
        login_data:{},
        kecamatan_form:[],
        stunting:{
            data:[],
            page:1,
            per_page:10,
            q:"",
            posyandu_id:"",
            last_page:0
        },
        detail_kk:{
            is_open:false,
            data:{}
        }
    }

    componentDidMount=()=>{
        this.setState({
            login_data:login_data()!==null?login_data():{}
        }, ()=>{
            if(this.state.login_data.role=="posyandu"){
                this.setState({
                    stunting:update(this.state.stunting, {
                        posyandu_id:{$set:this.state.login_data.id_user}
                    })
                }, ()=>{
                    this.getsStunting()
                })
            }
            else{
                this.getsStunting()
            }
        })
        
        this.getsKecamatanForm()
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
                Router.push("/")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    getsStunting=(reset=false)=>{
        const {stunting}=this.state

        api(access_token()).get("/stunting", {
            params:{
                page:reset?1:stunting.page,
                per_page:stunting.per_page,
                q:stunting.q,
                posyandu_id:stunting.posyandu_id
            }
        })
        .then(res=>{
            this.setState({
                stunting:update(this.state.stunting, {
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
    getPenduduk=async(penduduk_id)=>{
        const token=await api(access_token()).get("/auth/generate_kependudukan_system_token").then(res=>res.data.data).catch(err=>false)
        
        if(token!==false){
            return await api_kependudukan(token).get(`/penduduk/${penduduk_id}`).then(res=>res.data.data)
        }
        else{
            toast.error(`Get data failed!`, {position:"bottom-center"})
        }
    }
    getKK=async(kk_id)=>{
        const token=await api(access_token()).get("/auth/generate_kependudukan_system_token").then(res=>res.data.data).catch(err=>false)

        if(token!==false){
            return await api_kependudukan(token).get(`/kartu_keluarga/${kk_id}`).then(res=>res.data.data)
        }
        else{
            toast.error(`Get data failed!`, {position:"bottom-center"})
        }
    }
    goToPage=page=>{
        this.setState({
            stunting:update(this.state.stunting, {
                page:{$set:page}
            })
        }, ()=>{
            this.getsStunting()
        })
    }
    setPerPage=e=>{
        const target=e.target

        this.setState({
            stunting:update(this.state.stunting, {
                per_page:{$set:target.value}
            })
        }, ()=>{
            this.getsStunting(true)
        })
    }
    typeFilter=e=>{ 
        const {target}=e

        this.setState({
            stunting:update(this.state.stunting, {
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
                        this.getsStunting(true)
                    }, 500);
                break
                default:
                    this.getsStunting(true)
            }
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
    getBulan=bln=>{
        if(bln>60){
            return "60+ Bulan"
        }
        else{
            return bln+" Bulan"
        }
    }

    //detail kk
    showDetailKK=async no_kk=>{
        const kk=await this.getKK(no_kk).catch(err=>false)

        if(kk!==false){
            this.setState({
                detail_kk:{
                    is_open:true,
                    data:kk
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
                    data:{}
                }
            })
        }, 200);
    }

    render(){
        const {
            kecamatan_form, 
            login_data, 
            stunting,
            detail_kk
        }=this.state

        return (
            <>
                <Layout>
                    <div class="page-header d-print-none">
                        <div class="container-xl">
                            <div class="row g-2 align-items-center">
                                <div class="col">
                                    <div class="page-pretitle">Overview</div>
                                    <h2 class="page-title">Balita Stunting</h2>
                                </div>
                                <div class="col-12 col-md-auto ms-auto d-print-none">
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
                                            {login_data.role!="posyandu"&&
                                                <div style={{width:"200px"}} className="me-2">
                                                    <select 
                                                        name="posyandu_id" 
                                                        value={stunting.posyandu_id} 
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
                                                    value={stunting.q}
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
                                                            {stunting.data.map((list, idx)=>(
                                                                <tr key={list}>
                                                                        <td className="align-middle px-3">{(idx+1)+((stunting.page-1)*stunting.per_page)}</td>
                                                                        <td className="px-3">{list.data_anak.nik}</td>
                                                                        <td className="px-3">
                                                                            {list.data_anak?.no_kk.trim()!=""&&
                                                                                <button 
                                                                                    type="button" 
                                                                                    className="btn btn-link link-primary p-0"
                                                                                    onClick={e=>this.showDetailKK(list.data_anak.no_kk)}
                                                                                >
                                                                                    {list.data_anak.no_kk}
                                                                                </button>
                                                                            }
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
                                                            {stunting.data.length==0&&
                                                                <tr>
                                                                    <td colSpan="22" className="text-center">Data tidak ditemukan!</td>
                                                                </tr>
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-center mt-3">
                                            <div className="d-flex flex-column">
                                                <div>Halaman {stunting.page} dari {stunting.last_page}</div>
                                            </div>
                                            <div className="d-flex align-items-center me-auto ms-3">
                                                <select className="form-select" name="per_page" value={stunting.per_page} onChange={this.setPerPage}>
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
                                                        {"btn-primary":stunting.page>1}
                                                    )}
                                                    disabled={stunting.page<=1}
                                                    onClick={()=>this.goToPage(stunting.page-1)}
                                                >
                                                    <TbChevronLeft/>
                                                    Prev
                                                </button>
                                                <button 
                                                    className={classNames(
                                                        "btn",
                                                        "border-0",
                                                        {"btn-primary":stunting.page<stunting.last_page},
                                                        "ms-2"
                                                    )}
                                                    disabled={stunting.page>=stunting.last_page}
                                                    onClick={()=>this.goToPage(stunting.page+1)}
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

                {/* MODAL DETAIL KK */}
                <Modal show={detail_kk.is_open} className="modal-blur" onHide={this.hideDetailKK} backdrop="static" size="lg">
                    <Modal.Header closeButton>
                        <div className="modal-title h2 fw-bold">Detail Kartu Keluarga</div>
                    </Modal.Header>
                    <Modal.Body>
                        {!isUndefined(detail_kk.data.no_kk)&&
                            <>
                                <table className="mb-3">
                                    <tr>
                                        <th valign="top" width="140">No. KK</th>
                                        <td valign="top" width="15"> : </td>
                                        <td>{detail_kk.data?.no_kk}</td>
                                    </tr>
                                    <tr>
                                        <th valign="top">Provinsi</th>
                                        <td valign="top"> : </td>
                                        <td>{detail_kk.data.provinsi?.region}</td>
                                    </tr>
                                    <tr>
                                        <th valign="top">Kabupaten/Kota</th>
                                        <td valign="top"> : </td>
                                        <td>{detail_kk.data.kabupaten_kota?.region}</td>
                                    </tr>
                                    <tr>
                                        <th valign="top">Kecamatan</th>
                                        <td valign="top"> : </td>
                                        <td>{detail_kk.data.kecamatan?.region}</td>
                                    </tr>
                                    <tr>
                                        <th valign="top">getDesaForm</th>
                                        <td valign="top"> : </td>
                                        <td>{detail_kk.data.desa?.region}</td>
                                    </tr>
                                    <tr>
                                        <th valign="top">Alamat</th>
                                        <td valign="top"> : </td>
                                        <td>{detail_kk.data.alamat_detail?.dusun},  RT/RW {detail_kk.data.alamat_detail?.rt}/{detail_kk.data.alamat_detail?.rw}, Jalan {detail_kk.data.alamat_detail?.jalan}</td>
                                    </tr>
                                </table>
                                <div className="mb-3">
                                    <label className="my-1 me-2 fw-semibold" for="country">Detail/Anggota</label>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>NIK</th>
                                                <th>Nama Lengkap</th>
                                                <th>Hubungan Dalam Keluarga</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detail_kk.data.detail.map(row=>(
                                                <tr key={row}>
                                                    <td className="py-1">{row.nik}</td>
                                                    <td className="py-1">{row.penduduk.nama_lengkap}</td>
                                                    <td className="py-1">{row.status_hubungan_keluarga}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        }
                        
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

export default withRouter(withAuth(Stunting))