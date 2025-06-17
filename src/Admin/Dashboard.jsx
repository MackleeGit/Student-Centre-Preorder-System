import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { checkAuth, logoutUser , checkUserRole } from "../utils/authUtils.js";
import { showConfirmToast } from "../components/Toast/toastUtils.jsx";
import { supabase } from "../utils/supabaseClient.js";
import Sidebar from "./Sidebar";
import {
  LineChartComponent,
  BarChartComponent,
  DonutChartComponent,
} from "../components/Charts"; // Import your chart components
import "../css/dashboard.css";

const PlaceholderCard = ({ height = 60, width = "100%" }) => (
  <div
    style={{
      backgroundColor: "#e0e0e0",
      borderRadius: 8,
      height,
      width,
      marginBottom: 16,
      animation: "pulse 1.5s infinite ease-in-out",
    }}
  />
);

// Add CSS animation for pulse effect
const pulseStyle = `
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}
`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loadingUser , setLoadingUser ] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [salesData, setSalesData] = useState(null);
  const [ordersData, setOrdersData] = useState(null);
  const [activeVendors, setActiveVendors] = useState(null);
  const [avgFulfillmentTime, setAvgFulfillmentTime] = useState(null);
  const [liveOrders, setLiveOrders] = useState(null);
  const [highCancellationVendors, setHighCancellationVendors] = useState(null);
  const [systemAlerts, setSystemAlerts] = useState(null);
  const [ordersPerHour, setOrdersPerHour] = useState(null);
  const [topVendors, setTopVendors] = useState(null);
  const [orderStatusDistribution, setOrderStatusDistribution] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAuth(navigate);
    checkUserRole("admin", navigate);

    const fetchData = async () => {
      const { data: user, error } = await supabase.auth.getUser ();
      if (error || !user?.user?.email) {
        navigate("/admin/login");
        return;
      }
      setUserData(user.user);
      setLoadingUser (false);

      await fetchDashboardMetrics();
      await fetchLiveOrders();
      await fetchHighCancellationVendors();
      await fetchSystemAlerts();
      await fetchOrdersPerHour();
      await fetchTopVendors();
      await fetchOrderStatusDistribution();
    };

    fetchData();
  }, [navigate]);

  const fetchDashboardMetrics = async () => {
    try {
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("amount")
        .eq("date", new Date().toISOString().split("T")[0]);

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("date", new Date().toISOString().split("T")[0]);

      const { data: vendors, error: vendorsError } = await supabase
        .from("vendors")
        .select("*")
        .eq("status", "active");

      const { data: fulfillmentTimes, error: fulfillmentError } = await supabase
        .from("orders")
        .select("fulfillment_time")
        .eq("date", new Date().toISOString().split("T")[0]);

      if (!salesError) setSalesData(sales.reduce((acc, curr) => acc + curr.amount, 0));
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
      .select("id, vendor_name, status")
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
    const { data, error } = await supabase
      .from("orders")
      .select("count(*) as count, hour(created_at) as hour")
      .eq("date", new Date().toISOString().split("T")[0])
      .group("hour")
      .order("hour");

    if (!error) setOrdersPerHour(data);
    else setOrdersPerHour([]);
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
    const { data, error } = await supabase
      .from("orders")
      .select("status, count(*) as count")
      .eq("date", new Date().toISOString().split("T")[0])
      .group("status");

    if (!error) {
      const distribution = {};
      data.forEach((item) => {
        distribution[item.status] = item.count;
      });
      setOrderStatusDistribution(distribution);
    } else setOrderStatusDistribution({});
  };

  if (loadingUser ) return <p>Loading dashboard...</p>;

  const handleLogout = async () => {
    const confirmed = await showConfirmToast("Are you sure you want to log out?");
    if (confirmed) {
      await logoutUser (navigate);
    }
  };

  const renderAtAGlance = () => (
    <div className="kpi-cards">
      <style>{pulseStyle}</style>
      <div className="kpi-card">
        <h3>Today's Sales (Ksh)</h3>
        {salesData === null ? <PlaceholderCard /> : <p>{salesData}</p>}
      </div>
      <div className="kpi-card">
        <h3>Today's Orders</h3>
        {ordersData === null ? <PlaceholderCard /> : <p>{ordersData}</p>}
      </div>
      <div className="kpi-card">
        <h3>Active Vendors</h3>
        {activeVendors === null ? <PlaceholderCard /> : <p>{activeVendors}</p>}
      </div>
      <div className="kpi-card">
        <h3>Avg Fulfillment Time (min)</h3>
        {avgFulfillmentTime === null ? <PlaceholderCard /> : <p>{avgFulfillmentTime.toFixed(2)}</p>}
      </div>
    </div>
  );

  const renderActionableInsights = () => (
    <div className="actionable-insights">
      <h2>Actionable Insights</h2>
      <div className="live-order-feed">
        <h3>Live Order Feed</h3>
        {!liveOrders ? (
          <>
            <PlaceholderCard height={30} />
            <PlaceholderCard height={30} />
            <PlaceholderCard height={30} />
          </>
        ) : (
          <ul>
            {liveOrders.map((order) => (
              <li key={order.id}>
                {order.vendor_name} - {order.status}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="high-cancellation-vendors">
        <h3>Vendors with High Cancellation Rates</h3>
        {!highCancellationVendors ? (
          <PlaceholderCard height={80} />
        ) : (
          <ul>
            {highCancellationVendors.map((vendor) => (
              <li key={vendor.name}>
                {vendor.name} - {vendor.cancellation_rate}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="system-alerts">
        <h3>System Alerts</h3>
        {!systemAlerts ? (
          <PlaceholderCard height={60} />
        ) : (
          <ul>
            {systemAlerts.map((alert) => (
              <li key={alert.id}>{alert.message}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const renderQuickInsights = () => (
    <div className="quick-insights">
      <h2>Quick Insights</h2>
      <div className="charts" style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        <div className="chart" style={{ flex: 1, minWidth: 280 }}>
          <h3>Orders Per Hour</h3>
          {ordersPerHour === null ? <PlaceholderCard height={300} /> : <LineChartComponent data={ordersPerHour} />}
        </div>
        <div className="chart" style={{ flex: 1, minWidth: 280 }}>
          <h3>Top 5 Performing Vendors</h3>
          {topVendors === null ? <PlaceholderCard height={300} /> : <BarChartComponent data={topVendors} />}
        </div>
        <div className="chart" style={{ flex: 1, minWidth: 280 }}>
          <h3>Order Status Distribution</h3>
          {orderStatusDistribution === null ? <PlaceholderCard height={300} /> : <DonutChartComponent data={orderStatusDistribution} />}
        </div>
      </div>
    </div>
  );

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
          {renderAtAGlance()}
          {renderActionableInsights()}
          {renderQuickInsights()}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
