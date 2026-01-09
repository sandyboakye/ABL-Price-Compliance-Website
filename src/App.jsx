import { useState, useEffect } from 'react';
import './App.css';
import HomePage from './HomePage';
import Sidebar from './Sidebar';
import SearchBar from './SearchBar';
import { Filter as FilterIcon, BarChart2 as BarChartIcon, Trash2 as TrashIcon, Menu as MenuIcon } from 'lucide-react';
import MapComponent from './components/Map';
import CompareModal from './components/CompareModal';
import FilterPanel from './components/FilterPanel';
import Dashboard from './Dashboard';
import { usePubData } from './hooks/usePubData';
import { PRODUCT_CATALOG } from './services/dataLoader';

// Loading Component
const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#fff',
    color: '#333'
  }}>
    <div className="loader" style={{
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #FBC02D',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite',
      marginBottom: '20px'
    }}></div>
    <h2>Initializing Database...</h2>
    <p>Please wait while we prepare the map data for you.</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  // Data State
  const { data: appData, loading, error } = usePubData();

  // View State
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'map'
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

  // Navigation State
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedPub, setSelectedPub] = useState(null);

  // Feature State
  const [compareList, setCompareList] = useState([]); // Array of pub objects
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    outletType: [],
    compliance: 'all',
    product: 'all'
  });

  // Derived Data (Filtered)
  const getFilteredData = () => {
    if (!appData) return [];

    return appData.map(ablDistrict => {
      const filteredRegions = ablDistrict.districts.map(region => {
        const filteredPubs = region.pubs.filter(pub => {
          // 1. Outlet Type Filter
          if (filters.outletType.length > 0 && !filters.outletType.includes(pub.type)) {
            return false;
          }

          // 2. Product/Compliance Filter
          if (filters.compliance !== 'all') {
            // If specific product selected
            if (filters.product !== 'all') {
              const product = pub.products.find(p => p.name === filters.product);
              if (!product) return false; // Hide if pub doesn't have product?? Or just ignore. Let's hide.

              if (filters.compliance === 'compliant' && !product.compliant) return false;
              if (filters.compliance === 'non-compliant' && product.compliant) return false;
            } else {
              // General compliance (all products must be compliant? or any?)
              // Let's say: Compliant = ALL products compliant. Non-compliant = ANY product non-compliant.
              const isAllCompliant = pub.products.every(p => p.compliant);
              if (filters.compliance === 'compliant' && !isAllCompliant) return false;
              if (filters.compliance === 'non-compliant' && isAllCompliant) return false;
            }
          }

          return true;
        });

        return { ...region, pubs: filteredPubs };
      }).filter(region => region.pubs.length > 0); // Hide empty regions

      return { ...ablDistrict, districts: filteredRegions };
    }).filter(ablDistrict => ablDistrict.districts.length > 0);
  };

  const filteredData = getFilteredData();

  // Extract unique outlet types and products for filter dropdowns
  const extractUniqueValues = () => {
    const types = new Set();
    const products = new Set();
    if (appData) {
      appData.forEach(d => d.districts.forEach(r => r.pubs.forEach(p => {
        types.add(p.type);
        p.products.forEach(prod => products.add(prod.name));
      })));
    }
    return {
      outletTypes: Array.from(types).sort(),
      products: Array.from(products).sort()
    };
  };

  const { outletTypes, products } = extractUniqueValues();

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleSelectRegion = (regionId) => {
    if (selectedRegion === regionId) return; // No change
    setSelectedRegion(regionId);
    setSelectedDistrict(null);
    setSelectedPub(null);
    // On mobile, keep sidebar open to selection or close? Maybe keep open for detailed selection.
    // If selecting a pub (leaf node), maybe close sidebar?
    // Let's leave it to user to close or if they select a pub we might auto close in handleSelectPub?
  };

  const handleSelectDistrict = (districtId) => {
    setSelectedDistrict(districtId);
    setSelectedPub(null);
  };

  const handleSelectPub = (pubId) => {
    setSelectedPub(pubId);
    // Auto-close sidebar on mobile when a pub is selected to show it on map
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleBack = (currentView) => {
    if (currentView === 'pub') setSelectedPub(null);
    else if (currentView === 'district') setSelectedDistrict(null);
    else if (currentView === 'region') {
      setSelectedRegion(null);
      setSelectedDistrict(null);
    }
  };

  const handleToggleCompare = (pub) => {
    setCompareList(prev => {
      const exists = prev.find(p => p.id === pub.id);
      if (exists) {
        return prev.filter(p => p.id !== pub.id);
      } else {
        if (prev.length >= 3) {
          alert("You can compare up to 3 pubs at a time.");
          return prev;
        }
        return [...prev, pub];
      }
    });
  };

  const handleRemoveCompare = (pubId) => {
    setCompareList(prev => prev.filter(p => p.id !== pubId));
  };

  const handleClearCompare = (e) => {
    e.stopPropagation();
    setCompareList([]);
  };

  const handleGetStarted = () => {
    setCurrentView('map');
  };

  const handleSearchNavigate = (result) => {
    setCurrentView('map');
    setSelectedRegion(result.regionId);
    if (result.districtId) setSelectedDistrict(result.districtId);
    if (result.pubId) setSelectedPub(result.pubId);
    // Setup for mobile view if result found
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false); // Show map result
    }
  };

  const handleGoHome = () => {
    setCurrentView('home');
    setIsSearchOpen(false);
  };

  if (loading) return <LoadingScreen />;
  if (error) return <div className="error-screen">Error loading data: {error.message}</div>;

  return (
    <div className="app-container">
      {currentView === 'home' ? (
        <HomePage
          mockData={appData}
          onGetStarted={handleGetStarted}
          onGoDashboard={() => setCurrentView('dashboard')}
        />
      ) : currentView === 'dashboard' ? (
        <Dashboard
          data={filteredData}
          onBack={() => setCurrentView('home')}
        />
      ) : (
        <>
          {/* Mobile Backdrop */}
          <div
            className={`sidebar-backdrop ${isSidebarOpen ? 'visible' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          />

          <div className={`sidebar-wrapper ${isSidebarOpen ? 'mobile-open' : ''}`}>
            <Sidebar
              mockData={filteredData}
              selectedRegion={selectedRegion}
              selectedDistrict={selectedDistrict}
              selectedPub={selectedPub}
              onBack={handleBack}
              onSelectRegion={handleSelectRegion}
              onSelectDistrict={handleSelectDistrict}
              onSelectPub={handleSelectPub}
              onToggleCompare={handleToggleCompare}
              compareList={compareList}
              onOpenSearch={() => setIsSearchOpen(true)}
              onGoHome={handleGoHome}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>

          <div className="map-wrapper">
            {/* Mobile Menu Button - Left aligned */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 1000,
                background: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                color: '#333',
                display: 'flex', // Only flex, hide via media query in CSS if needed, or JS check
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="mobile-menu-btn" // We will add CSS to hide this on desktop
            >
              <MenuIcon size={24} />
            </button>

            <button
              className="filter-toggle-btn"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                background: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FilterIcon size={18} /> Filters
            </button>

            {isFilterOpen && (
              <FilterPanel
                outletTypes={outletTypes}
                products={products}
                activeFilters={filters}
                onFilterChange={setFilters}
                onClose={() => setIsFilterOpen(false)}
              />
            )}

            <MapComponent
              mockData={filteredData}
              selectedRegion={selectedRegion}
              selectedDistrict={selectedDistrict}
              selectedPub={selectedPub}
              onSelectRegion={handleSelectRegion}
              onSelectDistrict={handleSelectDistrict}
              onSelectPub={handleSelectPub}
            />

            {compareList.length > 0 && (
              <div className="compare-controls">
                <button
                  className="clear-compare-btn"
                  onClick={handleClearCompare}
                  title="Clear comparison list"
                >
                  <TrashIcon size={20} />
                </button>
                <button className="compare-fab" onClick={() => setIsCompareOpen(true)}>
                  <span>Compare ({compareList.length})</span>
                </button>
              </div>
            )}
          </div>

          <CompareModal
            isOpen={isCompareOpen}
            onClose={() => setIsCompareOpen(false)}
            pubs={compareList}
            allProducts={PRODUCT_CATALOG}
          />
        </>
      )}

      {/* Floating Dashboard Button (Only visible on Map) */}
      {currentView === 'map' && (
        <button
          onClick={() => setCurrentView('dashboard')}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            zIndex: 1000,
            background: '#1a1a1a',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BarChartIcon size={20} /> Analytics
        </button>
      )}

      <SearchBar
        mockData={filteredData}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleSearchNavigate}
      />
    </div>
  );
}

export default App;
