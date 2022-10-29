import React from "react"
import { OverlayTrigger, Tooltip } from "react-bootstrap"
import { BiSitemap, BiTrash } from "react-icons/bi"
import { BsPlus, BsPlusSquare } from "react-icons/bs"
import { FiCheck, FiClock, FiEdit, FiTrash, FiTrash2, FiUserPlus, FiX } from "react-icons/fi"
import { Tree, TreeNode } from "react-organizational-chart"
import JabatanContext from "../../store/jabatan_context"
import Avatar from "./avatar"

const OrganizationChart=({data})=>{
    return (
        <>
            <Tree
                lineWidth="1px"
                lineColor="#0d6efd"
                lineBorderRadius="0px"
                label={""}
            >
                {data.length>0?
                    data.map(d=>(
                        <OrgChartTree
                            data={d}
                        />
                    ))
                :
                    <TreeNode
                        label={
                            <AddOrgChartNode
                                id_jabatan=""
                            />
                        }
                    ></TreeNode>
                }
                
            </Tree>
        </>
    )
}
const OrgChartTree=({data})=>{
    return (
        <>
        {data.jabatan_type==="atasan"?
            <TreeNode
                label={
                    <OrgChartStyledNode 
                        jabatan={data.nama_jabatan}
                        users={data.users}
                        id_jabatan={data.id_jabatan}
                    />
                }
            >
                {data.bawahan.map(dc=>(
                    <OrgChartTree
                        data={dc}
                    />
                ))}
                <TreeNode
                    label={
                        <AddOrgChartNode
                            id_jabatan={data.id_jabatan}
                        />
                    }
                ></TreeNode>
            </TreeNode>
        :
            <TreeNode
                label={
                    <OrgChartStyledNode 
                        jabatan={data.nama_jabatan}
                        users={data.users}
                        id_jabatan={data.id_jabatan}
                    />
                }
            ></TreeNode>
        }
        </>
    )
}
const AddOrgChartNode=({id_jabatan})=>{
    const jabatan_context=React.useContext(JabatanContext)

    return (
        <button className="btn btn-primary mx-2" onClick={e=>jabatan_context.showTambahJabatan(id_jabatan)}>
            <BiSitemap className="fs-5"/>
        </button>
    )
}
const OrgChartStyledNode=({jabatan, id_jabatan, users})=>{
    const jabatan_context=React.useContext(JabatanContext)

    const renderStatus=(status)=>{
        let html_status
        switch(status){
            case "confirm":
                html_status=(
                    <OverlayTrigger
                        placement="bottom"
                        delay={{ show: 150, hide: 150 }}
                        overlay={props=>(
                            <Tooltip id="button-tooltip" {...props}>
                                Menunggu Konfirmasi
                            </Tooltip>
                        )}
                    >
                        <span className="list-jabatan-status badge bg-warning rounded-pill ms-auto"><FiClock/></span>
                    </OverlayTrigger>
                )
            break;
            case "applied":
                html_status=(
                    <OverlayTrigger
                        placement="bottom"
                        delay={{ show: 150, hide: 150 }}
                        overlay={props=>(
                            <Tooltip id="button-tooltip" {...props}>
                                Disetujui
                            </Tooltip>
                        )}
                    >
                        <span className="list-jabatan-status badge bg-success rounded-pill ms-auto"><FiCheck/></span>
                    </OverlayTrigger>
                )
            break;
            case "rejected":
                html_status=(
                    <OverlayTrigger
                        placement="bottom"
                        delay={{ show: 150, hide: 150 }}
                        overlay={props=>(
                            <Tooltip id="button-tooltip" {...props}>
                                Ditolak
                            </Tooltip>
                        )}
                    >
                        <span className="list-jabatan-status badge bg-danger rounded-pill ms-auto"><FiX/></span>
                    </OverlayTrigger>
                )
            break;
        }

        return html_status
    }

    return (
        <div 
            style={{
                display:"inline-block",
                borderRadius:"10px"
            }}
        >
            <div className="card card-organization mb-0">
                <div className="card-header d-flex justify-content-center px-3 py-2">
                    <span className="fs-7 fw-semibold text-nowrap">{jabatan}</span>
                </div>
                <div className="card-body">
                    {users.map(posisi=>(
                        <div className="d-flex align-items-center org-posisi-item list-jabatan">
                            <span className="avatar">
                                <Avatar data={posisi} circle/>
                            </span>
                            <span className="ms-2 me-3">{posisi.nama_lengkap}</span>
                            {renderStatus(posisi.status)}
                            <button className="list-jabatan-action btn btn-link link-danger btn-sm ms-1 px-1 pt-0" onClick={e=>jabatan_context.showHapusPekerja(posisi.id_jabatan_user)}><FiTrash2/></button>
                        </div>
                    ))}
                </div>
                <div className="card-footer">
                    <OverlayTrigger
                        placement="bottom"
                        delay={{show:100, hide:300}}
                        overlay={
                            <Tooltip>Tambah Pekerja</Tooltip>
                        }
                    >
                        <button className="btn btn-link link-dark fs-6 btn-sm px-1" onClick={e=>jabatan_context.showTambahPekerja(id_jabatan)}>
                            <FiUserPlus/>
                        </button>
                    </OverlayTrigger>
                    <OverlayTrigger
                        placement="bottom"
                        delay={{show:100, hide:300}}
                        overlay={
                            <Tooltip>Edit Jabatan</Tooltip>
                        }
                    >
                        <button className="btn btn-link link-dark btn-sm px-1" onClick={e=>jabatan_context.showEditJabatan({id_jabatan,nama_jabatan:jabatan})}>
                            <FiEdit/>
                        </button>
                    </OverlayTrigger>
                    <OverlayTrigger
                        placement="bottom"
                        delay={{show:100, hide:300}}
                        overlay={
                            <Tooltip>Hapus Jabatan</Tooltip>
                        }
                    >
                        <button className="btn btn-link link-dark btn-sm px-1" onClick={e=>jabatan_context.showHapusJabatan(id_jabatan)}>
                            <FiTrash2/>
                        </button>
                    </OverlayTrigger>
                </div>
            </div>
        </div>
    )
}

export default OrganizationChart