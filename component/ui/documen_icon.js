import React from "react"
import {FaFileImage, FaFileExcel, FaFileWord, FaFilePdf, FaFileAlt} from "react-icons/fa"

const DocumentIcon=({data})=>{
    var file_ext=data.split('.').pop();

    switch(file_ext){
        case "jpg":
        case "jpeg":
        case "png":
            return <FaFileImage size={20}/>
        break;
        
        case "xls":
        case "xlsx":
        case "csv":
            return <FaFileExcel size={20}/>
        break;

        case "doc":
        case "docx":
            return <FaFileWord size={20}/>
        break;

        case "pdf":
            return <FaFilePdf size={20}/>
        break;

        default:
            return <FaFileAlt size={20}/>
    }
}

export default DocumentIcon