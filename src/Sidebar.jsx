import React, { useState, useMemo } from 'react';
import { Home, Search } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({
    mockData,
    selectedRegion,
    selectedDistrict,
    selectedPub,
    onBack,
    onSelectRegion,
    onSelectDistrict,
    onSelectPub,
    onToggleCompare,
    compareList,
    onOpenSearch,
    onGoHome
}) => {
    // Helpers
    const currentRegion = useMemo(() =>
        mockData.find(r => r.id === selectedRegion),
        [mockData, selectedRegion]
    );

    const currentDistrict = useMemo(() =>
        currentRegion?.districts.find(d => d.id === selectedDistrict),
        [currentRegion, selectedDistrict]
    );

    const currentPub = useMemo(() =>
        currentDistrict?.pubs.find(p => p.id === selectedPub),
        [currentDistrict, selectedPub]
    );

    // Render Functions
    const renderRegionList = () => (
        <div className="list-group">
            <div className="list-header">
                <h3>Select ABL District</h3>
                <span className="hint">Click a district to view its administrative regions</span>
            </div>
            <ul>
                {mockData.map(region => (
                    <li
                        key={region.id}
                        className="list-item clickable"
                        onClick={() => onSelectRegion(region.id)}
                    >
                        <div className="item-name">{region.name}</div>
                        <div className="item-meta">{region.districts.length} Regions</div>
                    </li>
                ))}
            </ul>
        </div>
    );

    const renderDistrictList = () => (
        <div className="list-group">
            <button className="back-btn" onClick={() => onBack('region')}>
                ← Back to ABL Districts
            </button>
            <div className="list-header">
                <h3>{currentRegion.name}</h3>
                <span className="hint">Administrative Regions</span>
            </div>
            <ul>
                {currentRegion.districts.map(district => (
                    <li
                        key={district.id}
                        className="list-item clickable"
                        onClick={() => onSelectDistrict(district.id)}
                    >
                        <div className="item-name">{district.name}</div>
                        <div className="item-meta">{district.pubs.length} Pubs</div>
                    </li>
                ))}
            </ul>
        </div>
    );

    const renderPubList = () => (
        <div className="list-group">
            <button className="back-btn" onClick={() => onBack('district')}>
                ← Back to {currentRegion.name}
            </button>
            <div className="list-header">
                <h3>{currentDistrict.name}</h3>
                <span className="hint">Pubs</span>
            </div>
            <ul>
                {currentDistrict.pubs.map(pub => {
                    const isComparing = compareList.find(p => p.id === pub.id);
                    return (
                        <li key={pub.id} className="list-item clickable">
                            <div onClick={() => onSelectPub(pub.id)}>
                                <div className="item-name">{pub.name}</div>
                                <div className="item-meta">{pub.address}</div>
                            </div>
                            <button
                                className={`compare-btn ${isComparing ? 'active' : ''}`}
                                onClick={(e) => { e.stopPropagation(); onToggleCompare(pub); }}
                            >
                                {isComparing ? 'Remove Compare' : 'Compare'}
                            </button>
                        </li>
                    )
                })}
            </ul>
        </div>
    );

    const renderPubDetails = () => {
        const pub = currentDistrict.pubs.find(p => p.id === selectedPub);
        if (!pub) return null;

        const isComparing = compareList.find(p => p.id === pub.id);
        return (
            <div className="details-view">
                <button className="back-btn" onClick={() => onBack('pub')}>
                    ← Back to {currentDistrict.name}
                </button>
                <div className="pub-header">
                    <div className="pub-title-row">
                        <h2>{pub.name}</h2>
                        <button
                            className={`compare-btn ${isComparing ? 'active' : ''}`}
                            onClick={() => onToggleCompare(pub)}
                        >
                            {isComparing ? 'Remove' : 'Compare'}
                        </button>
                    </div>
                    <p className="address">{pub.address}, {currentRegion.name}</p>
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pub.name + ' ' + pub.address + ' ' + currentRegion.name + ' Ghana')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="maps-link"
                    >
                        View on Google Maps
                    </a>
                </div>

                <div className="products-section">
                    <h3>Products & Prices</h3>
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th className="text-right">Price (GHS)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pub.products.map((product, index) => (
                                <tr key={index}>
                                    <td>
                                        <div className="product-info-cell">
                                            <div className="product-thumb">
                                                <img src={product.image} alt={product.name} />
                                            </div>
                                            <div className="product-text">
                                                <span className="product-name">{product.name}</span>
                                                <span className="product-category">{product.category}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-right price-cell">
                                        <span className="currency">GHS</span>
                                        <span className="amount">{product.price.toFixed(2)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    let content;
    if (selectedPub) content = renderPubDetails();
    else if (selectedDistrict && currentDistrict) content = renderPubList();
    else if (selectedRegion && currentRegion) content = renderDistrictList();
    else content = renderRegionList();

    return (
        <div className={`sidebar ${selectedRegion ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="header-left">
                    {onGoHome && (
                        <button className="home-btn" onClick={onGoHome} title="Back to Home">
                            <Home size={20} />
                        </button>
                    )}
                    <div className="brand" onClick={onGoHome} style={{ cursor: onGoHome ? 'pointer' : 'default' }}>
                        ABL Price Check
                    </div>
                </div>
                {onOpenSearch && (
                    <button className="search-trigger-btn" onClick={onOpenSearch} title="Search (Ctrl+K)">
                        <Search size={20} />
                    </button>
                )}
            </div>
            <div className="sidebar-content">
                {content}
            </div>
        </div>
    );
};

export default Sidebar;
