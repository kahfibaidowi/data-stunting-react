import Link from "next/link"
import React from "react"

export default function Error404(){
    return (
        <div className="main-wrapper">
		    <div className="page-wrapper full-page">
                <div className="page-content d-flex align-items-center justify-content-center">
                    <div className="row w-100 mx-0 auth-page">
                        <div className="col-md-8 col-xl-6 mx-auto d-flex flex-column align-items-center">
                            <img
                                src="/images/404.svg"
                                className="img-fluid mb-2" 
                                alt="404"
                                width="911"
                                height="351"
                            />
                            <h1 className="fw-bolder mb-22 mt-2 tx-80 text-muted">404</h1>
                            <h4 className="mb-2">Page Not Found</h4>
                            <h6 className="text-muted mb-3 text-center">{"Oopps!! The page you were looking for doesn't exist."}</h6>
                            <Link href="/">Back to Homepage</Link>
                        </div>
                    </div>
                    <div className="mboh"></div>
                </div>
            </div>
	    </div>
    )
}