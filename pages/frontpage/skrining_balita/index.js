import React from "react"
import update from "immutability-helper"
import Animated from "../../../component/ui/animate"
import withAuth from "../../../component/hoc/auth"
import LayoutFrontpage from "../../../component/LayoutFrontpage"
import Link from "next/link"
import NumberFormat from 'react-number-format'
import { Formik } from "formik"
import { api, api_kependudukan } from "../../../config/api"
import { access_token, ceil_with_enclosure, isUndefined, login_data } from "../../../config/config"
import { toast } from "react-toastify"
import Router from "next/router"
import { ImPlus } from "react-icons/im"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import moment from "moment"
import { Modal } from "react-bootstrap"

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
        return await api_kependudukan().get(`/penduduk/${penduduk_id}`).then(res=>res.data.data)
    }
    getsSkriningNIK=async(nik)=>{
        return await api().get(`/skrining_balita/${nik}?type=nik`).then(res=>res.data.data)
    }
    addSkrining=async (values, actions)=>{
        //insert to database
        await api(access_token()).post("/skrining_balita", {
            id_user:values.id_user,
            data_anak:values.data_anak,
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

    render(){
        const {
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
                                        <button
                                            type="button"
                                            className="btn btn-primary text-nowrap" 
                                            onClick={this.toggleTambah}
                                        >
                                            <ImPlus/> Tambah
                                        </button>
                                        <div className="d-flex mb-3 mt-3">
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
                                                                    {list.data_anak.ibu}, {list.data_anak.ayah}
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
            </>
        )
    }
}

export default withAuth(Skrining)