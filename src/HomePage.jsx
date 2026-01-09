import { MapPin, Building2, Store, Map as MapIcon, Search, BarChart3, ArrowRight } from 'lucide-react';
import './HomePage.css';

import ablLogo from './assets/logos/ABL LOGO MAIN.png';

const HomePage = ({ mockData, onGetStarted, onGoDashboard }) => {
    // Calculate statistics
    const totalAblDistricts = mockData.length;

    // Calculate unique regions across all ABL districts to avoid double counting if boundaries overlap in data
    const uniqueRegions = new Set();
    mockData.forEach(ablDistrict => {
        ablDistrict.districts.forEach(region => {
            if (region.name !== 'Unknown Region') {
                uniqueRegions.add(region.name);
            }
        });
    });
    const totalRegions = uniqueRegions.size;

    const totalPubs = mockData.reduce((sum, region) =>
        sum + region.districts.reduce((distSum, district) => distSum + district.pubs.length, 0), 0
    );

    return (
        <div className="home-page">
            <div className="home-container">
                <div className="hero-section">
                    <div className="logo-container">
                        <img src={ablLogo} alt="ABL Logo" className="hero-logo" />
                    </div>

                    <h1 className="hero-title">Accra Brewery Price Check</h1>


                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <MapPin size={40} strokeWidth={1.5} />
                            </div>
                            <div className="stat-value">{totalAblDistricts}</div>
                            <div className="stat-label">ABL Districts</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <Building2 size={40} strokeWidth={1.5} />
                            </div>
                            <div className="stat-value">{totalRegions}</div>
                            <div className="stat-label">Regions</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">
                                <Store size={40} strokeWidth={1.5} />
                            </div>
                            <div className="stat-value">{totalPubs}</div>
                            <div className="stat-label">Outlets</div>
                        </div>
                    </div>

                    <div className="cta-group" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <button className="cta-button" onClick={onGetStarted}>
                            <span>Get Started</span>
                            <ArrowRight size={20} />
                        </button>
                        <button
                            className="cta-button secondary"
                            onClick={onGoDashboard}
                            style={{ background: '#fff', color: '#1a1a1a', border: '1px solid #ddd' }}
                        >
                            <BarChart3 size={20} />
                            <span>Dashboard</span>
                        </button>
                    </div>

                    <div className="features-list">
                        <div className="feature-item">
                            <span className="feature-icon">
                                <MapIcon size={20} />
                            </span>
                            <span>Interactive Map View</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">
                                <Search size={20} />
                            </span>
                            <span>Quick Search</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">
                                <BarChart3 size={20} />
                            </span>
                            <span>Price Comparison</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default HomePage;
