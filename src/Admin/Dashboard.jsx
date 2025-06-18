import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { checkAuth, logoutUser , checkUserRole } from "../utils/authUtils.js";
import { showConfirmToast } from "../components/Toast/toastUtils.jsx";
import { supabase } from "../utils/supabaseClient.js";
import Sidebar from "./Sidebar";
import StudentManagement from './StudentManagement.jsx';
import {
  LineChartComponent,
  BarChartComponent,
  DonutChartComponent,
} from "../components/Charts"; // Import your chart components
import "../css/dashboard.css";

// --- Placeholder Components (can be moved to separate files later) ---

const VendorManagement = () => (
    <div className="card">
        <div className="card-header"><h3 className="card-title">Vendor Management</h3></div>
        <div className="card-content"><p>Vendor management table and tools will be displayed here.</p></div>
    </div>
);

const ReportsAnalytics = () => (
    <div className="card">
        <div className="card-header"><h3 className="card-title">Reports & Analytics</h3></div>
        <div className="card-content"><p>Charts and downloadable reports will be displayed here.</p></div>
    </div>
);

// --- Main Admin Dashboard Component ---

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loadingUser , setLoadingUser ] = useState(true);
    const [activeView, setActiveView] = useState("dashboard");
    
    // Data states
    const [salesData, setSalesData] = useState(0);
    const [ordersData, setOrdersData] = useState(0);
    const [activeVendors, setActiveVendors] = useState(0);
    const [avgFulfillmentTime, setAvgFulfillmentTime] = useState(0);
    const [liveOrders, setLiveOrders] = useState([]);
    const [highCancellationVendors, setHighCancellationVendors] = useState([]);
    const [systemAlerts, setSystemAlerts] = useState([]);
    const [ordersPerHour, setOrdersPerHour] = useState([]);
    const [topVendors, setTopVendors] = useState([]);
    const [orderStatusDistribution, setOrderStatusDistribution] = useState({});

    useEffect(() => {
        checkAuth(navigate);
        checkUserRole("admin", navigate);

        const fetchData = async () => {
            setLoadingUser (true);
            const { data: user, error } = await supabase.auth.getUser ();
            if (error || !user?.user?.email) {
                navigate("/admin/login");
                return;
            }
            setUserData(user.user);
            await fetchDashboardMetrics();
            await fetchLiveOrders();
            await fetchHighCancellationVendors();
            await fetchSystemAlerts();
            await fetchOrdersPerHour();
            await fetchTopVendors();
            await fetchOrderStatusDistribution();
            setLoadingUser (false);
        };

        fetchData();
    }, [navigate]);

    const fetchDashboardMetrics = async () => {
        try {
            const { data: total_sales, error: salesError } = await supabase
                .from("vendor_sales")
                .select("total_sales")
                .eq("date", new Date().toISOString().split("T")[0]);

            const { data: orders, error: ordersError } = await supabase
                .from("orders")
                .select("*")
                .eq("date", new Date().toISOString().split("T")[0]);

            const { data: vendors, error: vendorsError } = await supabase
                .from("vendors")
                .select("*")
                .eq("availability", "open");

            const { data: fulfillmentTimes, error: fulfillmentError } = await supabase
                .from("orders")
                .select("fulfillment_time")
                .eq("date", new Date().toISOString().split("T")[0]);

            if (!salesError) setSalesData(total_sales.reduce((acc, curr) => acc + curr.amount, 0));
            else setSalesData(0);
            if (!ordersError) setOrdersData(orders.length);
            else setOrdersData(0);
            if (!vendorsError) setActiveVendors(vendors.length);
            else setActiveVendors(0);
            if (!fulfillmentError && fulfillmentTimes.length > 0) {
                const avgTime =
                    fulfillmentTimes.reduce((acc, curr) => acc + curr.fulfillment_time, 0) /
                    fulfillmentTimes.length;
                setAvgFulfillmentTime(avgTime);
            } else setAvgFulfillmentTime(0);
        } catch {
            setSalesData(0);
            setOrdersData(0);
            setActiveVendors(0);
            setAvgFulfillmentTime(0);
        }
    };

    const fetchLiveOrders = async () => {
        const { data, error } = await supabase
            .from("orders")
            .select("orderid, vendorid, status")
            .order("created_at", { ascending: false })
            .limit(10);

        if (!error) setLiveOrders(data);
        else setLiveOrders([]);
    };

    const fetchHighCancellationVendors = async () => {
        const { data, error } = await supabase
            .from("vendors")
            .select("name, cancellation_rate")
            .gt("cancellation_rate", 0.5);

        if (!error) setHighCancellationVendors(data);
        else setHighCancellationVendors([]);
    };

    const fetchSystemAlerts = async () => {
        const { data, error } = await supabase.from("system_alerts").select("*");
        if (!error) setSystemAlerts(data);
        else setSystemAlerts([]);
    };

    
       const fetchOrdersPerHour = async () => {
    // We now call the 'get_orders_per_hour' function we created in the database
    const { data, error } = await supabase.rpc('get_orders_per_hour');

    if (error) {
        console.error("Error fetching orders per hour:", error);
    
    } else {
        setOrdersPerHour(data);
    }
 };

    const fetchTopVendors = async () => {
        const { data, error } = await supabase
            .from("vendors")
            .select("name, total_sales")
            .order("total_sales", { ascending: false })
            .limit(5);

        if (!error) setTopVendors(data);
        else setTopVendors([]);
    };

   const fetchOrderStatusDistribution = async () => {
  // We also call the new function for status distribution
  const { data, error } = await supabase.rpc('get_order_status_distribution');
  if (error) {
    console.error("Error fetching status distribution:", error);
    setOrderStatusDistribution({});
  } else {
    const distribution = {};
    data.forEach((item) => {
      distribution[item.status] = item.status_count;
    });
    setOrderStatusDistribution(distribution);
  }
};

  const handleSuspendVendor = async (vendorId, currentAvailability) => {
    // Determine the new availability
    const newAvailability = currentAvailability === 'open' ? 'closed' : 'open';

    const confirmed = await showConfirmToast(`Set this vendor to '${newAvailability}'?`);

    if (confirmed) {
        const { error } = await supabase
            .from('vendors')
            .update({ availability: newAvailability }) // <-- Make sure it updates 'availability'
            .eq('id', vendorId);

        if (error) {
            console.error("Failed to update vendor availability:", error);
        } else {
            // Refresh your UI to show the change
            setVendors(vendors.map(v => v.id === vendorId ? { ...v, availability: newAvailability } : v));
        }
    }
};
    const handleLogout = async () => {
        const confirmed = await showConfirmToast("Are you sure you want to log out?");
        if (confirmed) {
            await logoutUser (navigate);
        }
    };

    const renderActiveView = () => {
        switch (activeView) {
            case "dashboard":
                return (
                    <div>
                        <h2>Dashboard Overview</h2>
                        <p>Welcome, {userData?.email || "Admin"}!</p>
                        {/* Render KPI cards, charts, etc. */}
                    </div>
                );
            case "vendors":
                return <VendorManagement />;
            case "students":
                return <StudentManagement />;
            case "reports":
                return <ReportsAnalytics />;
            default:
                return (
                    <div>
                        <h2>Dashboard Overview</h2>
                        <p>Welcome, {userData?.email || "Admin"}!</p>
                    </div>
                );
        }
    };

    if (loadingUser ) return <p>Loading dashboard...</p>;

    return (
        <div className="app-container" style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar active={activeView} setActiveView={setActiveView} />
            <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
                <header className="header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h1>Admin Dashboard</h1>
                    <button className="btn btn-outline" onClick={handleLogout}>
                        Logout
                    </button>
                </header>

                <section style={{ marginTop: 24 }}>
                    {renderActiveView()}
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;
