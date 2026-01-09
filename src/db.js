import Dexie from 'dexie';

export const db = new Dexie('AblPriceCheckDB');

// Bumped to version 3 to regenerate products with min/max price and compliance flags.
// We clear the table on upgrade to ensure we re-ingest the CSV with the new structure.
db.version(3).stores({
    pubs: '++id, region, district, administrativeRegion, name, type'
}).upgrade(tx => {
    return tx.table('pubs').clear();
});

// Add a hook to populate data if needed in future, but we'll control it via dataLoader for now.
