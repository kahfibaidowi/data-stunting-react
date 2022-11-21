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
            nik:"",
            last_page:0
        },
        tambah_skrining:{
            is_open:false,
            kecamatan_form:[],
            skrining:{
                id_user:"",
                nik_anak:"",
                data_anak:{},
                berat_badan_lahir:"",
                tinggi_badan_lahir:"",
                berat_badan:"",
                tinggi_badan:""
            },
            search_data:{
                nik_anak:{},
                old_data:{}
            }
        },
        download_template:{
            is_open:false,
            provinsi_form:[],
            kabupaten_kota_form:[],
            kecamatan_form:[],
            desa_form:[],
            template:{}
        },
        import_skrining:{
            is_open:false,
            kecamatan_form:[],
            skrining:{
                id_user:"",
                data:[]
            }
        },
        detail_kk:{
            is_open:false,
            data:{}
        }
    }

    componentDidMount=()=>{
        if(this.props.router.isReady){
            if(this.props.router.query?.action=="cek_antropometri"){
                this.toggleTambah()
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
                            this.getsSkrining()
                        })
                    }
                    else{
                        this.getsSkrining()
                    }
                })
            }
        }
        
        this.getsKecamatanForm()
    }
    componentDidUpdate=(prevProps)=>{
        if(prevProps.router.isReady!==this.props.router.isReady){
            if(this.props.router.isReady){
                if(this.props.router.query?.action=="cek_antropometri"){
                    this.toggleTambah()
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
                                this.getsSkrining()
                            })
                        }
                        else{
                            this.getsSkrining()
                        }
                    })
                }
            }
        }
        if(JSON.stringify(prevProps.router)!=JSON.stringify(this.props.router)){
            if(this.props.router.isReady){
                if(this.props.router.query?.action=="cek_antropometri"){
                    this.toggleTambah()
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
                                this.getsSkrining()
                            })
                        }
                        else{
                            this.getsSkrining()
                        }
                    })
                }
            }
        }
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
    getsSkrining=(reset=false)=>{
        const {skrining}=this.state

        api(access_token()).get("/skrining_balita", {
            params:{
                page:reset?1:skrining.page,
                per_page:skrining.per_page,
                q:skrining.q,
                posyandu_id:skrining.posyandu_id
            }
        })
        .then(res=>{
            this.setState({
                skrining:update(this.state.skrining, {
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
            skrining:update(this.state.skrining, {
                page:{$set:page}
            })
        }, ()=>{
            this.getsSkrining()
        })
    }
    setPerPage=e=>{
        const target=e.target

        this.setState({
            skrining:update(this.state.skrining, {
                per_page:{$set:target.value}
            })
        }, ()=>{
            this.getsSkrining(true)
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
                        this.getsSkrining(true)
                    }, 500);
                break
                default:
                    this.getsSkrining(true)
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
    generateColumnPenduduk=(data, with_ayah_ibu=true)=>{
        let data_penduduk={
            id_penduduk:data.id_penduduk,
            nik:data.nik,
            no_kk:data.kartu_keluarga!==null?data.kartu_keluarga.no_kk:"",
            nama_lengkap:data.nama_lengkap,
            tempat_lahir:data.tempat_lahir,
            tgl_lahir:data.tgl_lahir,
            jenis_kelamin:data.jenis_kelamin,
            provinsi:data.provinsi.region,
            kabupaten_kota:data.kabupaten_kota.region,
            kecamatan:data.kecamatan.region,
            desa:data.desa.region,
            alamat_detail:data.alamat_detail
        }

        if(with_ayah_ibu){
            data_penduduk=Object.assign({}, data_penduduk, {
                ibu:data.ibu!==null?{
                    id_penduduk:data.ibu.id_penduduk,
                    nik:data.ibu.nik,
                    nama_lengkap:data.ibu.nama_lengkap
                }:"",
                ayah:data.ayah!==null?{
                    id_penduduk:data.ayah.id_penduduk,
                    nik:data.ayah.nik,
                    nama_lengkap:data.ayah.nama_lengkap
                }:""
            })
        }

        return data_penduduk
    }


    //tambah
    toggleTambah=()=>{
        this.setState({
            tambah_skrining:{
                is_open:!this.state.tambah_skrining.is_open,
                kecamatan_form:this.state.kecamatan_form,
                skrining:{
                    id_user:this.state.skrining.posyandu_id,
                    nik_anak:"",
                    data_anak:{},
                    berat_badan_lahir:"",
                    tinggi_badan_lahir:"",
                    berat_badan:"",
                    tinggi_badan:""
                },
                search_data:{
                    nik_anak:{},
                    old_data:{}
                }
            }
        })
    }
    getsSkriningNIK=async(nik)=>{
        return await api(access_token()).get(`/skrining_balita/${nik}?type=nik`).then(res=>res.data.data)
    }
    addSkrining=async (values, actions)=>{
        //params
        const data_anak=this.generateColumnPenduduk(values.data_anak)

        //insert to database
        await api(access_token()).post("/skrining_balita", {
            id_user:values.id_user,
            data_anak:data_anak,
            berat_badan_lahir:values.berat_badan_lahir,
            tinggi_badan_lahir:values.tinggi_badan_lahir,
            berat_badan:values.berat_badan,
            tinggi_badan:values.tinggi_badan
        })
        .then(res=>{
            this.toggleTambah()
            this.getsSkrining(true)
            toast.success("Berhasil menambahkan data skrining!")
            Router.push("/frontpage/skrining_balita")
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Insert Data Failed! ", {position:"bottom-center"})
        })
    }
    tambahSkriningSchema=()=>{
        return yup.object().shape({
            nik_anak:yup.string().required(),
            berat_badan_lahir:yup.number().required(),
            tinggi_badan_lahir:yup.number().required(),
            berat_badan:yup.number().required(),
            tinggi_badan:yup.number().required(),
            data_anak:yup.object().shape({
                ibu:yup.object().shape({
                    nama_lengkap:yup.string().required(),
                    nik:yup.string().required()
                }),
                auah:yup.mixed().optional()
            })
        })
    }

    //download template
    toggleDownload=()=>{
        this.setState({
            download_template:{
                is_open:!this.state.download_template.is_open,
                provinsi_form:[],
                kabupaten_kota_form:[],
                kecamatan_form:[],
                desa_form:[],
                template:{
                    id_provinsi:"",
                    id_kabupaten_kota:"",
                    id_kecamatan:"",
                    id_desa:""
                }
            }
        })
        this.getsProvinsi()
    }
    getsProvinsi=async ()=>{
        const token=await api(access_token()).get("/auth/generate_kependudukan_system_token").then(res=>res.data.data).catch(err=>"")
        
        await api_kependudukan(token).get("/region/type/provinsi", {
            params:{
                page:1,
                per_page:"",
                q:""
            }
        })
        .then(res=>{
            this.typeDownload({target:{name:"provinsi_form", value:res.data.data}})
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    getKabKotaForm=async (province_id)=>{
        const token=await api(access_token()).get("/auth/generate_kependudukan_system_token").then(res=>res.data.data).catch(err=>"")
        
        await api_kependudukan(token).get("/region/type/kabupaten_kota", {
            params:{
                page:1,
                per_page:"",
                q:"",
                province_id:province_id
            }
        })
        .then(res=>{
            this.typeDownload({target:{name:"kabupaten_kota_form", value:res.data.data}})
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    getKecamatanForm=async (province_id, regency_id)=>{
        const token=await api(access_token()).get("/auth/generate_kependudukan_system_token").then(res=>res.data.data).catch(err=>"")
        
        await api_kependudukan(token).get("/region/type/kecamatan", {
            params:{
                page:1,
                per_page:"",
                q:"",
                province_id:province_id,
                regency_id:regency_id
            }
        })
        .then(res=>{
            this.typeDownload({target:{name:"kecamatan_form", value:res.data.data}})
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    getDesaForm=async (province_id, regency_id, district_id)=>{
        const token=await api(access_token()).get("/auth/generate_kependudukan_system_token").then(res=>res.data.data).catch(err=>"")
        
        await api_kependudukan(token).get("/region/type/desa", {
            params:{
                page:1,
                per_page:"",
                q:"",
                province_id:province_id,
                regency_id:regency_id,
                district_id:district_id
            }
        })
        .then(res=>{
            this.typeDownload({target:{name:"desa_form", value:res.data.data}})
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            toast.error("Gets Data Failed!", {position:"bottom-center"})
        })
    }
    typeDownload=e=>{
        const target=e.target

        this.setState({
            download_template:update(this.state.download_template, {
                [target.name]:{$set:target.value}
            })
        })
    }
    download=async (values, actions)=>{
        const token=await api(access_token()).get("/auth/generate_kependudukan_system_token").then(res=>res.data.data).catch(err=>false)
        
        if(token!==false){
            const data=await api_kependudukan(token).get("/penduduk", {
                params:{
                    page:1,
                    per_page:"",
                    q:"",
                    province_id:values.id_provinsi,
                    regency_id:values.id_kabupaten_kota,
                    district_id:values.id_kecamatan,
                    village_id:values.id_desa
                }
            })
            .then(res=>res.data.data)
            .catch(err=>[])

            const header=[
                {
                    value: 'NIK',
                    fontWeight: 'bold'
                },
                {
                    value: 'NO. KK',
                    fontWeight: 'bold'
                },
                {
                    value: 'NAMA ANAK',
                    fontWeight: 'bold'
                },
                {
                    value: 'TGL LAHIR',
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
            await data.map(d=>{
                const tgl_lahir=moment(d.tgl_lahir, "YYYY-MM-DD").format("YYYY-MM-DD")
                const batas_date=moment().subtract(5, "years").format("YYYY-MM-DD")

                if(tgl_lahir>batas_date){
                    data_excel.push([
                        {
                            type:String,
                            value:d.nik,
                        },
                        {
                            type:String,
                            value:d.kartu_keluarga!==null?d.kartu_keluarga.no_kk:null,
                        },
                        {
                            type:String,
                            value:d.nama_lengkap,
                        },
                        {
                            type:Date,
                            value:moment(d.tgl_lahir).toDate(),
                            format:"dd/mm/yyyy"
                        },
                        {
                            type:String,
                            value:d.jenis_kelamin,
                        },
                        {
                            type:String,
                            value:d.ibu!==null?d.ibu.nik:null,
                        },
                        {
                            type:String,
                            value:d.ibu!==null?d.ibu.nama_lengkap:null,
                        },
                        {
                            type:String,
                            value:d.ayah!==null?d.ayah.nik:null,
                        },
                        {
                            type:String,
                            value:d.ayah!==null?d.ayah.nama_lengkap:null,
                        },
                        {
                            type:Number,
                            value:null,
                        },
                        {
                            type:Number,
                            value:null,
                        },
                        {
                            type:Number,
                            value:null,
                        },
                        {
                            type:Number,
                            value:null,
                        },
                    ])
                }
            })

            const excel_data=[
                header,
                ...data_excel
            ]

            await writeXlsxFile(excel_data, {
                fileName:"skrining.xlsx"
            })
        }
        else{
            toast.error(`Get data failed!`, {position:"bottom-center"})
        }
    }

    //import
    selectFile=async e=>{
        file_to_workbook(e.target.files[0], async data=>{
            let penduduk_sheet=utils.sheet_to_json(data.Sheets[data.SheetNames[0]], {header:1})

            let penduduk_data=[]
            penduduk_sheet.map((row, idx)=>{
                if(idx>0){
                    penduduk_data=penduduk_data.concat([{
                        data_anak:{
                            nik:!isUndefined(row[0])?row[0]:"",
                            no_kk:!isUndefined(row[1])?row[1]:"",
                            nama_lengkap:!isUndefined(row[2])?row[2]:"",
                            tgl_lahir:excelToMomentDate(!isUndefined(row[3])?row[3]:""),
                            jenis_kelamin:!isUndefined(row[4])?row[4]:"",
                            ibu:{
                                nik:!isUndefined(row[5])?row[5]:"",
                                nama_lengkap:!isUndefined(row[6])?row[6]:""
                            },
                            ayah:!isUndefined(row[7])?"":{
                                nik:!isUndefined(row[7])?row[7]:"",
                                nama_lengkap:!isUndefined(row[8])?row[8]:""
                            }
                        },
                        berat_badan_lahir:!isUndefined(row[9])?row[9]:"",
                        tinggi_badan_lahir:!isUndefined(row[10])?row[10]:"",
                        berat_badan:!isUndefined(row[11])?row[11]:"",
                        tinggi_badan:!isUndefined(row[12])?row[12]:""
                    }])
                }
            })

            //cek
            let nik_params=penduduk_data.map(dx=>dx.data_anak.nik)
            const token=await api(access_token()).get("/auth/generate_kependudukan_system_token").then(res=>res.data.data).catch(err=>"")

            await api_kependudukan(token).get("/penduduk/type/multiple", {
                params:{
                    nik:nik_params
                }
            })
            .then(res=>{
                const data=res.data.data

                let xlsx=penduduk_data.map(x=>{
                    let idx=data.findIndex(d=>d.nik==x.data_anak.nik)

                    if(idx!=-1){
                        const data_anak=this.generateColumnPenduduk(data[idx])

                        return Object.assign({}, x, {
                            data_anak:data_anak,
                            found:true
                        })
                    }
                    else{
                        return Object.assign({}, x, {
                            data_anak:Object.assign({}, x.data_anak, {
                                ibu:"",
                                ayah:""
                            }),
                            found:false
                        })
                    }
                })

                this.setState({
                    import_skrining:{
                        is_open:!this.state.import_skrining.is_open,
                        kecamatan_form:this.state.kecamatan_form,
                        skrining:{
                            id_user:this.state.skrining.posyandu_id,
                            data:xlsx
                        }
                    }
                })
            })
            .catch(err=>{
                toast.error("Error!", {position:"bottom-center"})
            })
        })
    }
    hideImport=()=>{
        this.setState({
            import_skrining:{
                is_open:false,
                kecamatan_form:[],
                skrining:{
                    id_user:"",
                    data:[]
                }
            }
        })
    }
    importSkrining=async(values, actions)=>{
        await api(access_token()).post("/skrining_balita/type/multiple", {
            id_user:values.id_user,
            skrining:values.data
        })
        .then(res=>{
            this.getsSkrining(true)
            this.hideImport()
        })
        .catch(err=>{
            if(err.response.status===401){
                localStorage.removeItem("login_data")
                Router.push("/")
            }
            
            if(err.response.data?.error=="VALIDATION_ERROR")
                toast.error(err.response.data.data, {position:"bottom-center"})
            else
                toast.error("Import Data Failed! ", {position:"bottom-center"})
        })
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
            import_skrining,
            download_template,
            kecamatan_form, 
            login_data, 
            skrining,
            tambah_skrining,
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
                                    <h2 class="page-title">Skrining Balita</h2>
                                </div>
                                <div class="col-12 col-md-auto ms-auto d-print-none">
                                    <div class="btn-list">
                                        <Dropdown as={ButtonGroup}>
                                            <label>
                                                <span className="btn btn-success d-inline-flex align-items-center" style={{borderTopRightRadius:"0", borderBottomRightRadius:"0"}} onClick={this.selectfi}>
                                                    <TbUpload className="icon"/>
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
                                            <Dropdown.Toggle split variant="success" className="px-2"/>
                                            <Dropdown.Menu align="end" className="py-0 dropdown-menu-arrow">
                                                <label class="d-block w-100 mb-0">
                                                    <Dropdown.Item as="span" className="d-block w-100 cursor-pointer">Import Skrining</Dropdown.Item>
                                                    <input
                                                        type="file"
                                                        name="file"
                                                        onChange={this.selectFile}
                                                        style={{display:"none"}}
                                                        accept=".xlsx"
                                                    />
                                                </label>
                                                <Dropdown.Item as="span" className="d-block w-100 cursor-pointer" onClick={this.toggleDownload}>Download Template</Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                        <button type="button" class="btn btn-primary" onClick={this.toggleTambah}>
                                            <TbPlus className="icon"/>
                                            Cek Antropometri
                                        </button>
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
                                            {login_data.role!="posyandu"&&
                                                <div style={{width:"200px"}} className="me-2">
                                                    <select 
                                                        name="posyandu_id" 
                                                        value={skrining.posyandu_id} 
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
                                                    value={skrining.q}
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
                                                            {skrining.data.map((list, idx)=>(
                                                                <tr key={list}>
                                                                        <td className="align-middle px-3">{(idx+1)+((skrining.page-1)*skrining.per_page)}</td>
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
                                                            {skrining.data.length==0&&
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
                                                <div>Halaman {skrining.page} dari {skrining.last_page}</div>
                                            </div>
                                            <div className="d-flex align-items-center me-auto ms-3">
                                                <select className="form-select" name="per_page" value={skrining.per_page} onChange={this.setPerPage}>
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
                                                        {"btn-primary":skrining.page>1}
                                                    )}
                                                    disabled={skrining.page<=1}
                                                    onClick={()=>this.goToPage(skrining.page-1)}
                                                >
                                                    <TbChevronLeft/>
                                                    Prev
                                                </button>
                                                <button 
                                                    className={classNames(
                                                        "btn",
                                                        "border-0",
                                                        {"btn-primary":skrining.page<skrining.last_page},
                                                        "ms-2"
                                                    )}
                                                    disabled={skrining.page>=skrining.last_page}
                                                    onClick={()=>this.goToPage(skrining.page+1)}
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

                {/* MODAL TAMBAH */}
                <Modal show={tambah_skrining.is_open} className="modal-blur" onHide={this.toggleTambah} backdrop="static" size="sm">
                    <Modal.Header closeButton>
                        <div className="modal-title h2 fw-bold">Cek Antropometri</div>
                    </Modal.Header>
                    <Formik
                        initialValues={tambah_skrining.skrining}
                        onSubmit={this.addSkrining}
                        validationSchema={this.tambahSkriningSchema()}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div className='w-100 d-flex flex-column'>
                                        {login_data.role!="posyandu"&&
                                            <div className="mb-3">
                                                <label className="my-1 me-2 fw-semibold" for="country">Posyandu</label>
                                                <div class="input-group">
                                                    <select 
                                                        name="id_user" 
                                                        value={props.values.id_user} 
                                                        className="form-select" 
                                                        onChange={props.handleChange}
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
                                            </div>
                                        }
                                        <div className="mb-3">
                                            <label className="my-1 me-2 fw-semibold" for="country">NIK Anak<span className="text-danger">*</span></label>
                                            <div class="input-group">
                                                <input 
                                                    type="text" 
                                                    className="form-control"
                                                    name="nik_anak"
                                                    onChange={props.handleChange}
                                                    value={props.values.nik_anak}
                                                    disabled={!isUndefined(props.values.data_anak.nik)?true:false}
                                                />
                                                {!isUndefined(props.values.data_anak.nik)?
                                                    <button 
                                                        class="btn btn-danger"
                                                        type="button"
                                                        onClick={e=>{
                                                            this.setState({
                                                                tambah_skrining:update(this.state.tambah_skrining, {
                                                                    search_data:{
                                                                        nik_anak:{$set:{}},
                                                                        old_data:{$set:{}}
                                                                    }
                                                                })
                                                            })
                                                            props.setFieldValue("berat_badan_lahir", "")
                                                            props.setFieldValue("tinggi_badan_lahir", "")
                                                            props.setFieldValue("data_anak", {})
                                                            props.setFieldValue("berat_badan", "")
                                                            props.setFieldValue("tinggi_badan", "")
                                                        }}
                                                    >
                                                        Batal
                                                    </button>
                                                :
                                                    <button 
                                                        class="btn btn-secondary"
                                                        type="button"
                                                        onClick={async e=>{
                                                            const resetForm=new Promise((resolve, reject)=>{
                                                                props.setFieldValue("berat_badan_lahir", "")
                                                                props.setFieldValue("tinggi_badan_lahir", "")
                                                                props.setFieldValue("data_anak", {})
                                                                props.setFieldValue("berat_badan", "")
                                                                props.setFieldValue("tinggi_badan", "")

                                                                resolve(true)
                                                            })

                                                            resetForm.then(async res=>{
                                                                const data=await this.getPenduduk(props.values.nik_anak).catch(err=>false)

                                                                if(data!==false){
                                                                    const data2=await this.getsSkriningNIK(props.values.nik_anak).catch(err=>false)

                                                                    let old_data={}
                                                                    if(data2!==false){
                                                                        if(!isUndefined(data2.id_skrining_balita)){
                                                                            props.setFieldValue("berat_badan_lahir", data2.berat_badan_lahir)
                                                                            props.setFieldValue("tinggi_badan_lahir", data2.tinggi_badan_lahir)
                                                                            old_data=data2
                                                                        }
                                                                    }
                                                                    props.setFieldValue("data_anak", data)

                                                                    this.setState({
                                                                        tambah_skrining:update(this.state.tambah_skrining, {
                                                                            search_data:{
                                                                                nik_anak:{$set:this.generateColumnPenduduk(data)},
                                                                                old_data:{$set:old_data}
                                                                            }
                                                                        })
                                                                    })
                                                                }
                                                                else{
                                                                    this.setState({
                                                                        tambah_skrining:update(this.state.tambah_skrining, {
                                                                            search_data:{
                                                                                nik_anak:{$set:{}},
                                                                                old_data:{$set:{}}
                                                                            }
                                                                        })
                                                                    })
                                                                    toast.error(`NIK Anak tidak ditemukan!`, {position:"bottom-center"})
                                                                }
                                                            })
                                                            
                                                        }}
                                                    >
                                                        Gunakan
                                                    </button>
                                                }
                                            </div>
                                            {!isUndefined(tambah_skrining.search_data.nik_anak.id_penduduk)&&
                                                <table className="mt-2">
                                                    <tr>
                                                        <th valign="top" className="fw-semibold" width="150">Nama Lengkap </th>
                                                        <td valign="top" width="15"> : </td>
                                                        <td>{tambah_skrining.search_data.nik_anak.nama_lengkap}</td>
                                                    </tr>
                                                    <tr>
                                                        <th valign="top" className="fw-semibold">NIK </th>
                                                        <td valign="top"> : </td>
                                                        <td>{tambah_skrining.search_data.nik_anak.nik}</td>
                                                    </tr>
                                                    <tr>
                                                        <th valign="top" className="fw-semibold">Nama Ibu </th>
                                                        <td valign="top"> : </td>
                                                        <td>{tambah_skrining.search_data.nik_anak.ibu?.nama_lengkap}</td>
                                                    </tr>
                                                    <tr>
                                                        <th valign="top" className="fw-semibold">NIK Ibu </th>
                                                        <td valign="top"> : </td>
                                                        <td>{tambah_skrining.search_data.nik_anak.ibu?.nik}</td>
                                                    </tr>
                                                    <tr>
                                                        <th valign="top" className="fw-semibold">Alamat </th>
                                                        <td valign="top"> : </td>
                                                        <td>{' '}
                                                            {tambah_skrining.search_data.nik_anak.desa}, {' '}
                                                            {tambah_skrining.search_data.nik_anak.kecamatan}, {' '}
                                                            {tambah_skrining.search_data.nik_anak.kabupaten_kota}
                                                        </td>
                                                    </tr>
                                                </table>
                                            }
                                        </div>
                                        {!isUndefined(props.values.data_anak.nik)&&
                                            <>
                                                {isUndefined(tambah_skrining.search_data.old_data.id_skrining_balita)&&
                                                    <>
                                                        <div className="mb-3">
                                                            <label className="my-1 me-2 fw-semibold" for="country">Berat Badan Lahir<span className="text-danger">*</span></label>
                                                            <NumberFormat
                                                                displayType="input"
                                                                suffix=" Kg"
                                                                value={props.values.berat_badan_lahir}
                                                                onValueChange={values=>{
                                                                    const {value}=values
                                                                    props.setFieldValue("berat_badan_lahir", value)
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
                                                                value={props.values.tinggi_badan_lahir}
                                                                onValueChange={values=>{
                                                                    const {value}=values
                                                                    props.setFieldValue("tinggi_badan_lahir", value)
                                                                }}
                                                                className="form-control"
                                                                placeholder="Cm"
                                                            />
                                                            <span className="text-muted">Ukur dalam keadaan telentang!</span>
                                                        </div>
                                                    </>
                                                }
                                                <div className="mb-3">
                                                    <label className="my-1 me-2 fw-semibold" for="country">Berat Badan Saat Timbang<span className="text-danger">*</span></label>
                                                    <NumberFormat
                                                        displayType="input"
                                                        suffix=" Kg"
                                                        value={props.values.berat_badan}
                                                        onValueChange={values=>{
                                                            const {value}=values
                                                            props.setFieldValue("berat_badan", value)
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
                                                        value={props.values.tinggi_badan}
                                                        onValueChange={values=>{
                                                            const {value}=values
                                                            props.setFieldValue("tinggi_badan", value)
                                                        }}
                                                        className="form-control"
                                                        placeholder="Cm"
                                                    />
                                                    <span className="text-muted">Umur 24 Bulan ukur dalam keadaan telentang! contoh isian : 45, 45.5, 46</span>
                                                </div>
                                            </>
                                        }
                                    </div>
                                </Modal.Body>
                                <Modal.Footer className="mt-3 border-top pt-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-link text-gray me-auto" 
                                        onClick={this.toggleTambah}
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={props.isSubmitting||!(props.dirty&&props.isValid)}
                                    >
                                        Save Changes
                                    </button>
                                </Modal.Footer>
                            </form>
                        )}
                    </Formik>
                </Modal>

                {/* MODAL DOWNLOAD TEMPLATE */}
                <Modal show={download_template.is_open} className="modal-blur" onHide={this.toggleDownload} backdrop="static" size="sm">
                    <Modal.Header closeButton>
                        <div className="modal-title h2 fw-bold">Download Template</div>
                    </Modal.Header>
                    <Formik
                        initialValues={download_template.template}
                        onSubmit={this.download}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    <div class="mb-3">
                                        <label class="my-1 me-2" for="country">Provinsi</label>
                                        <select 
                                            name="id_provinsi" 
                                            value={props.values.id_provinsi} 
                                            className="form-select" 
                                            onChange={e=>{
                                                if(e.target.value!="") this.getKabKotaForm(e.target.value)
                                                else this.typeDownload({target:{name:"kabupaten_kota_form", value:[]}})

                                                this.typeDownload({target:{name:"kecamatan_form", value:[]}})
                                                this.typeDownload({target:{name:"desa_form", value:[]}})
                                                props.handleChange(e)
                                                props.setFieldValue("id_kabupaten_kota", "")
                                                props.setFieldValue("id_kecamatan", "")
                                                props.setFieldValue("id_desa", "")
                                            }}
                                        >
                                            <option value="">-- Pilih Provinsi</option>
                                            {download_template.provinsi_form.map(kf=>(
                                                <option key={kf} value={kf.id_region}>{kf.region}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label class="my-1 me-2" for="country">Kabupaten</label>
                                        <select 
                                            name="id_kabupaten_kota" 
                                            value={props.values.id_kabupaten_kota} 
                                            className="form-select" 
                                            onChange={e=>{
                                                if(e.target.value!="") this.getKecamatanForm(props.values.id_provinsi, e.target.value)
                                                else this.typeDownload({target:{name:"kecamatan_form", value:[]}})

                                                this.typeDownload({target:{name:"desa_form", value:[]}})
                                                props.handleChange(e)
                                                props.setFieldValue("id_kecamatan", "")
                                                props.setFieldValue("id_desa", "")
                                            }}
                                        >
                                            <option value="">-- Pilih Kabupaten Kota</option>
                                            {download_template.kabupaten_kota_form.map(kf=>(
                                                <option key={kf} value={kf.id_region}>{kf.region}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label class="my-1 me-2" for="country">Kecamatan</label>
                                        <select 
                                            name="id_kecamatan" 
                                            value={props.values.id_kecamatan} 
                                            className="form-select" 
                                            onChange={e=>{
                                                if(e.target.value!="") this.getDesaForm(props.values.id_provinsi, props.values.id_kabupaten_kota, e.target.value)
                                                else this.typeDownload({target:{name:"desa_form", value:[]}})

                                                props.handleChange(e)
                                                props.setFieldValue("id_desa", "")
                                            }}
                                        >
                                            <option value="">-- Pilih Kecamatan</option>
                                            {download_template.kecamatan_form.map(kf=>(
                                                <option key={kf} value={kf.id_region}>{kf.region}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label class="my-1 me-2" for="country">Desa</label>
                                        <select 
                                            name="id_desa" 
                                            value={props.values.id_desa} 
                                            className="form-select" 
                                            onChange={props.handleChange}
                                        >
                                            <option value="">-- Pilih Desa</option>
                                            {download_template.desa_form.map(kf=>(
                                                <option key={kf} value={kf.id_region}>{kf.region}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="d-flex flex-column">
                                        <span className="text-muted"><strong>*</strong> Hapus baris/data yang tidak digunakan!</span>
                                        <span className="text-muted"><strong>*</strong> Isikan hanya pada kolom berat_badan_lahir, tinggi_badan_lahir, berat_badan, tinggi_badan!</span>
                                        <span className="text-muted"><strong>*</strong> NIK Ibu, Nama Ibu Wajib diisi!</span>
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

                {/* MODAL IMPORT */}
                <Modal show={import_skrining.is_open} className="modal-blur" onHide={this.hideImport} backdrop="static" size="xl">
                    <Modal.Header closeButton>
                        <div className="modal-title h2 fw-bold">Data Excel</div>
                    </Modal.Header>
                    <Formik
                        initialValues={import_skrining.skrining}
                        onSubmit={this.importSkrining}
                    >
                        {props=>(
                            <form onSubmit={props.handleSubmit}>
                                <Modal.Body>
                                    {login_data.role!="posyandu"&&
                                        <div className="row mb-4">
                                            <div className="col-md-5 mx-auto">
                                                <div class="mb-3">
                                                    <label class="my-1 me-2" for="country">Posyandu</label>
                                                    <select 
                                                        name="id_user" 
                                                        value={props.values.id_user} 
                                                        className="form-select" 
                                                        onChange={props.handleChange}
                                                    >
                                                        <option value="">-- Pilih Posyandu</option>
                                                        {import_skrining.kecamatan_form.map(kec=>(
                                                            <optgroup label={kec.region} key={kec}>
                                                                {kec.posyandu.map(pos=>(
                                                                    <option value={pos.id_user} key={pos}>{pos.nama_lengkap}</option>
                                                                ))}
                                                            </optgroup>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                    <div class="table-responsive mb-4">
                                        <table class="table table-centered table-nowrap mb-0 rounded">
                                            <thead class="thead-light">
                                                <tr className="text-uppercase">
                                                    <th class="px-3 rounded-start" width="30">#</th>
                                                    <th class="px-3">NIK</th>
                                                    <th class="px-3">Nama Anak</th>
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
                                                        <tr className={classNames({"bg-danger":!list.found})}>
                                                            <td className="px-3">{(idx+1)}</td>
                                                            <td className="px-3">{list.data_anak.nik}</td>
                                                            <td className="px-3">{list.data_anak.nama_lengkap}</td>
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
                                    <div className="d-flex flex-column">
                                        <span className="text-muted"><strong>*</strong> Baris berwarna merah tidak ada di data kependudukan, proses import akan gagal!</span>
                                        <span className="text-muted"><strong>*</strong> Jika kolom NIK Ibu kosong, proses import akan gagal!</span>
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
                                        disabled={props.isSubmitting}
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

export default withRouter(withAuth(Skrining))