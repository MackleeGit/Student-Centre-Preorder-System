import React, { useState, useEffect, useRef } from 'react';
import { Clock, CheckCircle, XCircle, Bell, Search, Package, DollarSign, TrendingUp, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import "../css/dashboard.css";

import { checkAuth, logoutUser, checkUserRole } from "../utils/authUtils.js";
import { showConfirmToast, showInfoToast, showSuccessToast } from "../components/Toast/toastUtils.jsx";
import { useRealtimeNotifications } from "../components/hooks/useRealtimeNotifications.jsx";
import { useVendorOrders } from "../components/hooks/useVendorOrders.js";
import { supabase } from "../utils/supabaseClient.js";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [UserData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [timeslotMap, setTimeslotMap] = useState(null);


  // New modal state
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);



  useEffect(() => {
    if (!UserData?.vendorid) return;

    const fetchTimeslots = async () => {
      const { data, error } = await supabase
        .from("time_slot")
        .select("timeslotid, timeslottime");

      if (error) {
        console.error("❌ Failed to fetch time slots:", error);
        return;
      }

      const map = {};
      data?.forEach((slot) => {
        let timeString = slot.timeslottime;
        if (timeString && timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
          const [h, m] = timeString.split(":");
          const hourNum = parseInt(h, 10);
          const ampm = hourNum >= 12 ? "PM" : "AM";
          const hour12 = ((hourNum + 11) % 12 + 1);
          map[slot.timeslotid] = `${hour12.toString().padStart(2, '0')}:${m} ${ampm}`;
        } else {
          map[slot.timeslotid] = timeString;
        }
      });

      setTimeslotMap(map);
    };

    fetchTimeslots();
  }, [UserData?.vendorid]);



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
        .select("vendorid, name")
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



  const {
    notifications,
    initialNotificationLoading,
    isRefreshingNotifications,
    markAsRead,
    formatNotificationTime,
    refetchNotifications,
    fetchNotifications
  } = useRealtimeNotifications(UserData?.vendorid || null);


  const {
    incomingOrders,
    setIncomingOrders,
    approvedOrders,
    setApprovedOrders,
    initialOrderLoading,
    isRefreshingOrders,
    refetchOrders,
    fetchOrders
  } = useVendorOrders(UserData?.vendorid);



  useEffect(() => {
    if (!UserData?.vendorid) return;
    fetchNotifications();
    fetchOrders();

    const poll = () => {
      console.log('⏰ Polling Supabase for updates...');
      refetchOrders();
      refetchNotifications();
    };

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        poll();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [UserData?.vendorid]);




  const lastNotifId = useRef(null);
  const lastIncomingOrderId = useRef(null);
  const lastApprovedOrderId = useRef(null);

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
    if (incomingOrders.length > 0) {
      const latest = incomingOrders[0].orderid;
      if (lastIncomingOrderId.current && latest !== lastIncomingOrderId.current) {
        showSuccessToast("New Order Incoming", "");
      }
      lastIncomingOrderId.current = latest;
    }
  }, [incomingOrders]);


  useEffect(() => {
    if (approvedOrders.length > 0) {
      const latest = approvedOrders[0].orderid;
      if (lastApprovedOrderId.current && latest !== lastApprovedOrderId.current) {
        showSuccessToast("Order Approved", "");
      }
      lastApprovedOrderId.current = latest;
    }
  }, [approvedOrders]);





  if (loadingUser || initialNotificationLoading || initialOrderLoading) {
    return <p>Loading dashboard...</p>;
  }

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const handleLogout = async () => {
    const confirmed = await showConfirmToast("Are you sure you wish to log out?");
    if (confirmed) {
      await logoutUser(navigate);
    }
  };


  const updateOrderStatus = async (orderId, newStatus, extraFields = {}) => {
    // First, get the order details to find the student_number
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("student_number, vendorid")
      .eq("orderid", orderId)
      .single();

    if (orderError || !orderData) {
      console.error(`❌ Failed to fetch order ${orderId}:`, orderError);
      return false;
    }

    // Get the vendor name
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("name")
      .eq("vendorid", orderData.vendorid)
      .single();

    if (vendorError || !vendorData) {
      console.error(`❌ Failed to fetch vendor ${orderData.vendorid}:`, vendorError);
      return false;
    }

    // Update the order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({ order_status: newStatus, ...extraFields })
      .eq("orderid", orderId);

    if (updateError) {
      console.error(`❌ Failed to update order ${orderId} to "${newStatus}":`, updateError);
      return false;
    }

    // Create notification for the student
    const notificationMessage = `Your order from ${vendorData.name} has been updated to ${newStatus}`;
    
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        notifid: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        sender: orderData.vendorid,
        recipient: orderData.student_number,
        message: notificationMessage,
        read: false
      });

    if (notificationError) {
      console.error(`❌ Failed to create notification for student ${orderData.student_number}:`, notificationError);
      // Don't return false here since the order update was successful
    }

    console.log(`✅ Order ${orderId} updated to "${newStatus}" and notification sent to student ${orderData.student_number}`);
    return true;
  };



   

  const handleAcceptOrder = async (orderId) => {
    const order = incomingOrders.find(o => o.orderid === orderId);
    if (!order) return;

    const success = await updateOrderStatus(orderId, "processing", {
      time_accepted: new Date().toISOString()
    });

    if (success) {
      const updatedOrder = { ...order, order_status: "processing", time_accepted: new Date().toISOString() };
      setIncomingOrders(prev => prev.filter(o => o.orderid !== orderId));
      setApprovedOrders(prev => [updatedOrder, ...prev]);
    }
  };

  const handleRejectOrder = async (orderId) => {
    const success = await updateOrderStatus(orderId, "rejected");
    if (success) {
      setIncomingOrders(prev => prev.filter(o => o.orderid !== orderId));
    }
  };

  const handleMarkReady = async (orderId) => {
    const success = await updateOrderStatus(orderId, "ready");
    if (success) {
      setApprovedOrders(prev =>
        prev.map(order =>
          order.orderid === orderId ? { ...order, order_status: "ready" } : order
        )
      );
    }
  };

  const handleMarkCollected = async (orderId) => {
    const success = await updateOrderStatus(orderId, "collected", {
      time_collected: new Date().toISOString()
    });

    if (success) {
      setApprovedOrders(prev => prev.filter(o => o.orderid !== orderId));
    }
  };



  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const getTimeslotTime = (timeslotid) => {
    return timeslotMap[timeslotid] || "Unknown";
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




  return (
    <div style={{ minHeight: '100vh', background: 'var(--muted)' }}>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="flex items-center justify-between">
            <h1 className="header-title">Vendor Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="input-with-icon">
                <Search className="input-icon" size={16} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="input"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
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
            </div>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: 'var(--spacing-6) var(--spacing-4)' }}>
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h2 className="welcome-title">Welcome back, {UserData.name}. For test purposes, your id is {UserData.vendorid}!</h2>
            <p style={{ color: 'var(--muted-foreground)' }}>
              Manage your orders and keep track of your business.
            </p>
          </div>
        </div>

        {/* Order Queues */}
        <div className="grid grid-2 gap-4" style={{ marginBottom: 'var(--spacing-8)' }}>
          {/* Incoming Orders Queue */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <button
                  className="btn btn-primary"
                  style={{ fontWeight: 600, fontSize: '1.1rem' }}
                  onClick={() => setShowIncomingModal(true)}
                >
                  Incoming Orders ({incomingOrders.length})
                </button>
              </h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                New orders awaiting your response
              </p>
            </div>
            <div className="card-content">
              {incomingOrders.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-8)',
                  color: 'var(--muted-foreground)'
                }}>
                  <Clock size={48} style={{ margin: '0 auto var(--spacing-4)' }} />
                  <p>No new orders</p>
                </div>
              ) : (
                incomingOrders.map(order => (
                  <div key={order.orderid} className="order-item">
                    <div className="order-info" style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: 600, marginBottom: 'var(--spacing-1)' }}>
                        Order #{order.orderid}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        {order.customer_name} • {formatTime(order.created_at)}
                      </p>
                      <p style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-1)' }}>
                        {(order.items || []).join(', ')}

                      </p>
                      <p style={{ fontWeight: 600, marginTop: 'var(--spacing-1)' }}>
                        ${(order.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAcceptOrder(order.orderid)}
                      >
                        <CheckCircle size={16} />
                        Accept
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleRejectOrder(order.orderid)}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Approved Orders Queue */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <button
                  className="btn btn-primary"
                  style={{ fontWeight: 600, fontSize: '1.1rem' }}
                  onClick={() => setShowApprovedModal(true)}
                >
                  Approved Orders ({approvedOrders.length})
                </button>
              </h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                Orders in progress
              </p>
            </div>
            <div className="card-content">
              {approvedOrders.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-8)',
                  color: 'var(--muted-foreground)'
                }}>
                  <CheckCircle size={48} style={{ margin: '0 auto var(--spacing-4)' }} />
                  <p>No orders in progress</p>
                </div>
              ) : (
                approvedOrders.map(order => (
                  <div key={order.orderid} className="order-item">
                    <div className="order-info" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                        <h4 style={{ fontWeight: 600 }}>Order #{order.orderid}</h4>
                        {getStatusBadge(order.order_status)}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        {order.student_number} • Accepted {formatTime(order.time_accepted)}
                      </p>
                      <p style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-1)' }}>
                        {(order.items || []).join(', ')}
                      </p>
                      <p style={{ fontWeight: 600, marginTop: 'var(--spacing-1)' }}>
                        ${(order.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                      {order.order_status === 'preparing' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleMarkReady(order.orderid)}
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.order_status === 'ready' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleMarkCollected(order.orderid)}
                        >
                          Mark Collected
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* MODALS - overlay */}
        {showIncomingModal && (
          <div
            className="orders-modal"
            style={{
              position: "fixed",
              zIndex: 999,
              inset: 0,
              background: "rgba(17,24,39,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onClick={() => setShowIncomingModal(false)}
          >
            <div
              className="orders-modal-content"
              style={{
                background: "var(--card)",
                color: "var(--card-foreground)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--spacing-8)",
                maxWidth: 600,
                width: "95vw",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "var(--shadow-lg)",
                position: "relative"
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                style={{
                  position: "absolute", top: 10, right: 10,
                  background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "var(--muted-foreground)"
                }}
                onClick={() => setShowIncomingModal(false)}
                aria-label="Close"
              >×</button>
              <h2 style={{ marginBottom: 'var(--spacing-6)', fontWeight: 700 }}>Incoming Orders</h2>
              {incomingOrders.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--muted-foreground)" }}>No incoming orders.</div>
              ) : (
                incomingOrders.map(order => (
                  <div key={order.orderid} className="order-item" style={{ background: "var(--muted)", marginBottom: 'var(--spacing-3)' }}>
                    <div className="order-info" style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: 600, marginBottom: 'var(--spacing-1)' }}>
                        Order #{order.orderid}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        Student: {order.student_number} • Created: {formatTime(order.created_at)} • To be received: {getTimeslotTime(order.timeslotid)}
                      </p>
                      <p style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-1)' }}>
                        {(order.items || []).join(', ')}
                      </p>
                      <p style={{ fontWeight: 600, marginTop: 'var(--spacing-1)' }}>
                        ${(order.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAcceptOrder(order.orderid)}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={16} /> Accept
                        </span>
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleRejectOrder(order.orderid)}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <XCircle size={16} /> Reject
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {showApprovedModal && (
          <div
            className="orders-modal"
            style={{
              position: "fixed",
              zIndex: 999,
              inset: 0,
              background: "rgba(17,24,39,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onClick={() => setShowApprovedModal(false)}
          >
            <div
              className="orders-modal-content"
              style={{
                background: "var(--card)",
                color: "var(--card-foreground)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--spacing-8)",
                maxWidth: 600,
                width: "95vw",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "var(--shadow-lg)",
                position: "relative"
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                style={{
                  position: "absolute", top: 10, right: 10,
                  background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "var(--muted-foreground)"
                }}
                onClick={() => setShowApprovedModal(false)}
                aria-label="Close"
              >×</button>
              <h2 style={{ marginBottom: 'var(--spacing-6)', fontWeight: 700 }}>Approved Orders</h2>
              {approvedOrders.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--muted-foreground)" }}>No approved orders.</div>
              ) : (
                approvedOrders.map(order => (
                  <div key={order.orderid} className="order-item" style={{ background: "var(--muted)", marginBottom: 'var(--spacing-3)' }}>
                    <div className="order-info" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-1)' }}>
                        <h4 style={{ fontWeight: 600 }}>Order #{order.orderid}</h4>
                        {getStatusBadge(order.order_status)}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                        Student: {order.student_number} • Accepted: {formatTime(order.time_accepted)}
                      </p>
                      <p style={{ fontSize: '0.875rem', marginTop: 'var(--spacing-1)' }}>
                        {(order.items || []).join(', ')}
                      </p>
                      <p style={{ fontWeight: 600, marginTop: 'var(--spacing-1)' }}>
                        ${(order.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                      {order.order_status === 'processing' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleMarkReady(order.orderid)}
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.order_status === 'ready' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleMarkCollected(order.orderid)}
                        >
                          Mark Collected
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}


        {/* Quick Actions Panel */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-3 gap-4">
              <Link
                to="/vendor/viewmenu"
                style={{ textDecoration: "none" }}
                className="btn btn-outline btn-lg"
              >View Menu Items
              </Link>

              <Link
                to="/vendor/vendorprofile"
                style={{ textDecoration: "none" }}
                className="btn btn-outline btn-lg"
              >View Profile
              </Link>


              <Link
                to="/vendor/viewanalytics"
                style={{ textDecoration: "none" }}
                className="btn btn-outline btn-lg"
              >View Business Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default VendorDashboard;
