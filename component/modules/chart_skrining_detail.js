import React, { useState } from "react"
import classNames from "classnames";
import { Line } from "react-chartjs-2"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    defaults
} from 'chart.js';
import { isUndefined } from "../../config/config";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
defaults.font.family="Roboto"

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function ChartSkriningDetail({formula, jenkel, data=[]}){
    const [page, setPage]=useState(1)

    const antropometri=()=>{
        let posisi, batas
        if(page==1){
            posisi=0
            batas=25
        }
        else{
            posisi=25
            batas=61
        }

        if(isUndefined(jenkel)) return []
        if(isUndefined(formula.l)) return []

        let bbu=formula?.[jenkel.toLowerCase()].berat_badan_umur
        if(isUndefined(bbu)) return []

        //exec
        let new_bbu=[]
        for(var i=posisi; i<batas; i++){
            new_bbu=new_bbu.concat([bbu[i]])
        }
        const type=['min3sd', 'min2sd', 'min1sd', 'median', '1sd', '2sd', '3sd']

        return type.map(tp=>{
            const line_data=new_bbu.map(bb=>{
                return bb[tp]
            })

            let color=""
            if(['min3sd', 'min1sd', '2sd', '3sd'].includes(tp)){
                color="#000"
            }
            if(tp=="min2sd"){
                color="#f00"
            }
            if(tp=="median"){
                color="#0f0"
            }
            if(tp=="1sd"){
                color="#fcba03"
            }

            return {
                label:tp,
                disabled:true,
                data:line_data,
                color:color,
                weight:1,
                pointRadius:0
            }
        })
    }
    const berat_badan=()=>{
        let posisi, batas
        if(page==1){
            posisi=0
            batas=25
        }
        else{
            posisi=25
            batas=61
        }

        let bb=[]
        for(var i=posisi; i<batas; i++){
            const find_data=data.find(f=>f.usia_saat_ukur.toString()==i.toString())

            bb=bb.concat([!isUndefined(find_data)?Number(find_data.berat_badan):null])
        }

        return [{
            label:"Berat Badan",
            disabled:false,
            data:bb,
            color:"#000",
            weight:2,
            pointRadius:3
        }]
    }
    const labels=()=>{
        let posisi, batas
        if(page==1){
            posisi=0
            batas=25
        }
        else{
            posisi=25
            batas=61
        }

        let value=[]
        for(var i=posisi; i<batas; i++){
            value=value.concat([i])
        }

        return value
    }
    const data_generated=()=>{
        return berat_badan().concat(antropometri())
    }

    //actions

    return (
        <>
            <div className="d-flex">
                <div className="ms-auto">
                    <button 
                        className={classNames(
                            "btn",
                            "border-0",
                            {"btn-primary":page!=1}
                        )}
                        disabled={page==1}
                        onClick={()=>setPage(1)}
                    >
                        <FiChevronLeft/>
                        Prev
                    </button>
                    <button 
                        className={classNames(
                            "btn",
                            "border-0",
                            {"btn-primary":page!=2},
                            "ms-2"
                        )}
                        disabled={page==2}
                        onClick={()=>setPage(2)}
                    >
                        Next
                        <FiChevronRight/>
                    </button>
                </div>
            </div>
            <div style={{width:"100%", minWidth:"1084px", position:"relative"}}>
                <Line
                    data={{
                        labels:labels(),
                        datasets:data_generated().map(bj=>{
                            return {
                                label:bj.label,
                                data:bj.data,
                                borderWidth:bj.weight,
                                borderColor:bj.color,
                                backgroundColor:bj.color,
                                pointRadius:bj.pointRadius
                            }
                        })
                    }}
                    options={{
                        scales:{
                            x:{
                                grid:{
                                    display:true
                                }
                            },
                            y:{
                                suggestedMax:10,
                                min:0
                            }
                        },
                        plugins:{
                            legend:{
                                display:false
                            }
                        },
                        interaction:{
                            intersect:false,
                            mode:"point"
                        },
                        responsive:true,
                        maintainAspectRatio:true
                    }}
                />
            </div>
        </>
    )
}