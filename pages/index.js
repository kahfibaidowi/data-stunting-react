import { Formik } from "formik"
import update from "immutability-helper"
import dynamic from "next/dynamic"
import React from "react"
import Router from "next/router"
import {toast} from "react-toastify"
import { api } from "../config/api"
import { BASE_URL, login_data } from "../config/config"
import {BsArrowRight} from "react-icons/bs"
import * as yup from "yup"
import { Carousel, Navbar, Spinner } from "react-bootstrap"
import { TbLogin } from "react-icons/tb"
import Link from "next/link"
import NumberFormat from "react-number-format"
import CreatableSelect from "react-select/creatable"
import classNames from "classnames"
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"

const Map=dynamic(()=>import("../component/modules/map"), {ssr:false})
const Chart=dynamic(()=>import("react-apexcharts"), {ssr:false})

class Homepage extends React.Component{
    state={
        last_year_form:[
            {value:5, label:"5 tahun terakhir"},
            {value:10, label:"10 tahun terakhir"},
            {value:15, label:"15 tahun terakhir"},
            {value:20, label:"20 tahun terakhir"}
        ],
        pemetaan:{
            type:"kecamatan",
            district_id:"",
            data:[],
            center:{latitude:0,longitude:0,zoom:0}
        },
        bar_chart:{
            type:"kecamatan",
            district_id:"",
            options:{
                chart:{
                    id:"graph-stunting"
                },
                xaxis:{
                    categories:[]
                },
                tooltip: {
                    theme: 'dark'
                },
                colors:[
                    function ({value, seriesIndex, dataPointIndex, w}){
                        if(value<=49) {
                            return "#34eb83"
                        }
                        else if(value<=100){
                            return "#d3eb34"
                        }
                        else if(value<=200){
                            return "#ebab34"
                        }
                        else{
                            return "#eb3434"
                        }
                    }
                ]
            },
            series:[]
        },
        bar_chart_realisasi_bantuan:{
            tahun:"",
            options:{
                chart:{
                    id:"graph-realisasi-bantuan"
                },
                xaxis:{
                    categories:[]
                },
                tooltip: {
                    theme: 'dark'
                },
                colors:[
                    function ({value, seriesIndex, dataPointIndex, w}){
                        return "#34eb83"
                    }
                ]
            },
            series:[]
        }
    }

    componentDidMount=()=>{
        // this.getsPemetaan()
        // this.getsBarChart()
        // this.getsBarChartRealisasiBantuan()
    }
    getsPemetaan=async ()=>{
        const {pemetaan}=this.state

        await api().get("/home/stunting_4118/summary_kecamatan")
        .then(res=>{
            const geo_features=res.data.data.map(data=>{
                return {
                    type:"Feature",
                    properties:{
                        region:data.region,
                        type:data.type,
                        count_stunting:data.count_stunting
                    },
                    geometry:Object.keys(data.data.geo_json).length>0?data.data.geo_json:{type:"MultiPolygon", coordinates:[]}
                }
            })
            const geo_json={
                type:"FeatureCollection",
                name:"pemetaan",
                features:geo_features
            }
            this.setState({
                pemetaan:update(this.state.pemetaan, {
                    data:{$set:geo_json},
                    center:{$set:res.data.center}
                })
            })
        })
        .catch(err=>{
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    getsBarChart=async ()=>{
        const {bar_chart}=this.state

        await api().get("/home/stunting_4118/summary_kecamatan")
        .then(res=>{
            const xaxis=res.data.data.map(d=>d.region)
            const series1=res.data.data.map(d=>d.count_stunting)

            this.setState({
                bar_chart:update(this.state.bar_chart, {
                    options:{$set:{
                        chart:{
                            id:"graph-stunting"
                        },
                        tooltip: {
                            theme: 'dark'
                        },
                        xaxis:{
                            categories:xaxis
                        }
                    }},
                    series:{$set:[{
                        name:"stunting",
                        data:series1
                    }]}
                })
            })
        })
        .catch(err=>{
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    getsBarChartRealisasiBantuan=async ()=>{
        const {bar_chart_realisasi_bantuan}=this.state

        await api().get("home/stunting_4118/summary_realisasi_bantuan_per_dinas", {
            params:{
                tahun:bar_chart_realisasi_bantuan.tahun
            }
        })
        .then(res=>{
            const xaxis=res.data.data.map(d=>d.nama_lengkap)
            const series1=res.data.data.map(d=>d.total_realisasi_bantuan)

            this.setState({
                bar_chart_realisasi_bantuan:update(this.state.bar_chart_realisasi_bantuan, {
                    options:{$set:{
                        chart:{
                            id:"graph-realisasi-bantuan"
                        },
                        tooltip: {
                            theme: 'dark'
                        },
                        yaxis:{
                            labels:{
                                formatter:function(value){
                                    return value.toLocaleString("en-US")
                                }
                            }
                        },
                        xaxis:{
                            categories:xaxis
                        }
                    }},
                    series:{$set:[{
                        name:"Realisasi Bantuan",
                        data:series1
                    }]}
                })
            })
        })
        .catch(err=>{
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }

    //skrining data masuk


    //type
    typeFilterBarChartRealisasiBantuan=e=>{
        const target=e.target

        this.setState({
            bar_chart_realisasi_bantuan:update(this.state.bar_chart_realisasi_bantuan, {
                [target.name]:{$set:target.value}
            })
        }, ()=>{
            this.getsBarChartRealisasiBantuan()
        })
    }

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
    
    render(){
        const {pemetaan, bar_chart, bar_chart_realisasi_bantuan, last_year_form}=this.state

        return  (
            <>
                <nav 
                    className="navbar navbar-expand-lg"
                    style={{
                        left:0,
                        top:0,
                        width:"100%",
                        zIndex:99999999
                    }}
                >
                    <div className="container">
                        <Link href="" className="navbar-brand">
                            <img src="/logo.png" alt="Stunting" className="navbar-brand-image"/>
                        </Link>
                        <Link href="/login" className="btn btn-primary btn-pill">
                            Login Admin
                        </Link>
                    </div>
                </nav>
                <div className="d-flex" style={{marginTop:"70px"}}>
                    <div className="container">
                        {/* <div className="row">
                            <div className="col-12 mt-4">
                                <Carousel fade>
                                    <Carousel.Item>
                                        <img src="/carousel-1.png" className="d-block w-100  rounded-4" alt="Carousel 1"/>
                                    </Carousel.Item>
                                </Carousel>
                            </div>
                        </div> */}
                        {/* <div className="row">
                            <div className="col-12 mt-4">
                                <div className="card w-100 rounded-4 overflow-hidden">
                                    <div className="card-body p-3 border-top-0">
                                        <h3 className="card-title fw-semibold mb-4">Pemetaan Timbang 4118</h3>
                                        <Map data={pemetaan.data} center={pemetaan.center} className="map-responsive-full"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row mb-4">
                            <div className="col-md-6 mt-4">
                                <div className="card w-100 rounded-4 overflow-hidden">
                                    <div className="card-body p-3 border-top-0">
                                        <h3 className="card-title fw-semibold mb-4">Grafik Anak Penderita Stunting</h3>
                                        <Chart
                                            options={bar_chart.options}
                                            series={bar_chart.series}
                                            type="bar"
                                            width="100%"
                                            height="395px"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6 mt-4">
                                <div className="card w-100 rounded-4 overflow-hidden">
                                    <div className="card-body p-3 border-top-0">
                                        <h3 className="card-title fw-semibold mb-4">Realisasi Bantuan Dalam Tahun</h3>
                                        <div className="d-flex mb-3 mt-3">
                                            <div style={{width:"200px"}} className="me-2">
                                                <CreatableSelect
                                                    options={this.listTahun()}
                                                    onChange={e=>{
                                                        this.typeFilterBarChartRealisasiBantuan({target:{name:"tahun", value:e.value}})
                                                    }}
                                                    value={this.findTahun(bar_chart_realisasi_bantuan.tahun)}
                                                    placeholder="Pilih Tahun"
                                                />
                                            </div>
                                        </div>
                                        <Chart
                                            options={bar_chart_realisasi_bantuan.options}
                                            series={bar_chart_realisasi_bantuan.series}
                                            type="bar"
                                            width="100%"
                                            height="325px"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div> */}
                        <div className="row mt-5 mb-3">
                            <ControlBox/>
                        </div>
                        <div className="row mb-3">
                            <div className="col-12">
                                <SkriningDataMasuk/>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

class SkriningDataMasuk extends React.Component{
    state={
        skrining_data_masuk:{
            data:[],
            per_page:10,
            page:1,
            q:"",
            last_page:0,
            is_loading:false
        }
    }

    componentDidMount=async()=>{
        this.getsDataMasuk()
    }

    getsDataMasuk=async(reset=false)=>{
        const {skrining_data_masuk}=this.state

        this.setLoading(true)
        await api().get("/home/skrining_balita/data_masuk", {
            params:{
                page:reset?1:skrining_data_masuk.page,
                per_page:skrining_data_masuk.per_page,
                q:skrining_data_masuk.q
            }
        })
        .then(res=>{
            this.setState({
                skrining_data_masuk:update(this.state.skrining_data_masuk, {
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
    goToPage=page=>{
        this.setState({
            skrining_data_masuk:update(this.state.skrining_data_masuk, {
                page:{$set:page}
            })
        }, ()=>{
            this.getsDataMasuk()
        })
    }
    setPerPage=e=>{
        const target=e.target
    
        this.setState({
            skrining_data_masuk:update(this.state.skrining_data_masuk, {
                per_page:{$set:target.value}
            })
        }, ()=>{
            this.getsDataMasuk(true)
        })
    }
    typeFilter=e=>{ 
        const {target}=e
    
        this.setState({
            skrining_data_masuk:update(this.state.skrining_data_masuk, {
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
                        this.getsDataMasuk(true)
                    }, 500);
                break
                default:
                    this.getsDataMasuk(true)
            }
        })
    }
    setLoading=loading=>{
        this.setState({
            skrining_data_masuk:update(this.state.skrining_data_masuk, {
                is_loading:{$set:loading},
                data:{$set:[]}
            })
        })
    }
    timeout=0


    render(){
        const {skrining_data_masuk}=this.state

        return (
            <div className="card">

                <div className="card-body">
                    <h3 className="card-title fw-semibold mb-4">Quick Count Bulan Timbang Serentak</h3>
                    <div className="d-flex mb-3 mt-3">
                        <div style={{width:"200px"}} className="me-2">
                            <input
                                type="text"
                                className="form-control"
                                name="q"
                                onChange={this.typeFilter}
                                value={skrining_data_masuk.q}
                                placeholder="Cari ..."
                            />
                        </div>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover table-custom table-wrap mb-0 rounded">
                            <thead className="thead-light">
                                <tr>
                                    <th className="border-0 rounded-start" width="50">#</th>
                                    <th className="border-0">Kecamatan</th>
                                    <th className="border-0">Desa</th>
                                    <th className="border-0">Posyandu</th>
                                    <th className="border-0" width="150">Data Masuk</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!skrining_data_masuk.is_loading?
                                    <>
                                        {skrining_data_masuk.data.map((list, idx)=>(
                                            <tr key={list}>
                                                    <td className="align-middle">{(idx+1)+((skrining_data_masuk.page-1)*skrining_data_masuk.per_page)}</td>
                                                    <td className="py-1 align-middle">{list.kecamatan}</td>
                                                    <td>{list.desa}</td>
                                                    <td>{list.nama_lengkap}</td>
                                                    <td>{list.count_balita}</td>
                                            </tr>
                                        ))}
                                        {skrining_data_masuk.data.length==0&&
                                            <tr>
                                                <td colSpan={5} className="text-center">Data tidak ditemukan!</td>
                                            </tr>
                                        }
                                    </>
                                :
                                    <>
                                        <tr>
                                            <td colSpan={5} className="text-center">
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
                                    </>
                                }
                                
                            </tbody>
                        </table>
                    </div>
                    <div className="d-flex align-items-center mt-3">
                        <div className="d-flex flex-column">
                            <div>Halaman {skrining_data_masuk.page} dari {skrining_data_masuk.last_page}</div>
                        </div>
                        <div className="d-flex align-items-center me-auto ms-3">
                            <select className="form-select" name="per_page" value={skrining_data_masuk.per_page} onChange={this.setPerPage}>
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
                                    {"btn-primary":skrining_data_masuk.page>1}
                                )}
                                disabled={skrining_data_masuk.page<=1}
                                onClick={()=>this.goToPage(skrining_data_masuk.page-1)}
                            >
                                <FiChevronLeft/>
                                Prev
                            </button>
                            <button 
                                className={classNames(
                                    "btn",
                                    "border-0",
                                    {"btn-primary":skrining_data_masuk.page<skrining_data_masuk.last_page},
                                    "ms-2"
                                )}
                                disabled={skrining_data_masuk.page>=skrining_data_masuk.last_page}
                                onClick={()=>this.goToPage(skrining_data_masuk.page+1)}
                            >
                                Next
                                <FiChevronRight/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class ControlBox extends React.Component{
    state={
        summary:{
            total_posyandu:0,
            total_skrining:0,
            total_balita:0,
            total_user_online:0
        }
    }

    componentDidMount=()=>{
        this.getSummary()
    }
    getSummary=async(reset=false)=>{
        await api().get("/home/summary_posyandu")
        .then(res=>{
            this.setState({
                summary:res.data
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


    render(){
        const {summary}=this.state

        return (
            <>
                <div className="col-md-3 grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-baseline">
                                <h6 className="card-title mb-1">Total Posyandu</h6>
                            </div>
                            <div className="row">
                                <div className="col-6 col-md-12 col-xl-5">
                                    <h3 className="mb-1" style={{fontWeight:"700"}}>
                                        <NumberFormat
                                            displayType="text"
                                            thousandSeparator
                                            value={summary.total_posyandu}
                                        />
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-baseline">
                                <h6 className="card-title mb-1">Total Data Timbangan</h6>
                            </div>
                            <div className="row">
                                <div className="col-6 col-md-12 col-xl-5">
                                    <h3 className="mb-1" style={{fontWeight:"700"}}>
                                        <NumberFormat
                                            displayType="text"
                                            thousandSeparator
                                            value={summary.total_skrining}
                                        />
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-baseline">
                                <h6 className="card-title mb-1">Jumlah Balita Ditimbang</h6>
                            </div>
                            <div className="row">
                                <div className="col-6 col-md-12 col-xl-5">
                                    <h3 className="mb-1" style={{fontWeight:"700"}}>
                                        <NumberFormat
                                            displayType="text"
                                            thousandSeparator
                                            value={summary.total_balita}
                                        />
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 grid-margin stretch-card">
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-baseline">
                                <h6 className="card-title mb-1">Jumlah User Online</h6>
                            </div>
                            <div className="row">
                                <div className="col-6 col-md-12 col-xl-5">
                                    <h3 className="mb-1" style={{fontWeight:"700"}}>
                                        <NumberFormat
                                            displayType="text"
                                            thousandSeparator
                                            value={summary.total_user_online}
                                        />
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

export default Homepage