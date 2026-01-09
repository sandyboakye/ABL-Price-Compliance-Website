import React from 'react';
import './CompareModal.css';

const CompareModal = ({ isOpen, onClose, pubs, allProducts }) => {
    if (!isOpen) return null;

    // Get a unique list of all product categories and names derived from the pubs being compared
    // OR we can just use the union of all products found in these pubs.
    // Ideally we want to compare apples to apples.
    // Let's iterate through all pubs and collect all unique product IDs.

    const productMap = new Map();
    pubs.forEach(pub => {
        pub.products.forEach(p => {
            if (!productMap.has(p.name)) {
                productMap.set(p.name, { id: p.id, name: p.name, category: p.category });
            }
        });
    });
    const uniqueProducts = Array.from(productMap.values()).sort((a, b) => a.category.localeCompare(b.category));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Compare Prices</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="comparison-table-wrapper">
                        <table className="comparison-table">
                            <thead>
                                <tr>
                                    <th className="product-col">Product</th>
                                    {pubs.map(pub => (
                                        <th key={pub.id}>
                                            {pub.name}
                                            <span className="sub-header">{pub.address}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {uniqueProducts.map(product => (
                                    <tr key={product.id}>
                                        <td className="product-col">
                                            <div className="p-name">{product.name}</div>
                                            <div className="p-cat text-muted">{product.category}</div>
                                        </td>
                                        {(() => {
                                            const rowPrices = pubs.map(p => {
                                                const prod = p.products.find(pr => pr.name === product.name);
                                                return prod ? prod.price : -1;
                                            });
                                            const maxRowPrice = Math.max(...rowPrices);

                                            return pubs.map(pub => {
                                                const pubProduct = pub.products.find(p => p.name === product.name);

                                                if (!pubProduct) {
                                                    return <td key={pub.id} className="price-col"><span className="na">--</span></td>;
                                                }

                                                const price = pubProduct.price;
                                                // Only highlight if it's the max price in the row and there are multiple valid prices to compare
                                                const isHighest = price === maxRowPrice && price > 0 && rowPrices.filter(p => p > 0).length > 1;

                                                return (
                                                    <td key={pub.id} className={`price-col ${isHighest ? 'highest-price' : ''}`}>
                                                        <div className="price-container">
                                                            {isHighest && <span className="highest-label">Highest</span>}

                                                            <span className="price-main">
                                                                GHS {price.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                );
                                            });
                                        })()}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompareModal;
