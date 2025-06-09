import { useState } from "react";
import { Search, ShoppingCart, Bell, Clock } from "lucide-react";
import "../css/dashboard.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkAuth, logoutUser, checkUserRole } from "../utils/authUtils.js";
import { showConfirmToast } from "../components/Toast/toastUtils.jsx";
import { useRealtimeNotifications } from "../components/Notifications/useRealtimeNotifications.jsx";
import { supabase } from "../utils/supabaseClient.js";



const StudentDashboard = () => {

    const navigate = useNavigate();
    const [UserData, setUserData] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);



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
                .select("student_number, name")
                .eq("email", email)
                .maybeSingle();

            if (studentError || !student) {
                console.error("Student not found", vendorError);
                navigate("/login");
                return;
            }

            setUserData(student);
            setLoadingUser(false);
        };

        fetchStudent();

    }, []);


    // Custom hook using vendor ID
    const { notifications, loading: notificationsLoading, markAsRead, } = useRealtimeNotifications(UserData?.id);

    if (loadingUser || notificationsLoading) return <p>Loading dashboard...</p>;

    const unreadCount = notifications.filter(notif => !notif.read).length;


    const handleLogout = async () => {
        const confirmed = await showConfirmToast("Are you sure you wish to log out?");
        if (confirmed) {
            await logoutUser(navigate);
        }
    };

    const [searchQuery, setSearchQuery] = useState("");
    const [showNotifications, setShowNotifications] = useState(false);

    // Mock data
    const studentName = "John Doe";

    const activeOrders = [
        { id: 1, vendor: "Pizza Palace", status: "processing", total: 15.99, items: "1x Margherita Pizza, 1x Garlic Bread", estimatedTime: "15 min" },
        { id: 2, vendor: "Burger Barn", status: "ready", total: 12.50, items: "1x Classic Burger, 1x Fries", estimatedTime: "Ready!" },
    ];

    const vendors = [
        { id: 1, name: "Pizza Palace", items: 12, rating: 4.5, available: true },
        { id: 2, name: "Burger Barn", items: 8, rating: 4.2, available: true },
        { id: 3, name: "Healthy Bowls", items: 15, rating: 4.7, available: false },
    ];

    const recentOrders = [
        { id: 3, vendor: "Sushi Corner", status: "collected", total: 18.75, date: "Yesterday" },
        { id: 4, vendor: "Coffee House", status: "collected", total: 8.50, date: "2 days ago" },
    ];


    const searchResults = [
        { id: 1, name: "Margherita Pizza", vendor: "Pizza Palace", price: 12.99, description: "Fresh tomatoes, mozzarella, basil" },
        { id: 2, name: "Classic Burger", vendor: "Burger Barn", price: 10.50, description: "Beef patty, lettuce, tomato, onion" },
    ];

    const filteredSearchResults = searchQuery ? searchResults.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendor.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];





    return (
        <div style={{ minHeight: "100vh", background: "var(--background)" }}>
            {/* Header */}
            <header className="header">
                <div className="container flex items-center justify-between">
                    <h1 className="header-title">Order & Go Campus</h1>
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
                                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Notifications (48hrs)</div>
                                    </div>
                                    {notifications.map((notif) => (
                                        <div key={notif.id} className="notification-item">
                                            <div className="notification-title">{notif.message}</div>
                                            <div className="notification-time">{notif.time}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className="btn btn-outline btn-icon">
                            <a href="/student/cart" style={{ color: "inherit", textDecoration: "none" }}>
                                <ShoppingCart size={16} />
                            </a>
                        </button>
                        <button
                            className="btn btn-outline"
                            onClick={handleLogout}
                        >
                            Log Out
                        </button>

                        <button className="btn btn-outline">
                            <a href="/student/profile" style={{ color: "inherit", textDecoration: "none" }}>Profile</a>
                        </button>
                    </div>
                </div>
            </header>

            <div className="container" style={{ padding: "var(--spacing-6) var(--spacing-4)" }}>
                {/* Search Bar */}
                <div style={{ marginBottom: "var(--spacing-6)" }}>
                    <div className="input-with-icon">
                        <Search className="input-icon" size={16} />
                        <input
                            type="text"
                            placeholder="Search for food, vendors..."
                            className="input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Search Results */}
                {filteredSearchResults.length > 0 && (
                    <div className="search-results">
                        <h3 style={{ marginBottom: "var(--spacing-4)", fontSize: "1.25rem", fontWeight: 600 }}>
                            Search Results
                        </h3>
                        <div className="grid grid-3 gap-4">
                            {filteredSearchResults.map((item) => (
                                <div key={item.id} className="search-result-card">
                                    <div className="search-result-title">{item.name}</div>
                                    <div className="search-result-description">{item.description}</div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div className="search-result-price">${item.price}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>{item.vendor}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                                activeOrders.slice(0, 5).map((order) => (
                                    <div key={order.id} className="order-item">
                                        <div className="order-info">
                                            <h3>{order.vendor}</h3>
                                            <p>{order.items}</p>
                                            <p>${order.total}</p>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                                            <span className={`badge ${order.status === 'ready' ? 'badge-success' : order.status === 'processing' ? 'badge-warning' : 'badge-default'}`}>
                                                {order.status}
                                            </span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1)", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                                                <Clock size={12} />
                                                {order.estimatedTime}
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
                            {vendors.map((vendor) => (
                                <div key={vendor.id} className="vendor-item">
                                    <div className="vendor-info">
                                        <h3>{vendor.name}</h3>
                                        <p>{vendor.items} items • ⭐ {vendor.rating}</p>
                                    </div>
                                    <div className="vendor-actions">
                                        <span className={`badge ${vendor.available ? 'badge-success' : 'badge-secondary'}`}>
                                            {vendor.available ? "Open" : "Closed"}
                                        </span>
                                        <button className={`btn btn-sm ${vendor.available ? 'btn-primary' : 'btn-secondary'}`} disabled={!vendor.available}>
                                            <a href={`/student/menu/${vendor.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                                                View Menu
                                            </a>
                                        </button>
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
                            {recentOrders.map((order) => (
                                <div key={order.id} className="order-item">
                                    <div className="order-info">
                                        <h3>{order.vendor}</h3>
                                        <p>${order.total} • {order.date}</p>
                                    </div>
                                    <span className={`badge ${order.status === 'collected' ? 'badge-success' : 'badge-secondary'}`}>
                                        {order.status}
                                    </span>
                                </div>
                            ))}
                            <button className="btn btn-outline" style={{ width: "100%", marginTop: "var(--spacing-4)" }}>
                                <a href="/student/orders" style={{ color: "inherit", textDecoration: "none" }}>
                                    View All Orders
                                </a>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
