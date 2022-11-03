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
import moment from "moment"

class AddSkrining extends React.Component{
    state={
        login_data:{},
        kecamatan_form:[],
        tambah_skrining:{
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

    componentDidMount=()=>{
        this.setState({
            login_data:login_data()!==null?login_data():{}
        }, ()=>{
            if(this.state.login_data.role=="posyandu"){
                this.setState({
                    tambah_skrining:update(this.state.tambah_skrining, {
                        id_user:{$set:this.state.login_data.id_user}
                    })
                })
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
            actions.resetForm()
            this.setState({
                search_data:{
                    nik_anak:{},
                    nik_ibu:{},
                    nik_ayah:{}
                }
            })
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
        const {tambah_skrining, login_data, kecamatan_form, search_data}=this.state

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
                                    <li className="breadcrumb-item active">Cek Antropometri</li>
                                </ol>
                            </nav>
                            <div className='row mt-5 mb-5'>
                                <div className='col-md-4 mx-auto'>
                                    <Formik
                                        initialValues={tambah_skrining}
                                        enableReinitialize
                                        onSubmit={this.addSkrining}
                                    >
                                        {props=>(
                                            <form onSubmit={props.handleSubmit}>
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
                                                                            search_data:update(this.state.search_data, {
                                                                                nik_anak:{$set:{}},
                                                                                old_data:{$set:{}}
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
                                                                                    search_data:update(this.state.search_data, {
                                                                                        nik_anak:{$set:data},
                                                                                        old_data:{$set:old_data}
                                                                                    })
                                                                                })
                                                                            }
                                                                            else{
                                                                                this.setState({
                                                                                    search_data:update(this.state.search_data, {
                                                                                        nik_anak:{$set:{}},
                                                                                        old_data:{$set:{}}
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
                                                        {!isUndefined(search_data.nik_anak.id_penduduk)&&
                                                            <span class="form-text text-success">NIK Ditemukan : {search_data.nik_anak.nama_lengkap}</span>
                                                        }
                                                    </div>
                                                    {!isUndefined(props.values.data_anak.nik)&&
                                                        <>
                                                            {isUndefined(search_data.old_data.id_skrining_balita)&&
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
                                                    <div className="d-flex justify-content-center mt-4">
                                                        <button 
                                                            type="submit" 
                                                            className="btn btn-primary"
                                                            disabled={props.isSubmitting}
                                                        >
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        )}
                                    </Formik>
                                </div>
                            </div>
                        </div>
                    </div>
                </LayoutFrontpage>
            </>
        )
    }
}

export default withAuth(AddSkrining)