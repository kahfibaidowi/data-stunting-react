import React from "react"
import update from "immutability-helper"
import Animated from "../../../component/ui/animate"
import withAuth from "../../../component/hoc/auth"
import Layout from "../../../component/layout"
import Link from "next/link"
import dynamic from "next/dynamic"
import { api } from "../../../config/api"
import { access_token, isUndefined, login_data } from "../../../config/config"
import Router from "next/router"
import { toast } from "react-toastify"
import { table_bb_u_laki_laki, table_bb_u_perempuan } from "../../../config/helpers"
import { useEffect } from "react"
import { useState } from "react"
import NumberFormat from "react-number-format"

const Map=dynamic(()=>import("../../../component/modules/map"), {ssr:false})
const Chart=dynamic(()=>import("react-apexcharts"), {ssr:false})

class Setting extends React.Component{
    state={}

    componentDidMount=()=>{
    }

    render(){
        const {pemetaan, kecamatan_form, bar_chart, login_data}=this.state

        return (
            <>
                <Layout>
                    <div className="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 className="mb-3 mb-md-0">Pengaturan</h4>
                        </div>
                        <div className="d-flex align-items-center flex-wrap text-nowrap">
                            
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-4">
                            <UpdateBBTBUnknown/>
                        </div>
                    </div>
                </Layout>
            </>
        )
    }
}

const UpdateBBTBUnknown=(props)=>{
    const [is_loading, setIsLoading]=useState(false)
    const [count_unknown, setCountUnknown]=useState(0)
    const [predict_count, setPredictCount]=useState(200)

    useEffect(()=>{
        fetchCountUnknown()
    }, [])

    const fetchCountUnknown=async()=>{

        setIsLoading(true)
        await api(access_token()).get("/setting/get/count_bbtb_unknown")
        .then(res=>{
            setIsLoading(false)
            setCountUnknown(res.data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }

            setIsLoading(false)
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    const updateUnknown=async()=>{
        await api(access_token()).put("/setting/update/bbtb_unknown", {
            predict_count
        })
        .then(res=>{
            fetchCountUnknown()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }

            toast.error("Update Data Failed!", {position:"bottom-center"})
        })
    }

    return (
        <div class="card">
            <div class="card-header">
                <h5 class="card-title">Update BB/TB Unknown</h5>
            </div>
            <div class="card-body">
                <div className="mb-3">
                    Total BB/TB Unknown : <strong>{is_loading?"Loading...":count_unknown}</strong>
                </div>
                <div class="input-group mb-2" style={{maxWidth:"200px"}}>
                    <NumberFormat
                        displayType="input"
                        suffix=" Row"
                        value={predict_count}
                        onValueChange={values=>{
                            const {value}=values
                            setPredictCount(value)
                        }}
                        className="form-control"
                        placeholder="Jumlah Baris/Data"
                    />
                    <button 
                        class="btn btn-primary" 
                        type="button" 
                        id="button-addon2"
                        disabled={is_loading}
                        onClick={e=>updateUnknown()}
                    >
                        Update
                    </button>
                </div>
                <p className="mb-2 text-muted">Form ini digunakan untuk mengupdate Hasil BB/TB yang hasilnya unknown, jika setelah diupdate total unknown tidak berubah mungkin karena datanya tidak ada di table.</p>
            </div>
        </div>
    )
}

export default withAuth(Setting)