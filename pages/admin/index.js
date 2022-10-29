import withAuth from "../../component/hoc/auth"
import React from "react"
import LayoutAdmin from "../../component/LayoutAdmin"

class Dashboard extends React.Component{
    state={}

    componentDidMount=()=>{
    }


    render(){
        return (
            <LayoutAdmin
                title="Dashboard"
            >
                
            </LayoutAdmin>
        )
    }
}

export default withAuth(Dashboard)