import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient.js";
import "../css/dashboard.css";

const convertArrayToCSV = (arr, columns) => {
  const header = columns.map((col) => col.header).join(",");
  const rows = arr.map((item) =>
    columns
      .map((col) => {
        const val =
          typeof col.accessor === "function" ? col.accessor(item) : item[col.accessor];
        if (val == null) return "";
        const escaped = `${val}`.replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(",")
  );
  return [header, ...rows].join("\r\n");
};

const downloadCSV = (filename, csvString) => {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  link.click();
  URL.revokeObjectURL(url);
};

const ReportsAnalytics = () => {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [popularItems, setPopularItems] = useState([]);
  const [vendorLeaderboard, setVendorLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      const { data, error } = await supabase.from("vendors").select("id, name");
      if (!error) {
        setVendors(data);
      } else {
        console.error("Failed to fetch vendors:", error);
      }
    };
    fetchVendors();
  }, []);

  useEffect(() => {
    if (!selectedVendor || !dateRange.from || !dateRange.to) {
      setPopularItems([]);
      setVendorLeaderboard([]);
      return;
    }

    const fetchReports = async () => {
      setLoading(true);

      const popularQuery = supabase
        .from("menu_items")
        .select("name, vendor(name), total_orders")
        .eq("vendor_id", selectedVendor)
        .gte("order_date", dateRange.from)
        .lte("order_date", dateRange.to)
        .order("total_orders", { ascending: false })
        .limit(5);

      const leaderboardQuery = supabase
        .from("vendors")
        .select("name, total_sales, avg_completion_time")
        .eq("id", selectedVendor);

      try {
        const [
          { data: popularData, error: popularError },
          { data: leaderboardData, error: leaderboardError },
        ] = await Promise.all([popularQuery, leaderboardQuery]);

        if (popularError) throw popularError;
        if (leaderboardError) throw leaderboardError;

        setPopularItems(popularData);
        setVendorLeaderboard(leaderboardData);
      } catch (err) {
        console.error("Failed fetching reports:", err.message);
        setPopularItems([]);
        setVendorLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedVendor, dateRange]);

  const handleVendorChange = (e) => {
    setSelectedVendor(e.target.value);
  };

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const handleExport = () => {
    if (!selectedVendor) {
      alert("Please select a vendor before exporting reports.");
      return;
    }
    const popularItemsColumns = [
      { header: "Item Name", accessor: "name" },
      { header: "Vendor", accessor: (row) => row.vendor?.name || "" },
      { header: "Total Orders", accessor: "total_orders" },
    ];

    const vendorLeaderboardColumns = [
      { header: "Vendor Name", accessor: "name" },
      { header: "Total Sales (Ksh)", accessor: "total_sales" },
      { header: "Avg. Completion Time", accessor: "avg_completion_time" },
    ];

    const popularItemsCSV = convertArrayToCSV(popularItems, popularItemsColumns);
    const vendorLeaderboardCSV = convertArrayToCSV(vendorLeaderboard, vendorLeaderboardColumns);

    const combinedCSV =
      "Top 5 Most Popular Menu Items\r\n" +
      popularItemsCSV +
      "\r\n\r\nVendor Leaderboard\r\n" +
      vendorLeaderboardCSV;

    downloadCSV("STC_Preorder_Reports.csv", combinedCSV);
  };

  return (
    <div>
      <div
        className="card-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <h2>Analytics & Reports</h2>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <select
            aria-label="Select Vendor"
            value={selectedVendor}
            onChange={handleVendorChange}
            className="input"
            style={{ flex: 1, minWidth: 200 }}
          >
            <option value="">Select Vendor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="from"
            value={dateRange.from}
            onChange={handleDateChange}
            className="input"
            style={{ flex: 1, minWidth: 160 }}
            aria-label="From Date"
          />
          <input
            type="date"
            name="to"
            value={dateRange.to}
            onChange={handleDateChange}
            className="input"
            style={{ flex: 1, minWidth: 160 }}
            aria-label="To Date"
          />
          <button onClick={handleExport} className="btn btn-primary" style={{ flexShrink: 0 }}>
            Export All Reports (CSV)
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24, overflowX: "auto" }}>
        <h3>Top 5 Most Popular Menu Items</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Item Name</th>
              <th style={thStyle}>Vendor</th>
              <th style={thStyle}>Total Orders</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={tdStyle}>
                  Loading...
                </td>
              </tr>
            ) : popularItems.length === 0 ? (
              <tr>
                <td colSpan={3} style={tdStyle}>
                  No data available.
                </td>
              </tr>
            ) : (
              popularItems.map((item, index) => (
                <tr key={index}>
                  <td style={tdStyle}>{item.name}</td>
                  <td style={tdStyle}>{item.vendor?.name || "N/A"}</td>
                  <td style={tdStyle}>{item.total_orders}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginBottom: 24, overflowX: "auto" }}>
        <h3>Vendor Leaderboard</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Vendor Name</th>
              <th style={thStyle}>Total Sales (Ksh)</th>
              <th style={thStyle}>Avg. Completion Time (mins)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={tdStyle}>
                  Loading...
                </td>
              </tr>
            ) : vendorLeaderboard.length === 0 ? (
              <tr>
                <td colSpan={3} style={tdStyle}>
                  No data available.
                </td>
              </tr>
            ) : (
              vendorLeaderboard.map((vendor, index) => (
                <tr key={index}>
                  <td style={tdStyle}>{vendor.name}</td>
                  <td style={tdStyle}>{vendor.total_sales}</td>
                  <td style={tdStyle}>{vendor.avg_completion_time}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const thStyle = {
  textAlign: "left",
  padding: "12px 8px",
  borderBottom: "2px solid var(--border)",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 8px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

export default ReportsAnalytics;
