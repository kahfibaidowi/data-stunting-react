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
import { Carousel, Navbar } from "react-bootstrap"
import { TbLogin } from "react-icons/tb"
import Link from "next/link"
import NumberFormat from "react-number-format"
import CreatableSelect from "react-select/creatable"

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
        this.getsPemetaan()
        this.getsBarChart()
        this.getsBarChartRealisasiBantuan()
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
                <Navbar as="header" className="navbar navbar-light d-print-none fixed-top" expand="md">
                    <div className="container-xl">
                        <h1 className="navbar-brand navbar-brand-layout-condensed navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
                            <Link href="">
                                <img src="/logo.png" alt="Stunting" className="navbar-brand-image"/>
                            </Link>
                        </h1>
                        <div className="navbar-nav flex-row order-md-last py-2">
                            <Link href="/login" class="btn btn-primary btn-pill">
                                <TbLogin className="icon"/>
                                Login Admin
                            </Link>
                        </div>
                    </div>
                </Navbar>
                <div className="page-wrapper mt-5">
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
                        <div className="row">
                            <div className="col-12 mt-4">
                                <div className="card w-100 rounded-4 overflow-hidden">
                                    <div className="card-header">
                                        <h3 className="card-title fw-semibold">Pemetaan Stunting</h3>
                                    </div>
                                    <div className="card-body p-3 border-top-0">
                                        <Map data={pemetaan.data} center={pemetaan.center} className="map-responsive-full"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row mb-4">
                            <div className="col-md-6 mt-4">
                                <div className="card w-100 rounded-4 overflow-hidden">
                                    <div className="card-header">
                                        <h3 className="card-title fw-semibold">Grafik Anak Penderita Stunting</h3>
                                    </div>
                                    <div className="card-body p-3 border-top-0">
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
                                    <div className="card-header">
                                        <h3 className="card-title fw-semibold">Realisasi Bantuan Dalam Tahun</h3>
                                    </div>
                                    <div className="card-body p-3 border-top-0">
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
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

export default Homepage