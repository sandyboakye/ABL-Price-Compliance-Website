import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../src/data/abl_customers.csv');

function cleanCoordinate(coord) {
    if (!coord) return null;
    // Remove any character that is not a digit, minus sign, or decimal point
    let cleaned = String(coord).replace(/[^0-9.-]/g, '');
    // Handle specific typos observed
    // e.g., '?' at start is handled by regex above
    // Check for 'O' instead of '0'? The regex removes 'O', which might be wrong if it was meant to be 0.
    // Let's do a more careful replacement for 'O' -> '0' if it looks like a number context, but regex `[^0-9.-]` strips it.
    // If the input was "O.41583", regex makes it ".41583". That's actually parsed correctly by float as 0.41583.
    // If input was "5.49487", regex keeps it.

    // Check for multiple decimals
    const parts = cleaned.split('.');
    if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    const val = parseFloat(cleaned);
    return isNaN(val) ? null : val;
}

function processRow(line) {
    // Simple CSV parse relying on the fact that our data doesn't seem to have commas inside quotes for these columns
    // properly parsing CSV is hard without a library, but let's try a split first.
    // The header is: CUST_Type,CUST_Name,phoneNumber,address,district,longitude,latitude

    // Using a regex to split by comma but ignoring commas inside quotes
    const columns = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

    // Fallback if match failed or simple split is better (our data seems simple enough?)
    // Actually, some names might have commas. Let's assume standard CSV structure.
    // Given we are running in node, maybe we should just do basic string manipulation if we don't want to depend on 'papaparse' in the script 
    // (though it is in package.json, this script runs in node, so we need "type": "module" in package.json which we have).
    // Let's rely on a simpler split for now, or just import fs and process.

    // Wait, the project has papaparse installed. I can use it if I want? 
    // But 'node scripts/clean_data.js' might not find it if it's not consistent with module resolution.
    // Let's stick to manual processing for resilience unless it's complex.

    // Actually, looking at the data:
    // CUST_Type,CUST_Name,phoneNumber,address,district,longitude,latitude
    // "Mainstream","LOME SPOT(A3)",244470385,"Somanya","South",0.09270,6.23685
    // Some lines don't have quotes. 

    // Let's try to just split by comma, but be careful.
    // Actually, looking at the file view, most fields don't have quotes unless necessary? 
    // Line 12: Mainstream,SUMMERSPING RESTAURANT(C3,244893525,Somanya,South,0.10095,6.09427
    // That has a parenthesis but no comma inside.

    // Let's use a regex that handles quoted values to be safe.
    const parts = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuote = !inQuote;
            current += char;
        } else if (char === ',' && !inQuote) {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current);

    if (parts.length < 7) return line; // Broken line?

    // Indices based on header: CUST_Type,CUST_Name,phoneNumber,address,district,longitude,latitude
    // 0: Type, 1: Name, 2: Phone, 3: Address, 4: District, 5: Longitude, 6: Latitude

    let lngStr = parts[5];
    let latStr = parts[6];

    let lng = cleanCoordinate(lngStr);
    let lat = cleanCoordinate(latStr);

    if (lng === null || lat === null) {
        // console.log(`Skipping invalid row: ${line}`);
        // Instead of skipping, maybe we keep it but warn? 
        // For the map, invalid coords are useless. Let's fix or skip.
        // The user wants to CLEAN.
        return null;
    }

    // Heuristics for Ghana
    // Lat: 4 to 11
    // Lng: -3.5 to 1.5

    // Check if swapped
    if (Math.abs(lat) < 4 && Math.abs(lng) > 4) {
        // Likely swapped
        const temp = lat;
        lat = lng;
        lng = temp;
    }

    // Check bounds (rough box for Ghana)
    if (lat < 4 || lat > 12 || lng < -4 || lng > 2) {
        // Out of bounds. 
        // Some might be legitimate mistakes we can't auto-fix (like being in the ocean at 0,0).
        // Check for 0,0
        if (Math.abs(lat) < 0.1 && Math.abs(lng) < 0.1) return null; // Null island

        // Maybe missed negative sign on Longitude? Most of Ghana is West (Negative).
        // If lng is like 0.2, it's East. If it's 2.0, it's Togo border.
        // If it looks like a coordinate that is just missing a minus sign?
        // e.g. 1.123 -> -1.123
        if (lng > 1.5) {
            // Try negating
            if (lng > 1.5 && lng < 4) lng = -lng;
        }
    }

    // Reconstruct line
    parts[5] = String(lng);
    parts[6] = String(lat);

    return parts.join(',');
}

try {
    const data = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = data.split(/\r?\n/);
    const header = lines[0];
    const cleanedLines = [header];

    let droppedCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const processed = processRow(line);
        if (processed) {
            cleanedLines.push(processed);
        } else {
            droppedCount++;
        }
    }

    fs.writeFileSync(CSV_PATH, cleanedLines.join('\n'));
    console.log(`Cleanup complete. Processed ${lines.length} lines.`);
    console.log(`Kept: ${cleanedLines.length}`);
    console.log(`Dropped/Invalid: ${droppedCount}`);

} catch (err) {
    console.error("Error processing CSV:", err);
    process.exit(1);
}
