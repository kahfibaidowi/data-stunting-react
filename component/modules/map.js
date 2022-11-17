import React from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"


const Map=(props)=>{
    const mapStyle=feature=>{
        let color="#00f"
        if(feature.properties.count_stunting>0){
            color="#f00"
        }

        return {
            stroke:true,
            color:"#FFF",
            weight:1,
            opacity:1,
            fillColor:color,
            fillOpacity:.7
        }
    }

    return (
        <MapContainer 
            center={[props.center.latitude, props.center.longitude]} 
            zoom={props.center.zoom} 
            scrollWheelZoom={false}
            className="map-responsive"
        >
            <ChangeView center={[props.center.latitude, props.center.longitude]} zoom={props.center.zoom} />
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <GeoJSON 
                key={Date.now()} 
                data={props.data} 
                style={mapStyle}
                onEachFeature={(feature, layer)=>{
                    let popupContent=`
                        <div class='d-flex flex-column'>
                            <span>Kecamatan : ${feature.properties.region}</span>
                            <span>Jumlah Anak Penderita Stunting : <strong>${feature.properties.count_stunting}</strong></span>
                        </div>
                    `
                    layer.bindPopup(popupContent)
                }}
            />
        </MapContainer>
    )
}

function ChangeView({center, zoom}){
    const map=useMap()
    map.setView(center, zoom)
    return null
}
 
export default Map