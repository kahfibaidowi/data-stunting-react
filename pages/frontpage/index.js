import React from "react"
import Animated from "../../component/ui/animate"
import withAuth from "../../component/hoc/auth"
import LayoutFrontpage from "../../component/LayoutFrontpage"
import Link from "next/link"

class Frontpage extends React.Component{
    render(){
        return (
            <>
                <LayoutFrontpage>
                    <section className="block-slider">
                        <div className="container px-md-4">
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

                    <section className="block-widget mb-6">
                        <div className="container px-4">
                            <h2 className="block-title">Layanan Kesehatan Balita</h2>
                            <div className="row horizontal-scrollable flex-nowrap flex-md-wrap mt-2">
                                <div className="col-5 col-md-2 mb-4">
                                    <Link href="/frontpage/skrining_balita/add" className="d-flex flex-column align-items-center text-decoration-none box-shadow-1 p-3 rounded-2x h-100">
                                        <div className='widget-link-img-icon rounded'>
                                            <img src={`/6259890ee6bbd_antropometri.png`} className="img-fluid"/>
                                        </div>
                                        <div className="d-flex flex-column align-items-start mt-3">
                                            <h3 className='widget-title-text text-center'>Pemeriksaan Antropometri</h3>
                                        </div>
                                    </Link>
                                </div>
                                <div className="col-5 col-md-2 mb-4">
                                    <Link href="/frontpage/skrining_balita" className="d-flex flex-column align-items-center text-decoration-none box-shadow-1 p-3 rounded-2x h-100">
                                        <div className='widget-link-img-icon rounded'>
                                            <img src={`/620b99ec6e8ec_ilustrasi header-01-11.png`} className="img-fluid"/>
                                        </div>
                                        <div className="d-flex flex-column align-items-start mt-3">
                                            <h3 className='widget-title-text text-center'>Lihat Skrining</h3>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </LayoutFrontpage>
            </>
        )
    }
}

export default withAuth(Frontpage)