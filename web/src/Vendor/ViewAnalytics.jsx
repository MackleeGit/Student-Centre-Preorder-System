import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { showSuccessToast, showErrorToast, showInfoToast } from "../components/Toast/toastUtils";

const REPORT_TYPES = [
  { label: "Sales Over Time", value: "sales" },
  { label: "Top Menu Items", value: "top_items" },
  { label: "Recent Orders", value: "orders" }
];

// Helper: get formatted date
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}

export default function ViewAnalytics() {
  const [vendorId, setVendorId] = useState(null);
  const [reportType, setReportType] = useState(REPORT_TYPES[0].value);
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [vendorName, setVendorName] = useState("");

  // Fetch vendor ID on mount
  useEffect(() => {
    async function fetchVendor() {
      const { data: user, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.user?.email) {
        showErrorToast("Please log in again.");
        window.location.href = "/login";
        return;
      }
      const email = user.user.email;
      const { data: vendor, error: vendorError } = await supabase
        .from("vendors")
        .select("vendorid, name")
        .eq("email", email)
        .maybeSingle();
      if (vendorError || !vendor) {
        showErrorToast("Vendor not found");
        window.location.href = "/login";
        return;
      }
      setVendorId(vendor.vendorid);
      setVendorName(vendor.name || "");
    }
    fetchVendor();
  }, []);

  // Fetch analytics on vendor/reportType change
  useEffect(() => {
    if (vendorId) fetchAnalytics();
    // eslint-disable-next-line
  }, [vendorId, reportType]);

  async function fetchAnalytics() {
    setLoading(true);
    setAnalyticsData([]);
    if (!vendorId) return;

    // SALES
    if (reportType === "sales") {
      // Group sales per day for vendor
      let { data, error } = await supabase
        .from("orders")
        .select("created_at, total")
        .eq("vendorid", vendorId)
        .order("created_at", { ascending: false });

      if (error) {
        showErrorToast(error.message || "Could not load sales.");
      } else {
        // Group by day (poor man, since SQL group by depends on DB timezone)
        const grouped = {};
        data.forEach(o => {
          const d = (new Date(o.created_at)).toLocaleDateString();
          if (!grouped[d]) grouped[d] = 0;
          grouped[d] += Number(o.total ?? 0);
        });
        setAnalyticsData(
          Object.entries(grouped).map(([day, total]) => ({ day, total }))
        );
      }
    }

    // TOP MENU ITEMS
    if (reportType === "top_items") {
      // For this, join order_items, menuitems, orders and sum quantity for this vendor's items
      let { data, error } = await supabase
        .rpc('top_menu_items_for_vendor', { vendorid_input: vendorId }); // check for function existence in supabase

      if (error || !data) {
        // fallback: do it here (not efficient for prod, but shows how to process)
        // 1. get menuitems for this vendor
        let { data: items } = await supabase
          .from("menuitems")
          .select("menuitemid, name")
          .eq("vendorid", vendorId);

        // 2. get order_items, join orderid to orders (vendorid!)
        let { data: orderItems } = await supabase
          .from("order_items")
          .select("orderid, menuitemid, quantity");

        let { data: orders } = await supabase
          .from("orders")
          .select("orderid, vendorid");

        // filter orders for this vendor
        const vendorOrderIds = (orders ?? [])
          .filter(o => o.vendorid === vendorId)
          .map(o => o.orderid);
        // count quantities per menuitem
        const counts = {};
        (orderItems ?? []).forEach(oi => {
          if (vendorOrderIds.includes(oi.orderid)) {
            counts[oi.menuitemid] = (counts[oi.menuitemid] || 0) + (oi.quantity || 0);
          }
        });
        setAnalyticsData(
          (items ?? [])
            .map(m => ({
              name: m.name,
              sold: counts[m.menuitemid] || 0
            }))
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 8)
        );
      } else {
        setAnalyticsData(
          (data ?? []).map(row => ({
            name: row.name,
            sold: row.total_quantity
          }))
        );
      }
    }

    // ORDERS
    if (reportType === "orders") {
      let { data, error } = await supabase
        .from("orders")
        .select("orderid, order_status, created_at, total")
        .eq("vendorid", vendorId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        showErrorToast(error.message || "Could not load orders");
      } else {
        setAnalyticsData(data || []);
      }
    }
    setLoading(false);
  }

  // UI
  return (
    <div style={{ minHeight: "100vh", background: "var(--muted)" }}>
      <div className="header">
        <div className="container flex items-center justify-between">
          <button className="btn btn-ghost" onClick={() => window.history.back()}>Back</button>
          <h1 className="header-title">Business Analytics</h1>
          <span style={{ fontWeight: 500 }}>{vendorName && <>Vendor: <span style={{ color: "var(--primary)" }}>{vendorName}</span></>}</span>
        </div>
      </div>
      <div className="container" style={{ marginTop: "var(--spacing-6)" }}>
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: "var(--spacing-4)" }}>Analytics &amp; Reports</h2>
          <div className="flex gap-4 items-center" style={{ marginBottom: "var(--spacing-4)" }}>
            <select
              className="input"
              style={{ maxWidth: 220 }}
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              disabled={loading}
            >
              {REPORT_TYPES.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
            <button className="btn btn-outline btn-sm" onClick={fetchAnalytics} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
          <div>
            {loading && <div>Loading report...</div>}

            {!loading && reportType === "sales" && (
              <div>
                <b>Sales Over Time</b>
                <div className="grid grid-2 gap-4" style={{ marginTop: "var(--spacing-2)" }}>
                  {analyticsData.length === 0 && <span>No sales found.</span>}
                  {analyticsData.map((row, idx) => (
                    <div className="card" key={idx} style={{ padding: "var(--spacing-3)", fontSize: "0.95rem" }}>
                      <div>Date: {row.day}</div>
                      <div>Total Sales: <b>${Number(row.total).toFixed(2)}</b></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && reportType === "top_items" && (
              <div>
                <b>Top Menu Items</b>
                <div className="grid grid-2 gap-4" style={{ marginTop: "var(--spacing-2)" }}>
                  {analyticsData.length === 0 && <span>No items sold yet.</span>}
                  {analyticsData.map((row, idx) => (
                    <div className="card" key={idx} style={{ padding: "var(--spacing-3)", fontSize: "0.95rem" }}>
                      <div>Item: {row.name}</div>
                      <div>Sold: <b>{row.sold}</b></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && reportType === "orders" && (
              <div>
                <b>Recent Orders</b>
                <div className="grid grid-2 gap-4" style={{ marginTop: "var(--spacing-2)" }}>
                  {analyticsData.length === 0 && <span>No orders found.</span>}
                  {analyticsData.map((order, idx) => (
                    <div className="card" key={order.orderid || idx} style={{ padding: "var(--spacing-3)", fontSize: "0.95rem" }}>
                      <div>Order ID: {order.orderid}</div>
                      <div>Status: <span className="badge badge-default">{order.order_status}</span></div>
                      <div>Date: {formatDate(order.created_at)}</div>
                      <div>Total: <b>${Number(order.total).toFixed(2)}</b></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
