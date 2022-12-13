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
import {ConfirmDelete} from "../../../component/ui/confirm"
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

class RealisasiAnggaran extends React.Component{
    state={
        login_data:{},
        realisasi_anggaran:{
            data:[],
            page:1,
            per_page:10,
            q:"",
            jenis:"",
            tahun:"",
            last_page:0
        }
    }

    componentDidMount=()=>{
        this.setState({
            login_data:login_data()!==null?login_data():{}
        }, ()=>{
            this.getsRealisasiAnggaran()
        })
    }
    getsRealisasiAnggaran=async(reset=false)=>{
        const {realisasi_anggaran}=this.state

        await api(access_token()).get("/stunting_4118/realisasi_anggaran_dinas", {
            params:{
                page:reset?1:realisasi_anggaran.page,
                per_page:realisasi_anggaran.per_page,
                q:realisasi_anggaran.q,
                tahun:realisasi_anggaran.tahun
            }
        })
        .then(res=>{
            this.setState({
                realisasi_anggaran:update(this.state.realisasi_anggaran, {
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
            realisasi_anggaran:update(this.state.realisasi_anggaran, {
                page:{$set:page}
            })
        }, ()=>{
            this.getsRealisasiAnggaran()
        })
    }
    setPerPage=e=>{
        const target=e.target

        this.setState({
            realisasi_anggaran:update(this.state.realisasi_anggaran, {
                per_page:{$set:target.value}
            })
        }, ()=>{
            this.getsRealisasiAnggaran(true)
        })
    }
    typeFilter=e=>{ 
        const {target}=e

        this.setState({
            realisasi_anggaran:update(this.state.realisasi_anggaran, {
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
                        this.getsRealisasiAnggaran()
                    }, 500);
                break
                case "tahun":
                    this.getsRealisasiAnggaran(true)
                break;
            }
        })
    }
    timeout=0

    //helpers
    listTahun=()=>{
        const year=(new Date()).getFullYear()

        let years=[]
        years=years.concat([{value:"", label:"Semua Tahun"}])
        for(var i=year-5; i<=year+5; i++){
            years=years.concat([{value:i, label:i}])
        }

        return years
    }
    findTahun=(value)=>{
        if(value=="") return {value:"", label:"Semua Tahun"}
        return {label:value, value:value}
    }
    listJenis=()=>{
        return [
            {value:"", label:"Semua Jenis"},
            {value:"bantuan", label:"Bantuan"},
            {value:"koordinasi", label:"Koordinasi"}
        ]
    }
    findJenis=(value)=>{
        return this.listJenis().find(f=>f.value==value)
    }
    valueTotalRencanaAnggaran=(data)=>{
        const {realisasi_anggaran}=this.state

        switch(realisasi_anggaran.jenis){
            case "bantuan":
                return data.total_rencana_bantuan
            break
            case "koordinasi":
                return data.total_rencana_kegiatan
            break
            default:
                return Number(data.total_rencana_bantuan)+Number(data.total_rencana_kegiatan)
        }
    }
    valueTotalRealisasiAnggaran=(data)=>{
        const {realisasi_anggaran}=this.state

        switch(realisasi_anggaran.jenis){
            case "bantuan":
                return data.total_realisasi_bantuan
            break
            case "koordinasi":
                return data.total_realisasi_kegiatan
            break
            default:
                return Number(data.total_realisasi_bantuan)+Number(data.total_realisasi_kegiatan)
        }
    }

    render(){
        const {
            login_data,
            realisasi_anggaran
        }=this.state

        return (
            <>
                <Layout>
                    <div class="page-header d-print-none">
                        <div class="container-xl">
                            <div class="row g-2 align-items-center">
                                <div class="col">
                                    <div class="page-pretitle">Intervensi</div>
                                    <h2 class="page-title">Realisasi Anggaran Dinas</h2>
                                </div>
                                <div class="col-12 col-md-auto ms-auto d-print-none">
                                    <div class="btn-list">
                                        
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
                                            <div style={{width:"200px"}} className="me-2">
                                                <CreatableSelect
                                                    options={this.listTahun()}
                                                    onChange={e=>{
                                                        this.typeFilter({target:{name:"tahun", value:e.value}})
                                                    }}
                                                    value={this.findTahun(realisasi_anggaran.tahun)}
                                                    placeholder="Semua Tahun"
                                                />
                                            </div>
                                            <div style={{width:"200px"}} className="me-2">
                                                <Select
                                                    options={this.listJenis()}
                                                    onChange={e=>{
                                                        this.setState({
                                                            realisasi_anggaran:update(this.state.realisasi_anggaran, {
                                                                jenis:{$set:e.value}
                                                            })
                                                        })
                                                    }}
                                                    value={this.findJenis(realisasi_anggaran.jenis)}
                                                    placeholder="Semua Jenis"
                                                />
                                            </div>
                                            <div style={{width:"200px"}} className="me-2">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="q"
                                                    onChange={this.typeFilter}
                                                    value={realisasi_anggaran.q}
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
                                                                <th className="px-3">Dinas</th>
                                                                <th className="px-3">Total Rencana Anggaran(Rp)</th>
                                                                <th className="px-3">Total Realisasi Anggaran(Rp)</th>
                                                                <th className="px-3">Serapan(%)</th>
                                                                <th className="px-3" width="90"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="border-top-0">
                                                            {realisasi_anggaran.data.map((list, idx)=>(
                                                                <tr key={list}>
                                                                        <td className="align-middle px-3">{(idx+1)+((realisasi_anggaran.page-1)*realisasi_anggaran.per_page)}</td>
                                                                        <td className="px-3">{list.nama_lengkap}</td>
                                                                        <td className="px-3">
                                                                            <NumberFormat
                                                                                value={this.valueTotalRencanaAnggaran(list)}
                                                                                displayType="text"
                                                                                thousandSeparator={true}
                                                                            />
                                                                        </td>
                                                                        <td className="px-3">
                                                                            <NumberFormat
                                                                                value={this.valueTotalRealisasiAnggaran(list)}
                                                                                displayType="text"
                                                                                thousandSeparator={true}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <NumberFormat
                                                                                value={(this.valueTotalRealisasiAnggaran(list)/(this.valueTotalRencanaAnggaran(list)>0?this.valueTotalRencanaAnggaran(list):1))*100}
                                                                                displayType="text"
                                                                                thousandSeparator={true}
                                                                                decimalScale={2}
                                                                            />
                                                                        </td>
                                                                        <td></td>
                                                                </tr>
                                                            ))}
                                                            {realisasi_anggaran.data.length==0&&
                                                                <tr>
                                                                    <td colSpan="6" className="text-center">Data tidak ditemukan!</td>
                                                                </tr>
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-center mt-3">
                                            <div className="d-flex flex-column">
                                                <div>Halaman {realisasi_anggaran.page} dari {realisasi_anggaran.last_page}</div>
                                            </div>
                                            <div className="d-flex align-items-center me-auto ms-3">
                                                <select className="form-select" name="per_page" value={realisasi_anggaran.per_page} onChange={this.setPerPage}>
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
                                                        {"btn-primary":realisasi_anggaran.page>1}
                                                    )}
                                                    disabled={realisasi_anggaran.page<=1}
                                                    onClick={()=>this.goToPage(realisasi_anggaran.page-1)}
                                                >
                                                    <TbChevronLeft/>
                                                    Prev
                                                </button>
                                                <button 
                                                    className={classNames(
                                                        "btn",
                                                        "border-0",
                                                        {"btn-primary":realisasi_anggaran.page<realisasi_anggaran.last_page},
                                                        "ms-2"
                                                    )}
                                                    disabled={realisasi_anggaran.page>=realisasi_anggaran.last_page}
                                                    onClick={()=>this.goToPage(realisasi_anggaran.page+1)}
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
            </>
        )
    }
}

export default withRouter(withAuth(RealisasiAnggaran))