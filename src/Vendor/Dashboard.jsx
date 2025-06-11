import { useState } from "react";
import { Bell, Package, DollarSign, TrendingUp, Clock, User } from "lucide-react";
import "../css/dashboard.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkAuth, logoutUser, checkUserRole } from "../utils/authUtils.js";
import { showConfirmToast } from "../components/Toast/toastUtils.jsx";
import { useRealtimeNotifications} from "../components/Notifications/useRealtimeNotifications.jsx";
import { supabase } from "../utils/supabaseClient.js";

const VendorDashboard = () => {

  const navigate = useNavigate();
  const [UserData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);



  useEffect(() => {
    checkAuth(navigate);
    checkUserRole("vendor", navigate);

    const fetchVendor = async () => {
      const { data: user, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.user?.email) {
        console.error("Auth error", authError);
        navigate("/login");
        return;
      }

      const email = user.user.email;

      const { data: vendor, error: vendorError } = await supabase
        .from("vendors")
        .select("id, name")
        .eq("email", email)
        .maybeSingle();

      if (vendorError || !vendor) {
        console.error("Vendor not found", vendorError);
        navigate("/login");
        return;
      }

      setUserData(vendor);
      setLoadingUser(false);
    };

    fetchVendor();



  }, []);



  // Custom hook using vendor ID //Added OR NULL (Always call it)
  const { notifications, loading: notificationsLoading, markAsRead } =
    useRealtimeNotifications(UserData?.id || null);


  if (loadingUser || notificationsLoading) return <p>Loading dashboard...</p>;

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const handleLogout = async () => {
    const confirmed = await showConfirmToast("Are you sure you wish to log out?");
    if (confirmed) {
      await logoutUser(navigate);
    }
  };



  // Mock data
  const vendorName = "Pizza Palace";
  const vendorRating = 4.5;

  const stats = {
    todayOrders: 23,
    todayRevenue: 456.78,
    activeOrders: 5,
    avgRating: 4.5
  };

  const processingOrders = [
    {
      id: 1,
      student: "John Doe",
      items: ["Margherita Pizza x2", "Garlic Bread x1"],
      total: 25.99,
      status: "pending",
      orderTime: "2 min ago",
      pickupTime: "15 min"
    },
    {
      id: 2,
      student: "Jane Smith",
      items: ["Pepperoni Pizza x1", "Coke x1"],
      total: 18.50,
      status: "processing",
      orderTime: "5 min ago",
      pickupTime: "10 min"
    },
    {
      id: 3,
      student: "Mike Johnson",
      items: ["Veggie Pizza x1", "Water x1"],
      total: 22.99,
      status: "ready",
      orderTime: "8 min ago",
      pickupTime: "Ready!"
    },
    {
      id: 4,
      student: "Sarah Wilson",
      items: ["Hawaiian Pizza x1"],
      total: 16.99,
      status: "processing",
      orderTime: "12 min ago",
      pickupTime: "8 min"
    },
    {
      id: 5,
      student: "Tom Brown",
      items: ["Meat Loaf x1", "Fries x2"],
      total: 24.50,
      status: "pending",
      orderTime: "15 min ago",
      pickupTime: "20 min"
    },
    {
      id: 6,
      student: "Lisa Davis",
      items: ["Margherita Pizza x1", "Salad x1"],
      total: 19.99,
      status: "ready",
      orderTime: "18 min ago",
      pickupTime: "Ready!"
    }
  ];


  const updateOrderStatus = (orderId, newStatus) => {
    console.log(`Updating order ${orderId} to ${newStatus}`);
    // TODO: Implement status update
  };

  const handleOrderClick = (orderId) => {
    console.log(`Viewing order ${orderId}`);
    // TODO: Navigate to order details
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Header */}
      <header className="header">
        <div className="container flex items-center justify-between">
          <div>
            <h1 className="header-title">{vendorName}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)", marginTop: "var(--spacing-1)" }}>
              <span style={{ fontSize: "1.125rem", fontWeight: 600 }}>⭐ {vendorRating}</span>
              <span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>Average Rating</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="notification-dropdown">
              <button
                className="btn btn-outline btn-icon"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={16} />

                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}




              </button>

              {showNotifications && (
                <div className="notification-menu">
                  <div style={{ padding: "var(--spacing-3)", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Notifications</div>
                  </div>
                  {notifications.map((notif) => (
                    <div key={notif.notifid} className="notification-item">
                      <div className="notification-title">{notif.message}</div>
                      <div className="notification-time">{formatNotificationTime(notif.timestamp)}</div>

                      {!notif.read && (

                        <button
                          onClick={() => markAsRead(notif.notifid)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow" >
                          Mark as Read
                        </button>


                      )}



                    </div>
                  ))}
                </div>
              )}

            </div>

            <button
              className="btn btn-outline"
              onClick={handleLogout}
            >
              Log Out
            </button>
            <button className="btn btn-outline">
              <a href="/vendor/profile" style={{ color: "inherit", textDecoration: "none" }}>Profile</a>
            </button>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: "var(--spacing-6) var(--spacing-4)" }}>
        {/* Stats Cards */}
        <div className="grid grid-4 gap-4" style={{ marginBottom: "var(--spacing-6)" }}>
          <div className="card stats-card">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)", marginBottom: "var(--spacing-2)" }}>
              <Package size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Today's Orders</span>
            </div>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{stats.todayOrders}</p>
          </div>
          <div className="card stats-card">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)", marginBottom: "var(--spacing-2)" }}>
              <DollarSign size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Today's Revenue</span>
            </div>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>${stats.todayRevenue}</p>
          </div>
          <div className="card stats-card">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)", marginBottom: "var(--spacing-2)" }}>
              <Bell size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Active Orders</span>
            </div>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{stats.activeOrders}</p>
          </div>
          <div className="card stats-card">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)", marginBottom: "var(--spacing-2)" }}>
              <TrendingUp size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Avg Rating</span>
            </div>
            <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>⭐ {stats.avgRating}</p>
          </div>
        </div>

        <div className="grid grid-2 gap-4">
          {/* Order Queue */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Order Queue</h3>
            </div>
            <div className="card-content">
              {processingOrders.map((order) => (
                <div
                  key={order.id}
                  className="order-item clickable-order"
                  onClick={() => handleOrderClick(order.id)}
                >
                  <div className="order-info">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--spacing-1)" }}>
                      <h3>Order #{order.id}</h3>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{order.orderTime}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1)", marginBottom: "var(--spacing-1)" }}>
                      <User size={12} />
                      <span style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>{order.student}</span>
                    </div>
                    <p style={{ fontSize: "0.875rem", marginBottom: "var(--spacing-1)" }}>{order.items.join(", ")}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600 }}>${order.total}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1)", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                        <Clock size={12} />
                        {order.pickupTime}
                      </div>
                    </div>
                  </div>
                  <div className="order-actions">
                    <span className={`badge ${order.status === 'ready' ? 'badge-success' : order.status === 'processing' ? 'badge-warning' : 'badge-default'}`}>
                      {order.status}
                    </span>
                    {order.status === 'pending' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, 'processing');
                        }}
                      >
                        Accept
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, 'ready');
                        }}
                      >
                        Mark Ready
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="card-content">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
                <button className="btn btn-outline quick-action-btn">
                  <a href="/vendor/menu" style={{ color: "inherit", textDecoration: "none" }}>
                    Manage Menu
                  </a>
                </button>
                <button className="btn btn-outline quick-action-btn">
                  <a href="/vendor/reports" style={{ color: "inherit", textDecoration: "none" }}>
                    View Reports
                  </a>
                </button>
                <button className="btn btn-outline quick-action-btn">
                  Toggle Availability
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
