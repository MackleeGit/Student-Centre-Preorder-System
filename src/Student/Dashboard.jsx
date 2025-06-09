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
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");


    const [menuResults, setMenuResults] = useState([]);
    const [vendorResults, setVendorResults] = useState([]);
    const [activeOrders, setActiveOrders] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);

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

    

        const fetchVendors = async () => {

            const { data: vendors, error } = await supabase
                .from('vendors')
                .select('id, name, image_url')
                .eq('availability', 'open');

            if (vendors) {
                // Randomize order client-side
                const shuffledVendors = vendors.sort(() => 0.5 - Math.random());
                setVendors(shuffledVendors);  // <-- use it here inside the if block
            } else if (error) {
                console.error("Error fetching Available Vendors", error);
            }

        };
        fetchVendors();






    }, []);




    useEffect(() => {
    if (!UserData?.student_number) return;

    const fetchActiveOrders = async () => {
        const { data, error } = await supabase
            .from("orders")
            .select("orderid, vendorid, order_status, created_at, time_accepted")
            .eq("student_number", UserData.student_number)
            .in("order_status", ["pending", "processing", "ready"])
            .order("created_at", { ascending: false });

        if (!error) {
            setActiveOrders(data);
        } else {
            console.error("Error fetching active orders:", error);
        }
    };
    fetchActiveOrders();

    const fetchRecentOrders = async () => {
        const { data, error } = await supabase
            .from("orders")
            .select("orderid, vendorid, order_status,created_at")
            .eq("student_number", UserData.student_number)
            .eq("order_status", "collected")
            .order("created_at", { ascending: false })
            .limit(5);

        if (!error) {
            setRecentOrders(data);
        } else {
            console.error("Error fetching recent orders:", error);
        }
    };
    fetchRecentOrders();

}, [UserData]);
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

    const performSearch = async (searchTerm) => {
        if (!searchTerm) {
            setMenuResults([]);
            setVendorResults([]);
            return;
        }
        // Search Menu Items
        const { data: menuItems, error: menuError } = await supabase
            .from('menuitems')
            .select('menuitemid, name, price, vendorid')
            .ilike('name', `%${searchTerm}%`);

        if (!menuError && menuItems) {
            setMenuResults(menuItems);
        } else {
            setMenuResults([]);
        }

        // Search Vendors
        const { data: vendorResults, error: vendorError } = await supabase
            .from('vendors')
            .select('id, name, image_url')
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



    // Mock data
    const studentName = `${UserData?.fname} ${UserData?.lname}`;




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
                    <h1 className="header-title">STC Preorder System
</h1>
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
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>

                {/* Search Results */}
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

                        {/* Menu Items */}
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
                                        <div key={item.menuitemid}
                                            className="search-result-card">
                                            <div className="search-result-title">{item.name}</div>
                                            <div style={{ fontWeight: "bold" }}>${item.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Vendors */}
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
                                        <div key={vendor.id} className="search-result-card">
                                            <div className="search-result-title">{vendor.name}</div>
                                            {/* You can add vendorImage or other details here */}
                                        </div>
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
                                    <div key={activeorder.orderid} className="order-item">
                                        <div className="order-info">
                                            <h3>{activeorder.vendorid}</h3>
                                            <p>Place Order Items</p>
                                            <p>$Place Total Price</p>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                                            <span className={`badge ${activeorder.order_status === 'ready' ? 'badge-success' : activeorder.order_status === 'processing' ? 'badge-warning' : 'badge-default'}`}>
                                                {activeorder.order_status}
                                            </span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1)", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                                                <Clock size={12} />
                                                {activeorder.created_at}
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
                                        <p>{vendor.items} items • ⭐ {5}</p>
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
                                    <span className={`badge ${order.order_status === 'collected' ? 'badge-success' : 'badge-secondary'}`}>
                                        {order.order_status}
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
