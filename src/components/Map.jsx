import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import './Map.css';
import L from 'leaflet';
import ghanaRegionsGeoJSON from '../data/ghana-regions.json';

// Fix for default marker icons in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to update view
const MapController = ({ selectedRegion, selectedDistrict, selectedPub, mockData }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedPub) {
            // Find pub coordinates
            let pub;
            for (const r of mockData) {
                for (const d of r.districts) {
                    const p = d.pubs.find(p => p.id === selectedPub);
                    if (p) { pub = p; break; }
                }
                if (pub) break;
            }
            if (pub && pub.coordinates) {
                map.flyTo(pub.coordinates, 15);
            }
        } else if (selectedDistrict || selectedRegion) {
            // For North/South or "All Outlets", just zoom to the bounds of the points in that group
            // Since we don't have specific polygons for North vs South, calculating bounds from points is safest.
            let pubs = [];

            const region = mockData.find(r => r.id === selectedRegion);
            if (region) {
                if (selectedDistrict) {
                    const dist = region.districts.find(d => d.id === selectedDistrict);
                    if (dist) pubs = dist.pubs;
                } else {
                    // Collect all pubs in region
                    region.districts.forEach(d => pubs.push(...d.pubs));
                }
            }

            if (pubs.length > 0) {
                const lats = pubs.map(p => p.coordinates[0]);
                const lngs = pubs.map(p => p.coordinates[1]);
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const minLng = Math.min(...lngs);
                const maxLng = Math.max(...lngs);
                map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [50, 50] });
            } else {
                // Default if no pubs (shouldn't happen with real data)
                map.flyTo([7.9465, -1.0232], 7);
            }
        }
    }, [selectedRegion, selectedDistrict, selectedPub, map, mockData]);

    return null;
};

const MapComponent = ({ mockData, selectedRegion, selectedDistrict, selectedPub, onSelectRegion, onSelectDistrict, onSelectPub }) => {
    const position = [7.9465, -1.0232];
    const zoom = 7;

    // Ghana boundaries
    const ghanaBounds = [
        [4.5, -3.5],
        [11.5, 1.5]
    ];

    // We keep the Ghana GeoJSON just for the visual outline of the country
    // We don't make it interactive for picking "North/South" because those don't map 1:1 to these administrative regions.
    const getRegionStyle = () => {
        return {
            fillColor: '#FFC600',
            fillOpacity: 0.1, // Lighter fill
            color: '#E6B200',
            weight: 1,
            opacity: 0.5,
            className: 'region-polygon'
        };
    };

    return (
        <div className="map-container">
            <MapContainer
                center={position}
                zoom={zoom}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                maxBounds={ghanaBounds}
                minZoom={6}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController
                    selectedRegion={selectedRegion}
                    selectedDistrict={selectedDistrict}
                    selectedPub={selectedPub}
                    mockData={mockData}
                />

                {/* World Mask */}
                <GeoJSON
                    data={{
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: [
                                [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]
                            ]
                        }
                    }}
                    style={{
                        fillColor: '#000000',
                        fillOpacity: 0.7,
                        color: 'transparent',
                        weight: 0,
                    }}
                />

                {/* Ghana Outline (Visual Only) */}
                <GeoJSON
                    data={ghanaRegionsGeoJSON}
                    style={getRegionStyle}
                />

                {/* Markers with Clustering */}
                <MarkerClusterGroup
                    chunkedLoading
                    spiderfyOnMaxZoom={true}
                >
                    {mockData.map(region => (
                        region.districts.map(district => (
                            district.pubs.map(pub => (
                                <Marker
                                    key={pub.id}
                                    position={pub.coordinates}
                                    eventHandlers={{
                                        click: () => {
                                            onSelectRegion(region.id);
                                            onSelectDistrict(district.id);
                                            onSelectPub(pub.id);
                                        },
                                    }}
                                >
                                    <Popup>
                                        <strong>{pub.name}</strong><br />
                                        {pub.address}<br />
                                        <span style={{ fontSize: '0.8em', color: '#666' }}>{pub.type}</span>
                                    </Popup>
                                </Marker>
                            ))
                        ))
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
};
export default MapComponent;
