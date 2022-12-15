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
        }
    }

    componentDidMount=()=>{
        this.getsKecamatanForm()
        this.getsPemetaan()
        this.getsBarChart()
    }
    getsPemetaan=async ()=>{
        const {pemetaan}=this.state

        await api(access_token()).get("/stunting/summary_region", {
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
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    getsBarChart=async ()=>{
        const {bar_chart}=this.state

        await api(access_token()).get("/stunting/summary_region", {
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
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
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
                Router.push("/login")
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
                    <section className="block-widget mb-5 mt-5">
                        <div className="container d-flex flex-column">
                            <div className="row">
                                <div className="col-lg-6 mb-3">
                                    <div className="card w-100 rounded-4 overflow-hidden">
                                        <div className="card-header">
                                            <h3 className="card-title fw-semibold">Pemetaan Stunting</h3>
                                        </div>
                                        <div className="card-body p-3 border-top-0">
                                            <div className="d-flex mb-3">
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
                                            <Map data={pemetaan.data} center={pemetaan.center}/>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6 mb-3">
                                    <div className="card w-100 rounded-4 overflow-hidden">
                                        <div className="card-header">
                                            <h3 className="card-title fw-semibold">Grafik Anak Penderita Stunting</h3>
                                        </div>
                                        <div className="card-body p-3 border-top-0">
                                            <div className="d-flex mb-3">
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
                                            <Chart
                                                options={bar_chart.options}
                                                series={bar_chart.series}
                                                type="bar"
                                                width="100%"
                                                height="385px"
                                            />
                                        </div>
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