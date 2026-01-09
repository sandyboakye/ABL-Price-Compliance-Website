import { useState, useEffect } from 'react';
import { db } from '../db';
import { initializeDatabase } from '../services/dataLoader';

export const usePubData = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // 1. Initialize DB (only parses CSV if empty)
                await initializeDatabase();

                // 2. Query all pubs
                const allPubs = await db.pubs.toArray();

                // 3. Transform flat list back to hierarchical structure for App
                // Structure: [{ id, name, districts: [{ id, name, pubs: [...] }] }]

                const regionsMap = {};

                allPubs.forEach(pub => {
                    const rId = pub.region === 'District North' ? 'region-north' : 'region-south';

                    if (!regionsMap[rId]) {
                        regionsMap[rId] = {
                            id: rId,
                            name: pub.region,
                            districtsMap: {}
                        };
                    }

                    const dId = pub.administrativeRegion || 'Unknown Region';

                    // Filter out Unknown Regions (Outliers) as requested
                    if (dId === 'Unknown Region') {
                        return;
                    }

                    if (!regionsMap[rId].districtsMap[dId]) {
                        regionsMap[rId].districtsMap[dId] = {
                            id: dId, // Use admin region name as ID
                            name: dId,
                            pubs: []
                        };
                    }

                    regionsMap[rId].districtsMap[dId].pubs.push(pub);
                });

                const formattedData = Object.values(regionsMap).map(r => ({
                    id: r.id,
                    name: r.name,
                    districts: Object.values(r.districtsMap)
                }));

                setData(formattedData);
            } catch (err) {
                console.error("Failed to load pub data:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    return { data, loading, error };
};
