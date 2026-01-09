
// Ray-casting algorithm to check if a point is inside a polygon
// Point: [longitude, latitude]
// Polygon: array of rings, where the first ring is the exterior ring
function isPointInPolygon(point, polygon) {
    const x = point[0], y = point[1];
    let inside = false;

    // We only need to check the exterior ring (index 0) for basic inclusion
    // If we have holes, we'd need to check them too, but for regions usually checking exterior is enough for assignment
    const ring = polygon[0];

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}

// Handle MultiPolygon as well
function isPointInGeometry(point, geometry) {
    if (geometry.type === 'Polygon') {
        return isPointInPolygon(point, geometry.coordinates);
    } else if (geometry.type === 'MultiPolygon') {
        for (const polygon of geometry.coordinates) {
            if (isPointInPolygon(point, polygon)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Finds the region name for a given point (lat, lng)
 * @param {number} lat 
 * @param {number} lng 
 * @param {object} geoJson FeatureCollection
 * @returns {string|null} Region name or null if not found
 */
export function getRegionForPoint(lat, lng, geoJson) {
    // GeoJSON uses [lng, lat]
    const point = [lng, lat];

    for (const feature of geoJson.features) {
        if (feature.geometry && isPointInGeometry(point, feature.geometry)) {
            return feature.properties.shapeName || feature.properties.name || 'Unknown Region';
        }
    }

    return null;
}
