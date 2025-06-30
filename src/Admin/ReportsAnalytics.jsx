import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../utils/supabaseClient.js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, Info } from 'lucide-react';
import "../css/dashboard.css";

<<<<<<< Updated upstream
// --- New Helper Component for Empty States ---
=======
// --- Helper Component for Empty States ---
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });

=======
    const [timePeriod, setTimePeriod] = useState('weekly');

    // State for report data
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                supabase.rpc('get_daily_revenue', { start_date: dateRange.start, end_date: dateRange.end }),
                supabase.rpc('get_top_vendors', { start_date: dateRange.start, end_date: dateRange.end }),
                supabase.rpc('get_most_popular_items', { start_date: dateRange.start, end_date: dateRange.end }),
                supabase.rpc('get_order_status_distribution', { start_date: dateRange.start, end_date: dateRange.end })
            ]);

            if (salesError || topVendorsError || popularItemsError || orderStatusError) {
                throw new Error("One or more report queries failed.");
=======
                supabase.rpc('get_daily_revenue', { time_period: timePeriod }),
                supabase.rpc('get_top_vendors', { time_period: timePeriod }),
                supabase.rpc('get_most_popular_items', { time_period: timePeriod }),
                supabase.rpc('get_order_status_distribution', { time_period: timePeriod })
            ]);

            if (salesError || topVendorsError || popularItemsError || orderStatusError) {
                const allErrors = [salesError, topVendorsError, popularItemsError, orderStatusError].filter(Boolean);
                throw new Error(allErrors.map(e => e.message).join(', '));
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    }, [dateRange]);
=======
    }, [timePeriod]);
>>>>>>> Stashed changes

    useEffect(() => {
        fetchAllReportData();
    }, [fetchAllReportData]);
<<<<<<< Updated upstream

    const handleDateChange = (e) => {
        setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    };
    
=======
    
    // --- NEW, IMPROVED CSV EXPORT LOGIC ---

    const convertArrayToCSV = (array, title) => {
        // If there's no data, return a clean message under the title
        if (!array || array.length === 0) {
            return `${title}\nNo data available for this period.\n`;
        }
    
        const columnDelimiter = ',';
        const lineDelimiter = '\n';
        // Get headers from the keys of the first object
        const keys = Object.keys(array[0]);
    
        // Start the CSV string with the report title and a line break
        let result = title + lineDelimiter;
        // Add the column headers
        result += keys.join(columnDelimiter) + lineDelimiter;
    
        // Add each row of data
        array.forEach(item => {
            let ctr = 0;
            keys.forEach(key => {
                if (ctr > 0) result += columnDelimiter;
    
                let value = item[key] === null || item[key] === undefined ? '' : String(item[key]);
                // Handle commas within the data by wrapping the value in double quotes
                if (value.includes(columnDelimiter)) {
                    value = `"${value}"`;
                }
    
                result += value;
                ctr++;
            });
            result += lineDelimiter;
        });
    
        return result;
    };

    const handleExport = () => {
        const periodText = timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1);
        
        // --- Build the beautifully structured report string ---
        let fullCsv = `STC Preorder System - ${periodText} Report\n`;
        fullCsv += `Generated on: ${new Date().toLocaleString()}\n\n`; // Add a timestamp and extra space

        // Section for Top Vendors
        fullCsv += convertArrayToCSV(topVendors, "Top 5 Vendors by Sales");
        fullCsv += "\n\n"; // Add extra space between tables

        // Section for Popular Items
        fullCsv += convertArrayToCSV(popularItems, "Top 10 Most Popular Items");
        fullCsv += "\n\n"; // Add extra space
        
        // Format the pie chart data for a simple table format
        const statusForCsv = orderStatus.map(item => ({ status: item.name, count: item.value }));
        fullCsv += convertArrayToCSV(statusForCsv, "Order Status Distribution");
        fullCsv += "\n\n";
        
        // Section for Daily Revenue
        fullCsv += convertArrayToCSV(salesRevenue, "Daily Revenue (Ksh)");
        fullCsv += "\n";

        // --- Trigger the download ---
        const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `stc_report_${timePeriod}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    // --- Render Logic ---
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
                        <select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)} className="input">
                            <option value="today">Today</option>
                            <option value="weekly">Last 7 Days</option>
                            <option value="monthly">Last 30 Days</option>
                        </select>
                    </label>
                    <button onClick={handleExport} className="btn btn-outline btn-sm">
>>>>>>> Stashed changes
                        <Download size={14} /> Export to CSV
                    </button>
                </div>
            </div>

            <div className="card-content">
<<<<<<< Updated upstream
                {/* --- Charts Section --- */}
=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                        ) : (
                            <NoDataPlaceholder message="No sales data for this period." />
                        )}
=======
                        ) : <NoDataPlaceholder message="No sales data for this period." />}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                        ) : (
                            <NoDataPlaceholder message="No order status data for this period." />
                        )}
                    </div>
                </div>
                
                {/* --- Tables Section --- */}
=======
                        ) : <NoDataPlaceholder message="No order data for this period." />}
                    </div>
                </div>
                
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                                )) : (
                                    <tr><td colSpan="2"><NoDataPlaceholder message="No vendor sales data." /></td></tr>
                                )}
=======
                                )) : <tr><td colSpan="2"><NoDataPlaceholder message="No vendor sales data." /></td></tr>}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
                                )) : (
                                     <tr><td colSpan="3"><NoDataPlaceholder message="No popular items data." /></td></tr>
                                )}
=======
                                )) : <tr><td colSpan="3"><NoDataPlaceholder message="No popular items data." /></td></tr>}
>>>>>>> Stashed changes
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReportsAnalytics;
