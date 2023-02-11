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
import { access_token, ceil_with_enclosure, excelToMomentDate, file_to_workbook, isUndefined, is_object, login_data } from "../../../config/config"
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
import { TbArrowLeft, TbChevronLeft, TbChevronRight, TbDownload, TbPlus, TbUpload } from "react-icons/tb"
import dynamic from "next/dynamic"
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiDownload, FiUpload } from "react-icons/fi"

const Map=dynamic(()=>import("../../../component/modules/map"), {ssr:false})
const Chart=dynamic(()=>import("react-apexcharts"), {ssr:false})


class Stunting4118 extends React.Component{
    state={
        login_data:{},
        kecamatan_form:[],
        stunting_4118:{
            data:[],
            page:1,
            per_page:10,
            q:"",
            district_id:"",
            last_page:0,
            is_loading:false
        },
        import_stunting_4118:{
            is_open:false,
            kecamatan_form:[],
            stunting_4118:{
                id_kecamatan:"",
                data:[]
            }
        },
        detail_kk:{
            is_open:false,
            data:{}
        },
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
        download_template:{
            is_open:false,
            kecamatan_form:[],
            template:{}
        },
    }

    componentDidMount=()=>{
        this.getsStunting4118()
        this.getsKecamatanForm()
        this.getsPemetaan()
        this.getsBarChart()
    }
    getsPemetaan=async ()=>{
        const {pemetaan}=this.state

        await api(access_token()).get("/stunting_4118/summary_kecamatan")
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

        await api(access_token()).get("/stunting_4118/summary_kecamatan")
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
    getsKecamatanForm=async()=>{
        api(access_token()).get("/region/type/kecamatan", {
            params:{
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
    getsStunting4118=async(reset=false)=>{
        const {stunting_4118}=this.state

        this.setLoading(true)
        await api(access_token()).get("/stunting_4118", {
            params:{
                page:reset?1:stunting_4118.page,
                per_page:stunting_4118.per_page,
                q:stunting_4118.q,
                district_id:stunting_4118.district_id
            }
        })
        .then(res=>{
            this.setState({
                stunting_4118:update(this.state.stunting_4118, {
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
            stunting_4118:update(this.state.stunting_4118, {
                page:{$set:page}
            })
        }, ()=>{
            this.getsStunting4118()
        })
    }
    setPerPage=e=>{
        const target=e.target

        this.setState({
            stunting_4118:update(this.state.stunting_4118, {
                per_page:{$set:target.value}
            })
        }, ()=>{
            this.getsStunting4118(true)
        })
    }
    typeFilter=e=>{ 
        const {target}=e

        this.setState({
            stunting_4118:update(this.state.stunting_4118, {
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
                        this.getsStunting4118(true)
                    }, 500);
                break
                default:
                    this.getsStunting4118(true)
            }
        })
    }
    setLoading=loading=>{
        this.setState({
            stunting_4118:update(this.state.stunting_4118, {
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
        if(bln!==null){
            return bln+" Bulan" 
        }
        return ""
    }
    valueBBU=value=>{
        if(value=="gizi_buruk") return "Berat Badan sangat Kurang";
        if(value=="gizi_kurang") return "Berat badan kurang";
        if(value=="gizi_baik") return "Berat badan normal";
        if(value=="gizi_lebih") return "Risiko Berat badan lebih";
        
        return value
    }

    //import
    selectFile=async e=>{
        file_to_workbook(e.target.files[0], async data=>{
            let penduduk_sheet=utils.sheet_to_json(data.Sheets[data.SheetNames[0]], {header:1})

            let penduduk_data=[]
            penduduk_sheet.map((row, idx)=>{
                if(idx>0){
                    const ttl=!isUndefined(row[4])?row[4].split(","):""

                    let jenkel=!isUndefined(row[5])?row[5]:""
                    if(jenkel=="LAKI-LAKI") jenkel="L"
                    else if(jenkel=="PEREMPUAN") jenkel="P"

                    penduduk_data=penduduk_data.concat([{
                        data_anak:{
                            nik:!isUndefined(row[2])?row[2]:"",
                            no_kk:!isUndefined(row[1])?row[1]:"",
                            nama_lengkap:!isUndefined(row[3])?row[3]:"",
                            tempat_lahir:ttl!==""?ttl[0]:"",
                            tgl_lahir:ttl!==""?moment(ttl[1], "DD-MM-YYYY").format("YYYY-MM-DD"):"",
                            jenis_kelamin:jenkel,
                            ibu:!isUndefined(row[6])?{
                                nik:row[6],
                                nama_lengkap:!isUndefined(row[7])?row[7]:""
                            }:"",
                            ayah:!isUndefined(row[8])?{
                                nik:row[8],
                                nama_lengkap:!isUndefined(row[9])?row[9]:""
                            }:"",
                            alamat_detail:{
                                desa:!isUndefined(row[10])?row[10]:"",
                                dusun:!isUndefined(row[11])?row[11]:"",
                                rw:!isUndefined(row[12])?row[12].toString():"",
                                rt:!isUndefined(row[13])?row[13].toString():"",
                                jalan:!isUndefined(row[14])?row[14]:"",
                            }
                        },
                        berat_badan_lahir:!isUndefined(row[15])?Number(row[15]):"",
                        tinggi_badan_lahir:!isUndefined(row[16])?Number(row[16]):"",
                        berat_badan:!isUndefined(row[17])?Number(row[17]):"",
                        tinggi_badan:!isUndefined(row[18])?Number(row[18]):""
                    }])
                }
            })

            //data
            this.setState({
                import_stunting_4118:{
                    is_open:!this.state.import_stunting_4118.is_open,
                    kecamatan_form:this.state.kecamatan_form,
                    stunting_4118:{
                        id_kecamatan:"",
                        data:penduduk_data
                    }
                }
            })
        })
    }
    hideImport=()=>{
        this.setState({
            import_stunting_4118:{
                is_open:false,
                kecamatan_form:[],
                stunting_4118:{
                    id_kecamatan:"",
                    data:[]
                }
            }
        })
    }
    importStunting4118=async(values, actions)=>{
        await api(access_token()).post("/stunting_4118/type/multiple", {
            id_kecamatan:values.id_kecamatan,
            skrining:values.data
        })
        .then(res=>{
            this.getsStunting4118(true)
            this.hideImport()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/login")
            }
            
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Import Data Failed! ", {position:"bottom-center"})
        })
    }
    importStunting4118Schema=()=>{
        return yup.object().shape({
            id_kecamatan:yup.string().required()
        })
    }

    //export/download
    toggleDownload=()=>{
        this.setState({
            download_template:{
                is_open:!this.state.download_template.is_open,
                kecamatan_form:this.state.kecamatan_form,
                template:{
                    id_kecamatan:""
                }
            }
        })
    }
    getRawJenkel=jenkel=>{
        if(jenkel=="L"){
            return "LAKI-LAKI"
        }
        else if(jenkel=="P"){
            return "PEREMPUAN"
        }
    }
    download=async (values, actions)=>{
        const data=await api(access_token()).get("/stunting_4118", {
            params:{
                page:1,
                per_page:"",
                q:"",
                district_id:values.id_kecamatan
            }
        })
        .then(res=>res.data.data)
        .catch(err=>[])

        const header=[
            {
                value:"NO",
                fontWeight:'bold'
            },
            {
                value: 'NO. KK',
                fontWeight: 'bold'
            },
            {
                value: 'NIK',
                fontWeight: 'bold'
            },
            {
                value: 'NAMA LENGKAP',
                fontWeight: 'bold'
            },
            {
                value: 'TEMPAT & TGL LAHIR',
                fontWeight: 'bold'
            },
            {
                value: 'JENIS KELAMIN',
                fontWeight: 'bold'
            },
            {
                value: 'NIK IBU',
                fontWeight: 'bold'
            },
            {
                value: 'NAMA IBU',
                fontWeight: 'bold'
            },
            {
                value: 'NIK AYAH',
                fontWeight: 'bold'
            },
            {
                value: 'NAMA AYAH',
                fontWeight: 'bold'
            },
            {
                value: 'DESA',
                fontWeight: 'bold'
            },
            {
                value: 'DUSUN',
                fontWeight: 'bold'
            },
            {
                value: 'RW',
                fontWeight: 'bold'
            },
            {
                value: 'RT',
                fontWeight: 'bold'
            },
            {
                value: 'JALAN',
                fontWeight: 'bold'
            },
            {
                value: 'BERAT BADAN LAHIR',
                fontWeight: 'bold'
            },
            {
                value: 'TINGGI BADAN LAHIR',
                fontWeight: 'bold'
            },
            {
                value: 'BERAT BADAN',
                fontWeight: 'bold'
            },
            {
                value: 'TINGGI BADAN',
                fontWeight: 'bold'
            }
        ]

        let data_excel=[]
        await data.map((list, idx)=>{
            const tgl_lahir=moment(list.data_anak.tgl_lahir, "YYYY-MM-DD").format("DD-MM-YYYY")
            const d=list.data_anak

            data_excel.push([
                {
                    type:Number,
                    value:idx+1
                },
                {
                    type:String,
                    value:d.no_kk.toString()
                },
                {
                    type:String,
                    value:d.nik.toString()
                },
                {
                    type:String,
                    value:d.nama_lengkap.toString()
                },
                {
                    type:String,
                    value:d.tempat_lahir+","+tgl_lahir
                },
                {
                    type:String,
                    value:this.getRawJenkel(d.jenis_kelamin)
                },
                {
                    type:String,
                    value:is_object(d.ibu)?d.ibu.nik.toString():null
                },
                {
                    type:String,
                    value:is_object(d.ibu)?d.ibu.nama_lengkap.toString():null
                },
                {
                    type:String,
                    value:is_object(d.ayah)?d.ayah.nik.toString():null
                },
                {
                    type:String,
                    value:is_object(d.ayah)?d.ayah.nama_lengkap.toString():null
                },
                {
                    type:String,
                    value:is_object(d.alamat_detail)?d.alamat_detail.desa.toString():null
                },
                {
                    type:String,
                    value:is_object(d.alamat_detail)?d.alamat_detail.dusun.toString():null
                },
                {
                    type:String,
                    value:is_object(d.alamat_detail)?d.alamat_detail.rw.toString():null
                },
                {
                    type:String,
                    value:is_object(d.alamat_detail)?d.alamat_detail.rt.toString():null
                },
                {
                    type:String,
                    value:is_object(d.alamat_detail)?d.alamat_detail.jalan.toString():null
                },
                {
                    type:Number,
                    value:list.berat_badan_lahir
                },
                {
                    type:Number,
                    value:list.tinggi_badan_lahir
                },
                {
                    type:Number,
                    value:list.berat_badan
                },
                {
                    type:Number,
                    value:list.tinggi_badan
                }
            ])
        })

        const excel_data=[
            header,
            ...data_excel
        ]

        await writeXlsxFile(excel_data, {
            fileName:"stunting-4118.xlsx"
        })

        this.toggleDownload()
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
                    data:{}
                }
            })
        }, 200);
    }

    render(){
        const {
            import_stunting_4118,
            kecamatan_form, 
            login_data, 
            stunting_4118,
            detail_kk,
            pemetaan,
            bar_chart,
            download_template
        }=this.state

        return (
            <>
                <Layout>
                    <div class="d-flex justify-content-between align-items-center flex-wrap grid-margin">
                        <div>
                            <h2 class="mb-3 mb-md-0">Stunting 4118</h2>
                        </div>
                        <div class="d-flex align-items-center flex-wrap text-nowrap">
                            <Dropdown as={ButtonGroup}>
                                <label>
                                    <span className="btn btn-success btn-icon-text d-inline-flex align-items-center" style={{borderTopRightRadius:"0", borderBottomRightRadius:"0"}} onClick={this.selectfi}>
                                        <FiUpload className="btn-icon-prepend"/>
                                        Import
                                    </span>
                                    <input
                                        type="file"
                                        name="file"
                                        onChange={this.selectFile}
                                        style={{display:"none"}}
                                        accept=".xlsx"
                                    />
                                </label>
                                <Dropdown.Toggle split variant="success" className="px-1">
                                    <FiChevronDown/>
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end" className="dropdown-menu-arrow">
                                    <label class="d-block w-100 mb-0">
                                        <Dropdown.Item as="span" className="d-block w-100 cursor-pointer">Import Stunting 4118</Dropdown.Item>
                                        <input
                                            type="file"
                                            name="file"
                                            onChange={this.selectFile}
                                            style={{display:"none"}}
                                            accept=".xlsx"
                                        />
                                    </label>
                                    <Dropdown.Item 
                                        as="a" 
                                        className="d-block w-100 cursor-pointer" 
                                        href="/xlsx/stunting-4118.xlsx"
                                        target="_blank"
                                    >
                                        Download Template
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                            <button type="button" className="btn btn-secondary btn-icon-text ms-2" onClick={this.toggleDownload}>
                                <FiDownload className="btn-icon-prepend"/>
                                Export
                            </button>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-lg-6 mb-3">
                            <div className="card w-100 rounded-4 overflow-hidden">
                                <div className="card-body p-3 border-top-0">
                                    <h3 className="card-title fw-semibold mb-4">Pemetaan Stunting</h3>
                                    <Map data={pemetaan.data} center={pemetaan.center}/>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 mb-3">
                            <div className="card w-100 rounded-4 overflow-hidden">
                                <div className="card-body p-3 border-top-0">
                                    <h3 className="card-title fw-semibold mb-4">Grafik Anak Penderita Stunting</h3>
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
                    <div className='row mt-3 mb-5'>
                        <div className='col-12'>
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex mb-3 mt-3">
                                        <div style={{width:"200px"}} className="me-2">
                                            <select 
                                                name="district_id" 
                                                value={stunting_4118.district_id} 
                                                className="form-select" 
                                                onChange={this.typeFilter}
                                            >
                                                <option value="">-- Pilih Kecamatan</option>
                                                {kecamatan_form.map(kec=>(
                                                    <option value={kec.id_region} key={kec}>{kec.region}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{width:"200px"}} className="me-2">
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="q"
                                                onChange={this.typeFilter}
                                                value={stunting_4118.q}
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
                                                    <th className="px-3">Alamat</th>
                                                    <th className="px-3">Usia Saat Ukur</th>
                                                    <th className="px-3">Berat Badan </th>
                                                    <th className="px-3">Tinggi Badan</th>
                                                    <th className="px-3">TB/U</th>
                                                    <th className="px-3">BB/U</th>
                                                    <th className="px-3">BB/TB</th>
                                                    <th className="px-3">Last Update</th>
                                                    <th className="px-3" width="90"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="border-top-0">
                                                {!stunting_4118.is_loading?
                                                    <>
                                                        {stunting_4118.data.map((list, idx)=>(
                                                            <tr key={list}>
                                                                    <td className="align-middle px-3">{(idx+1)+((stunting_4118.page-1)*stunting_4118.per_page)}</td>
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
                                                                    <td className="px-3">{list.kecamatan.region}</td>
                                                                    <td className="px-3">Desa {list.data_anak.alamat_detail?.desa}, Dusun {list.data_anak.alamat_detail?.dusun}, RT {list.data_anak.alamat_detail?.rt}, RW {list.data_anak.alamat_detail?.rw}, Jl {list.data_anak.alamat_detail?.jalan}</td>
                                                                    <td className="px-3">{this.getBulan(list.usia_saat_ukur)}</td>
                                                                    <td className="px-3">{list.berat_badan}</td>
                                                                    <td className="px-3">{list.tinggi_badan}</td>
                                                                    <td className="px-3">{list.hasil_tinggi_badan_per_umur.split("_").join(" ")}</td>
                                                                    <td className="px-3">{this.valueBBU(list.hasil_berat_badan_per_umur)}</td>
                                                                    <td className="px-3">{list.hasil_berat_badan_per_tinggi_badan.split("_").join(" ")}</td>
                                                                    <td className="px-3">{moment(list.updated_at).format("DD-MM-YYYY HH:mm:ss")}</td>
                                                                    <td className="text-nowrap p-1 px-3">
                                                                    </td>
                                                            </tr>
                                                        ))}
                                                        {stunting_4118.data.length==0&&
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
                                            <div>Halaman {stunting_4118.page} dari {stunting_4118.last_page}</div>
                                        </div>
                                        <div className="d-flex align-items-center me-auto ms-3">
                                            <select className="form-select" name="per_page" value={stunting_4118.per_page} onChange={this.setPerPage}>
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
                                                    {"btn-primary":stunting_4118.page>1}
                                                )}
                                                disabled={stunting_4118.page<=1}
                                                onClick={()=>this.goToPage(stunting_4118.page-1)}
                                            >
                                                <FiChevronLeft/>
                                                Prev
                                            </button>
                                            <button 
                                                className={classNames(
                                                    "btn",
                                                    "border-0",
                                                    {"btn-primary":stunting_4118.page<stunting_4118.last_page},
                                                    "ms-2"
                                                )}
                                                disabled={stunting_4118.page>=stunting_4118.last_page}
                                                onClick={()=>this.goToPage(stunting_4118.page+1)}
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

                {/* MODAL IMPORT */}
                <Modal show={import_stunting_4118.is_open} className="modal-blur" onHide={this.hideImport} backdrop="static" size="xl" scrollable>
                    <Formik
                        initialValues={import_stunting_4118.stunting_4118}
                        onSubmit={this.importStunting4118}
                        validationSchema={this.importStunting4118Schema()}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Header closeButton>
                                    <h4 className="modal-title">Data Excel</h4>
                                </Modal.Header>
                                <Modal.Body>
                                    <div className="row mb-4">
                                        <div className="col-md-5 mx-auto">
                                            <div class="mb-3">
                                                <label class="my-1 me-2" for="country">Kecamatan</label>
                                                <select 
                                                    name="id_kecamatan" 
                                                    value={props.values.id_kecamatan} 
                                                    className="form-select" 
                                                    onChange={props.handleChange}
                                                >
                                                    <option value="">-- Pilih Kecamatan</option>
                                                    {kecamatan_form.map(kec=>(
                                                        <option value={kec.id_region} key={kec}>{kec.region}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="table-responsive mb-4">
                                        <table class="table table-hover table-custom table-nowrap mb-0 rounded">
                                            <thead class="thead-light">
                                                <tr className="text-uppercase">
                                                    <th class="px-3 rounded-start" width="30">#</th>
                                                    <th class="px-3">NIK</th>
                                                    <th class="px-3">Nama Anak</th>
                                                    <th class="px-3">Tempat Lahir</th>
                                                    <th class="px-3">Tgl Lahir</th>
                                                    <th class="px-3">Jenis Kelamin</th>
                                                    <th class="px-3">NIK Ibu</th>
                                                    <th class="px-3">Nama Ibu</th>
                                                    <th class="px-3">NIK Ayah</th>
                                                    <th class="px-3">Nama Ayah</th>
                                                    <th class="px-3">Berat Badan Lahir</th>
                                                    <th class="px-3">Tinggi Badan Lahir</th>
                                                    <th class="px-3">Berat Badan</th>
                                                    <th class="px-3 rounded-end">Tinggi Badan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {props.values.data.map((list, idx)=>(
                                                    <React.Fragment key={list}>
                                                        <tr>
                                                            <td className="px-3">{(idx+1)}</td>
                                                            <td className="px-3">{list.data_anak.nik}</td>
                                                            <td className="px-3">{list.data_anak.nama_lengkap}</td>
                                                            <td className="px-3">{list.data_anak.tempat_lahir}</td>
                                                            <td className="px-3">{moment(list.data_anak.tgl_lahir).format("D MMM YYYY")}</td>
                                                            <td className="px-3">{list.data_anak.jenis_kelamin}</td>
                                                            <td className="px-3">{list.data_anak.ibu?.nik}</td>
                                                            <td className="px-3">{list.data_anak.ibu?.nama_lengkap}</td>
                                                            <td className="px-3">{list.data_anak.ayah?.nik}</td>
                                                            <td className="px-3">{list.data_anak.ayah?.nama_lengkap}</td>
                                                            <td className="px-3">{list.berat_badan_lahir}</td>
                                                            <td className="px-3">{list.tinggi_badan_lahir}</td>
                                                            <td className="px-3">{list.berat_badan}</td>
                                                            <td className="px-3">{list.tinggi_badan}</td>
                                                        </tr>
                                                    </React.Fragment>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Modal.Body>
                                <Modal.Footer className="mt-3 border-top pt-2">
                                    <button 
                                        type="button" 
                                        class="btn btn-link text-gray me-auto" 
                                        onClick={this.hideImport}
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        class="btn btn-primary"
                                        disabled={props.isSubmitting||!(props.dirty&&props.isValid)}
                                    >
                                        {props.isSubmitting?
                                            <Spinner size="sm" variant="light" animation="border" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </Spinner>
                                        :
                                            <>Save Changes</>
                                        }
                                    </button>
                                </Modal.Footer>
                            </form>
                        )}
                    </Formik>
                </Modal>

                {/* MODAL DOWNLOAD TEMPLATE */}
                <Modal show={download_template.is_open} className="modal-blur" onHide={this.toggleDownload} backdrop="static" size="sm">
                    <Modal.Header closeButton>
                        <h4 className="modal-title">Download Excel</h4>
                    </Modal.Header>
                    <Formik
                        initialValues={download_template.template}
                        onSubmit={this.download}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div class="mb-3">
                                        <label class="my-1 me-2" for="country">Kecamatan</label>
                                        <select 
                                            name="id_kecamatan" 
                                            value={props.values.id_kecamatan} 
                                            className="form-select" 
                                            onChange={props.handleChange}
                                        >
                                            <option value="">-- Pilih Kecamatan</option>
                                            {download_template.kecamatan_form.map(kf=>(
                                                <option key={kf} value={kf.id_region}>{kf.region}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="d-flex flex-column">
                                        <span className="text-muted"><strong>*</strong> Hapus baris/data yang tidak digunakan!</span>
                                    </div>
                                </Modal.Body>
                                <Modal.Footer className="mt-3 border-top pt-2">
                                    <button 
                                        type="button" 
                                        class="btn btn-link text-gray me-auto" 
                                        onClick={this.toggleDownload}
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        class="btn btn-dark"
                                        disabled={props.isSubmitting}
                                    >
                                        {props.isSubmitting?
                                            <Spinner size="sm" variant="light" animation="border" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </Spinner>
                                        :
                                            <>Download</>
                                        }
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

export default withRouter(withAuth(Stunting4118))