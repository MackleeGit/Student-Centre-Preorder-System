import { useState, useEffect, useRef } from "react";
import { Search, ShoppingCart, Bell, Clock } from "lucide-react";
import "../css/dashboard.css";
import { useNavigate } from "react-router-dom";
import { checkAuth, logoutUser, checkUserRole } from "../utils/authUtils.js";
import { showConfirmToast } from "../components/Toast/toastUtils.jsx";
import { useRealtimeNotifications } from "../components/hooks/useRealtimeNotifications.jsx";
import { useStudentOrders } from "../components/hooks/useStudentOrders.js";
import { supabase } from "../utils/supabaseClient.js";
import { Link } from "react-router-dom";
import RatingDisplay from "../components/rating/RatingDisplay.jsx";

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [UserData, setUserData] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    const [menuResults, setMenuResults] = useState([]);
    const [vendorResults, setVendorResults] = useState([]);
    const [vendors, setVendors] = useState([]);

    useEffect(() => {
        checkAuth(navigate);
        checkUserRole("student", navigate);

        const fetchStudent = async () => {
            const { data: user, error: authError } = await supabase.auth.getUser();
            if (authError || !user?.user?.email) {
                console.error("Auth error", authError);
                navigate("/login");
                return;
            }

            const email = user.user.email;

            const { data: student, error: studentError } = await supabase
                .from("students")
                .select("student_number, fname,lname")
                .eq("email", email)
                .maybeSingle();

            if (studentError || !student) {
                console.error("Student not found", studentError);
                navigate("/login");
                return;
            }

            setUserData(student);
            setLoadingUser(false);
        };
        fetchStudent();
    }, []);

    const {
        notifications,
        initialNotificationLoading,
        isRefreshingNotifications,
        markAsRead,
        formatNotificationTime,
        refetchNotifications,
        fetchNotifications
    } = useRealtimeNotifications(UserData?.student_number || null);

    const {
        activeOrders,
        availableVendors,
        recentOrders,
        initialOrderLoading,
        isRefreshingOrders,
        fetchOrders,
        refetchOrders,
        setActiveOrders,
        setRecentOrders,
        fetchAvailableVendors,
        refetchAvailableVendors
    } = useStudentOrders(UserData?.student_number || null);

    useEffect(() => {
        if (!UserData?.student_number) return;
        fetchNotifications();
        fetchOrders();
        fetchAvailableVendors();

        const poll = () => {
            console.log('⏰ Polling Supabase for updates...');
            refetchOrders();
            refetchNotifications();
            refetchAvailableVendors();
        };

        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                poll();
            }
        }, 15000);

        return () => clearInterval(intervalId);
    }, [UserData?.student_number]);

    const lastNotifId = useRef(null);
    const lastActiveOrderId = useRef(null);

    useEffect(() => {
        if (notifications.length > 0) {
            const latest = notifications[0].notifid;
            if (lastNotifId.current && latest !== lastNotifId.current) {
                showSuccessToast("🔔 New Notification", "");
            }
            lastNotifId.current = latest;
        }
    }, [notifications]);

    useEffect(() => {
        if (activeOrders.length > 0) {
            const latest = activeOrders[0].orderid;
            if (lastActiveOrderId.current && latest !== lastActiveOrderId.current) {
                showSuccessToast("New Order Incoming", "");
            }
            lastActiveOrderId.current = latest;
        }
    }, [activeOrders]);

    // Fetch detailed order information for modal
    const fetchOrderDetails = async (orderid) => {
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select(`
                orderid,
                vendorid,
                student_number,
                created_at,
                time_accepted,
                order_status,
                total,
                vendors (name),
                order_items (
                    quantity,
                    menuitems (name, price)
                )
            `)
            .eq('orderid', orderid)
            .single();

        if (orderError) {
            console.error('Error fetching order details:', orderError);
            return null;
        }

        return orderData;
    };

    const handleOrderClick = async (order) => {
        const orderDetails = await fetchOrderDetails(order.orderid);
        if (orderDetails) {
            setSelectedOrder(orderDetails);
            setShowOrderModal(true);
        }
    };

  const getStatusBadge = (order_status) => {
    switch (order_status) {
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'accepted':
      case 'preparing':
        return <span className="badge badge-secondary">Preparing</span>;
      case 'ready':
        return <span className="badge badge-success">Ready</span>;
      default:
        return <span className="badge badge-default">{order_status}</span>;
    }
  };


    // Modal scroll lock
    useEffect(() => {
        if (showOrderModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [showOrderModal]);

    if (loadingUser || initialOrderLoading || initialNotificationLoading) return <p>Loading dashboard...</p>;

    const unreadCount = notifications.filter(notif => !notif.read).length;

    const handleLogout = async () => {
        const confirmed = await showConfirmToast("Are you sure you wish to log out?");
        if (confirmed) {
            await logoutUser(navigate);
        }
    };

    const performSearch = async (searchTerm) => {
        if (!searchTerm) {
            setMenuResults([]);
            setVendorResults([]);
            return;
        }
        const { data: menuItems, error: menuError } = await supabase
            .from('menuitems')
            .select('menuitemid, name, price, vendorid')
            .ilike('name', `%${searchTerm}%`);

        if (!menuError && menuItems) {
            setMenuResults(menuItems);
        } else {
            setMenuResults([]);
        }

        const { data: vendorResults, error: vendorError } = await supabase
            .from('vendors')
            .select('vendorid, name, image_url')
            .ilike('name', `%${searchTerm}%`);

        if (!vendorError && vendorResults) {
            setVendorResults(vendorResults);
        } else {
            setVendorResults([]);
        }
    };

    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchQuery(term);
        performSearch(term);
    };

    const studentName = `${UserData?.fname} ${UserData?.lname}`;

    return (
        <div style={{ minHeight: "100vh", background: "var(--background)" }}>
            <header className="header">
                <div className="container flex items-center justify-between">
                    <h1 className="header-title">STC Preorder System</h1>
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
                        <button className="btn btn-outline" onClick={handleLogout}>
                            Log Out
                        </button>
                        <button className="btn btn-outline">
                            <a href="/student/profile" style={{ color: "inherit", textDecoration: "none" }}>Profile</a>
                        </button>
                    </div>
                </div>
            </header>

            <div className="container" style={{ padding: "var(--spacing-6) var(--spacing-4)" }}>
                <div style={{ marginBottom: "var(--spacing-6)" }}>
                    <div className="input-with-icon">
                        <Search className="input-icon" size={16} />
                        <input
                            type="text"
                            placeholder="Search for food, vendors..."
                            className="input"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>

                {(menuResults.length > 0 || vendorResults.length > 0) && (
                    <div className="search-results" style={{
                        border: "3px solid var(--primary)",
                        borderRadius: "8px",
                        padding: "1rem",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        backgroundColor: "#f9faff",
                    }}>
                        <h3 style={{ marginBottom: "var(--spacing-4)", fontSize: "1.25rem", fontWeight: 600 }}>
                            Search Results
                        </h3>

                        {menuResults.length > 0 && (
                            <div style={{
                                marginTop: "var(--spacing-6)",
                                border: "0.5px solid var(--primary)",
                                borderRadius: "8px",
                                padding: '5px'
                            }}>
                                <h4>Menu Items</h4>
                                <div className="grid grid-3 gap-4">
                                    {menuResults.map(item => (
                                        <div key={item.menuitemid} className="search-result-card">
                                            <div className="search-result-title">{item.name}</div>
                                            <div style={{ fontWeight: "bold" }}>${item.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {vendorResults.length > 0 && (
                            <div style={{
                                marginTop: "var(--spacing-6)",
                                border: "0.5px solid var(--primary)",
                                borderRadius: "8px",
                                padding: '5px'
                            }}>
                                <h4>Vendors</h4>
                                <div className="grid grid-3 gap-4">
                                    {vendorResults.map(vendor => (
                                        <Link
                                            key={vendor.vendorid}
                                            to={`/student/viewvendor/${vendor.vendorid}`}
                                            className="search-result-card"
                                            style={{ textDecoration: "none", color: "inherit" }}
                                        >
                                            <div className="search-result-title">{vendor.name}</div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Welcome Section and Active Orders */}
                <div className="welcome-section">
                    <div className="welcome-text">
                        <h2 className="welcome-title">Welcome, {studentName}!</h2>
                        <p style={{ color: "var(--muted-foreground)" }}>Ready to order your favorite campus meals?</p>
                    </div>
                    <div className="active-orders-box card">
                        <div className="card-header">
                            <h3 className="card-title">Active Orders</h3>
                        </div>
                        <div className="card-content">
                            {activeOrders.length > 0 ? (
                                activeOrders.slice(0, 5).map((activeorder) => (
                                    <div 
                                        key={activeorder.orderid} 
                                        className="order-item"
                                        onClick={() => handleOrderClick(activeorder)}
                                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--muted)'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                        <div className="order-info">
                                            <h3>Order #{activeorder.orderid}</h3>
                                            <p>Vendor ID: {activeorder.vendorid}</p>
                                            <p>${activeorder.total || 'N/A'}</p>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                                           {getStatusBadge(activeorder.order_status)};
                                            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1)", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                                                <Clock size={12} />
                                                {new Date(activeorder.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: "var(--muted-foreground)", textAlign: "center", padding: "var(--spacing-8)" }}>
                                    No active orders
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-2 gap-4">
                    {/* Available Vendors */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Available Vendors</h3>
                        </div>
                        <div className="card-content">
                            {availableVendors.map((vendor) => (
                                <div key={vendor.vendorid} className="vendor-item">
                                    <div className="vendor-info">
                                        <h3>{vendor.name}</h3>
                                        <p>{vendor.items || 0} items • ⭐ {vendor.rating || 5}</p>
                                    </div>
                                    <div className="vendor-actions">
                                        <span 
                                            className="badge"
                                            style={{ 
                                                backgroundColor: vendor.availability ? '#10b981' : '#6b7280',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            {vendor.availability ? "Open" : "Closed"}
                                        </span>
                                        <Link
                                            to={`/student/viewvendor/${vendor.vendorid}`}
                                            className={`btn btn-sm ${vendor.availability ? 'btn-primary' : 'btn-secondary'}`}
                                            style={{ textDecoration: "none" }}
                                        >
                                            View Vendor
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Recent Orders</h3>
                        </div>
                        <div className="card-content">
                            {recentOrders.slice(0, 5).map((order) => (
                                <div 
                                    key={order.orderid} 
                                    className="order-item"
                                    onClick={() => handleOrderClick(order)}
                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--muted)'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    <div className="order-info">
                                        <h3>Order #{order.orderid}</h3>
                                        <p>${order.total || 'N/A'} • {new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    {getStatusBadge(order.order_status)};
                                </div>
                            ))}
                            <Link
                                to="/student/vieworders"
                                className="btn btn-outline"
                                style={{ width: "100%", marginTop: "var(--spacing-4)", textDecoration: "none" }}
                            >
                                View All Orders
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Details Modal */}
            {showOrderModal && selectedOrder && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2000
                    }}
                    onClick={() => setShowOrderModal(false)}
                >
                    <div
                        className="card"
                        style={{
                            minWidth: 500,
                            maxWidth: 600,
                            padding: "var(--spacing-8)",
                            background: "var(--card)",
                            borderRadius: "1rem",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Order Details</h3>
                            <button
                                onClick={() => setShowOrderModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--muted-foreground)'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                            <p><strong>Order ID:</strong> #{selectedOrder.orderid}</p>
                            <p><strong>Vendor:</strong> {selectedOrder.vendors?.name || `Vendor ID: ${selectedOrder.vendorid}`}</p>
                            <p><strong>Created At:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                            {selectedOrder.time_accepted && (
                                <p><strong>Approved At:</strong> {new Date(selectedOrder.time_accepted).toLocaleString()}</p>
                            )}
                            <p><strong>Status:</strong> 
                                {getStatusBadge(selectedOrder.order_status)};
                            </p>
                            <p><strong>Total:</strong> ${selectedOrder.total || 'N/A'}</p>
                        </div>

                        <div>
                            <h4 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Order Items:</h4>
                            {selectedOrder.order_items?.map((item, index) => (
                                <div key={index} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    padding: '8px 0',
                                    borderBottom: '1px solid var(--border)'
                                }}>
                                    <span>{item.menuitems?.name || 'Unknown Item'}</span>
                                    <span>
                                        {item.quantity}x ${item.menuitems?.price || 'N/A'} = ${(item.quantity * (item.menuitems?.price || 0)).toFixed(2)}
                                    </span>
                                </div>
                            )) || <p>No items found</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;