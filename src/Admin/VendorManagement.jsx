import React, { useEffect, useState } from "react";
import { FilePenLine, Ban } from "lucide-react";
import { supabase } from "../utils/supabaseClient.js";
import "../css/dashboard.css";

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, name, contact_email, status");
      if (error) {
        console.error("Error fetching vendors:", error);
      } else {
        setVendors(data);
      }
      setLoading(false);
    };
    fetchVendors();
  }, []);

  const handleEdit = (id) => {
    // TODO: Implement edit vendor modal or page navigation
    alert(`Edit vendor with ID ${id}`);
  };

  const handleSuspend = async (id) => {
    if (!window.confirm("Are you sure you want to suspend this vendor?")) return;
    try {
      const { error } = await supabase
        .from("vendors")
        .update({ status: "Suspended" })
        .eq("id", id);
      if (error) throw error;

      setVendors((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "Suspended" } : v))
      );
    } catch (error) {
      console.error("Error suspending vendor:", error);
      alert("Failed to suspend vendor");
    }
  };

  return (
    <div>
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <h2>Vendor Management</h2>
        <button className="btn btn-primary" onClick={() => alert("Add new vendor - implement!")}>
          + Add New Vendor
        </button>
      </div>

      <div className="card" style={{ marginTop: 16, overflowX: "auto" }}>
        {loading ? (
          <p>Loading vendors...</p>
        ) : vendors.length === 0 ? (
          <p>No vendors found.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Vendor Name</th>
                <th style={thStyle}>Contact Email</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={tdStyle}>{vendor.name}</td>
                  <td style={tdStyle}>{vendor.contact_email}</td>
                  <td style={tdStyle}>
                    <StatusTag status={vendor.status} />
                  </td>
                  <td style={{ ...tdStyle, minWidth: 120 }}>
                    <button
                      onClick={() => handleEdit(vendor.id)}
                      className="btn btn-ghost"
                      title="Edit vendor"
                      style={{ marginRight: 8 }}
                      aria-label={`Edit vendor ${vendor.name}`}
                    >
                      <FilePenLine />
                    </button>
                    {vendor.status !== "Suspended" && (
                      <button
                        onClick={() => handleSuspend(vendor.id)}
                        className="btn btn-ghost badge-destructive"
                        title="Suspend vendor"
                        aria-label={`Suspend vendor ${vendor.name}`}
                      >
                        <Ban />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

const StatusTag = ({ status }) => {
  const lower = status?.toLowerCase() || "";
  const isActive = lower === "active";
  const isSuspended = lower === "suspended";

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "9999px",
        backgroundColor: isActive ? "#10B981" : isSuspended ? "#EF4444" : "#9CA3AF",
        color: "white",
        fontWeight: 600,
        fontSize: "0.875rem",
        display: "inline-block",
        minWidth: 70,
        textAlign: "center",
        userSelect: "none",
      }}
      aria-label={`Status: ${status}`}
    >
      {status}
    </span>
  );
};

export default VendorManagement;
