import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient.js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download } from 'lucide-react';
import "../css/dashboard.css";

// --- Main Reports Component ---
const ReportsAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for filters
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });

    // State for report data
    const [salesRevenue, setSalesRevenue] = useState([]);
    const [topVendors, setTopVendors] = useState([]);
    const [popularItems, setPopularItems] = useState([]);
    const [orderStatus, setOrderStatus] = useState([]);

    // --- Data Fetching Logic ---
    useEffect(() => {
        const fetchAllReportData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Run all database calls in parallel for better performance
                const [
                    { data: salesData, error: salesError },
                    { data: topVendorsData, error: topVendorsError },
                    { data: popularItemsData, error: popularItemsError },
                    { data: orderStatusData, error: orderStatusError },
                ] = await Promise.all([
                    supabase.rpc('get_daily_sales_revenue', { start_date: dateRange.start, end_date: dateRange.end }),
                    supabase.rpc('get_top_vendors_by_sales', { start_date: dateRange.start, end_date: dateRange.end }),
                    supabase.rpc('get_most_popular_items', { start_date: dateRange.start, end_date: dateRange.end }),
                    supabase.rpc('get_order_status_distribution') // This can also be updated to accept date ranges
                ]);

                if (salesError) throw salesError;
                if (topVendorsError) throw topVendorsError;
                if (popularItemsError) throw popularItemsError;
                if (orderStatusError) throw orderStatusError;

                setSalesRevenue(salesData);
                setTopVendors(topVendorsData);
                setPopularItems(popularItemsData);
                
                // Format data for the pie chart
                const formattedStatusData = orderStatusData.map(item => ({
                    name: item.status,
                    value: Number(item.status_count)
                }));
                setOrderStatus(formattedStatusData);

            } catch (err) {
                console.error("Error fetching report data:", err);
                setError("Failed to load one or more reports. Please check database functions and RLS policies.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllReportData();
    }, [dateRange]); // Re-fetch data whenever the dateRange changes

    const handleDateChange = (e) => {
        setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    };
    
    // --- Render Logic ---
    if (loading) return <div className="loading-spinner">Generating Reports...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const PIE_COLORS = ['#4CAF50', '#FFC107', '#F44336', '#9E9E9E']; // Colors for Completed, Processing, Cancelled, etc.

    return (
        <div className="reports-container">
            <div className="card-header">
                <h3 className="card-title">Reports & Analytics</h3>
                <div className="filters-container">
                    <label>
                        Start Date:
                        <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} className="input" />
                    </label>
                    <label>
                        End Date:
                        <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} className="input" />
                    </label>
                    <button className="btn btn-outline btn-sm">
                        <Download size={14} /> Export to CSV
                    </button>
                </div>
            </div>

            {/* --- Charts Section --- */}
            <div className="grid grid-2 gap-4" style={{ marginTop: '24px' }}>
                <div className="card">
                    <div className="card-header"><h4 className="card-title">Total Revenue Per Day (Ksh)</h4></div>
                    <div className="card-content" style={{ height: '300px' }}>
                        <ResponsiveContainer>
                            <LineChart data={salesRevenue}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => `Ksh ${value.toLocaleString()}`} />
                                <Legend />
                                <Line type="monotone" dataKey="total_revenue" stroke="#1d4ed8" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card">
                     <div className="card-header"><h4 className="card-title">Order Status Distribution</h4></div>
                     <div className="card-content" style={{ height: '300px' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={orderStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                    {orderStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            {/* --- Tables Section --- */}
            <div className="grid grid-2 gap-4" style={{ marginTop: '24px' }}>
                <div className="card">
                    <div className="card-header"><h4 className="card-title">Top 5 Vendors by Sales</h4></div>
                    <div className="card-content">
                        <table className="data-table">
                            <thead>
                                <tr><th>Vendor Name</th><th>Total Sales (Ksh)</th></tr>
                            </thead>
                            <tbody>
                                {topVendors.map(vendor => (
                                    <tr key={vendor.name}>
                                        <td>{vendor.name}</td>
                                        <td>{Number(vendor.total_sales).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><h4 className="card-title">Top 10 Most Popular Items</h4></div>
                    <div className="card-content">
                        <table className="data-table">
                             <thead>
                                <tr><th>Item</th><th>Vendor</th><th>Total Orders</th></tr>
                            </thead>
                            <tbody>
                                {popularItems.map(item => (
                                    <tr key={`${item.name}-${item.vendor_name}`}>
                                        <td>{item.name}</td>
                                        <td>{item.vendor_name}</td>
                                        <td>{item.total_orders}</td>
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

export default ReportsAnalytics;
