
import { useState, useEffect } from "react";
import { ArrowLeft, Star, ShoppingCart, Plus, Minus, Search, Clock } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient.js";
import "../css/dashboard.css";
import "../css/responsive/student/viewVendor.css";
import { showSuccessToast, showErrorToast, showConfirmToast } from "../components/Toast/toastUtils.jsx";
import RatingDisplay from "../components/rating/RatingDisplay.jsx";

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
    const [isGuest, setIsGuest] = useState(true);

    useEffect(() => {
        fetchStudentInfo();
        fetchVendorData();
        fetchTimeSlots();
        fetchBusyTimeSlots();
    }, [vendorid]);

    const fetchStudentInfo = async () => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                setIsGuest(true);
                return;
            }
            const { data: student, error: studentError } = await supabase
                .from("students")
                .select("student_number")
                .eq("email", user.email)
                .single();
            if (student && !studentError) {
                setStudentNumber(student.student_number);
                setIsGuest(false);
            } else {
                setIsGuest(true);
            }
        } catch (error) {
            console.error('Error fetching student info:', error);
            setIsGuest(true);
        }
    };

    const fetchVendorData = async () => {
        try {
            const { data: vendorData, error: vendorError } = await supabase
                .from('vendors')
                .select('*')
                .eq('vendorid', vendorid)
                .single();
            if (vendorError) throw vendorError;
            setVendor(vendorData);

            if (vendorData?.availability === 'open') {
                const { data: menuData, error: menuError } = await supabase
                    .from('menuitems')
                    .select('*')
                    .eq('vendorid', vendorid);
                if (menuError) throw menuError;
                setMenuItems(menuData || []);
            } else {
                setMenuItems([]);
            }

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
            const { data, error } = await supabase.from('time_slot').select('*').order('timeslottime');
            if (error) throw error;
            setTimeSlots(data || []);
        } catch (error) {
            console.error('Error fetching time slots:', error);
        }
    };

    const fetchBusyTimeSlots = async () => {
        try {
            const { data, error } = await supabase.from('orders').select('timeslotid').in('order_status', ['processing', 'pending']);
            if (error) throw error;
            const timeslotCounts = {};
            data.forEach(order => {
                timeslotCounts[order.timeslotid] = (timeslotCounts[order.timeslotid] || 0) + 1;
            });
            const busySlots = Object.keys(timeslotCounts).filter(timeslotid => timeslotCounts[timeslotid] > 1);
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
        if (isGuest) {
            showErrorToast("Please log in to start an order.");
            navigate('/login');
            return;
        }
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

    const createOrderInDatabase = async () => {
        try {
            const totalPrice = newOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
            const orderId = orderResult.orderid;
            const orderItems = newOrder.map(item => ({
                orderid: orderId,
                menuitemid: item.menuitemid,
                quantity: item.quantity
            }));
            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;
            return orderResult;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    };

    const initiateSTKPush = async () => {
        if (isGuest || !studentNumber) {
            showErrorToast("You must be logged in as a student to place an order.");
            navigate("/login");
            return;
        }
        if (!selectedTimeSlot) {
            showErrorToast('Please select a pickup time slot');
            return;
        }
        const orderTotal = newOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const confirmed = await showConfirmToast(`Confirm payment of $${orderTotal.toFixed(2)} for your order?`, 'Confirm Payment');
        if (!confirmed) return;

        setIsProcessingPayment(true);
        try {
            const response = await fetch("/.netlify/functions/stkPush", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: "254708374149",
                    amount: Math.ceil(orderTotal)
                })
            });
            const data = await response.json();
            if (response.ok && data.response) {
                showSuccessToast('Payment initiated successfully! Check your phone for M-Pesa prompt.');
                await createOrderInDatabase();
                showSuccessToast('Order created successfully!');
                setNewOrder([]);
                setSelectedTimeSlot("");
                setShowOrderWizard(false);
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
            <div style={{ minHeight: "100vh", background: "var(--background)", padding: "var(--spacing-8)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <p>Loading vendor information...</p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "var(--background)" }}>
            <header className="header">
                <div className="container flex items-center justify-between">
                    <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding: "var(--spacing-2)" }}>
                        <ArrowLeft size={20} /> Back
                    </button>
                    <h1 className="header-title">Vendor Details</h1>
                    <div></div>
                </div>
            </header>

            {/* Vendor Banner - UPDATED */}
            <div style={{
                // Use the vendor's banner_url for the background image.
                // The linear-gradient acts as an overlay for text readability.
                background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${vendor?.banner_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: "white",
                padding: "var(--spacing-8) 0",
                marginBottom: "var(--spacing-6)",
                textAlign: "center"
            }}>
                <div className="container">
                    <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "var(--spacing-2)", textShadow: "2px 2px 8px rgba(0,0,0,0.6)" }}>
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
                        <div className="card-header"><h3 className="card-title">About {vendor?.name}</h3></div>
                        <div className="card-content">
                            <div style={{ marginBottom: "var(--spacing-4)" }}>
                                <strong>Date Joined:</strong> {vendor?.date_joined ? new Date(vendor.date_joined).toLocaleDateString() : 'N/A'}
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
                            <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "var(--spacing-2)" }}>Vendor Currently Unavailable</h3>
                            <p>This vendor is currently closed. Please try again later when they're open.</p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-4)" }}>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: "600" }}>Menu Items</h3>
                                {isGuest ? (
                                    <button className="btn btn-outline" onClick={() => navigate('/login')}>Log In to Order</button>
                                ) : (
                                    selectedItems.length > 0 && (
                                        <button className="btn btn-primary" onClick={handleAddToOrder}>Add {selectedItems.length} item(s) to order</button>
                                    )
                                )}
                            </div>
                            <div className="grid grid-3 gap-4">
                                {menuItems.map((item) => {
                                    const isSelected = selectedItems.some(selected => selected.menuitemid === item.menuitemid);
                                    return (
                                        <div key={item.menuitemid} className="card" onClick={() => handleItemSelect(item)} style={{ cursor: "pointer", border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)", background: isSelected ? "rgba(31, 41, 55, 0.05)" : "var(--card)", transform: isSelected ? "scale(1.02)" : "scale(1)", transition: "all 0.2s ease" }}>
                                            {item.image_url && (
                                                <div style={{ width: "100%", height: "160px", marginBottom: "var(--spacing-3)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                                                    <img 
                                                        src={item.image_url} 
                                                        alt={item.name}
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                </div>
                                            )}
                                            <div style={{ marginBottom: "var(--spacing-2)" }}>
                                                <h4 style={{ fontWeight: "600", marginBottom: "var(--spacing-1)" }}>{item.name}</h4>
                                                <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginBottom: "var(--spacing-2)" }}>{item.description || 'Delicious menu item'}</p>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-3)" }}>
                                                <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--primary)" }}>${item.price}</span>
                                                {isSelected && (<div style={{ background: "var(--primary)", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>)}
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-1)" }}>
                                                {item.category && (
                                                    <span style={{ 
                                                        background: "var(--secondary)", 
                                                        color: "var(--secondary-foreground)", 
                                                        padding: "2px 6px", 
                                                        borderRadius: "var(--radius)", 
                                                        fontSize: "0.75rem",
                                                        fontWeight: "500"
                                                    }}>
                                                        {item.category}
                                                    </span>
                                                )}
                                                {item.ingredients && (
                                                    <span style={{ 
                                                        background: "var(--muted)", 
                                                        color: "var(--muted-foreground)", 
                                                        padding: "2px 6px", 
                                                        borderRadius: "var(--radius)", 
                                                        fontSize: "0.75rem"
                                                    }}>
                                                        {item.ingredients}
                                                    </span>
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
                        <div className="card-header"><h3 className="card-title">Customer Reviews</h3></div>
                        <div className="card-content"><RatingDisplay averageRating={averageRating} totalRatings={ratings.length} /></div>
                    </div>
                )}

                {activeTab === "order" && (
                    vendor?.availability === 'closed' ? (
                        <div style={{ textAlign: "center", padding: "var(--spacing-8)", color: "var(--muted-foreground)" }}>
                            <Clock size={64} style={{ margin: "0 auto var(--spacing-4)", opacity: 0.5 }} />
                            <h3 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "var(--spacing-2)" }}>Vendor Currently Unavailable</h3>
                            <p>This vendor is currently closed. Please try again later when they're open.</p>
                        </div>
                    ) : (
                        <div className="card">
                            <div className="card-header"><h3 className="card-title">Start Your Order</h3></div>
                            <div className="card-content">
                                <p style={{ marginBottom: "var(--spacing-4)", color: "var(--muted-foreground)" }}>Ready to order from {vendor?.name}? Click below to open our order wizard and start building your meal.</p>
                                {isGuest ? (
                                    <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')} style={{ width: "100%" }}><ShoppingCart size={20} /> Log In to Start an Order</button>
                                ) : (
                                    <button className="btn btn-primary btn-lg" onClick={() => setShowOrderWizard(true)} style={{ width: "100%" }}><ShoppingCart size={20} /> Start New Order</button>
                                )}
                            </div>
                        </div>
                    )
                )}
            </div>

            {showOrderWizard && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "var(--spacing-4)" }}>
                    <div style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", width: "90%", maxWidth: "800px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <div style={{ padding: "var(--spacing-4)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Order from {vendor?.name}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowOrderWizard(false)}><ArrowLeft size={16} /> Close</button>
                        </div>
                        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                            <button className={`btn btn-ghost ${wizardTab === "current" ? 'active-tab' : ''}`} onClick={() => setWizardTab("current")} style={{ borderRadius: "0", borderBottom: wizardTab === "current" ? "2px solid var(--primary)" : "none", flex: 1 }}>Current Order ({newOrder.length})</button>
                            <button className={`btn btn-ghost ${wizardTab === "menu" ? 'active-tab' : ''}`} onClick={() => setWizardTab("menu")} style={{ borderRadius: "0", borderBottom: wizardTab === "menu" ? "2px solid var(--primary)" : "none", flex: 1 }}>Browse Menu</button>
                        </div>
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
                                                <div key={item.menuitemid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--spacing-3)", border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: "var(--spacing-3)" }}>
                                                    <div>
                                                        <h4 style={{ fontWeight: "600" }}>{item.name}</h4>
                                                        <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>${item.price} each</p>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                                                        <button className="btn btn-outline btn-sm" onClick={() => updateOrderItemQuantity(item.menuitemid, -1)}><Minus size={14} /></button>
                                                        <span style={{ minWidth: "2rem", textAlign: "center", fontWeight: "600" }}>{item.quantity}</span>
                                                        <button className="btn btn-outline btn-sm" onClick={() => updateOrderItemQuantity(item.menuitemid, 1)}><Plus size={14} /></button>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => removeFromOrder(item.menuitemid)} style={{ color: "var(--destructive)" }}>Remove</button>
                                                    </div>
                                                </div>
                                            ))}
                                            <div style={{ marginTop: "var(--spacing-4)", padding: "var(--spacing-4)", border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: "var(--spacing-3)" }}>
                                                <h4 style={{ fontWeight: "600", marginBottom: "var(--spacing-2)" }}>Select Pickup Time</h4>
                                                <select value={selectedTimeSlot} onChange={(e) => setSelectedTimeSlot(e.target.value)} className="input" style={{ width: "100%" }}>
                                                    <option value="">Choose a time slot...</option>
                                                    {timeSlots.map((slot) => {
                                                        const disabledReason = getTimeSlotDisabledReason(slot);
                                                        return (<option key={slot.timeslotid} value={slot.timeslotid} disabled={!!disabledReason} style={{ color: disabledReason ? "#999" : "inherit", backgroundColor: disabledReason ? "#f5f5f5" : "inherit" }}>{slot.timeslottime} {disabledReason ? `(${disabledReason})` : ''}</option>);
                                                    })}
                                                </select>
                                            </div>
                                            <div style={{ borderTop: "2px solid var(--border)", paddingTop: "var(--spacing-4)", marginTop: "var(--spacing-4)" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-2)" }}>
                                                    <span style={{ fontSize: "1rem", fontWeight: "600" }}>Total Items:</span>
                                                    <span style={{ fontSize: "1rem", fontWeight: "600", color: totalQuantity > 3 ? "var(--destructive)" : "var(--foreground)" }}>{totalQuantity} / 3</span>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-4)" }}>
                                                    <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>Total:</span>
                                                    <span style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--primary)" }}>${orderTotal.toFixed(2)}</span>
                                                </div>
                                                {!canProceedToCheckout && (<p style={{ color: "var(--destructive)", fontSize: "0.875rem", marginBottom: "var(--spacing-2)" }}>{totalQuantity > 3 && "Maximum 3 items allowed per order. "} {!selectedTimeSlot && "Please select a pickup time slot."}</p>)}
                                                <button className="btn btn-primary" onClick={initiateSTKPush} style={{ width: "100%", opacity: canProceedToCheckout && !isProcessingPayment ? 1 : 0.5, cursor: canProceedToCheckout && !isProcessingPayment ? "pointer" : "not-allowed" }} disabled={!canProceedToCheckout || isProcessingPayment}>{isProcessingPayment ? 'Processing Payment...' : 'Proceed to Checkout'}</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {wizardTab === "menu" && (
                                <div>
                                    <div className="input-with-icon" style={{ marginBottom: "var(--spacing-4)" }}>
                                        <Search className="input-icon" size={16} />
                                        <input type="text" placeholder="Search menu items..." className="input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    </div>
                                    <div className="grid grid-2 gap-3">
                                        {filteredMenuItems.map((item) => (
                                            <div key={item.menuitemid} className="card" style={{ cursor: "pointer", padding: "var(--spacing-3)" }}>
                                                {item.image_url && (
                                                    <div style={{ width: "100%", height: "80px", marginBottom: "var(--spacing-2)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                                                        <img 
                                                            src={item.image_url} 
                                                            alt={item.name}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    </div>
                                                )}
                                                <div style={{ marginBottom: "var(--spacing-2)" }}>
                                                    <h4 style={{ fontWeight: "600", marginBottom: "var(--spacing-1)", fontSize: "0.9rem" }}>{item.name}</h4>
                                                    <p style={{ color: "var(--muted-foreground)", fontSize: "0.75rem", marginBottom: "var(--spacing-2)" }}>{item.description || 'Delicious menu item'}</p>
                                                </div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-1)", marginBottom: "var(--spacing-2)" }}>
                                                    {item.category && (
                                                        <span style={{ 
                                                            background: "var(--secondary)", 
                                                            color: "var(--secondary-foreground)", 
                                                            padding: "1px 4px", 
                                                            borderRadius: "var(--radius)", 
                                                            fontSize: "0.65rem",
                                                            fontWeight: "500"
                                                        }}>
                                                            {item.category}
                                                        </span>
                                                    )}
                                                    {item.ingredients && (
                                                        <span style={{ 
                                                            background: "var(--muted)", 
                                                            color: "var(--muted-foreground)", 
                                                            padding: "1px 4px", 
                                                            borderRadius: "var(--radius)", 
                                                            fontSize: "0.65rem"
                                                        }}>
                                                            {item.ingredients}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span style={{ fontSize: "1rem", fontWeight: "600", color: "var(--primary)" }}>${item.price}</span>
                                                    <button className="btn btn-primary btn-sm" onClick={() => addToOrderFromWizard(item)} style={{ fontSize: "0.75rem", padding: "4px 8px" }}><Plus size={12} /> Add</button>
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