import React from 'react'
import { api } from '../../config/api'
import { is_login, access_token} from '../../config/config'
import Router, { withRouter } from 'next/router'

export default function withAuth(WrappedComponent, data){
    class authHOC extends React.Component{
        state={
            show_page:false
        }
        
        componentDidMount=()=>{
            if(is_login()){
                this.tokenVerify()
            }
            else{
                Router.push("/")
            }
        }
        tokenVerify=()=>{
            api(access_token()).get("/auth/verify")
            .then(res=>{
                this.setState({
                    show_page:true
                })
            })
            .catch(err=>{
                if(err.response.status===401){
                    localStorage.removeItem("login_data")
                    Router.push("/")
                }
            })
        }

        render(){
            return (
                <>
                    {this.state.show_page&&
                        <WrappedComponent {...this.props}/>
                    }
                </>
            )
        }
    }

    return withRouter(authHOC)
}