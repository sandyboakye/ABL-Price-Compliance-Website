import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Home, ArrowLeft } from 'lucide-react';
import './Dashboard.css';

const COLORS = ['#008751', '#FFC600', '#006039', '#4ade80', '#d97706', '#166534']; // ABL Green/Gold Palette
const COMPLIANCE_COLORS = ['#008751', '#dc2626']; // ABL Green, Red

const Dashboard = ({ data, onBack, onGoHome }) => {

    // 1. Prepare Data: Outlets per Region
    const regionStats = {};

    data.forEach(district => {
        district.districts.forEach(region => {
            if (!regionStats[region.name]) {
                regionStats[region.name] = 0;
            }
            regionStats[region.name] += region.pubs.length;
        });
    });

    const regionData = Object.keys(regionStats).map(name => ({
        name: name,
        outlets: regionStats[name]
    }));

    // Sort by outlet count
    regionData.sort((a, b) => b.outlets - a.outlets);

    // 2. Prepare Data: Compliance Overview
    let compliantCount = 0;
    let nonCompliantCount = 0;

    // Flatten pubs
    const allPubs = data.flatMap(d => d.districts).flatMap(r => r.pubs);

    allPubs.forEach(pub => {
        // Compliant if ALL products within range.
        const isCompliant = pub.products.every(p => p.compliant);
        if (isCompliant) compliantCount++;
        else nonCompliantCount++;
    });

    const complianceData = [
        { name: 'Compliant', value: compliantCount },
        { name: 'Non-Compliant', value: nonCompliantCount }
    ];

    // 3. Prepare Data: Average Price per Product
    // We'll just take a few key products to keep it readable
    const productStats = {};

    allPubs.forEach(pub => {
        pub.products.forEach(p => {
            if (!productStats[p.name]) {
                productStats[p.name] = { sum: 0, count: 0, min: p.minPrice, max: p.maxPrice };
            }
            productStats[p.name].sum += p.price;
            productStats[p.name].count += 1;
        });
    });

    const priceData = Object.keys(productStats).map(name => ({
        name: name,
        avgPrice: parseFloat((productStats[name].sum / productStats[name].count).toFixed(2)),
        targetMin: productStats[name].min,
        targetMax: productStats[name].max
    })).slice(0, 5); // Top 5 products


    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="nav-group">
                    <button className="nav-button" onClick={onGoHome}>
                        <Home size={20} /> Home
                    </button>
                    <button className="nav-button secondary" onClick={onBack}>
                        <ArrowLeft size={20} /> Back
                    </button>
                </div>
                <h1>Analytics Dashboard</h1>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card">
                    <h3>Total Outlets</h3>
                    <div className="value">{allPubs.length}</div>
                </div>
                <div className="kpi-card">
                    <h3>Compliance Rate</h3>
                    <div className="value" style={{ color: (compliantCount / allPubs.length) > 0.8 ? '#008751' : '#dc2626' }}>
                        {((compliantCount / allPubs.length) * 100).toFixed(1)}%
                    </div>
                </div>
                <div className="kpi-card">
                    <h3>Regions</h3>
                    <div className="value">{regionData.length}</div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card wide">
                    <h3>Outlets by Region</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={regionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} tick={{ fill: '#666' }} />
                                <YAxis tick={{ fill: '#666' }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="outlets" fill="#FFC600" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Overall Compliance</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={complianceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {complianceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COMPLIANCE_COLORS[index % COMPLIANCE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Average Price (Top Products)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={priceData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 'auto']} tick={{ fill: '#666' }} />
                                <YAxis dataKey="name" type="category" width={100} fontSize={11} tick={{ fill: '#666' }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="avgPrice" fill="#008751" name="Avg Price (GHS)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
