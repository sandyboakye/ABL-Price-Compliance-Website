
import React, { useState } from 'react';
import { Filter, X, CheckCircle, AlertTriangle } from 'lucide-react';
import './FilterPanel.css';

const FilterPanel = ({
    outletTypes,
    products,
    activeFilters,
    onFilterChange,
    onClose
}) => {
    // activeFilters: { outletType: [], compliance: 'all', product: 'all' }

    const handleOutletTypeChange = (type) => {
        const currentTypes = activeFilters.outletType || [];
        const newTypes = currentTypes.includes(type)
            ? currentTypes.filter(t => t !== type)
            : [...currentTypes, type];
        onFilterChange({ ...activeFilters, outletType: newTypes });
    };

    return (
        <div className="filter-panel">
            <div className="filter-header">
                <h3>Filters</h3>
                <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>

            <div className="filter-section">
                <h4>Compliance Status</h4>
                <div className="radio-group">
                    <label className={`radio-option ${activeFilters.compliance === 'all' ? 'active' : ''}`}>
                        <input
                            type="radio"
                            name="compliance"
                            checked={activeFilters.compliance === 'all'}
                            onChange={() => onFilterChange({ ...activeFilters, compliance: 'all' })}
                        />
                        All
                    </label>
                    <label className={`radio-option ${activeFilters.compliance === 'compliant' ? 'active' : ''}`}>
                        <input
                            type="radio"
                            name="compliance"
                            checked={activeFilters.compliance === 'compliant'}
                            onChange={() => onFilterChange({ ...activeFilters, compliance: 'compliant' })}
                        />
                        <CheckCircle size={16} className="text-green" /> Compliant
                    </label>
                    <label className={`radio-option ${activeFilters.compliance === 'non-compliant' ? 'active' : ''}`}>
                        <input
                            type="radio"
                            name="compliance"
                            checked={activeFilters.compliance === 'non-compliant'}
                            onChange={() => onFilterChange({ ...activeFilters, compliance: 'non-compliant' })}
                        />
                        <AlertTriangle size={16} className="text-red" /> Non-Compliant
                    </label>
                </div>
            </div>

            <div className="filter-section">
                <h4>Outlet Type</h4>
                <div className="checkbox-group">
                    {outletTypes.map(type => (
                        <label key={type} className="checkbox-option">
                            <input
                                type="checkbox"
                                checked={(activeFilters.outletType || []).includes(type)}
                                onChange={() => handleOutletTypeChange(type)}
                            />
                            {type}
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <h4>Product Price Check</h4>
                <select
                    value={activeFilters.product || 'all'}
                    onChange={(e) => onFilterChange({ ...activeFilters, product: e.target.value })}
                    className="product-select"
                >
                    <option value="all">All Products</option>
                    {products.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
                <p className="hint-text">Select a product to view specific compliance.</p>
            </div>

            <button
                className="reset-btn"
                onClick={() => onFilterChange({ outletType: [], compliance: 'all', product: 'all' })}
            >
                Reset Filters
            </button>
        </div>
    );
};

export default FilterPanel;
