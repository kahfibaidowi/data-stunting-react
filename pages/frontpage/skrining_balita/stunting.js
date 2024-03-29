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
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"

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
            last_page:0,
            is_loading:false
        },
        detail_kk:{
            is_open:false,
            data:[]
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
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    getsStunting=(reset=false)=>{
        const {stunting}=this.state

        this.setLoading(true)
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
    setLoading=loading=>{
        this.setState({
            stunting:update(this.state.stunting, {
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
    getBulan=bln=>{
        if(bln>60){
            return "60+ Bulan"
        }
        else{
            return bln+" Bulan"
        }
    }
    valueBBU=value=>{
        if(value=="gizi_buruk") return "Berat Badan sangat Kurang";
        if(value=="gizi_kurang") return "Berat badan kurang";
        if(value=="gizi_baik") return "Berat badan normal";
        if(value=="gizi_lebih") return "Risiko Berat badan lebih";
        
        return value
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
            kecamatan_form, 
            login_data, 
            stunting,
            detail_kk
        }=this.state

        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 class="mb-3 mb-md-0">Balita Stunting</h4>
                        </div>
                        <div class="d-flex align-items-center flex-wrap text-nowrap">
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
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
                                                    <th className="px-3">Alamat Balita</th>
                                                    <th className="px-3">Data Status</th>
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
                                                {!stunting.is_loading?
                                                    <>
                                                        {stunting.data.map((list, idx)=>(
                                                            <tr key={list}>
                                                                    <td className="align-middle px-3">{(idx+1)+((stunting.page-1)*stunting.per_page)}</td>
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
                                                                    <td className="px-3">Desa {list.user_posyandu.desa} - Posy. {list.user_posyandu.nama_lengkap}</td>
                                                                    <td className="px-3">
                                                                        {list.data_anak?.provinsi?.nama}, {list.data_anak?.kabupaten_kota?.nama}, {list.data_anak?.kecamatan?.nama}, Desa {list.data_anak?.desa?.nama}, RT/RW {list.data_anak.alamat_detail.rt}/{list.data_anak.alamat_detail.rw}
                                                                    </td>
                                                                    <td className="px-3">{list.data_anak.data_status}</td>
                                                                    <td className="px-3">{this.getBulan(list.usia_saat_ukur)}</td>
                                                                    <td className="px-3">{moment(list.created_at).format("YYYY-MM-DD")}</td>
                                                                    <td className="px-3">{list.berat_badan}</td>
                                                                    <td className="px-3">{list.tinggi_badan}</td>
                                                                    <td className="px-3">{list.hasil_tinggi_badan_per_umur.split("_").join(" ")}</td>
                                                                    <td className="px-3">{this.valueBBU(list.hasil_berat_badan_per_umur)}</td>
                                                                    <td className="px-3">{list.hasil_berat_badan_per_tinggi_badan.split("_").join(" ")}</td>
                                                                    <td className="text-nowrap p-1 px-3">
                                                                    </td>
                                                            </tr>
                                                        ))}
                                                        {stunting.data.length==0&&
                                                            <tr>
                                                                <td colSpan="24" className="text-center">Data tidak ditemukan!</td>
                                                            </tr>
                                                        }
                                                    </>
                                                :
                                                    <tr>
                                                        <td colSpan={24} className="text-center">
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
                                                <FiChevronLeft/>
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
                                                <FiChevronRight/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>

                <DetailKK
                    data={detail_kk}
                    hideModal={this.hideDetailKK}
                />
            </>
        )
    }
}

//DETAIL KK
const DetailKK=({data, hideModal})=>{
    
    return (
        <Modal show={data.is_open} className="modal-blur" onHide={hideModal} backdrop="static" size="lg">
            <Modal.Header closeButton>
                <h4 className="modal-title">Detail Kartu Keluarga</h4>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <label className="my-1 me-2 fw-semibold" for="country">Detail/Anggota</label>
                    <div className="table-responsive">
                        <table className="table table-nowrap table-custom">
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
                                {data.data.map(row=>(
                                    <tr key={row}>
                                        <td className="">{row.nik}</td>
                                        <td className="">{row.nama}</td>
                                        <td className="">{row.provinsi?.nama}</td>
                                        <td className="">{row.kota?.nama}</td>
                                        <td className="">{row.kecamatan?.nama}</td>
                                        <td className="">{row.desa?.nama}</td>
                                        <td className="">
                                            {" "},  RT/RW {row.rt}/{row.rw}, Jalan {""}
                                        </td>
                                        <td className="">{row.hubungan_keluarga?.nama}</td>
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
                    onClick={hideModal}
                >
                    Tutup
                </button>
            </Modal.Footer>
        </Modal>
    )
}

export default withRouter(withAuth(Stunting))