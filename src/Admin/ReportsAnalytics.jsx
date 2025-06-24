import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../utils/supabaseClient.js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, Info } from 'lucide-react';
import "../css/dashboard.css";

// --- New Helper Component for Empty States ---
const NoDataPlaceholder = ({ message }) => (
    <div className="no-data-placeholder">
        <Info size={24} />
        <p>{message}</p>
    </div>
);


// --- Main Reports Component ---
const ReportsAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });

    const [salesRevenue, setSalesRevenue] = useState([]);
    const [topVendors, setTopVendors] = useState([]);
    const [popularItems, setPopularItems] = useState([]);
    const [orderStatus, setOrderStatus] = useState([]);

    const fetchAllReportData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const [
                { data: salesData, error: salesError },
                { data: topVendorsData, error: topVendorsError },
                { data: popularItemsData, error: popularItemsError },
                { data: orderStatusData, error: orderStatusError },
            ] = await Promise.all([
                supabase.rpc('get_daily_revenue', { start_date: dateRange.start, end_date: dateRange.end }),
                supabase.rpc('get_top_vendors', { start_date: dateRange.start, end_date: dateRange.end }),
                supabase.rpc('get_most_popular_items', { start_date: dateRange.start, end_date: dateRange.end }),
                supabase.rpc('get_order_status_distribution', { start_date: dateRange.start, end_date: dateRange.end })
            ]);

            if (salesError || topVendorsError || popularItemsError || orderStatusError) {
                throw new Error("One or more report queries failed.");
            }

            setSalesRevenue(salesData || []);
            setTopVendors(topVendorsData || []);
            setPopularItems(popularItemsData || []);
            
            const formattedStatusData = (orderStatusData || []).map(item => ({
                name: item.status,
                value: Number(item.status_count)
            }));
            setOrderStatus(formattedStatusData);

        } catch (err) {
            console.error("Error fetching report data:", err);
            setError("Failed to load reports. Please check database functions and RLS policies.");
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchAllReportData();
    }, [fetchAllReportData]);

    const handleDateChange = (e) => {
        setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    };
    
    if (loading) return <div className="loading-spinner">Generating Reports...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const PIE_COLORS = ['#4CAF50', '#FFC107', '#F44336', '#9E9E9E', '#2196F3'];

    return (
        <>
            <div className="card-header">
                <h3 className="card-title">Reports & Analytics</h3>
                <div className="filters-container">
                    <label>
                        Show data for:
                        <select value={dateRange.start} onChange={(e) => {
                            const days = Number(e.target.value);
                            const start = new Date(new Date().setDate(new Date().getDate() - days)).toISOString().split('T')[0];
                            const end = new Date().toISOString().split('T')[0];
                            setDateRange({ start, end });
                        }} className="input">
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                        </select>
                    </label>
                    <button className="btn btn-outline btn-sm">
                        <Download size={14} /> Export to CSV
                    </button>
                </div>
            </div>

            <div className="card-content">
                {/* --- Charts Section --- */}
                <div className="grid grid-2 gap-4" style={{ marginTop: '24px' }}>
                    <div className="chart-card">
                        <h4 className="chart-title">Total Revenue Per Day (Ksh)</h4>
                        {salesRevenue.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={salesRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis tickFormatter={(value) => `Ksh ${value/1000}k`} />
                                    <Tooltip formatter={(value) => `Ksh ${Number(value).toLocaleString()}`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="total_revenue" stroke="#1d4ed8" strokeWidth={2} name="Revenue" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <NoDataPlaceholder message="No sales data for this period." />
                        )}
                    </div>
                    <div className="chart-card">
                         <h4 className="chart-title">Order Status Distribution</h4>
                        {orderStatus.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
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
                        ) : (
                            <NoDataPlaceholder message="No order status data for this period." />
                        )}
                    </div>
                </div>
                
                {/* --- Tables Section --- */}
                <div className="grid grid-2 gap-4" style={{ marginTop: '24px' }}>
                    <div className="table-card">
                        <h4 className="chart-title">Top 5 Vendors by Sales</h4>
                        <table className="data-table">
                            <thead>
                                <tr><th>Vendor Name</th><th>Total Sales (Ksh)</th></tr>
                            </thead>
                            <tbody>
                                {topVendors.length > 0 ? topVendors.map(vendor => (
                                    <tr key={vendor.name}>
                                        <td>{vendor.name}</td>
                                        <td>{Number(vendor.total_sales).toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="2"><NoDataPlaceholder message="No vendor sales data." /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-card">
                        <h4 className="chart-title">Top 10 Most Popular Items</h4>
                        <table className="data-table">
                             <thead>
                                <tr><th>Item</th><th>Vendor</th><th>Total Orders</th></tr>
                            </thead>
                            <tbody>
                                {popularItems.length > 0 ? popularItems.map(item => (
                                    <tr key={`${item.name}-${item.vendor_name}`}>
                                        <td>{item.name}</td>
                                        <td>{item.vendor_name}</td>
                                        <td>{item.total_orders}</td>
                                    </tr>
                                )) : (
                                     <tr><td colSpan="3"><NoDataPlaceholder message="No popular items data." /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReportsAnalytics;
