import React, { useEffect, useState } from "react"
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
import { Button, ButtonGroup, Dropdown, Modal, OverlayTrigger, Popover, Spinner, Tab, Tabs } from "react-bootstrap"
import writeXlsxFile from 'write-excel-file'
import FileSaver from "file-saver"
import readXlsxFile from "read-excel-file"
import { read, utils, writeFileXLSX } from 'xlsx';
import * as yup from "yup"
import { TbArrowLeft, TbChevronLeft, TbChevronRight, TbPlus, TbUpload } from "react-icons/tb"
import axios from "axios"
import { FiArrowRight, FiCheck, FiChevronDown, FiChevronLeft, FiChevronRight, FiEdit, FiEdit2, FiEdit3, FiFilter, FiInfo, FiPlus, FiSearch, FiTrash, FiX } from "react-icons/fi"
import swal from "sweetalert2"
import withReactContent from 'sweetalert2-react-content'
import ChartSkriningDetail from "../../../component/modules/chart_skrining_detail"
import Select from "react-select"
import { RadioPicker } from "../../../component/ui/custom_input"
import { zScoreBBTB, zScoreBBU, zScoreTBU } from "../../../config/helpers"


const MySwal=withReactContent(swal)

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
            district_id:"",
            village_id:"",
            nik:"",
            bbu:"",
            tbu:"",
            bbtb:"",
            status_gizi:"",
            tindakan:"",
            umur:{
                start:"",
                end:""
            },
            hide_bb_0:"n",
            hide_tb_0:"n",
            last_page:0,
            is_loading:false
        },
        tambah_skrining:{
            is_open:false,
            kecamatan_form:[]
        },
        detail_kk:{
            is_open:false,
            data:[]
        },
        detail_skrining:{
            is_open:false,
            data:{},
            skrining:[],
            is_loading:false
        },
        edit_skrining:{
            is_open:false,
            data:{}
        }
    }

    componentDidMount=()=>{
        if(this.props.router.isReady){
            if(this.props.router.query?.action=="cek_antropometri"){
                this.toggleTambah()
                this.setState({
                    login_data:login_data()!==null?login_data():{}
                })
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
                            this.fetchSkrining()
                        })
                    }
                    else{
                        //this.fetchSkrining()
                        this.fetchKecamatanForm()
                    }
                })
            }
        }
    }
    componentDidUpdate=(prevProps)=>{
        if(prevProps.router.isReady!==this.props.router.isReady){
            if(this.props.router.isReady){
                if(this.props.router.query?.action=="cek_antropometri"){
                    this.toggleTambah()
                    this.setState({
                        login_data:login_data()!==null?login_data():{}
                    })
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
                                this.fetchSkrining()
                            })
                        }
                        else{
                            //this.fetchSkrining()
                            this.fetchKecamatanForm()
                        }
                    })
                }
            }
        }
        if(JSON.stringify(prevProps.router)!=JSON.stringify(this.props.router)){
            if(this.props.router.isReady){
                if(this.props.router.query?.action=="cek_antropometri"){
                    this.toggleTambah()
                    this.setState({
                        login_data:login_data()!==null?login_data():{}
                    })
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
                                this.fetchSkrining()
                            })
                        }
                        else{
                            this.fetchKecamatanForm()
                            //this.fetchSkrining()
                        }
                    })
                }
            }
        }
    }

    //API, REQUEST, DATA
    abortController=new AbortController()
    request={
        apiGetsKecamatanForm:async(params)=>{
            return await api(access_token()).get("/region/type/kecamatan", {
                params
            })
            .then(res=>res.data)
        },
        apiGetsSkrining:async(params)=>{
            this.abortController.abort()
            this.abortController=new AbortController()

            return await api(access_token()).get("/skrining_balita", {
                params,
                signal:this.abortController.signal
            })
            .then(res=>res.data)
        },
        apiGetsSkriningNIK:async(nik)=>{
            const params={
                page:1,
                per_page:"",
                q:"",
                nik:nik,
                posyandu_id:"",
                village_id:"",
                district_id:"",
                bbu:"",
                tbu:"",
                bbtb:"",
                status_gizi:"",
                tindakan:"",
                umur_start:"",
                umur_end:""
            }

            return await api(access_token()).get("/skrining_balita", {
                params
            })
            .then(res=>res.data)
        },
        apiGetPenduduk:async(penduduk_id)=>{
            return await api(access_token()).post("/auth/request_stunting_madiunkab", {
                endpoint:"/view-penduduk",
                methods:"POST",
                params:{
                    query:"nik",
                    data:penduduk_id
                }
            })
            .then(res=>res.data)
        },
        apiGetKK:async(kk_id)=>{
            return await api(access_token()).post("/auth/request_stunting_madiunkab", {
                endpoint:"/view-penduduk",
                methods:"POST",
                params:{
                    query:"kk",
                    data:kk_id
                }
            })
            .then(res=>res.data)
        },
        apiGetSkriningNIK:async(nik)=>{
            return await api(access_token()).get(`/skrining_balita/${nik}?type=nik`)
            .then(res=>res.data)
        },
        apiUpdateSkrining:async(params)=>{
            return await api(access_token()).put(`/skrining_balita/${params.id_skrining_balita}`, params).then(res=>res.data)
        },
        apiMadiunKabGetsProvinsiForm:async()=>{
            return await api(access_token()).post("/auth/request_stunting_madiunkab", {
                endpoint:"/provinsi",
                methods:"GET",
                params:{}
            })
            .then(res=>res.data)
        },
        apiMadiunKabGetsKabupatenKotaForm:async(province_id)=>{
            return await api(access_token()).post("/auth/request_stunting_madiunkab", {
                endpoint:`/kota/${province_id}`,
                methods:"GET",
                params:{}
            })
            .then(res=>res.data)
        },
        apiMadiunKabGetsKecamatanForm:async(regency_id)=>{
            return await api(access_token()).post("/auth/request_stunting_madiunkab", {
                endpoint:`/kecamatan/${regency_id}`,
                methods:"GET",
                params:{}
            })
            .then(res=>res.data)
        },
        apiMadiunKabGetsDesaForm:async(district_id)=>{
            return await api(access_token()).post("/auth/request_stunting_madiunkab", {
                endpoint:`/desa/${district_id}`,
                methods:"GET",
                params:{}
            })
            .then(res=>res.data)
        },
        apiGetDataLahir:async(nik)=>{
            return await api(access_token()).post("/auth/request_stunting_madiunkab", {
                endpoint:"/balita/get-data-kelahiran",
                methods:"POST",
                params:{
                    nik:nik
                }
            })
            .then(res=>res.data)
        },
        apiGetSummaryFormula:async()=>{
            return await api(access_token()).get("/skrining_balita/summary/formula").then(res=>res.data)
        },
        apiDeleteSkrining:async(id)=>{
            return await api(access_token()).delete(`/skrining_balita/${id}`).then(res=>res.data)
        }
    }

    //QUERY, MUTATION
    fetchSummaryFormula=async()=>{
        await this.request.apiGetSummaryFormula()
        .then(data=>{
            this.setState({
                formula:data.data
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
    fetchKecamatanForm=async()=>{
        const params={
            per_page:"",
            q:"",
            with_desa:1,
            with_posyandu:1
        }

        await this.request.apiGetsKecamatanForm(params)
        .then(data=>{
            this.setState({
                kecamatan_form:data.data
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
    fetchSkrining=async(reset=false)=>{
        const {skrining}=this.state

        const params={
            page:reset?1:skrining.page,
            per_page:skrining.per_page,
            q:skrining.q,
            nik:skrining.nik,
            posyandu_id:skrining.posyandu_id,
            village_id:skrining.village_id,
            district_id:skrining.district_id,
            bbu:skrining.bbu,
            tbu:skrining.tbu,
            bbtb:skrining.bbtb,
            status_gizi:skrining.status_gizi,
            tindakan:skrining.tindakan,
            umur_start:skrining.umur.start,
            umur_end:skrining.umur.end,
            hide_bb_0:skrining.hide_bb_0,
            hide_tb_0:skrining.hide_tb_0
        }

        this.setLoading(true)
        await this.request.apiGetsSkrining(params)
        .then(data=>{
            this.setState({
                skrining:update(this.state.skrining, {
                    data:{$set:data.data},
                    last_page:{$set:data.last_page},
                    page:{$set:data.current_page},
                    is_loading:{$set:false}
                })
            })
        })
        .catch(err=>{
            if(err.name=="CanceledError"){
                toast.warn("Request Aborted!", {position:"bottom-center"})
            }
            else{
                if(err.response.status===401){
                    localStorage.removeItem("login_data")
                    Router.push("/login")
                }
                toast.error("Gets Data Failed!", {position:"bottom-center"})
                this.setLoading(false)
            }
        })
    }
    fetchSkriningByNIK=async(nik)=>{
        this.setState({
            detail_skrining:update(this.state.detail_skrining, {
                is_loading:{$set:true}
            })
        })
        await this.request.apiGetsSkriningNIK(nik)
        .then(data=>{
            this.setState({
                detail_skrining:update(this.state.detail_skrining, {
                    skrining:{$set:data.data},
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
            this.setState({
                detail_skrining:update(this.state.detail_skrining, {
                    is_loading:{$set:false}
                })
            })
        })
    }
    addSkrining=async (values, actions)=>{
        //insert to database
        await api(access_token()).post("/skrining_balita", {
            id_user:values.id_user,
            input_bulan:values.input_bulan,
            data_anak:values.data_anak,
            berat_badan_lahir:values.berat_badan_lahir,
            tinggi_badan_lahir:values.tinggi_badan_lahir,
            berat_badan:values.berat_badan,
            tinggi_badan:values.tinggi_badan
        })
        .then(res=>{
            this.toggleTambah()
            toast.success("Berhasil menambahkan data skrining!")

            if(this.props.router.query?.action=="cek_antropometri"){
                Router.push("/frontpage/skrining_balita")
            }
            else{
                this.fetchSkrining(true)
            }
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
    updateSkrining=async(values, actions)=>{
        await this.request.apiUpdateSkrining(values)
        .then(data=>{
            this.fetchSkrining()
            this.toggleEditSkrining()
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
    deleteSkrining=async(id)=>{
        await this.request.apiDeleteSkrining(id)
        .then(data=>{
            this.fetchSkrining()
            toast.warn("Data Skrining Dihapus!")
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            toast.error("Remove Data Failed!", {position:"bottom-center"})
        })
    }

    //TABLE
    goToPage=page=>{
        this.setState({
            skrining:update(this.state.skrining, {
                page:{$set:page}
            })
        }, ()=>{
            this.fetchSkrining()
        })
    }
    setPerPage=e=>{
        const target=e.target

        this.setState({
            skrining:update(this.state.skrining, {
                per_page:{$set:target.value}
            })
        }, ()=>{
            this.fetchSkrining(true)
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
                        this.fetchSkrining(true)
                    }, 500);
                break
                case "district_id":
                    this.setState({
                        skrining:update(this.state.skrining, {
                            village_id:{$set:""},
                            posyandu_id:{$set:""}
                        })
                    }, ()=>{
                        this.fetchSkrining()
                    })
                break
                case "village_id":
                    this.setState({
                        skrining:update(this.state.skrining, {
                            posyandu_id:{$set:""}
                        })
                    }, ()=>{
                        this.fetchSkrining()
                    })
                break
                default:
                    this.fetchSkrining(true)
            }
        })
    }
    setLoading=loading=>{
        this.setState({
            skrining:update(this.state.skrining, {
                is_loading:{$set:loading},
                data:{$set:[]}
            })
        })
    }
    timeout=0

    //ACTIONS
    showDetailKK=async no_kk=>{
        const kk=await this.request.apiGetKK(no_kk).catch(err=>false)
        
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
    toggleTambah=()=>{
        this.setState({
            tambah_skrining:{
                is_open:!this.state.tambah_skrining.is_open,
                kecamatan_form:this.state.kecamatan_form
            }
        })
    }
    toggleDetailSkrining=(data={})=>{
        this.setState({
            detail_skrining:update(this.state.detail_skrining, {
                is_open:{$set:!this.state.detail_skrining.is_open},
                data:{$set:data}
            })
        }, ()=>{
            if(this.state.detail_skrining.is_open){
                this.fetchSkriningByNIK(data.data_anak.nik)
            }
            else{
                setTimeout(() => {
                    this.setState({
                        detail_skrining:update(this.state.detail_skrining, {
                            skrining:{$set:[]}
                        })
                    })
                }, 300);
            }
        })
    }
    toggleEditSkrining=(data={})=>{
        this.setState({
            edit_skrining:{
                is_open:!this.state.edit_skrining.is_open,
                data:data
            }
        })
    }
    showConfirmHapus=(data)=>{
        MySwal.fire({
            title: "Apakah anda Yakin?",
            text: "Data yang sudah dihapus tidak bisa dikembalikan lagi!",
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
                this.deleteSkrining(data.id_skrining_balita)
            }
        })
    }

    render(){
        const {
            kecamatan_form, 
            login_data, 
            skrining,
            tambah_skrining,
            detail_kk,
            detail_skrining,
            edit_skrining
        }=this.state

        return (
            <>
                <Layout>
                    <div className="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h4 className="mb-3 mb-md-0">Rekap Timbangan</h4>
                        </div>
                        <div className="d-flex align-items-center flex-wrap text-nowrap">
                            <button 
                                type="button" 
                                className="btn btn-primary btn-icon-text mb-2 mb-md-0"
                                onClick={this.toggleTambah}
                            >
                                <FiPlus className="btn-icon-prepend"/>
                                Cek Antropometri
                            </button>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <Table 
                                        data={skrining}
                                        login_data={login_data}
                                        setPerPage={this.setPerPage}
                                        goToPage={this.goToPage}
                                        typeFilter={this.typeFilter}
                                        kecamatan_form={kecamatan_form}
                                        showDetailKK={this.showDetailKK}
                                        toggleDetailSkrining={this.toggleDetailSkrining}
                                        toggleEditSkrining={this.toggleEditSkrining}
                                        showConfirmHapus={this.showConfirmHapus}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Layout>

                <TambahSkrining
                    data={tambah_skrining}
                    hideModal={this.toggleTambah}
                    addSkrining={this.addSkrining}
                    login_data={login_data}
                    request={this.request}
                    kecamatan_form={kecamatan_form}
                />

                <EditSkrining
                    data={edit_skrining}
                    hideModal={this.toggleEditSkrining}
                    updateSkrining={this.updateSkrining}
                    request={this.request}
                />

                <DetailKK
                    data={detail_kk}
                    hideModal={this.hideDetailKK}
                />

                <DetailSkrining
                    data={detail_skrining}
                    hideModal={this.toggleDetailSkrining}
                />
            </>
        )
    }
}

//TABLE SKRINING
const Table=({data, typeFilter, setPerPage, goToPage, kecamatan_form, showDetailKK, toggleDetailSkrining, toggleEditSkrining, showConfirmHapus, login_data})=>{
    const [filter_umur, setFilterUmur]=useState({
        start:"",
        end:""
    })

    //helpers
    const jenkel=val=>{
        if(val=="L"){
            return "Laki Laki"
        }
        else if(val=="P"){
            return "Perempuan"
        }
    }
    const getBulan=bln=>{
        if(bln>60){
            return "60+ Bulan"
        }
        else{
            return bln+" Bulan"
        }
    }
    const valueBBU=value=>{
        if(value=="gizi_buruk") return "Berat Badan sangat Kurang";
        if(value=="gizi_kurang") return "Berat badan kurang";
        if(value=="gizi_baik") return "Berat badan normal";
        if(value=="gizi_lebih") return "Risiko Berat badan lebih";
        
        return value
    }
    const valueStatusGizi=value=>{
        if(value=="T") return "Tidak Naik (T)"
        if(value=="N") return "Naik (N)"

        return "Tidak Diketahui (O)"
    }
    const valueTindakan=(status_gizi, bbu)=>{
        if(status_gizi=="T") return "rujuk";
        if(bbu!="gizi_baik") return "rujuk";

        return ""
    }

    //value
    const list_kecamatan=()=>{
        let list=kecamatan_form.map(reg=>{
            return {
                label:reg.region,
                value:reg.id_region
            }
        })
        list=[{label:"Semua Kecamatan", value:""}].concat(list)

        return list
    }
    const list_desa=()=>{
        let list=[]
        if(data.district_id!=""){
            const desa=kecamatan_form.filter(reg=>reg.id_region.toString()==data.district_id.toString())[0].desa

            list=desa.map(reg=>{
                return {
                    label:reg.region,
                    value:reg.id_region
                }
            })
        }
        list=[{label:"Semua Desa", value:""}].concat(list)
        return list
    }
    const list_posyandu=()=>{
        let list=[]
        let desa=[]
        let posyandu=[]
        if(data.district_id!=""){
            desa=kecamatan_form.filter(reg=>reg.id_region.toString()==data.district_id.toString())
            if(desa.length>0){
                desa=desa[0].desa
            }
            else{
                desa=[]
            }
        }
        if(data.village_id!=""){
            posyandu=desa.filter(reg=>reg.id_region.toString()==data.village_id.toString())
            if(posyandu.length>0){
                posyandu=posyandu[0].posyandu
            }
            else{
                posyandu=[]
            }

            list=posyandu.map(pos=>{
                return {
                    label:pos.nama_lengkap,
                    value:pos.id_user
                }
            })
        }
        list=[{label:"Semua Posyandu", value:""}].concat(list)
        return list
    }
    const list_bbu=()=>{
        return [
            {label:"Semua BB/U", value:""},
            {label:"Gizi Buruk", value:"gizi_buruk"},
            {label:"Gizi Kurang", value:"gizi_kurang"},
            {label:"Gizi Baik", value:"gizi_baik"},
            {label:"Gizi Lebih", value:"gizi_lebih"},
            {label:"Unknown", value:"unknown"},
        ]
    }
    const list_tbu=()=>{
        return [
            {label:"Semua TB/U", value:""},
            {label:"Sangat Pendek", value:"sangat_pendek"},
            {label:"Pendek", value:"pendek"},
            {label:"Normal", value:"normal"},
            {label:"Tinggi", value:"tinggi"},
            {label:"Unknown", value:"unknown"},
        ]
    }
    const list_bbtb=()=>{
        return [
            {label:"Semua BB/TB", value:""},
            {label:"Gizi Buruk", value:"gizi_buruk"},
            {label:"Gizi Kurang", value:"gizi_kurang"},
            {label:"Gizi Baik", value:"gizi_baik"},
            {label:"Beresiko Gizi Lebih", value:"beresiko_gizi_lebih"},
            {label:"Gizi Lebih", value:"gizi_lebih"},
            {label:"Obesitas", value:"obesitas"},
            {label:"Unknown", value:"unknown"},
        ]
    }
    const list_gizi=()=>{
        return [
            {label:"Semua Status Gizi", value:""},
            {label:"Naik (N)", value:"N"},
            {label:"Tidak Naik (T)", value:"T"},
            {label:"Tidak Diketahui (O)", value:"O"}
        ]
    }
    const list_tindakan=()=>{
        return [
            {label:"Semua Tidakan", value:""},
            {label:"Rujuk", value:"rujuk"},
            {label:"Tidak Ada Tindakan", value:"tidak_ada"}
        ]
    }
    const count_filter=()=>{
        let count=0

        if(data.bbu!="") count++
        if(data.tbu!="") count++
        if(data.bbtb!="") count++
        if(data.status_gizi!="") count++
        if(data.tindakan!="") count++
        if(data.umur.start!="" && data.umur.end!="") count++
        if(data.hide_bb_0=="y") count++
        if(data.hide_tb_0=="y") count++

        return count
    }
    

    return (
        <>
            <div className="d-flex mb-3 mt-3">
                {login_data.role!="posyandu"&&
                    <>
                        <div style={{width:"200px"}} className="me-2">
                            <Select
                                options={list_kecamatan()}
                                onChange={e=>{
                                    typeFilter({target:{name:"district_id", value:e.value}})
                                }}
                                value={list_kecamatan().find(f=>f.value.toString()==data.district_id.toString())}
                                placeholder="Pilih Kecamatan"
                            />
                        </div>
                        <div style={{width:"200px"}} className="me-2">
                            <Select
                                options={list_desa()}
                                onChange={e=>{
                                    typeFilter({target:{name:"village_id", value:e.value}})
                                }}
                                value={list_desa().find(f=>f.value.toString()==data.village_id.toString())}
                                placeholder="Pilih Desa"
                            />
                        </div>
                        <div style={{width:"200px"}} className="me-2">
                            <Select
                                options={list_posyandu()}
                                onChange={e=>{
                                    typeFilter({target:{name:"posyandu_id", value:e.value}})
                                }}
                                value={list_posyandu().find(f=>f.value.toString()==data.posyandu_id.toString())}
                                placeholder="Pilih Posyandu"
                            />
                        </div>
                    </>
                }
                <div style={{width:"200px"}} className="me-2">
                    <input
                        type="text"
                        className="form-control"
                        name="q"
                        onChange={typeFilter}
                        value={data.q}
                        placeholder="Cari ..."
                    />
                </div>
                
                {login_data.role=="dinkes"&&
                    <div className="ms-auto">
                        <Dropdown autoClose="outside">
                            <Dropdown.Toggle variant="light" id="dropdown-basic">
                                <FiFilter className="btn-icon-prepend me-1"/>
                                Filter{count_filter()>0&&<>ed <span className="badge bg-primary rounded-pill">{count_filter()}</span></>}
                            </Dropdown.Toggle>

                            <Dropdown.Menu style={{minWidth:"400px"}}>
                                <div className="d-flex flex-column p-2">
                                    <div>
                                        <div className="mb-3">
                                            <div className="form-check mb-2">
                                                <input 
                                                    type="checkbox" 
                                                    className="form-check-input" 
                                                    id="cb_hide_bb_0"
                                                    checked={data.hide_bb_0=="y"}
                                                    onChange={(e)=>{
                                                        typeFilter({target:{name:"hide_bb_0", value:data.hide_bb_0!="y"?"y":"n"}})
                                                    }}
                                                />
                                                <label className="form-check-label" for="cb_hide_bb_0">Sembunyikan BB=0</label>
                                            </div>
                                            <div className="form-check mb-2">
                                                <input 
                                                    type="checkbox" 
                                                    className="form-check-input" 
                                                    id="cb_hide_tb_0"
                                                    checked={data.hide_tb_0=="y"}
                                                    onChange={(e)=>{
                                                        typeFilter({target:{name:"hide_tb_0", value:data.hide_tb_0!="y"?"y":"n"}})
                                                    }}
                                                />
                                                <label className="form-check-label" for="cb_hide_tb_0">Sembunyikan TB=0</label>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold fs-5" for="country">Usia Saat Ukur/Umur (0-60 bulan)</label>
                                            <div className="input-group mb-3" style={{maxWidth:"300px"}}>
                                                <NumberFormat
                                                    displayType="input"
                                                    suffix=" Bulan"
                                                    value={filter_umur.start}
                                                    onValueChange={values=>{
                                                        const {value}=values
                                                        setFilterUmur(update(filter_umur, {
                                                            start:{$set:value}
                                                        }))
                                                    }}
                                                    thousandSeparator={true}
                                                    decimalScale={false}
                                                    className="form-control"
                                                    placeholder="Dari"
                                                />
                                                <NumberFormat
                                                    displayType="input"
                                                    suffix=" Bulan"
                                                    value={filter_umur.end}
                                                    onValueChange={values=>{
                                                        const {value}=values
                                                        setFilterUmur(update(filter_umur, {
                                                            end:{$set:value}
                                                        }))
                                                    }}
                                                    thousandSeparator={true}
                                                    decimalScale={false}
                                                    className="form-control"
                                                    placeholder="Sampai"
                                                />
                                                <button 
                                                    className="btn btn-secondary btn-icon" 
                                                    type="button" 
                                                    disabled={
                                                        (filter_umur.start==data.umur.start && filter_umur.end==data.umur.end)||
                                                        (filter_umur.start.toString().trim()=="" || filter_umur.end.toString().trim()=="")
                                                    }
                                                    onClick={e=>{
                                                        e.preventDefault()
                                                        typeFilter({target:{name:"umur", value:filter_umur}})
                                                    }}
                                                >
                                                    <FiSearch/>
                                                </button>
                                            </div>
                                            {(data.umur.start!=""||data.umur.end!="")&&
                                                <div className="mt-1">
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-link link-danger text-decoration-underline p-0"
                                                        onClick={e=>{
                                                            e.preventDefault()
                                                            
                                                            const umur={start:"", end:""}
                                                            setFilterUmur(umur)
                                                            typeFilter({target:{name:"umur", value:umur}})
                                                        }}
                                                    >
                                                        Clear Filter Umur
                                                    </button>
                                                </div>
                                            }
                                        </div>
                                        <div className="mb-1">
                                            <label className="my-1 me-2 fw-semibold fs-5" for="country">Berat Badan/Umur</label>
                                            <div className="d-flex flex-wrap">
                                                {list_bbu().map((list, idx)=>(
                                                    <div className="me-2 mb-1" key={idx}>
                                                        <RadioPicker
                                                            label={list.label}
                                                            checked={data.bbu==list.value}
                                                            onChange={()=>typeFilter({target:{name:"bbu", value:list.value}})}
                                                            disabled={false}
                                                            id={`bbu-${idx}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mb-1">
                                            <label className="my-1 me-2 fw-semibold fs-5" for="country">Tinggi Badan/Umur</label>
                                            <div className="d-flex flex-wrap">
                                                {list_tbu().map((list, idx)=>(
                                                    <div className="me-2 mb-1" key={idx}>
                                                        <RadioPicker
                                                            label={list.label}
                                                            checked={data.tbu==list.value}
                                                            onChange={()=>typeFilter({target:{name:"tbu", value:list.value}})}
                                                            disabled={false}
                                                            id={`tbu-${idx}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mb-1">
                                            <label className="my-1 me-2 fw-semibold fs-5" for="country">Berat Badan/Tinggi Badan</label>
                                            <div className="d-flex flex-wrap">
                                                {list_bbtb().map((list, idx)=>(
                                                    <div className="me-2 mb-1" key={idx}>
                                                        <RadioPicker
                                                            label={list.label}
                                                            checked={data.bbtb==list.value}
                                                            onChange={()=>typeFilter({target:{name:"bbtb", value:list.value}})}
                                                            disabled={false}
                                                            id={`bbtb-${idx}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mb-1">
                                            <label className="my-1 me-2 fw-semibold fs-5" for="country">Status Gizi</label>
                                            <div className="d-flex flex-wrap">
                                                {list_gizi().map((list, idx)=>(
                                                    <div className="me-2 mb-1" key={idx}>
                                                        <RadioPicker
                                                            label={list.label}
                                                            checked={data.status_gizi==list.value}
                                                            onChange={()=>typeFilter({target:{name:"status_gizi", value:list.value}})}
                                                            disabled={false}
                                                            id={`gizi-${idx}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mb-1">
                                            <label className="my-1 me-2 fw-semibold fs-5" for="country">Tindakan</label>
                                            <div className="d-flex flex-wrap">
                                                {list_tindakan().map((list, idx)=>(
                                                    <div className="me-2 mb-1" key={idx}>
                                                        <RadioPicker
                                                            label={list.label}
                                                            checked={data.tindakan==list.value}
                                                            onChange={()=>typeFilter({target:{name:"tindakan", value:list.value}})}
                                                            disabled={false}
                                                            id={`tindakan-${idx}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                }
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
                            <th className="px-3">ZScore TB/U</th>
                            <th className="px-3">ZScore BB/U</th>
                            <th className="px-3">ZScore BB/TB</th>
                            <th className="px-3">Status Gizi</th>
                            <th className="px-3">Tindakan</th>
                            <th className="px-3">Rekomendasi Gizi</th>
                            <th className="px-3" width="90"></th>
                        </tr>
                    </thead>
                    <tbody className="border-top-0">
                        {!data.is_loading?
                            <>
                                {data.data.map((list, idx)=>(
                                    <tr key={list}>
                                        <td className="align-middle px-3">{(idx+1)+((data.page-1)*data.per_page)}</td>
                                        <td className="px-3">
                                            {list.data_anak.from_kependudukan?
                                                <>{list.data_anak.nik}</>
                                            :
                                                <span className="text-warning">{list.data_anak.nik}</span>
                                            }
                                        </td>
                                        <td className="px-3">
                                            <button 
                                                type="button" 
                                                className="btn btn-link link-primary p-0"
                                                onClick={e=>showDetailKK(list.data_anak.no_kk)}
                                            >
                                                {list.data_anak.no_kk}
                                            </button>
                                        </td>
                                        <td className="px-3">{list.data_anak.nama_lengkap}</td>
                                        <td className="px-3">{jenkel(list.data_anak.jenis_kelamin)}</td>
                                        <td className="px-3">{list.data_anak.tgl_lahir}</td>
                                        <td className="px-3">{list.berat_badan_lahir}</td>
                                        <td className="px-3">{list.tinggi_badan_lahir}</td>
                                        <td className="px-3">
                                            {list.data_anak?.ibu?.nama_lengkap}, No. WA: {list.data_anak?.ibu?.no_wa}
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
                                        <td className="px-3">{getBulan(list.usia_saat_ukur)}</td>
                                        <td className="px-3">{moment(list.created_at).format("YYYY-MM-DD")}</td>
                                        <td className="px-3">{list.berat_badan}</td>
                                        <td className="px-3">{list.tinggi_badan}</td>
                                        <td className="px-3">{list.hasil_tinggi_badan_per_umur.split("_").join(" ")}</td>
                                        <td className="px-3">{valueBBU(list.hasil_berat_badan_per_umur)}</td>
                                        <td className="px-3">{list.hasil_berat_badan_per_tinggi_badan.split("_").join(" ")}</td>
                                        <td className="px-3">{zScoreTBU(list.tinggi_badan, list.data_anak.jenis_kelamin.toUpperCase(), list.usia_saat_ukur)}</td>
                                        <td className="px-3">{zScoreBBU(list.berat_badan, list.data_anak.jenis_kelamin.toUpperCase(), list.usia_saat_ukur)}</td>
                                        <td className="px-3">{zScoreBBTB(list.berat_badan, list.tinggi_badan, list.data_anak.jenis_kelamin.toUpperCase(), list.usia_saat_ukur)}</td>
                                        <td className="px-3">{valueStatusGizi(list.hasil_status_gizi)}</td>
                                        <td className="px-3">{valueTindakan(list.hasil_status_gizi, list.hasil_berat_badan_per_umur)}</td>
                                        <td className="px-3"></td>
                                        <td valign="middle" className="text-nowrap p-1 px-3 h-100">
                                            <div className="d-flex align-items-center h-100">
                                                <button type="button" className="btn btn-light py-0 px-2" onClick={()=>toggleDetailSkrining(list)}>
                                                    <FiInfo className="icon me-1"/>
                                                    Detail
                                                </button>
                                                <button type="button" className="btn btn-secondary py-0 px-2 ms-1" onClick={()=>toggleEditSkrining(list)}>
                                                    <FiEdit className="icon me-1"/>
                                                    Edit
                                                </button>
                                                <button type="button" className="btn btn-danger py-0 px-2 ms-1" onClick={()=>showConfirmHapus(list)}>
                                                    <FiTrash className="icon me-1"/>
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data.data.length==0&&
                                    <tr>
                                        <td colSpan="30" className="text-center">Data tidak ditemukan!</td>
                                    </tr>
                                }
                            </>
                        :
                            <tr>
                                <td colSpan={30} className="text-center">
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
                    <div>Halaman {data.page} dari {data.last_page}</div>
                </div>
                <div className="d-flex align-items-center me-auto ms-3">
                    <select className="form-select" name="per_page" value={data.per_page} onChange={setPerPage}>
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
                            {"btn-primary":data.page>1}
                        )}
                        disabled={data.page<=1}
                        onClick={()=>goToPage(data.page-1)}
                    >
                        <FiChevronLeft/>
                        Prev
                    </button>
                    <button 
                        className={classNames(
                            "btn",
                            "border-0",
                            {"btn-primary":data.page<data.last_page},
                            "ms-2"
                        )}
                        disabled={data.page>=data.last_page}
                        onClick={()=>goToPage(data.page+1)}
                    >
                        Next
                        <FiChevronRight/>
                    </button>
                </div>
            </div>
        </>
    )
}

//TAMBAH SKRINING
const TambahSkrining=({data, hideModal, addSkrining, login_data, request, kecamatan_form})=>{
    const [search_loading, setSearchLoading]=useState(false)
    const [edit_penduduk, setEditPenduduk]=useState({
        is_open:false,
        data:{},
        setPenduduk:()=>{}
    })

    //QUERY, MUTATION
    const searchNIK=(formik)=>{
        const resetForm=new Promise((resolve, reject)=>{
            formik.setFieldValue("berat_badan_lahir", "")
            formik.setFieldValue("tinggi_badan_lahir", "")
            formik.setFieldValue("data_anak", {})
            formik.setFieldValue("old_skrining", {})
            formik.setFieldValue("berat_badan", "")
            formik.setFieldValue("tinggi_badan", "")
            setSearchLoading(true)

            resolve(true)
        })

        resetForm.then(async res=>{
            //old skrining
            const data_old_skrining=await request.apiGetSkriningNIK(formik.values.nik_anak.toString().trim()).catch(err=>false)
            if(data_old_skrining!==false){
                formik.setFieldValue("berat_badan_lahir", data_old_skrining.data.berat_badan_lahir)
                formik.setFieldValue("tinggi_badan_lahir", data_old_skrining.data.tinggi_badan_lahir)
                formik.setFieldValue("data_anak", data_old_skrining.data.data_anak)
                setSearchLoading(false)
            }
            else{
                //lahir
                let lahir={
                    berat_badan_lahir:"",
                    tinggi_badan_lahir:""
                }
                const data_lahir=await request.apiGetDataLahir(formik.values.nik_anak.toString().trim()).catch(err=>false)
                if(data_lahir!==false && data_lahir.data!==null){
                    lahir={
                        berat_badan_lahir:data_lahir.data.berat_badan,
                        tinggi_badan_lahir:data_lahir.data.tinggi_badan
                    }
                }

                //penduduk
                const data_penduduk=await request.apiGetPenduduk(formik.values.nik_anak.toString().trim()).catch(err=>false)
                if(data_penduduk!==false && !isUndefined(data_penduduk.data.nik)){
                    let data_anak={}
                    data_anak={
                        id_penduduk:"",
                        nik:data_penduduk.data.nik,
                        no_kk:data_penduduk.data.kk,
                        nama_lengkap:data_penduduk.data.nama,
                        tempat_lahir:data_penduduk.data.tempat_lahir,
                        tgl_lahir:data_penduduk.data.tanggal_lahir,
                        jenis_kelamin:jenkelReverse(data_penduduk.data.jenis_kelamin.nama),
                        provinsi:{
                            id:data_penduduk.data.provinsi!==null?data_penduduk.data.provinsi.id:"",
                            nama:data_penduduk.data.provinsi!==null?data_penduduk.data.provinsi.nama:"",
                        },
                        kabupaten_kota:{
                            id:data_penduduk.data.kota!==null?data_penduduk.data.kota.id:"",
                            nama:data_penduduk.data.kota!==null?data_penduduk.data.kota.nama:"",
                        },
                        kecamatan:{
                            id:data_penduduk.data.kecamatan!==null?data_penduduk.data.kecamatan.id:"",
                            nama:data_penduduk.data.kecamatan!==null?data_penduduk.data.kecamatan.nama:"",
                        },
                        desa:{
                            id:data_penduduk.data.desa!==null?data_penduduk.data.desa.id:"",
                            nama:data_penduduk.data.desa!==null?data_penduduk.data.desa.nama:"",
                        },
                        alamat_detail:{
                            dusun:"",
                            jalan:"",
                            rt:data_penduduk.data.rt,
                            rw:data_penduduk.data.rw
                        },
                        ibu:{
                            id_penduduk:"",
                            nik:data_penduduk.data.ibu!==null?data_penduduk.data.ibu.nik:"",
                            nama_lengkap:data_penduduk.data.ibu!==null?data_penduduk.data.ibu.nama:"",
                            no_wa:""
                        },
                        data_status:data_penduduk.data.data_status,
                        from_kependudukan:true
                    }

                    //set
                    formik.setFieldValue("berat_badan_lahir", lahir.berat_badan_lahir)
                    formik.setFieldValue("tinggi_badan_lahir", lahir.tinggi_badan_lahir)
                    formik.setFieldValue("data_anak", data_anak)
                    setSearchLoading(false)
                }
                else{
                    MySwal.fire({
                        title: "Data Tidak Ditemukan!",
                        text: "Apakah anda ingin menambahkan data balita manual?",
                        icon: "question",
                        showCancelButton: true,
                        confirmButtonText: 'Ya, Tambah Data!',
                        cancelButtonText: 'Batal!',
                        reverseButtons: true,
                        customClass:{
                            popup:"w-auto"
                        }
                    })
                    .then(async result=>{
                        if(result.isDismissed){
                            setSearchLoading(false)
                        }
                        if(result.isConfirmed){
                            //data
                            let data_anak={
                                id_penduduk:"",
                                nik:formik.values.nik_anak.toString().trim(),
                                no_kk:"",
                                nama_lengkap:"",
                                tempat_lahir:"",
                                tgl_lahir:"",
                                jenis_kelamin:"",
                                provinsi:{
                                    id:"",
                                    nama:""
                                },
                                kabupaten_kota:{
                                    id:"",
                                    nama:""
                                },
                                kecamatan:{
                                    id:"",
                                    nama:""
                                },
                                desa:{
                                    id:"",
                                    nama:""
                                },
                                alamat_detail:{
                                    dusun:"",
                                    jalan:"",
                                    rt:"",
                                    rw:""
                                },
                                ibu:{
                                    id_penduduk:"",
                                    nik:"",
                                    nama_lengkap:"",
                                    no_wa:""
                                },
                                data_status:"",
                                from_kependudukan:false
                            }

                            //set
                            formik.setFieldValue("berat_badan_lahir", lahir.berat_badan_lahir)
                            formik.setFieldValue("tinggi_badan_lahir", lahir.tinggi_badan_lahir)
                            formik.setFieldValue("data_anak", data_anak)
                            setSearchLoading(false)
                        }
                    })
                }
            }
        })
    }

    //actions
    const showModalEditPenduduk=(data, formik)=>{
        setEditPenduduk({
            is_open:true,
            data:data,
            setPenduduk:(data)=>formik.setFieldValue("data_anak", data)
        })
    }
    const hideModalEditPenduduk=()=>{
        setEditPenduduk({
            is_open:false,
            data:{},
            formik:null
        })
    }

    //helpers
    const jenkelReverse=val=>{
        if(val=="Laki Laki"){
            return "L"
        }
        else if(val=="Perempuan"){
            return "P"
        }
    }

    return (
        <>
            <Modal 
                show={data.is_open} 
                className="modal-blur" 
                onHide={hideModal} 
                backdrop="static" 
                size="sm"
                scrollable
            >
                <Formik
                    initialValues={{
                        id_user:login_data.role=="posyandu"?login_data.id_user:"",
                        nik_anak:"",
                        input_bulan:0,
                        data_anak:{},
                        old_skrining:{},
                        berat_badan_lahir:"",
                        tinggi_badan_lahir:"",
                        berat_badan:"",
                        tinggi_badan:""
                    }}
                    onSubmit={addSkrining}
                    validationSchema={
                        yup.object().shape({
                            nik_anak:yup.string().required(),
                            input_bulan:yup.number().required(),
                            berat_badan_lahir:yup.number().required(),
                            tinggi_badan_lahir:yup.number().required(),
                            berat_badan:yup.number().required(),
                            tinggi_badan:yup.number().required(),
                            data_anak:yup.object().shape({
                                nama_lengkap:yup.string().required(),
                                nik:yup.string().required(),
                                jenis_kelamin:yup.string().required(),
                                tgl_lahir:yup.string().required()
                            })
                        })
                    }
                >
                    {formik=>(
                        <>
                            <Modal.Header closeButton>
                                <h4 className="modal-title">Cek Antropometri</h4>
                            </Modal.Header>
                            <form onSubmit={formik.handleSubmit}>
                                <Modal.Body>
                                    <div className='w-100 d-flex flex-column'>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Usia Sampai</label>
                                            <div className="input-group">
                                                <select 
                                                    name="input_bulan" 
                                                    value={formik.values.input_bulan} 
                                                    className="form-select" 
                                                    onChange={formik.handleChange}
                                                >
                                                    <option value="0">Bulan Ini</option>
                                                    <option value="-1">1 Bulan Lalu</option>
                                                    <option value="-2">2 Bulan Lalu</option>
                                                    <option value="-3">3 Bulan Lalu</option>
                                                </select>
                                            </div>
                                        </div>
                                        {login_data.role!="posyandu"&&
                                            <div className="mb-3">
                                                <label className="my-1 me-2 fw-semibold" for="country">Posyandu</label>
                                                <div className="input-group">
                                                    <select 
                                                        name="id_user" 
                                                        value={formik.values.id_user} 
                                                        className="form-select" 
                                                        onChange={formik.handleChange}
                                                    >
                                                        <option value="">-- Pilih Posyandu</option>
                                                        {kecamatan_form.map(kec=>(
                                                            <optgroup label={kec.region} key={kec}>
                                                                {kec.desa.map(des=>(
                                                                    <>
                                                                        {des.posyandu.map(pos=>(
                                                                            <option value={pos.id_user} key={pos}>{pos.nama_lengkap}</option>
                                                                        ))}
                                                                    </>
                                                                ))}
                                                            </optgroup>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        }
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">NIK Anak<span className="text-danger">*</span></label>
                                            <div className="input-group">
                                                <input 
                                                    type="text" 
                                                    className="form-control"
                                                    name="nik_anak"
                                                    onChange={formik.handleChange}
                                                    value={formik.values.nik_anak}
                                                    disabled={!isUndefined(formik.values.data_anak.nik)?true:false}
                                                />
                                                {!isUndefined(formik.values.data_anak.nik)?
                                                    <button 
                                                        className="btn btn-danger btn-icon"
                                                        type="button"
                                                        onClick={e=>{
                                                            formik.setFieldValue("berat_badan_lahir", "")
                                                            formik.setFieldValue("tinggi_badan_lahir", "")
                                                            formik.setFieldValue("data_anak", {})
                                                            formik.setFieldValue("berat_badan", "")
                                                            formik.setFieldValue("tinggi_badan", "")
                                                        }}
                                                        title="Batal"
                                                    >
                                                        <FiX/>
                                                    </button>
                                                :
                                                    <button 
                                                        className="btn btn-secondary btn-icon"
                                                        type="button"
                                                        onClick={e=>searchNIK(formik)}
                                                        disabled={search_loading}
                                                        title="Gunakan"
                                                    >
                                                        {!search_loading?
                                                            <>
                                                                <FiArrowRight/>
                                                            </>
                                                        :
                                                            <>
                                                                <Spinner
                                                                    as="span"
                                                                    animation="border"
                                                                    size="sm"
                                                                    role="status"
                                                                    aria-hidden="true"
                                                                />
                                                            </>
                                                        }
                                                    </button>
                                                }
                                            </div>
                                            {!isUndefined(formik.values.data_anak.id_penduduk)&&
                                                <table className="mt-2">
                                                    <tr>
                                                        <th valign="top" className="fw-semibold" width="150">Nama Lengkap </th>
                                                        <td valign="top" width="15"> : </td>
                                                        <td>{formik.values.data_anak.nama_lengkap}</td>
                                                    </tr>
                                                    <tr>
                                                        <th valign="top" className="fw-semibold">NIK</th>
                                                        <td valign="top"> : </td>
                                                        <td>{formik.values.data_anak.nik}</td>
                                                    </tr>
                                                    <tr>
                                                        <th valign="top" className="fw-semibold">Nama Ibu</th>
                                                        <td valign="top"> : </td>
                                                        <td>{formik.values.data_anak.ibu?.nama_lengkap}</td>
                                                    </tr>
                                                    <tr>
                                                        <th valign="top" className="fw-semibold">NIK Ibu</th>
                                                        <td valign="top"> : </td>
                                                        <td>{formik.values.data_anak.ibu?.nik}</td>
                                                    </tr>
                                                    <tr>
                                                        <th valign="top" className="fw-semibold">Alamat </th>
                                                        <td valign="top"> : </td>
                                                        <td>{' '}
                                                            {formik.values.data_anak?.desa?.nama}, {' '}
                                                            {formik.values.data_anak?.kecamatan?.nama}, {' '}
                                                            {formik.values.data_anak?.kabupaten_kota?.nama}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td colSpan={3}>
                                                            <button 
                                                                className="btn btn-link link-primary p-0 text-decoration-underline"
                                                                type="button"
                                                                onClick={e=>showModalEditPenduduk(formik.values.data_anak, formik)}
                                                            >
                                                                <FiEdit className="me-1"/>
                                                                Edit Penduduk
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </table>
                                            }
                                        </div>
                                        {!isUndefined(formik.values.data_anak.nik)&&
                                            <>
                                                <div className="mb-3">
                                                    <label className="my-1 me-2 fw-semibold" for="country">Berat Badan Lahir<span className="text-danger">*</span></label>
                                                    <NumberFormat
                                                        displayType="input"
                                                        suffix=" Kg"
                                                        value={formik.values.berat_badan_lahir}
                                                        onValueChange={values=>{
                                                            const {value}=values
                                                            formik.setFieldValue("berat_badan_lahir", value)
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
                                                        value={formik.values.tinggi_badan_lahir}
                                                        onValueChange={values=>{
                                                            const {value}=values
                                                            formik.setFieldValue("tinggi_badan_lahir", value)
                                                        }}
                                                        className="form-control"
                                                        placeholder="Cm"
                                                    />
                                                    <span className="text-muted">Ukur dalam keadaan telentang!</span>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="my-1 me-2 fw-semibold" for="country">Berat Badan Saat Timbang<span className="text-danger">*</span></label>
                                                    <NumberFormat
                                                        displayType="input"
                                                        suffix=" Kg"
                                                        value={formik.values.berat_badan}
                                                        onValueChange={values=>{
                                                            const {value}=values
                                                            formik.setFieldValue("berat_badan", value)
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
                                                        value={formik.values.tinggi_badan}
                                                        onValueChange={values=>{
                                                            const {value}=values
                                                            formik.setFieldValue("tinggi_badan", value)
                                                        }}
                                                        className="form-control"
                                                        placeholder="Cm"
                                                    />
                                                    <span className="text-muted">Umur <strong>24</strong> Bulan ukur dalam keadaan telentang!</span>
                                                </div>
                                            </>
                                        }
                                    </div>
                                </Modal.Body>
                                <Modal.Footer className="mt-3 border-top pt-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-link text-gray me-auto" 
                                        onClick={hideModal}
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={formik.isSubmitting||!(formik.dirty&&formik.isValid)}
                                    >
                                        Save Changes
                                    </button>
                                </Modal.Footer>
                            </form>
                        </>
                    )}
                </Formik>
            </Modal>

            <EditPenduduk 
                data={edit_penduduk}
                hideModal={hideModalEditPenduduk}
                request={request}
            />
        </>
    )
}

//TAMBAH SKRINING
const EditSkrining=({data, hideModal, updateSkrining, request})=>{

    return (
        <>
            <Modal 
                show={data.is_open} 
                className="modal-blur" 
                onHide={hideModal} 
                backdrop="static" 
                size="sm"
                scrollable
            >
                <Formik
                    initialValues={data.data}
                    onSubmit={updateSkrining}
                    validationSchema={
                        yup.object().shape({
                            id_skrining_balita:yup.string().required(),
                            berat_badan_lahir:yup.number().required(),
                            tinggi_badan_lahir:yup.number().required(),
                            berat_badan:yup.number().required(),
                            tinggi_badan:yup.number().required()
                        })
                    }
                >
                    {formik=>(
                        <>
                            <Modal.Header closeButton>
                                <h4 className="modal-title">Edit Antropometri</h4>
                            </Modal.Header>
                            <form onSubmit={formik.handleSubmit}>
                                <Modal.Body>
                                    <div className='w-100 d-flex flex-column'>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Berat Badan Lahir<span className="text-danger">*</span></label>
                                            <NumberFormat
                                                displayType="input"
                                                suffix=" Kg"
                                                value={formik.values.berat_badan_lahir}
                                                onValueChange={values=>{
                                                    const {value}=values
                                                    formik.setFieldValue("berat_badan_lahir", value)
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
                                                value={formik.values.tinggi_badan_lahir}
                                                onValueChange={values=>{
                                                    const {value}=values
                                                    formik.setFieldValue("tinggi_badan_lahir", value)
                                                }}
                                                className="form-control"
                                                placeholder="Cm"
                                            />
                                            <span className="text-muted">Ukur dalam keadaan telentang!</span>
                                        </div>
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">Berat Badan Saat Timbang<span className="text-danger">*</span></label>
                                            <NumberFormat
                                                displayType="input"
                                                suffix=" Kg"
                                                value={formik.values.berat_badan}
                                                onValueChange={values=>{
                                                    const {value}=values
                                                    formik.setFieldValue("berat_badan", value)
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
                                                value={formik.values.tinggi_badan}
                                                onValueChange={values=>{
                                                    const {value}=values
                                                    formik.setFieldValue("tinggi_badan", value)
                                                }}
                                                className="form-control"
                                                placeholder="Cm"
                                            />
                                            <span className="text-muted">Umur 24 Bulan ukur dalam keadaan telentang! contoh isian : 45, 45.5, 46</span>
                                        </div>
                                    </div>
                                </Modal.Body>
                                <Modal.Footer className="mt-3 border-top pt-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-link text-gray me-auto" 
                                        onClick={hideModal}
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={formik.isSubmitting||!(formik.isValid)}
                                    >
                                        Save Changes
                                    </button>
                                </Modal.Footer>
                            </form>
                        </>
                    )}
                </Formik>
            </Modal>
        </>
    )
}

//EDIT PENDUDUK
const EditPenduduk=({data, hideModal, request})=>{
    const [provinsi_form, setProvinsiForm]=useState([])
    const [kabupaten_kota_form, setKabupatenKotaForm]=useState([])
    const [kecamatan_form, setKecamatanForm]=useState([])
    const [desa_form, setDesaForm]=useState([])

    useEffect(()=>{
        //provinsi
        fetchProvinsiForm()
        //kabupaten kota
        if(!isUndefined(data.data.kabupaten_kota) && data.data.kabupaten_kota.id.toString().trim()!=""){
            fetchKabupatenKotaForm(data.data.provinsi.id)
        }
        //kecamatan
        if(!isUndefined(data.data.kecamatan) && data.data.kecamatan.id.toString().trim()!=""){
            fetchKecamatanForm(data.data.kabupaten_kota.id)
        }
        //desa
        if(!isUndefined(data.data.desa) && data.data.desa.id.toString().trim()!=""){
            fetchDesaForm(data.data.kecamatan.id)
        }

        return ()=>{
            setProvinsiForm([])
            setKabupatenKotaForm([])
            setKecamatanForm([])
            setDesaForm([])
        }
    }, [data.data])

    //query, mutable
    const fetchProvinsiForm=async ()=>{
        setProvinsiForm([])
        await request.apiMadiunKabGetsProvinsiForm()
        .then(data=>{
            setProvinsiForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    const fetchKabupatenKotaForm=async (province_id)=>{
        setKabupatenKotaForm([])
        await request.apiMadiunKabGetsKabupatenKotaForm(province_id)
        .then(data=>{
            setKabupatenKotaForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    const fetchKecamatanForm=async (regency_id)=>{
        setKecamatanForm([])
        await request.apiMadiunKabGetsKecamatanForm(regency_id)
        .then(data=>{
            setKecamatanForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    const fetchDesaForm=async (district_id)=>{
        setDesaForm([])
        await request.apiMadiunKabGetsDesaForm(district_id)
        .then(data=>{
            setDesaForm(data.data)
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }

    return (
        <Modal 
            show={data.is_open} 
            onHide={hideModal} 
            backdrop="static" 
            size="sm" 
            className="modal-nested"
            backdropClassName="backdrop-nested" 
            scrollable
        >
            <Formik
                initialValues={data.data}
                onSubmit={(values, actions)=>{
                    data.setPenduduk(values)
                    hideModal()
                }}
            >
                {formik=>(
                    <form onSubmit={formik.handleSubmit}>
                        <Modal.Header closeButton>
                            <h4 className="modal-title">Edit Penduduk</h4>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">NIK</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="nik"
                                    value={formik.values.nik}
                                    disabled
                                />
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">No. KK</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="no_kk"
                                    value={formik.values.no_kk}
                                    onChange={formik.handleChange}
                                />
                            </div>
                            <div className="mb-1">
                                <label className="my-1 me-2" for="country">Provinsi</label>
                                <select 
                                    name="provinsi.id" 
                                    value={formik.values.provinsi.id} 
                                    className="form-select" 
                                    onChange={e=>{
                                        let value

                                        if(e.target.value!=""){
                                            fetchKabupatenKotaForm(e.target.value)
                                            value=provinsi_form.filter(f=>f.id.toString()==e.target.value)[0]
                                        }
                                        else{
                                            setKabupatenKotaForm([])
                                            value={id:"", nama:""}
                                        }

                                        setKecamatanForm([])
                                        setDesaForm([])
                                        formik.setFieldValue("provinsi", value)
                                        formik.setFieldValue("kabupaten_kota", {id:"", nama:""})
                                        formik.setFieldValue("kecamatan", {id:"", nama:""})
                                        formik.setFieldValue("desa", {id:"", nama:""})
                                    }}
                                >
                                    <option value="">-- Pilih Provinsi</option>
                                    {provinsi_form.map(kf=>(
                                        <option key={kf.id} value={kf.id}>{kf.nama}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-1">
                                <label className="my-1 me-2" for="country">Kabupaten/Kota</label>
                                <select 
                                    name="kabupaten_kota.id" 
                                    value={formik.values.kabupaten_kota.id} 
                                    className="form-select" 
                                    onChange={e=>{
                                        let value

                                        if(e.target.value!=""){
                                            fetchKecamatanForm(e.target.value)
                                            value=kabupaten_kota_form.filter(f=>f.id.toString()==e.target.value)[0]
                                        }
                                        else{
                                            setKecamatanForm([])
                                            value={id:"", nama:""}
                                        }

                                        setDesaForm([])
                                        formik.setFieldValue("kabupaten_kota", value)
                                        formik.setFieldValue("kecamatan", {id:"", nama:""})
                                        formik.setFieldValue("desa", {id:"", nama:""})
                                    }}
                                >
                                    <option value="">-- Pilih Kabupaten/Kota</option>
                                    {kabupaten_kota_form.map(kf=>(
                                        <option key={kf.id} value={kf.id}>{kf.nama}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-1">
                                <label className="my-1 me-2" for="country">Kecamatan</label>
                                <select 
                                    name="kecamatan.id" 
                                    value={formik.values.kecamatan.id} 
                                    className="form-select" 
                                    onChange={e=>{
                                        let value

                                        if(e.target.value!=""){
                                            fetchDesaForm(e.target.value)
                                            value=kecamatan_form.filter(f=>f.id.toString()==e.target.value)[0]
                                        }
                                        else{
                                            setDesaForm([])
                                            value={id:"", nama:""}
                                        }

                                        formik.setFieldValue("kecamatan", value)
                                        formik.setFieldValue("desa", {id:"", nama:""})
                                    }}
                                >
                                    <option value="">-- Pilih Kecamatan</option>
                                    {kecamatan_form.map(kf=>(
                                        <option key={kf.id} value={kf.id}>{kf.nama}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Desa</label>
                                <select 
                                    name="desa.id" 
                                    value={formik.values.desa.id} 
                                    className="form-select" 
                                    onChange={e=>{
                                        let value

                                        if(e.target.value!=""){
                                            value=desa_form.filter(f=>f.id.toString()==e.target.value)[0]
                                        }
                                        else{
                                            value={id:"", nama:""}
                                        }

                                        formik.setFieldValue("desa", value)
                                    }}
                                >
                                    <option value="">-- Pilih Desa</option>
                                    {desa_form.map(kf=>(
                                        <option key={kf.id} value={kf.id}>{kf.nama}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Detail Alamat</label>
                                <div>
                                    <div className="input-group mb-1">
                                        <span className="input-group-text">Dusun</span>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder=""
                                            name="alamat_detail.dusun"
                                            onChange={formik.handleChange}
                                            value={formik.values.alamat_detail.dusun}
                                        />
                                    </div>
                                    <div className="input-group mb-1">
                                        <span className="input-group-text">RW</span>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder=""
                                            name="alamat_detail.rw"
                                            onChange={formik.handleChange}
                                            value={formik.values.alamat_detail.rw}
                                        />
                                    </div>
                                    <div className="input-group mb-1">
                                        <span className="input-group-text">RT</span>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder=""
                                            name="alamat_detail.rt"
                                            onChange={formik.handleChange}
                                            value={formik.values.alamat_detail.rt}
                                        />
                                    </div>
                                    <div className="input-group mb-1">
                                        <span className="input-group-text">Jalan</span>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder=""
                                            name="alamat_detail.jalan"
                                            onChange={formik.handleChange}
                                            value={formik.values.alamat_detail.jalan}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mb-1">
                                <label className="my-1 me-2" for="country">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="nama_lengkap"
                                    onChange={formik.handleChange}
                                    value={formik.values.nama_lengkap}
                                />
                            </div>
                            <div className="mb-1">
                                <label className="my-1 me-2" for="country">Tempat Lahir</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="tempat_lahir"
                                    onChange={formik.handleChange}
                                    value={formik.values.tempat_lahir}
                                />
                            </div>
                            <div className="mb-1">
                                <label className="my-1 me-2" for="country">Tgl Lahir</label>
                                <input 
                                    type="date" 
                                    className="form-control"
                                    name="tgl_lahir"
                                    onChange={formik.handleChange}
                                    value={formik.values.tgl_lahir}
                                />
                            </div>
                            <div className="mb-1">
                                <label className="my-1 me-2" for="country">Jenis Kelamin</label>
                                <select 
                                    className="form-select" 
                                    name="jenis_kelamin"
                                    onChange={formik.handleChange}
                                    value={formik.values.jenis_kelamin}
                                >
                                    <option value="">-- Pilih Jenis Kelamin</option>
                                    <option value="L">Laki Laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="my-1 me-2" for="country">Data Status</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    name="data_status"
                                    onChange={formik.handleChange}
                                    value={formik.values.data_status}
                                />
                            </div>
                            <div className="mb-1">
                                <label className="my-1 me-2" for="country">Data Ibu</label>
                                <div>
                                    <div className="input-group mb-1">
                                        <span className="input-group-text">NIK Ibu</span>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder=""
                                            name="ibu.nik"
                                            onChange={formik.handleChange}
                                            value={formik.values.ibu.nik}
                                        />
                                    </div>
                                    <div className="input-group mb-1">
                                        <span className="input-group-text">Nama Ibu</span>
                                        <input 
                                            type="text" 
                                            className="form-control"  
                                            placeholder=""
                                            name="ibu.nama_lengkap"
                                            onChange={formik.handleChange}
                                            value={formik.values.ibu.nama_lengkap}
                                        />
                                    </div>
                                    <div className="input-group mb-1">
                                        <span className="input-group-text">No. WA</span>
                                        <input 
                                            type="text" 
                                            className="form-control"  
                                            placeholder=""
                                            name="ibu.no_wa"
                                            onChange={formik.handleChange}
                                            value={formik.values.ibu.no_wa}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="mt-3 border-top pt-2">
                            <button 
                                type="button" 
                                className="btn btn-link text-gray me-auto" 
                                onClick={hideModal}
                            >
                                Batal
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={formik.isSubmitting||!(formik.isValid)}
                            >
                                Save Changes
                            </button>
                        </Modal.Footer>
                    </form>
                )}
            </Formik>
        </Modal>
    )
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
                    className="btn btn-link text-gray me-auto" 
                    onClick={hideModal}
                >
                    Tutup
                </button>
            </Modal.Footer>
        </Modal>
    )
}

//DETAIL SKRINING
const DetailSkrining=({data, hideModal})=>{
    const [chart_open, setChartOpen]=useState(false)

    useEffect(()=>{
        if(data.is_open){
            setTimeout(() => {
                setChartOpen(true)
            }, 300);
        }
        else{
            setTimeout(() => {
                setChartOpen(false)
            }, 300);
        }
    }, [data])

    //helpers
    const jenkel=val=>{
        if(val=="L"){
            return "Laki Laki"
        }
        else if(val=="P"){
            return "Perempuan"
        }
    }
    const getBulan=bln=>{
        if(bln>60){
            return "60+ Bulan"
        }
        else{
            return bln+" Bulan"
        }
    }
    const valueBBU=value=>{
        if(value=="gizi_buruk") return "Berat Badan sangat Kurang";
        if(value=="gizi_kurang") return "Berat badan kurang";
        if(value=="gizi_baik") return "Berat badan normal";
        if(value=="gizi_lebih") return "Risiko Berat badan lebih";
        
        return value
    }
    const valueStatusGizi=value=>{
        if(value=="T") return "Tidak Naik (T)"
        if(value=="N") return "Naik (N)"

        return "Tidak Diketahui (O)"
    }
    const valueTindakan=(status_gizi, bbu)=>{
        if(status_gizi=="T") return "rujuk";
        if(bbu!="gizi_baik") return "rujuk";

        return ""
    }


    return (
        <Modal show={data.is_open} className="modal-blur" onHide={hideModal} backdrop="static" size="xl" scrollable>
            <Modal.Header closeButton>
                <h4 className="modal-title">Detail Skrining</h4>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <table cellPadding="5">
                        <tr>
                            <th width="180">NIK</th>
                            <td width="10">:</td>
                            <td>{data.data.data_anak?.nik}</td>
                        </tr>
                        <tr>
                            <th width="180">Nama Balita</th>
                            <td width="10">:</td>
                            <td>{data.data.data_anak?.nama_lengkap}</td>
                        </tr>
                        <tr>
                            <th width="180">Tempat, Tanggal Lahir</th>
                            <td width="10">:</td>
                            <td>{data.data.data_anak?.tempat_lahir}, {data.data.data_anak?.tgl_lahir}</td>
                        </tr>
                        <tr>
                            <th width="180">Jenis Kelamin</th>
                            <td width="10">:</td>
                            <td>{jenkel(data.data.data_anak?.jenis_kelamin)}</td>
                        </tr>
                        <tr>
                            <th valign="top" width="180">Alamat Lengkap</th>
                            <td valign="top" width="10">:</td>
                            <td>
                                Desa {data.data.data_anak?.desa.nama} RT {data.data.data_anak?.alamat_detail.rt} RW {data.data.data_anak?.alamat_detail.rw}<br/>
                                Kecamatan {data.data.data_anak?.kecamatan.nama}<br/>
                                Kabupaten/Kota {data.data.data_anak?.kabupaten_kota.nama}<br/>
                                Provinsi {data.data.data_anak?.provinsi.nama}<br/>
                            </td>
                        </tr>
                    </table>
                    <Tabs
                        defaultActiveKey="skrining"
                        id="tab-detail-skrining-nik"
                        className="mb-3 mt-3"
                    >
                        <Tab eventKey="skrining" title="Data Skrining">
                            <div className="table-responsive mt-3">
                                <table className="table table-hover table-custom table-nowrap mb-0 rounded">
                                    <thead className="thead-light">
                                        <tr className="text-uppercase">
                                            <th className="px-3" width="50">#</th>
                                            <th className="px-3">Posyandu</th>
                                            <th className="px-3">Usia Saat Ukur</th>
                                            <th className="px-3">Tanggal</th>
                                            <th className="px-3">Berat Badan </th>
                                            <th className="px-3">Tinggi Badan</th>
                                            <th className="px-3">TB/U</th>
                                            <th className="px-3">BB/U</th>
                                            <th className="px-3">BB/TB</th>
                                            <th className="px-3">Status Gizi</th>
                                            <th className="px-3">Tindakan</th>
                                            <th className="px-3">Rekomendasi Gizi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="border-top-0">
                                        {!data.is_loading?
                                            <>
                                                {data.skrining.map((list, idx)=>(
                                                    <tr key={list}>
                                                        <td className="align-middle px-3">{(idx+1)}</td>
                                                        <td className="px-3">Desa {list.user_posyandu.desa} - Posy. {list.user_posyandu.nama_lengkap}</td>
                                                        <td className="px-3">{getBulan(list.usia_saat_ukur)}</td>
                                                        <td className="px-3">{moment(list.created_at).format("YYYY-MM-DD")}</td>
                                                        <td className="px-3">{list.berat_badan}</td>
                                                        <td className="px-3">{list.tinggi_badan}</td>
                                                        <td className="px-3">{list.hasil_tinggi_badan_per_umur.split("_").join(" ")}</td>
                                                        <td className="px-3">{valueBBU(list.hasil_berat_badan_per_umur)}</td>
                                                        <td className="px-3">{list.hasil_berat_badan_per_tinggi_badan.split("_").join(" ")}</td>
                                                        <td className="px-3">{valueStatusGizi(list.hasil_status_gizi)}</td>
                                                        <td className="px-3">{valueTindakan(list.hasil_status_gizi, list.hasil_berat_badan_per_umur)}</td>
                                                        <td></td>
                                                    </tr>
                                                ))}
                                                {data.data.length==0&&
                                                    <tr>
                                                        <td colSpan="12" className="text-center">Data tidak ditemukan!</td>
                                                    </tr>
                                                }
                                            </>
                                        :
                                            <tr>
                                                <td colSpan={12} className="text-center">
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
                        </Tab>
                        <Tab eventKey="graph" title="Grafik KMS">
                            <div className="d-flex flex-column w-100" style={{overflowX:"auto"}}>
                                {chart_open&&
                                    <ChartSkriningDetail
                                        data={data.skrining}
                                        jenkel={data.data.data_anak?.jenis_kelamin}
                                    />
                                }
                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </Modal.Body>
            <Modal.Footer className="mt-3 border-top pt-2">
                <button 
                    type="button" 
                    className="btn btn-link text-gray me-auto" 
                    onClick={hideModal}
                >
                    Tutup
                </button>
            </Modal.Footer>
        </Modal>
    )
}

export default withRouter(withAuth(Skrining))