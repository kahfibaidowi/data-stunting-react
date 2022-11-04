import React from "react"
import update from "immutability-helper"
import classNames from "classnames"
import Animated from "../../../component/ui/animate"
import withAuth from "../../../component/hoc/auth"
import LayoutFrontpage from "../../../component/LayoutFrontpage"
import Link from "next/link"
import NumberFormat from 'react-number-format'
import { Formik } from "formik"
import { api, api_kependudukan } from "../../../config/api"
import { access_token, ceil_with_enclosure, excelToMomentDate, isUndefined, login_data } from "../../../config/config"
import { toast } from "react-toastify"
import Router from "next/router"
import { ImFileExcel, ImPlus } from "react-icons/im"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import moment from "moment"
import { Button, ButtonGroup, Dropdown, Modal, Spinner } from "react-bootstrap"
import writeXlsxFile from 'write-excel-file'
import FileSaver from "file-saver"
import readXlsxFile from "read-excel-file"

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
        }
    }

    componentDidMount=()=>{
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
                posyandu_id:skrining.posyandu_id,
                nik:skrining.nik
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
    getBulan=bln=>{
        if(bln>60){
            return "60+ Bulan"
        }
        else{
            return bln+" Bulan"
        }
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
    getPenduduk=async(penduduk_id)=>{
        const token=await api(access_token()).get("/auth/generate_kependudukan_system_token").then(res=>res.data.data).catch(err=>false)
        
        if(token!==false){
            return await api_kependudukan(token).get(`/penduduk/${penduduk_id}`).then(res=>res.data.data)
        }
        else{
            toast.error(`Get data failed!`, {position:"bottom-center"})
        }
    }
    getsSkriningNIK=async(nik)=>{
        return await api().get(`/skrining_balita/${nik}?type=nik`).then(res=>res.data.data)
    }
    addSkrining=async (values, actions)=>{
        //insert to database
        await api(access_token()).post("/skrining_balita", {
            id_user:values.id_user,
            data_anak:Object.assign({}, values.data_anak, {
                ibu:values.data_anak.ibu!==null?values.data_anak.ibu:"",
                ayah:values.data_anak.ayah!==null?values.data_anak.ayah:""
            }),
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
            toast.error("Insert Data Failed!", {position:"bottom-center"})
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
        console.log("lksdf")
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
                data_excel.push([
                    {
                        type:String,
                        value:d.nik,
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
        let data_excel=[]

        const data=readXlsxFile(e.target.files[0])
        await data.then(rows=>{
            rows.map((row, idx)=>{
                if(idx>0){
                    data_excel.push({
                        data_anak:{
                            nik:row[0]!==null?row[0]:"",
                            nama_lengkap:row[1]!==null?row[1]:"",
                            tgl_lahir:excelToMomentDate(row[2]!==null?row[2]:""),
                            jenis_kelamin:row[3]!==null?row[3]:"",
                            ibu:{
                                nik:row[4]!==null?row[4]:"",
                                nama_lengkap:row[5]!==null?row[5]:""
                            },
                            ayah:row[6]===null?"":{
                                nik:row[6]!==null?row[6]:"",
                                nama_lengkap:row[7]!==null?row[7]:""
                            }
                        },
                        berat_badan_lahir:row[8]!==null?row[8]:"",
                        tinggi_badan_lahir:row[9]!==null?row[9]:"",
                        berat_badan:row[10]!==null?row[10]:"",
                        tinggi_badan:row[11]!==null?row[11]:""
                    })
                }
            })
        })

        //cek
        let nik_params=data_excel.map(dx=>dx.data_anak.nik)
        const token=await api(access_token()).get("/auth/generate_kependudukan_system_token").then(res=>res.data.data).catch(err=>"")

        await api_kependudukan(token).get("/penduduk/type/multiple", {
            params:{
                nik:nik_params
            }
        })
        .then(res=>{
            const data=res.data.data

            let xlsx=data_excel.map(x=>{
                let idx=data.findIndex(d=>d.nik==x.data_anak.nik)

                if(idx!=-1){
                    return Object.assign({}, x, {
                        data_anak:Object.assign({}, data[idx], {
                            ayah:data[idx].ayah!==null?data[idx].ayah:"",
                            ibu:data[idx].ibu!==null?data[idx].ibu:"",
                        }),
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
            toast.error("Import Data Failed!", {position:"bottom-center"})
        })
    }

    render(){
        const {
            import_skrining,
            download_template,
            kecamatan_form, 
            login_data, 
            skrining,
            tambah_skrining
        }=this.state

        return (
            <>
                <LayoutFrontpage>
                    <div className='block-blog-widget py-5'>
                        <div className='container px-md-4'>
                            <nav className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between">
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link href="/frontpage" className='text-decoration-none'>
                                            Frontpage
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item active">List Antropometri</li>
                                </ol>
                            </nav>
                            <div className='row mt-5 mb-5'>
                                <div className='col-md-12 mx-auto'>
                                    <div>
                                        <div className="d-flex">
                                            <button
                                                type="button"
                                                className="btn btn-primary text-nowrap me-2" 
                                                onClick={this.toggleTambah}
                                            >
                                                <ImPlus/> Tambah
                                            </button>
                                            <Dropdown as={ButtonGroup}>
                                                <Button variant="success" className="d-inline-flex align-items-center">
                                                    <ImFileExcel/>
                                                    <span class="ms-1">Import</span>
                                                </Button>
                                                <Dropdown.Toggle split variant="success" className="px-2"/>
                                                <Dropdown.Menu className="py-0">
                                                    <label class="d-block w-100 mb-0">
                                                        <Dropdown.Item as="span" className="d-block w-100 cursor-pointer">Pilih Berkas</Dropdown.Item>
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
                                        </div>
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
                                        <div className="table-responsive">
                                            <table className="table table-centered table-nowrap mb-0 rounded">
                                                <thead className="thead-light">
                                                    <tr>
                                                        <th className="border-0 rounded-start" width="50">#</th>
                                                        <th className="border-0">NIK</th>
                                                        <th className="border-0">Nama</th>
                                                        <th className="border-0">JK</th>
                                                        <th className="border-0">Tgl Lahir</th>
                                                        <th className="border-0">BB Lahir</th>
                                                        <th className="border-0">TB Lahir</th>
                                                        <th className="border-0">Orang Tua</th>
                                                        <th className="border-0">Prov</th>
                                                        <th className="border-0">Kab/Kota</th>
                                                        <th className="border-0">Kec</th>
                                                        <th className="border-0">Desa/Kel</th>
                                                        <th className="border-0">Posyandu</th>
                                                        <th className="border-0">Alamat</th>
                                                        <th className="border-0">Usia Saat Ukur</th>
                                                        <th className="border-0">Tanggal</th>
                                                        <th className="border-0">Berat Badan </th>
                                                        <th className="border-0">Tinggi Badan</th>
                                                        <th className="border-0">TB/U</th>
                                                        <th className="border-0">BB/U</th>
                                                        <th className="border-0">BB/TB</th>
                                                        <th className="border-0 rounded-end" width="90"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {skrining.data.map((list, idx)=>(
                                                        <tr key={list}>
                                                                <td className="align-middle">{(idx+1)+((skrining.page-1)*skrining.per_page)}</td>
                                                                <td>{list.data_anak.nik}</td>
                                                                <td>{list.data_anak.nama_lengkap}</td>
                                                                <td>{list.data_anak.jenis_kelamin}</td>
                                                                <td>{list.data_anak.tgl_lahir}</td>
                                                                <td>{list.berat_badan_lahir}</td>
                                                                <td>{list.tinggi_badan_lahir}</td>
                                                                <td>
                                                                    {list.data_anak.ibu?.nama_lengkap}, {list.data_anak.ayah?.nama_lengkap}
                                                                </td>
                                                                <td>JAWA TIMUR</td>
                                                                <td>MADIUN</td>
                                                                <td>{list.user_posyandu.kecamatan}</td>
                                                                <td>{list.user_posyandu.desa}</td>
                                                                <td>{list.user_posyandu.nama_lengkap}</td>
                                                                <td>Desa {list.user_posyandu.desa} - Posy. {list.user_posyandu.nama_lengkap}</td>
                                                                <td>{this.getBulan(list.usia_saat_ukur)}</td>
                                                                <td>{moment(list.created_at).format("YYYY-MM-DD")}</td>
                                                                <td>{list.berat_badan}</td>
                                                                <td>{list.tinggi_badan}</td>
                                                                <td>{list.hasil_tinggi_badan_per_umur.split("_").join(" ")}</td>
                                                                <td>{list.hasil_berat_badan_per_umur.split("_").join(" ")}</td>
                                                                <td>{list.hasil_berat_badan_per_tinggi_badan.split("_").join(" ")}</td>
                                                                <td className="text-nowrap p-1">
                                                                </td>
                                                        </tr>
                                                    ))}
                                                    {skrining.data.length==0&&
                                                        <tr>
                                                            <td colSpan="21" className="text-center">Data tidak ditemukan!</td>
                                                        </tr>
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="d-flex align-items-center mt-4">
                                            <div className="d-flex flex-column">
                                                <div>Halaman {skrining.page} dari {skrining.last_page} Halaman</div>
                                            </div>
                                            <div className="d-flex align-items-center me-auto ms-3">
                                                <select className="form-select" name="per_page" value={skrining.per_page} onChange={this.setPerPage}>
                                                    <option value="10">10 Data</option>
                                                    <option value="2">25 Data</option>
                                                    <option value="50">50 Data</option>
                                                    <option value="100">100 Data</option>
                                                </select>
                                            </div>
                                            <div className="d-flex ms-3">
                                                <button 
                                                    className="btn btn-gray" 
                                                    disabled={skrining.page<=1}
                                                    onClick={()=>this.goToPage(skrining.page-1)}
                                                >
                                                    <FaChevronLeft/>
                                                </button>
                                                <button 
                                                    className="btn btn-gray ms-1" 
                                                    disabled={skrining.page>=skrining.last_page}
                                                    onClick={()=>this.goToPage(skrining.page+1)}
                                                >
                                                    <FaChevronRight/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </LayoutFrontpage>

                {/* MODAL TAMBAH */}
                <Modal show={tambah_skrining.is_open} onHide={this.toggleTambah} backdrop="static">
                    <Modal.Header closeButton>
                        <Modal.Title>Cek Antropometri</Modal.Title>
                    </Modal.Header>
                    <Formik
                        initialValues={tambah_skrining.skrining}
                        enableReinitialize
                        onSubmit={this.addSkrining}
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
                                                                                nik_anak:{$set:data},
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
                                                <span class="form-text text-success">NIK Ditemukan : {tambah_skrining.search_data.nik_anak.nama_lengkap}</span>
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
                                                    <label className="my-1 me-2 fw-semibold" for="country">Berat Badan<span className="text-danger">*</span></label>
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
                                                    <label className="my-1 me-2 fw-semibold" for="country">Tinggi Badan<span className="text-danger">*</span></label>
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
                                <Modal.Footer className="mt-3">
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
                                        disabled={props.isSubmitting}
                                    >
                                        Save Changes
                                    </button>
                                </Modal.Footer>
                            </form>
                        )}
                    </Formik>
                </Modal>

                {/* MODAL DOWNLOAD TEMPLATE */}
                <Modal show={download_template.is_open} onHide={this.toggleDownload} backdrop="static">
                    <Modal.Header closeButton>
                        <Modal.Title>Download Template</Modal.Title>
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
                                <Modal.Footer className="mt-3">
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
                <Modal show={import_skrining.is_open} onHide={this.hideImport} backdrop="static" size="xl">
                    <Modal.Header closeButton>
                        <Modal.Title>Data Excel</Modal.Title>
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
                                                <tr>
                                                    <th class="border-0 rounded-start" width="30">#</th>
                                                    <th class="border-0">NIK</th>
                                                    <th class="border-0">Nama Anak</th>
                                                    <th class="border-0">Tgl Lahir</th>
                                                    <th class="border-0">Jenis Kelamin</th>
                                                    <th class="border-0">NIK Ibu</th>
                                                    <th class="border-0">Nama Ibu</th>
                                                    <th class="border-0">NIK Ayah</th>
                                                    <th class="border-0">Nama Ayah</th>
                                                    <th class="border-0">Berat Badan Lahir</th>
                                                    <th class="border-0">Tinggi Badan Lahir</th>
                                                    <th class="border-0">Berat Badan</th>
                                                    <th class="border-0 rounded-end">Tinggi Badan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {props.values.data.map((list, idx)=>(
                                                    <React.Fragment key={list}>
                                                        <tr className={classNames({"bg-danger":!list.found})}>
                                                            <td>{(idx+1)}</td>
                                                            <td>{list.data_anak.nik}</td>
                                                            <td>{list.data_anak.nama_lengkap}</td>
                                                            <td>{moment(list.data_anak.tgl_lahir).format("D MMM YYYY")}</td>
                                                            <td>{list.data_anak.jenis_kelamin}</td>
                                                            <td>{list.data_anak.ibu?.nik}</td>
                                                            <td>{list.data_anak.ibu?.nama_lengkap}</td>
                                                            <td>{list.data_anak.ayah?.nik}</td>
                                                            <td>{list.data_anak.ayah?.nama_lengkap}</td>
                                                            <td>{list.berat_badan_lahir}</td>
                                                            <td>{list.tinggi_badan_lahir}</td>
                                                            <td>{list.berat_badan}</td>
                                                            <td>{list.berat_badan}</td>
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
                                <Modal.Footer className="mt-3">
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
            </>
        )
    }
}

export default withAuth(Skrining)