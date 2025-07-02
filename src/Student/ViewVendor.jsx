import { useState, useEffect } from "react";
import { ArrowLeft, Star, ShoppingCart, Plus, Minus, Search, Clock } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient.js";
import "../css/dashboard.css";
import "../css/responsive/student/viewVendor.css";
import { showSuccessToast, showErrorToast, showConfirmToast } from "../components/Toast/toastUtils.jsx";
import RatingDisplay from "../components/rating/RatingDisplay.jsx";
import { checkAuth } from "../utils/authUtils.js";

const ViewVendor = () => {
    const { vendorid } = useParams();
    const navigate = useNavigate();

    const [vendor, setVendor] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("main");
    const [selectedItems, setSelectedItems] = useState([]);
    const [showOrderWizard, setShowOrderWizard] = useState(false);
    const [newOrder, setNewOrder] = useState([]);
    const [wizardTab, setWizardTab] = useState("current");
    const [searchQuery, setSearchQuery] = useState("");
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
    const [busyTimeSlots, setBusyTimeSlots] = useState([]);
    const [studentNumber, setStudentNumber] = useState(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    useEffect(() => {
        checkAuth(navigate);
        fetchStudentInfo();
        fetchVendorData();
        fetchTimeSlots();
        fetchBusyTimeSlots();
    }, [vendorid]);

    const fetchStudentInfo = async () => {
        try {
            const { data: user, error: authError } = await supabase.auth.getUser();
            if (authError || !user?.user?.email) {
                navigate("/login");
                return;
            }

            const { data: student, error: studentError } = await supabase
                .from("students")
                .select("student_number")
                .eq("email", user.user.email)
                .single();

            if (studentError || !student) {
                console.error("Student not found", studentError);
                navigate("/login");
                return;
            }

            setStudentNumber(student.student_number);
        } catch (error) {
            console.error('Error fetching student info:', error);
            navigate("/login");
        }
    };

    const fetchVendorData = async () => {
        try {
            // Fetch vendor info
            const { data: vendorData, error: vendorError } = await supabase
                .from('vendors')
                .select('*')
                .eq('vendorid', vendorid)
                .single();

            if (vendorError) throw vendorError;
            setVendor(vendorData);

            if (vendorData?.availability === 'open') {
                // Fetch menu items
                const { data: menuData, error: menuError } = await supabase
                    .from('menuitems')
                    .select('*')
                    .eq('vendorid', vendorid);

                if (menuError) throw menuError;
                setMenuItems(menuData || []);
            } else {
                setMenuItems([]);
            }

            // Fetch ratings
            const { data: ratingsData, error: ratingsError } = await supabase
                .from('orders')
                .select('rating')
                .eq('vendorid', vendorid)
                .not('rating', 'is', null);

            if (ratingsError) throw ratingsError;

            if (ratingsData && ratingsData.length > 0) {
                const avgRating = ratingsData.reduce((sum, order) => sum + order.rating, 0) / ratingsData.length;
                setAverageRating(avgRating);
            } else {
                setAverageRating(3);
            }

            setRatings(ratingsData || []);
        } catch (error) {
            console.error('Error fetching vendor data:', error);
            showErrorToast('Failed to load vendor information');
        } finally {
            setLoading(false);
        }
    };

    const fetchTimeSlots = async () => {
        try {
            const { data, error } = await supabase
                .from('time_slot')
                .select('*')
                .order('timeslottime');

            if (error) throw error;
            setTimeSlots(data || []);
        } catch (error) {
            console.error('Error fetching time slots:', error);
        }
    };

    const fetchBusyTimeSlots = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('timeslotid')
                .in('order_status', ['processing', 'pending']);

            if (error) throw error;

            const timeslotCounts = {};
            data.forEach(order => {
                timeslotCounts[order.timeslotid] = (timeslotCounts[order.timeslotid] || 0) + 1;
            });

            const busySlots = Object.keys(timeslotCounts).filter(
                timeslotid => timeslotCounts[timeslotid] > 1
            );

            setBusyTimeSlots(busySlots);
        } catch (error) {
            console.error('Error fetching busy time slots:', error);
        }
    };

    const isTimeSlotDisabled = (timeslottime) => {
        const now = new Date();
        const slotTime = new Date();
        const [hours, minutes] = timeslottime.split(':');
        slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        return slotTime < oneHourFromNow;
    };

    const getTimeSlotDisabledReason = (slot) => {
        const isTimeTooSoon = isTimeSlotDisabled(slot.timeslottime);
        const isBusy = busyTimeSlots.includes(slot.timeslotid.toString());

        if (isTimeTooSoon) return "Time slot must be at least 1 hour from now";
        if (isBusy) return "Time slot is busy with other orders";
        return null;
    };

    const handleItemSelect = (item) => {
        if (selectedItems.length >= 3 && !selectedItems.some(selected => selected.menuitemid === item.menuitemid)) {
            showErrorToast('You can only select up to 3 items at once');
            return;
        }

        setSelectedItems(prev => {
            const exists = prev.find(selected => selected.menuitemid === item.menuitemid);
            if (exists) {
                return prev.filter(selected => selected.menuitemid !== item.menuitemid);
            } else {
                return [...prev, { ...item, quantity: 1 }];
            }
        });
    };

    const handleAddToOrder = async () => {
        if (selectedItems.length === 0) {
            showErrorToast('Please select at least one item');
            return;
        }

        const confirmed = await showConfirmToast('Add selected items to new order?');
        if (confirmed) {
            setNewOrder(prev => [...prev, ...selectedItems]);
            setSelectedItems([]);
            setShowOrderWizard(true);
            setWizardTab("current");
            showSuccessToast('Items added to order!');
        }
    };

    const updateOrderItemQuantity = (menuitemid, change) => {
        setNewOrder(prev => prev.map(item => {
            if (item.menuitemid === menuitemid) {
                const newQuantity = Math.max(1, item.quantity + change);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const removeFromOrder = (menuitemid) => {
        setNewOrder(prev => prev.filter(item => item.menuitemid !== menuitemid));
    };

    const addToOrderFromWizard = (item) => {
        const exists = newOrder.find(orderItem => orderItem.menuitemid === item.menuitemid);
        if (exists) {
            updateOrderItemQuantity(item.menuitemid, 1);
        } else {
            setNewOrder(prev => [...prev, { ...item, quantity: 1 }]);
        }
        showSuccessToast(`${item.name} added to order`);
    };

   const createOrderInDatabase = async (orderData) => {
    try {
        // Calculate total price
        const totalPrice = newOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Insert order and get generated orderid
        const { data: orderResult, error: orderError } = await supabase
            .from('orders')
            .insert({
                student_number: studentNumber,
                vendorid: vendorid,
                order_status: 'pending',
                created_at: new Date().toISOString(),
                timeslotid: selectedTimeSlot,
                total: totalPrice
            })
            .select()
            .single();

        if (orderError) throw orderError;

        const orderId = orderResult.orderid; // 👈 This is your SERIAL integer ID
        console.log(orderId)

        // Insert order items referencing the new orderid
        const orderItems = newOrder.map(item => ({
            orderid: orderId, // 👈 Correctly referencing the new order
            menuitemid: item.menuitemid,
            quantity: item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        return orderResult;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

    const initiateSTKPush = async () => {
        if (!studentNumber) {
            showErrorToast('Student information not found');
            return;
        }

        const orderTotal = newOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const confirmed = await showConfirmToast(
            `Confirm payment of $${orderTotal.toFixed(2)} for your order?`,
            'Confirm Payment'
        );

        if (!confirmed) return;

        setIsProcessingPayment(true);
        console.log("🧮 Order total before STK:", orderTotal);
        try {


            const response = await fetch("/.netlify/functions/stkPush", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: "254708374149", // Test phone number
                    amount: Math.ceil(orderTotal) // Round up to nearest whole number
                })
            });

            const data = await response.json();

            if (response.ok && data.response) {
                showSuccessToast('Payment initiated successfully! Check your phone for M-Pesa prompt.');

                // Create order in database
                await createOrderInDatabase();

                showSuccessToast('Order created successfully!');

                // Reset order state
                setNewOrder([]);
                setSelectedTimeSlot("");
                setShowOrderWizard(false);

                // Navigate back to dashboard
                navigate('/student/dashboard');
            } else {
                throw new Error(data.message || 'Payment initiation failed');
            }
        } catch (error) {
            console.error("Payment error:", error);
            showErrorToast(`Payment failed: ${error.message}`);
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const filteredMenuItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const orderTotal = newOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQuantity = newOrder.reduce((sum, item) => sum + item.quantity, 0);
    const canProceedToCheckout = totalQuantity <= 3 && selectedTimeSlot;

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: "var(--background)", padding: "var(--spacing-8)" }}>
                <p>Loading vendor information...</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "var(--background)" }}>
            {/* Header with Back Button */}
            <header className="header">
                <div className="container flex items-center justify-between">
                    <button
                        className="btn btn-ghost"
                        onClick={() => navigate(-1)}
                        style={{ padding: "var(--spacing-2)" }}
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <h1 className="header-title">Vendor Details</h1>
                    <div></div>
                </div>
            </header>

            {/* Vendor Banner */}
            <div style={{
                background: `linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)`,
                color: "white",
                padding: "var(--spacing-8) 0",
                marginBottom: "var(--spacing-6)"
            }}>
                <div className="container">
                    <div style={{ textAlign: "center" }}>
                        <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "var(--spacing-2)" }}>
                            {vendor?.name}
                        </h1>
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--spacing-4)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1)" }}>
                                <Star size={20} fill="gold" color="gold" />
                                <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>
                                    {averageRating.toFixed(1)} Rating
                                </span>
                            </div>
                            <span style={{ background: "rgba(255,255,255,0.2)", padding: "var(--spacing-1) var(--spacing-3)", borderRadius: "var(--radius)" }}>
                                {vendor?.availability === 'open' ? 'Open Now' : 'Closed'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="container">
                <div style={{
                    display: "flex",
                    borderBottom: "2px solid var(--border)",
                    marginBottom: "var(--spacing-6)"
                }}>
                    {[
                        { key: "main", label: "About" },
                        { key: "menu", label: "Menu" },
                        { key: "ratings", label: "Reviews" },
                        { key: "order", label: "Quick Order" }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            className={`btn btn-ghost ${activeTab === tab.key ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                borderRadius: "0",
                                borderBottom: activeTab === tab.key ? "2px solid var(--primary)" : "2px solid transparent",
                                background: "transparent",
                                fontWeight: activeTab === tab.key ? "600" : "400"
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "main" && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">About {vendor?.name}</h3>
                        </div>
                        <div className="card-content">
                            <div style={{ marginBottom: "var(--spacing-4)" }}>
                                <strong>Date Joined:</strong> {vendor?.datejoined ? new Date(vendor.datejoined).toLocaleDateString() : 'N/A'}
                            </div>
                            <div>
                                <strong>Description:</strong>
                                <p style={{ marginTop: "var(--spacing-2)", color: "var(--muted-foreground)" }}>
                                    {vendor?.description || 'This vendor hasn\'t added a description yet.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "menu" && (
                    vendor?.availability === 'closed' ? (
                        <div style={{ textAlign: "center", padding: "var(--spacing-8)", color: "var(--muted-foreground)" }}>
                            <Clock size={64} style={{ margin: "0 auto var(--spacing-4)", opacity: 0.5 }} />
                            <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "var(--spacing-2)" }}>
                                Vendor Currently Unavailable
                            </h3>
                            <p>This vendor is currently closed. Please try again later when they're open.</p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-4)" }}>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: "600" }}>Menu Items</h3>
                                {selectedItems.length > 0 && (
                                    <button className="btn btn-primary" onClick={handleAddToOrder}>
                                        Add {selectedItems.length} item(s) to order
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-3 gap-4">
                                {menuItems.map((item) => {
                                    const isSelected = selectedItems.some(selected => selected.menuitemid === item.menuitemid);
                                    return (
                                        <div
                                            key={item.menuitemid}
                                            className="card"
                                            onClick={() => handleItemSelect(item)}
                                            style={{
                                                cursor: "pointer",
                                                border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                                                background: isSelected ? "rgba(31, 41, 55, 0.05)" : "var(--card)",
                                                transform: isSelected ? "scale(1.02)" : "scale(1)",
                                                transition: "all 0.2s ease"
                                            }}
                                        >
                                            <div style={{ marginBottom: "var(--spacing-2)" }}>
                                                <h4 style={{ fontWeight: "600", marginBottom: "var(--spacing-1)" }}>{item.name}</h4>
                                                <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                                                    {item.description || 'Delicious menu item'}
                                                </p>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--primary)" }}>
                                                    ${item.price}
                                                </span>
                                                {isSelected && (
                                                    <div style={{
                                                        background: "var(--primary)",
                                                        color: "white",
                                                        borderRadius: "50%",
                                                        width: "24px",
                                                        height: "24px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center"
                                                    }}>
                                                        ✓
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                )}

                {activeTab === "ratings" && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Customer Reviews</h3>
                        </div>
                        <div className="card-content">
                            <RatingDisplay
                                averageRating={averageRating}
                                totalRatings={ratings.length}
                            />
                        </div>
                    </div>
                )}

                {activeTab === "order" && (
                    vendor?.availability === 'closed' ? (
                        <div style={{ textAlign: "center", padding: "var(--spacing-8)", color: "var(--muted-foreground)" }}>
                            <Clock size={64} style={{ margin: "0 auto var(--spacing-4)", opacity: 0.5 }} />
                            <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "var(--spacing-2)" }}>
                                Vendor Currently Unavailable
                            </h3>
                            <p>This vendor is currently closed. Please try again later when they're open.</p>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Start Your Order</h3>
                            </div>
                            <div className="card-content">
                                <p style={{ marginBottom: "var(--spacing-4)", color: "var(--muted-foreground)" }}>
                                    Ready to order from {vendor?.name}? Click below to open our order wizard and start building your meal.
                                </p>
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={() => setShowOrderWizard(true)}
                                    style={{ width: "100%" }}
                                >
                                    <ShoppingCart size={20} />
                                    Start New Order
                                </button>
                            </div>
                        </div>
                    )
                )}
            </div>

            {/* Order Wizard Modal */}
            {showOrderWizard && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "var(--spacing-4)"
                }}>
                    <div style={{
                        background: "var(--card)",
                        borderRadius: "var(--radius-lg)",
                        width: "90%",
                        maxWidth: "800px",
                        maxHeight: "90vh",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        {/* Wizard Header */}
                        <div style={{
                            padding: "var(--spacing-4)",
                            borderBottom: "1px solid var(--border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Order from {vendor?.name}</h3>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setShowOrderWizard(false)}
                            >
                                <ArrowLeft size={16} />
                                Close
                            </button>
                        </div>

                        {/* Wizard Tabs */}
                        <div style={{
                            display: "flex",
                            borderBottom: "1px solid var(--border)"
                        }}>
                            <button
                                className={`btn btn-ghost ${wizardTab === "current" ? 'active-tab' : ''}`}
                                onClick={() => setWizardTab("current")}
                                style={{
                                    borderRadius: "0",
                                    borderBottom: wizardTab === "current" ? "2px solid var(--primary)" : "none",
                                    flex: 1
                                }}
                            >
                                Current Order ({newOrder.length})
                            </button>
                            <button
                                className={`btn btn-ghost ${wizardTab === "menu" ? 'active-tab' : ''}`}
                                onClick={() => setWizardTab("menu")}
                                style={{
                                    borderRadius: "0",
                                    borderBottom: wizardTab === "menu" ? "2px solid var(--primary)" : "none",
                                    flex: 1
                                }}
                            >
                                Browse Menu
                            </button>
                        </div>

                        {/* Wizard Content */}
                        <div style={{ flex: 1, overflow: "auto", padding: "var(--spacing-4)" }}>
                            {wizardTab === "current" && (
                                <div>
                                    {newOrder.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "var(--spacing-8)", color: "var(--muted-foreground)" }}>
                                            <ShoppingCart size={48} style={{ margin: "0 auto var(--spacing-4)" }} />
                                            <p>Your order is empty. Switch to the Menu tab to add items.</p>
                                        </div>
                                    ) : (
                                        <div>
                                            {newOrder.map((item) => (
                                                <div key={item.menuitemid} style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    padding: "var(--spacing-3)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "var(--radius)",
                                                    marginBottom: "var(--spacing-3)"
                                                }}>
                                                    <div>
                                                        <h4 style={{ fontWeight: "600" }}>{item.name}</h4>
                                                        <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                                                            ${item.price} each
                                                        </p>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => updateOrderItemQuantity(item.menuitemid, -1)}
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span style={{ minWidth: "2rem", textAlign: "center", fontWeight: "600" }}>
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => updateOrderItemQuantity(item.menuitemid, 1)}
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            onClick={() => removeFromOrder(item.menuitemid)}
                                                            style={{ color: "var(--destructive)" }}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Time Slot Selection */}
                                            <div style={{
                                                marginTop: "var(--spacing-4)",
                                                padding: "var(--spacing-4)",
                                                border: "1px solid var(--border)",
                                                borderRadius: "var(--radius)",
                                                marginBottom: "var(--spacing-3)"
                                            }}>
                                                <h4 style={{ fontWeight: "600", marginBottom: "var(--spacing-2)" }}>Select Pickup Time</h4>
                                                <select
                                                    value={selectedTimeSlot}
                                                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                                    className="input"
                                                    style={{ width: "100%" }}
                                                >
                                                    <option value="">Choose a time slot...</option>
                                                    {timeSlots.map((slot) => {
                                                        const disabledReason = getTimeSlotDisabledReason(slot);
                                                        return (
                                                            <option
                                                                key={slot.timeslotid}
                                                                value={slot.timeslotid}
                                                                disabled={!!disabledReason}
                                                                style={{
                                                                    color: disabledReason ? "#999" : "inherit",
                                                                    backgroundColor: disabledReason ? "#f5f5f5" : "inherit"
                                                                }}
                                                            >
                                                                {slot.timeslottime} {disabledReason ? `(${disabledReason})` : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>

                                            <div style={{
                                                borderTop: "2px solid var(--border)",
                                                paddingTop: "var(--spacing-4)",
                                                marginTop: "var(--spacing-4)"
                                            }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-2)" }}>
                                                    <span style={{ fontSize: "1rem", fontWeight: "600" }}>Total Items:</span>
                                                    <span style={{ fontSize: "1rem", fontWeight: "600", color: totalQuantity > 3 ? "var(--destructive)" : "var(--foreground)" }}>
                                                        {totalQuantity} / 3
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-4)" }}>
                                                    <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>Total:</span>
                                                    <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--primary)" }}>
                                                        ${orderTotal.toFixed(2)}
                                                    </span>
                                                </div>

                                                {!canProceedToCheckout && (
                                                    <p style={{
                                                        color: "var(--destructive)",
                                                        fontSize: "0.875rem",
                                                        marginBottom: "var(--spacing-2)"
                                                    }}>
                                                        {totalQuantity > 3 && "Maximum 3 items allowed per order. "}
                                                        {!selectedTimeSlot && "Please select a pickup time slot."}
                                                    </p>
                                                )}

                                                <button
                                                    className="btn btn-primary"
                                                    onClick={initiateSTKPush}
                                                    style={{
                                                        width: "100%",
                                                        opacity: canProceedToCheckout && !isProcessingPayment ? 1 : 0.5,
                                                        cursor: canProceedToCheckout && !isProcessingPayment ? "pointer" : "not-allowed"
                                                    }}
                                                    disabled={!canProceedToCheckout || isProcessingPayment}
                                                >
                                                    {isProcessingPayment ? 'Processing Payment...' : 'Proceed to Checkout'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {wizardTab === "menu" && (
                                <div>
                                    {/* Search */}
                                    <div className="input-with-icon" style={{ marginBottom: "var(--spacing-4)" }}>
                                        <Search className="input-icon" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search menu items..."
                                            className="input"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    {/* Menu Items */}
                                    <div className="grid grid-2 gap-4">
                                        {filteredMenuItems.map((item) => (
                                            <div key={item.menuitemid} className="card" style={{ cursor: "pointer" }}>
                                                <div style={{ marginBottom: "var(--spacing-2)" }}>
                                                    <h4 style={{ fontWeight: "600", marginBottom: "var(--spacing-1)" }}>{item.name}</h4>
                                                    <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                                                        {item.description || 'Delicious menu item'}
                                                    </p>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--primary)" }}>
                                                        ${item.price}
                                                    </span>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => addToOrderFromWizard(item)}
                                                    >
                                                        <Plus size={14} />
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewVendor;