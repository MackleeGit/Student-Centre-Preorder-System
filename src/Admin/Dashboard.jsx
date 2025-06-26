import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Users, UtensilsCrossed, BarChart3, Wallet, ShoppingCart, Store } from "lucide-react";
import { checkAuth, logoutUser, checkUserRole } from "../utils/authUtils.js";
import { showConfirmToast } from "../components/Toast/toastUtils.jsx";
import { supabase } from "../utils/supabaseClient.js";

// --- Import all your child components ---
import Sidebar from "./Sidebar";
import StudentManagement from './StudentManagement.jsx';
import VendorManagement from './VendorManagement.jsx';
import ReportsAnalytics from './ReportsAnalytics.jsx';

import "../css/dashboard.css";


// --- Main Dashboard Overview Component ---
// This new component will neatly contain all the logic and UI for the main dashboard view.
const DashboardOverview = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, activeVendors: 0 });

    useEffect(() => {
        const fetchDashboardMetrics = async () => {
            setLoading(true);
            const today = new Date().toISOString().split("T")[0];

            // --- Corrected Data Fetching Logic ---
            try {
                // Fetch sales for today
                const { data: salesData, error: salesError } = await supabase
                    .from("vendor_daily_sales")
                    .select("total_sales")
                    .eq("sales_date", today);

                if (salesError) throw salesError;
                
                // Calculate total sales
                const totalSales = salesData ? salesData.reduce((acc, sale) => acc + (sale.total_sales || 0), 0) : 0;

                // Fetch other stats
                const { count: orderCount, error: orderError } = await supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today);
                if(orderError) throw orderError;

                const { count: vendorCount, error: vendorError } = await supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('availability', 'open');
                if(vendorError) throw vendorError;

                setStats({
                    totalSales: totalSales,
                    totalOrders: orderCount || 0,
                    activeVendors: vendorCount || 0,
                });

            } catch (error) {
                console.error("Error fetching dashboard metrics:", error);
                setStats({ totalSales: 0, totalOrders: 0, activeVendors: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardMetrics();
    }, []);

    if (loading) {
        return <div className="loading-spinner">Loading Dashboard Stats...</div>;
    }

    return (
        <>
            <div className="card-header">
                <h3 className="card-title">Dashboard Overview</h3>
            </div>
            <div className="card-content">
                <div className="grid grid-3 gap-4">
                    <div className="card stat-card">
                        <Wallet className="stat-icon" size={24} />
                        <div className="stat-value">Ksh {stats.totalSales.toLocaleString()}</div>
                        <div className="stat-label">Today's Sales</div>
                    </div>
                    <div className="card stat-card">
                        <ShoppingCart className="stat-icon" size={24} />
                        <div className="stat-value">{stats.totalOrders}</div>
                        <div className="stat-label">Today's Orders</div>
                    </div>
                    <div className="card stat-card">
                        <Store className="stat-icon" size={24} />
                        <div className="stat-value">{stats.activeVendors}</div>
                        <div className="stat-label">Active Vendors</div>
                    </div>
                </div>
                 {/* You can add your chart components here later */}
            </div>
        </>
    );
};


// --- Main Admin Layout Component ---
const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loadingUser, setLoadingUser] = useState(true);
    const [activeView, setActiveView] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        // This useEffect now only handles security and basic user info.
        checkAuth(navigate);
        checkUserRole("admin", navigate);
        setLoadingUser(false);
    }, [navigate]);

    const handleLogout = async () => {
        const confirmed = await showConfirmToast("Are you sure you want to log out?");
        if (confirmed) {
            await logoutUser(navigate);
        }
    };

    const handleSidebarItemClick = (view) => {
        setActiveView(view);
        setSidebarOpen(false);
    };

    // This function now correctly renders the appropriate component for each view.
    const renderActiveView = () => {
        switch (activeView) {
            case "vendors":
                return <VendorManagement />;
            case "students":
                return <StudentManagement />;
            case "reports":
                return <ReportsAnalytics />;
            default:
                return <DashboardOverview />;
        }
    };

    if (loadingUser) return <p>Loading...</p>;

    return (
        <div className="app-container" style={{ display: "flex", minHeight: "100vh" }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
                <Menu size={20} />
            </button>

            <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} />

            <Sidebar
                activeView={activeView}
                setActiveView={handleSidebarItemClick}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
                <header className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h1>Admin Panel</h1>
                    <button className="btn btn-primary" onClick={handleLogout}>
                        Logout
                    </button>
                </header>

                <section style={{ marginTop: 24 }}>
                    {/* The outer .card div provides consistent styling for all views */}
                    <div className="card">
                        {renderActiveView()}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;
