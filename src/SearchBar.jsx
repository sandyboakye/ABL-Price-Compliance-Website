import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Building2, Store, FileText } from 'lucide-react';
import './SearchBar.css';

const SearchBar = ({ mockData, isOpen, onClose, onNavigate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Search function
    useEffect(() => {
        try {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            const query = searchQuery.toLowerCase();
            const results = [];

            if (!mockData) return;

            mockData.forEach(region => {
                // Search regions
                if (region.name && String(region.name).toLowerCase().includes(query)) {
                    results.push({
                        type: 'region',
                        id: region.id,
                        name: region.name,
                        meta: `${(region.districts || []).length} districts`,
                        regionId: region.id
                    });
                }

                if (region.districts) {
                    region.districts.forEach(district => {
                        // Search districts
                        if (district.name && String(district.name).toLowerCase().includes(query)) {
                            results.push({
                                type: 'district',
                                id: district.id,
                                name: district.name,
                                meta: `${(district.pubs || []).length} pubs · ${region.name}`,
                                regionId: region.id,
                                districtId: district.id
                            });
                        }

                        if (district.pubs) {
                            district.pubs.forEach(pub => {
                                // Search pubs
                                // Guard against missing name/address and ensure String
                                const pubName = String(pub.name || '');
                                const pubAddress = String(pub.address || '');

                                if (pubName.toLowerCase().includes(query) ||
                                    pubAddress.toLowerCase().includes(query)) {
                                    results.push({
                                        type: 'pub',
                                        id: pub.id,
                                        name: pubName,
                                        meta: `${pubAddress} · ${district.name}`,
                                        regionId: region.id,
                                        districtId: district.id,
                                        pubId: pub.id
                                    });
                                }
                            });
                        }
                    });
                }
            });

            setSearchResults(results.slice(0, 10)); // Limit to 10 results
            setSelectedIndex(0);
        } catch (error) {
            console.error("Search failure:", error);
            setSearchResults([]);
        }
    }, [searchQuery, mockData]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < searchResults.length - 1 ? prev + 1 : prev
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (searchResults[selectedIndex]) {
                        handleSelectResult(searchResults[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    handleClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, searchResults, selectedIndex]);

    const handleSelectResult = (result) => {
        onNavigate(result);
        handleClose();
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSelectedIndex(0);
        onClose();
    };

    const getResultIcon = (type) => {
        switch (type) {
            case 'region': return <MapPin size={20} />;
            case 'district': return <Building2 size={20} />;
            case 'pub': return <Store size={20} />;
            default: return <FileText size={20} />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="search-overlay" onClick={handleClose}>
            <div className="search-modal" onClick={(e) => e.stopPropagation()}>
                <div className="search-header">
                    <div className="search-input-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            ref={inputRef}
                            type="text"
                            className="search-input"
                            placeholder="Search regions, districts, or pubs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                className="clear-button"
                                onClick={() => setSearchQuery('')}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button className="close-search-button" onClick={handleClose}>
                        ESC
                    </button>
                </div>

                {searchResults.length > 0 && (
                    <div className="search-results">
                        {searchResults.map((result, index) => (
                            <div
                                key={`${result.type}-${result.id}`}
                                className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                                onClick={() => handleSelectResult(result)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <span className="result-icon">{getResultIcon(result.type)}</span>
                                <div className="result-content">
                                    <div className="result-name">{result.name}</div>
                                    <div className="result-meta">{result.meta}</div>
                                </div>
                                <span className="result-type">{result.type}</span>
                            </div>
                        ))}
                    </div>
                )}

                {searchQuery && searchResults.length === 0 && (
                    <div className="no-results">
                        <Search className="no-results-icon" size={48} strokeWidth={1} />
                        <p>No results found for "{searchQuery}"</p>
                    </div>
                )}

                {!searchQuery && (
                    <div className="search-tips">
                        <div className="tip-item">
                            <kbd>↑</kbd> <kbd>↓</kbd> to navigate
                        </div>
                        <div className="tip-item">
                            <kbd>Enter</kbd> to select
                        </div>
                        <div className="tip-item">
                            <kbd>ESC</kbd> to close
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
