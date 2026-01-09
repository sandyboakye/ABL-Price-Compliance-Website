import Papa from 'papaparse';
import { db } from '../db';
import ablCustomersCsv from '../data/abl_customers.csv?raw';
import ghanaRegions from '../data/ghana-regions.json';
import { getRegionForPoint } from '../utils/geoUtils';

// Images (Need to import these to map them just like in mockData)
// To avoid circular dependency or code duplication, we might need to refactor where these live,
// but for now, we'll keep the generation logic here or import a helper.
// Since mockData had them hardcoded, we'll replicate the product generation logic here.

import betaMaltPetImg from '../assets/images/Beta Malt PET.jpg';
import betaMaltRgbImg from '../assets/images/Beta Malt RGB.jpg';
import brutalCanImg from '../assets/images/BRUTAL CAN.png';
import brutalFruitRubyImg from '../assets/images/Brutal Fruit Ruby Apple.jpg';
import budweiserImg from '../assets/images/Budweiser.jpg';
import castleLiteCanImg from '../assets/images/CASTLE LITE_CAN.png';
import clubLagerMiniImg from '../assets/images/Club Lager (Mini).jpg';
import clubLagerLargeImg from '../assets/images/Club Lager (Large).jpg';
import coronaExtraImg from '../assets/images/Corona Extra.jpg';
import eagleExtraStoutImg from '../assets/images/Eagle Extra Stout.jpg';
import eagleLagerImg from '../assets/images/Eagle Lager.jpg';
import shandyMiniImg from '../assets/images/Shandy(Mini).jpg';
import shandyLargeImg from '../assets/images/Shandy(Large).jpg';
import stellaArtoisImg from '../assets/images/Stella Artois.jpg';

export const PRODUCT_CATALOG = [
    { name: "Beta Malt PET", image: betaMaltPetImg, targetPrice: 8.00, minPrice: 7.50, maxPrice: 8.50, category: "Malt" },
    { name: "Beta Malt RGB", image: betaMaltRgbImg, targetPrice: 7.00, minPrice: 6.50, maxPrice: 7.50, category: "Malt" },
    { name: "BRUTAL CAN", image: brutalCanImg, targetPrice: 14.00, minPrice: 13.00, maxPrice: 15.00, category: "Cider" },
    { name: "Brutal Fruit Ruby Apple", image: brutalFruitRubyImg, targetPrice: 15.00, minPrice: 14.00, maxPrice: 16.00, category: "Cider" },
    { name: "Budweiser", image: budweiserImg, targetPrice: 16.00, minPrice: 15.00, maxPrice: 17.00, category: "Premium" },
    { name: "CASTLE LITE_CAN", image: castleLiteCanImg, targetPrice: 13.00, minPrice: 12.00, maxPrice: 14.00, category: "Beer" },
    { name: "Club Lager (Mini)", image: clubLagerMiniImg, targetPrice: 10.00, minPrice: 9.50, maxPrice: 10.50, category: "Beer" },
    { name: "Club Lager (Large)", image: clubLagerLargeImg, targetPrice: 15.00, minPrice: 14.00, maxPrice: 16.00, category: "Beer" },
    { name: "Corona Extra", image: coronaExtraImg, targetPrice: 18.00, minPrice: 17.00, maxPrice: 19.00, category: "Premium" },
    { name: "Eagle Extra Stout", image: eagleExtraStoutImg, targetPrice: 12.00, minPrice: 11.00, maxPrice: 13.00, category: "Stout" },
    { name: "Eagle Lager", image: eagleLagerImg, targetPrice: 11.00, minPrice: 10.00, maxPrice: 12.00, category: "Beer" },
    { name: "Shandy(Mini)", image: shandyMiniImg, targetPrice: 9.00, minPrice: 8.50, maxPrice: 9.50, category: "Beer" },
    { name: "Shandy(Large)", image: shandyLargeImg, targetPrice: 12.00, minPrice: 11.00, maxPrice: 13.00, category: "Beer" },
    { name: "Stella Artois", image: stellaArtoisImg, targetPrice: 19.00, minPrice: 18.00, maxPrice: 20.00, category: "Premium" }
];

const generateProductsForPub = (pubIndex) => {
    const priceVariance = (Math.random() * 4) - 2; // +/- 2 GHS

    return PRODUCT_CATALOG.map((p, i) => {
        // Randomly skip some products to simulate variety? No, keep all for now for consistency,
        // or maybe skip 10%
        // if (Math.random() > 0.9) return null; 

        // Apply variance to the target price
        const effectivePrice = parseFloat((p.targetPrice + priceVariance).toFixed(2));

        return {
            ...p,
            id: `p${pubIndex}-${i + 1}`,
            price: effectivePrice,
            compliant: effectivePrice >= p.minPrice && effectivePrice <= p.maxPrice
            // We already include minPrice/maxPrice from spread ...p
        };
    }).filter(Boolean); // Filter nulls if we skipped any
};

export const initializeDatabase = async () => {
    try {
        const count = await db.pubs.count();
        if (count > 0) {
            console.log("Database already populated.");
            return;
        }

        console.log("Database empty. Parsing CSV and populating...");

        return new Promise((resolve, reject) => {
            Papa.parse(ablCustomersCsv, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: async (results) => {
                    const rows = results.data;
                    const pubsToAdd = [];

                    rows.forEach((row, index) => {
                        // Validation similar to mockData.js
                        const regionKey = row.district === 'North' ? 'District North' : (row.district === 'South' ? 'District South' : null);

                        if (!regionKey) return;
                        if (!row.latitude || !row.longitude || isNaN(row.latitude) || isNaN(row.longitude)) return;

                        // Determine Administrative Region
                        const adminRegion = getRegionForPoint(row.latitude, row.longitude, ghanaRegions) || 'Unknown Region';

                        // We flatten the data for the DB. 
                        // ID needs to be unique. 
                        const pubId = `pub-${index}`;

                        pubsToAdd.push({
                            id: pubId,
                            name: row.CUST_Name,
                            address: row.address || 'Unknown Address',
                            locationUrl: `https://www.google.com/maps/search/?api=1&query=${row.latitude},${row.longitude}`,
                            coordinates: [row.latitude, row.longitude],
                            region: regionKey, // 'District North' or 'District South'
                            administrativeRegion: adminRegion,
                            district: 'All Outlets', // Grouping bucket
                            type: row.CUST_Type,
                            products: generateProductsForPub(index)
                        });
                    });

                    if (pubsToAdd.length > 0) {
                        await db.pubs.bulkAdd(pubsToAdd);
                        console.log(`Successfully added ${pubsToAdd.length} pubs to IndexedDB.`);
                    }
                    resolve();
                },
                error: (err) => {
                    console.error("CSV Parse Error:", err);
                    reject(err);
                }
            });
        });

    } catch (error) {
        console.error("Database initialization failed:", error);
        throw error;
    }
};
