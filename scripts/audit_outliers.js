
import fs from 'fs';
import Papa from 'papaparse';
import { getRegionForPoint } from '../src/utils/geoUtils.js';
import ghanaRegions from '../src/data/ghana-regions.json' with { type: "json" };

const csvFilePath = './src/data/abl_customers.csv';

const fileContent = fs.readFileSync(csvFilePath, 'utf8');

Papa.parse(fileContent, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (results) => {
        const rows = results.data;
        const outliers = [];

        rows.forEach((row, index) => {
            if (!row.latitude || !row.longitude) return;

            const region = getRegionForPoint(row.latitude, row.longitude, ghanaRegions);

            if (!region) {
                outliers.push({
                    Row: index + 2, // +1 for 0-index, +1 for header
                    Name: row.CUST_Name,
                    Address: row.address,
                    Latitude: row.latitude,
                    Longitude: row.longitude,
                    District: row.district
                });
            }
        });

        console.log(`Found ${outliers.length} outliers.`);

        // Generate Markdown Table
        let markdown = "| Row | Name | Address | Latitude | Longitude | ABL District |\n";
        markdown += "|---|---|---|---|---|---|\n";

        outliers.forEach(o => {
            markdown += `| ${o.Row} | ${o.Name} | ${o.Address} | ${o.Latitude} | ${o.Longitude} | ${o.District} |\n`;
        });

        fs.writeFileSync('outliers_report.md', markdown);
        console.log('Report written to outliers_report.md');
    }
});
