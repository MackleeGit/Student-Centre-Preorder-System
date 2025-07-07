
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient.js";
import { checkAuth, checkUserRole } from "../utils/authUtils.js";
import "../css/dashboard.css";

const ViewOrders = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [activeOrders, setActiveOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    useEffect(() => {
        checkAuth(navigate);
        checkUserRole("student", navigate);
        fetchStudent();
    }, []);

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
            .select("student_number, fname, lname")
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

    useEffect(() => {
        if (userData?.student_number) {
            fetchAllOrders();
        }
    }, [userData]);

    const fetchAllOrders = async () => {
        setLoading(true);
        
        const { data: orders, error } = await supabase
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
            .eq('student_number', userData.student_number)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            const active = orders.filter(order => 
                ['pending', 'processing', 'ready'].includes(order.order_status)
            );
            const completed = orders.filter(order => 
                ['collected', 'cancelled'].includes(order.order_status)
            );
            
            setActiveOrders(active);
            setCompletedOrders(completed);
        }
        
        setLoading(false);
    };

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

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'processing': return '#3b82f6';
            case 'ready': return '#10b981';
            case 'collected': return '#6b7280';
            case 'cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const downloadReceipt = (order) => {
        // Placeholder for download receipt functionality
        console.log('Download receipt for order:', order.orderid);
        // TODO: Implement receipt download
    };

    // Modal scroll lock
    useEffect(() => {
        if (showOrderModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }, [showOrderModal]);

    if (loadingUser) return <p>Loading...</p>;

    const orderRowStyle = {
        display: 'grid',
        gridTemplateColumns: '100px 120px 200px 150px 120px 120px 150px 100px',
        gap: '1rem',
        padding: '1rem',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    };

    const headerRowStyle = {
        ...orderRowStyle,
        fontWeight: 600,
        backgroundColor: 'var(--muted)',
        cursor: 'default'
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--background)" }}>
            <header className="header">
                <div className="container flex items-center justify-between">
                    <button className="btn btn-ghost" onClick={() => navigate(-1)}>
                        Back
                    </button>
                    <h1 className="header-title">All Orders</h1>
                    <div></div>
                </div>
            </header>

            <div className="container" style={{ padding: "var(--spacing-6) var(--spacing-4)" }}>
                {loading ? (
                    <p>Loading orders...</p>
                ) : (
                    <>
                        {/* Active Orders Section */}
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <div className="card-header">
                                <h3 className="card-title">Active Orders ({activeOrders.length})</h3>
                            </div>
                            <div className="card-content" style={{ padding: 0 }}>
                                {activeOrders.length > 0 ? (
                                    <>
                                        <div style={headerRowStyle}>
                                            <span>Order ID</span>
                                            <span>Vendor ID</span>
                                            <span>Menu Items</span>
                                            <span>Created At</span>
                                            <span>Status</span>
                                            <span>Total</span>
                                            <span>Approved At</span>
                                            <span>Actions</span>
                                        </div>
                                        {activeOrders.map((order) => (
                                            <div
                                                key={order.orderid}
                                                style={orderRowStyle}
                                                onClick={() => handleOrderClick(order)}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--muted)'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                            >
                                                <span>#{order.orderid}</span>
                                                <span>{order.vendorid}</span>
                                                <span>
                                                    {order.order_items?.map(item => item.menuitems?.name).join(', ') || 'N/A'}
                                                </span>
                                                <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                                <span 
                                                    style={{ 
                                                        backgroundColor: getStatusColor(order.order_status),
                                                        color: 'white',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {order.order_status}
                                                </span>
                                                <span>${order.total || 'N/A'}</span>
                                                <span>
                                                    {order.time_accepted ? new Date(order.time_accepted).toLocaleDateString() : 'Pending'}
                                                </span>
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOrderClick(order);
                                                    }}
                                                >
                                                    View
                                                </button>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                        No active orders
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Completed Orders Section */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Completed Orders ({completedOrders.length})</h3>
                            </div>
                            <div className="card-content" style={{ padding: 0 }}>
                                {completedOrders.length > 0 ? (
                                    <>
                                        <div style={headerRowStyle}>
                                            <span>Order ID</span>
                                            <span>Vendor ID</span>
                                            <span>Menu Items</span>
                                            <span>Created At</span>
                                            <span>Status</span>
                                            <span>Total</span>
                                            <span>Approved At</span>
                                            <span>Actions</span>
                                        </div>
                                        {completedOrders.map((order) => (
                                            <div
                                                key={order.orderid}
                                                style={orderRowStyle}
                                                onClick={() => handleOrderClick(order)}
                                                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--muted)'}
                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                            >
                                                <span>#{order.orderid}</span>
                                                <span>{order.vendorid}</span>
                                                <span>
                                                    {order.order_items?.map(item => item.menuitems?.name).join(', ') || 'N/A'}
                                                </span>
                                                <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                                <span 
                                                    style={{ 
                                                        backgroundColor: getStatusColor(order.order_status),
                                                        color: 'white',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {order.order_status}
                                                </span>
                                                <span>${order.total || 'N/A'}</span>
                                                <span>
                                                    {order.time_accepted ? new Date(order.time_accepted).toLocaleDateString() : 'N/A'}
                                                </span>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOrderClick(order);
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadReceipt(order);
                                                        }}
                                                        disabled
                                                        style={{ opacity: 0.5 }}
                                                    >
                                                        Receipt
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                                        No completed orders
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}
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
                                <span 
                                    style={{ 
                                        backgroundColor: getStatusColor(selectedOrder.order_status),
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        marginLeft: '8px'
                                    }}
                                >
                                    {selectedOrder.order_status}
                                </span>
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

export default ViewOrders;