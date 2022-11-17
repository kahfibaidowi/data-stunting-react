import React from "react"
import update from "immutability-helper"
import Animated from "../../component/ui/animate"
import withAuth from "../../component/hoc/auth"
import Layout from "../../component/layout"
import Link from "next/link"
import dynamic from "next/dynamic"
import { api } from "../../config/api"
import { access_token, isUndefined } from "../../config/config"
import Router from "next/router"
import { toast } from "react-toastify"

const Map=dynamic(()=>import("../../component/modules/map"), {ssr:false})
const Chart=dynamic(()=>import("react-apexcharts"), {ssr:false})

class Frontpage extends React.Component{
    state={
        kecamatan_form:[],
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
                }
            },
            series:[]
        }
    }

    componentDidMount=()=>{
        this.getsKecamatanForm()
        this.getsPemetaan()
        this.getsBarChart()
    }
    getsPemetaan=async ()=>{
        const {pemetaan}=this.state

        await api(access_token()).get("/stunting", {
            params:{
                per_page:"",
                q:"",
                type:pemetaan.type,
                district_id:pemetaan.district_id
            }
        })
        .then(res=>{
            const geo_features=res.data.data.map(data=>{
                return {
                    type:"Feature",
                    properties:{
                        region:data.region,
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
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    getsBarChart=async ()=>{
        const {bar_chart}=this.state

        await api(access_token()).get("/stunting", {
            params:{
                per_page:"",
                q:"",
                type:bar_chart.type,
                district_id:bar_chart.district_id
            }
        })
        .then(res=>{
            const xaxis=res.data.data.map(d=>d.region)
            const series1=res.data.data.map(d=>d.count_stunting)

            this.setState({
                bar_chart:update(this.state.bar_chart, {
                    options:{$set:{
                        chart:{
                            id:"graph-stunting"
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
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    getsKecamatanForm=async ()=>{
        await api(access_token()).get("/region/type/kecamatan", {
            params:{
                page:1,
                per_page:"",
                q:"",
                with_desa:0,
                with_posyandu:0
            }
        })
        .then(res=>{
            this.setState({
                kecamatan_form:res.data.data
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

    //pemetaan
    typeFilterPemetaan=e=>{ 
        const {target}=e

        switch(target.name){
            case "district_id":
                this.setState({
                    pemetaan:update(this.state.pemetaan, {
                        [target.name]:{$set:target.value},
                        data:{$set:[]}
                    })
                }, ()=>{
                    this.getsPemetaan()
                })
            break
            case "type":
                this.setState({
                    pemetaan:update(this.state.pemetaan, {
                        [target.name]:{$set:target.value},
                        data:{$set:[]},
                        district_id:{$set:""}
                    })
                }, ()=>{
                    this.getsPemetaan()
                })
            break
        }
    }

    //graph chart
    typeFilterChart=e=>{ 
        const {target}=e

        switch(target.name){
            case "district_id":
                this.setState({
                    bar_chart:update(this.state.bar_chart, {
                        [target.name]:{$set:target.value},
                        options:{$set:{
                            chart:{
                                id:"graph-stunting"
                            },
                            xaxis:{
                                categories:[]
                            }
                        }},
                        series:{$set:[]}
                    })
                }, ()=>{
                    this.getsBarChart()
                })
            break
            case "type":
                this.setState({
                    bar_chart:update(this.state.bar_chart, {
                        [target.name]:{$set:target.value},
                        options:{$set:{
                            chart:{
                                id:"graph-stunting"
                            },
                            xaxis:{
                                categories:[]
                            }
                        }},
                        series:{$set:[]},
                        district_id:{$set:""}
                    })
                }, ()=>{
                    this.getsBarChart()
                })
            break
        }
    }

    render(){
        const {pemetaan, kecamatan_form, bar_chart}=this.state

        return (
            <>
                <Layout>
                    <section className="block-slider">
                        <div className="container">
                            <div className="slider-wrapper">
                                <div className="row">
                                    <div className="col-md-6">
                                        <Animated 
                                            isVisible={true} 
                                            animationIn="animate__fadeInDown"
                                            animationInDuration='1000ms' 
                                            animationInDelay='100ms'
                                            animationOut="animate__fadeOutUp" 
                                            animationOutDelay='100ms'
                                        >
                                            <h2 className="slider-header-title">Pusat Layanan Kesehatan Terintegrasi</h2>
                                        </Animated>
                                        <Animated 
                                            isVisible={true} 
                                            animationIn="animate__fadeInUp"
                                            animationInDuration='1000ms' 
                                            animationInDelay='500ms'
                                            animationOut="animate__fadeOutDown" 
                                            animationOutDelay='500ms'
                                        >
                                            <p className="slider-header-description text-muted mt-3">Kontrol kesehatan mudah, aman dan nyaman dengan aplikasi pusline</p>
                                        </Animated>
                                    </div>
                                </div>
                                <div className="slider-img">
                                    <Animated 
                                        isVisible={true} 
                                        animationIn="animate__backInRight"
                                        animationInDuration='1000ms' 
                                        animationInDelay='800ms'
                                        animationOut="animate__backOutRight" 
                                        animationOutDelay='800ms'
                                    >
                                        <img src={`/620f3fb174fc2_ilustrasi header new.png`}/>
                                    </Animated>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="block-widget mb-5">
                        <div className="container d-flex flex-column">
                            <h2 className="block-title mb-2">Layanan Kesehatan Balita</h2>
                            <div className="row horizontal-scrollable flex-nowrap flex-md-wrap mt-3">
                                <div className="col-5 col-md-2 mb-4">
                                    <Link href="/frontpage/skrining_balita/?action=cek_antropometri" className="text-decoration-none h-100">
                                        <div className="card border-0 rounded-4">
                                            <div className="card-body text-center py-4 px-2 rounded-4">
                                                <div className="mb-3 d-flex justify-content-center">
                                                    <div className="widget-link-img-icon">
                                                    <img src={`/6259890ee6bbd_antropometri.png`} className="img-fluid"/>
                                                    </div>
                                                </div>
                                                <div className="card-title fw-semibold text-muted text-truncate">Cek Antropometri</div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                                <div className="col-5 col-md-2 mb-4">
                                    <Link href="/frontpage/skrining_balita" className="text-decoration-none h-100">
                                        <div className="card border-0 rounded-4">
                                            <div className="card-body text-center py-4 px-2 rounded-4">
                                                <div className="mb-3 d-flex justify-content-center">
                                                    <div className="widget-link-img-icon">
                                                        <img src={`/620b99ec6e8ec_ilustrasi header-01-11.png`} className="img-fluid"/>
                                                    </div>
                                                </div>
                                                <div className="card-title fw-semibold text-muted text-truncate">Lihat Skrining</div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section className="block-widget mb-5">
                        <div className="container d-flex flex-column">
                            <h2 className="block-title mb-2">Pemetaan Stunting</h2>
                                <div className="d-flex mb-4">
                                    <div style={{width:"200px"}} className="me-2">
                                        <select name="type" value={pemetaan.type} className="form-select" onChange={this.typeFilterPemetaan}>
                                            <option value="kecamatan">Kecamatan</option>
                                            <option value="desa">Desa</option>
                                        </select>
                                    </div>
                                    {pemetaan.type=="desa"&&
                                        <div style={{width:"200px"}} className="me-2">
                                            <select name="district_id" value={pemetaan.district_id} className="form-select" onChange={this.typeFilterPemetaan}>
                                                <option value="">-- Pilih Kecamatan</option>
                                                {kecamatan_form.map(kf=>(
                                                    <option key={kf} value={kf.id_region}>{kf.region}</option>
                                                ))}
                                            </select>
                                        </div>
                                    }
                                </div>
                            <div 
                                className="d-flex flex-column align-items-center justify-content-between"
                            >
                                <div className="card w-100 rounded-4 overflow-hidden">
                                    <div className="card-body p-0">
                                        <Map data={pemetaan.data} center={pemetaan.center}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="block-widget mb-5">
                        <div className="container d-flex flex-column">
                            <h2 className="block-title mb-2">Grafik Anak Penderita Stunting</h2>
                                <div className="d-flex mb-4">
                                    <div style={{width:"200px"}} className="me-2">
                                        <select name="type" value={bar_chart.type} className="form-select" onChange={this.typeFilterChart}>
                                            <option value="kecamatan">Kecamatan</option>
                                            <option value="desa">Desa</option>
                                        </select>
                                    </div>
                                    {bar_chart.type=="desa"&&
                                        <div style={{width:"200px"}} className="me-2">
                                            <select name="district_id" value={bar_chart.district_id} className="form-select" onChange={this.typeFilterChart}>
                                                <option value="">-- Pilih Kecamatan</option>
                                                {kecamatan_form.map(kf=>(
                                                    <option key={kf} value={kf.id_region}>{kf.region}</option>
                                                ))}
                                            </select>
                                        </div>
                                    }
                                </div>
                            <div 
                                className="d-flex flex-column align-items-center justify-content-between"
                            >
                                <div className="card w-100 rounded-4 overflow-hidden">
                                    <div className="card-body p-0 graph-responsive">
                                        <Chart
                                            options={bar_chart.options}
                                            series={bar_chart.series}
                                            type="bar"
                                            width="100%"
                                            height="100%"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </Layout>
            </>
        )
    }
}

export default withAuth(Frontpage)