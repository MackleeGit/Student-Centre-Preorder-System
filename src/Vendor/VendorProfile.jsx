
import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { showSuccessToast, showErrorToast, showConfirmToast } from "../components/Toast/toastUtils";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit3, Save, X, User, Mail, Phone, MapPin, Clock } from "lucide-react";

const VendorProfilePage = () => {
  const [vendor, setVendor] = useState(null);
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    
   
    availability: "closed" 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVendor();
    // eslint-disable-next-line
  }, []);

  const fetchVendor = async () => {
    setLoading(true);
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.user?.email) {
      navigate("/login");
      return;
    }

    const email = user.user.email;
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (vendorError || !vendorData) {
      showErrorToast("Vendor not found");
      navigate("/login");
      return;
    }

    setVendor(vendorData);
    setForm({
      name: vendorData.name || "",
      email: vendorData.email || "",
      phone: vendorData.phone || "",
    
     
      availability: vendorData.availability || "closed",
    });

    // Fetch ratings and orders count
    await fetchVendorStats(vendorData.vendorid);
    setLoading(false);
  };

  const fetchVendorStats = async (vendorId) => {
    try {
      // Fetch ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('orders')
        .select('rating')
        .eq('vendorid', vendorId)
        .not('rating', 'is', null);

      if (!ratingsError && ratingsData && ratingsData.length > 0) {
        const avgRating = ratingsData.reduce((sum, order) => sum + order.rating, 0) / ratingsData.length;
        setAverageRating(avgRating);
      }

      // Fetch total orders count
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('orderid', { count: 'exact' })
        .eq('vendorid', vendorId);

      if (!ordersError) {
        setTotalOrders(ordersData?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
    }
  };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      showErrorToast("Vendor name is required");
      return;
    }

    if (!form.email.trim()) {
      showErrorToast("Email is required");
      return;
    }

    // Check for duplicate name (excluding current vendor)
    const { data: existingVendor, error: checkError } = await supabase
      .from("vendors")
      .select("vendorid")
      .eq("name", form.name.trim())
      .neq("vendorid", vendor.vendorid)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      showErrorToast("Error checking vendor name");
      return;
    }

    if (existingVendor) {
      showErrorToast("A vendor with this name already exists");
      return;
    }

    const confirmed = await showConfirmToast("Save changes to your vendor profile?");
    if (!confirmed) return;

    setSaving(true);
    const { error } = await supabase
      .from("vendors")
      .update({
        name: form.name.trim(),
        phone: form.phone.trim(),

       
        availability: form.availability
      })
      .eq("vendorid", vendor.vendorid);

    if (error) {
      showErrorToast(error.message || "Could not update profile.");
    } else {
      showSuccessToast("Profile updated successfully");
      setEditing(false);
      fetchVendor();
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setForm({
      name: vendor.name || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
     
      availability: vendor.availability || "closed",
    });
    setEditing(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "var(--spacing-8)" }}>
      <p>Loading profile...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Header */}
      <header className="header">
        <div className="container flex items-center justify-between">
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="header-title">Vendor Profile</h1>
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
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--spacing-4)", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-1)" }}>
                <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>
                  ⭐ {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet'}
                </span>
              </div>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "var(--spacing-1) var(--spacing-3)", borderRadius: "var(--radius)" }}>
                {totalOrders} Total Orders
              </span>
              <span style={{ 
                background: vendor?.availability === 'open' ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)", 
                color: vendor?.availability === 'open' ? "#22c55e" : "#ef4444",
                padding: "var(--spacing-1) var(--spacing-3)", 
                borderRadius: "var(--radius)",
                fontWeight: "600"
              }}>
                {vendor?.availability === 'open' ? 'Open' : 'Closed'}
              </span>
            </div>
            {vendor?.datejoined && (
              <p style={{ marginTop: "var(--spacing-2)", opacity: 0.9 }}>
                Member since {new Date(vendor.datejoined).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div className="card" style={{ padding: "var(--spacing-8)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-6)" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>Profile Information</h2>
            {!editing ? (
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                <Edit3 size={16} />
                Edit Profile
              </button>
            ) : (
              <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  <Save size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>
                <button className="btn btn-outline" onClick={handleCancel}>
                  <X size={16} />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: "var(--spacing-6)" }}>
            {/* Basic Information */}
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "var(--spacing-4)", display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                <User size={20} />
                Basic Information
              </h3>
              
              <div style={{ display: "grid", gap: "var(--spacing-4)" }}>
                <div>
                  <label style={{ fontWeight: "500", marginBottom: "var(--spacing-2)", display: "block" }}>
                    Vendor Name *
                  </label>
                  {editing ? (
                    <input 
                      className="input" 
                      name="name" 
                      value={form.name} 
                      onChange={handleChange}
                      placeholder="Enter vendor name"
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <p style={{ padding: "var(--spacing-3)", background: "var(--muted)", borderRadius: "var(--radius)" }}>
                      {vendor?.name || "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ fontWeight: "500", marginBottom: "var(--spacing-2)", display: "block", display: "flex", alignItems: "center", gap: "var(--spacing-1)" }}>
                    <Mail size={16} />
                    Email Address
                  </label>
                  <p style={{ padding: "var(--spacing-3)", background: "var(--muted)", borderRadius: "var(--radius)", color: "var(--muted-foreground)" }}>
                    {vendor?.email} (Cannot be changed)
                  </p>
                </div>

                <div>
                  <label style={{ fontWeight: "500", marginBottom: "var(--spacing-2)", display: "block", display: "flex", alignItems: "center", gap: "var(--spacing-1)" }}>
                    <Phone size={16} />
                    Phone Number
                  </label>
                  {editing ? (
                    <input 
                      className="input" 
                      name="phone" 
                      value={form.phone} 
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <p style={{ padding: "var(--spacing-3)", background: "var(--muted)", borderRadius: "var(--radius)" }}>
                      {vendor?.phone || "Not provided"}
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "var(--spacing-4)" }}>
                Business Information
              </h3>
              
              <div style={{ display: "grid", gap: "var(--spacing-4)" }}>
          
                <div>
                  <label style={{ fontWeight: "500", marginBottom: "var(--spacing-2)", display: "block", display: "flex", alignItems: "center", gap: "var(--spacing-1)" }}>
                    <Clock size={16} />
                    Availability Status
                  </label>
                  {editing ? (
                    <select 
                      className="input" 
                      name="availability" 
                      value={form.availability} 
                      onChange={handleChange}
                      style={{ width: "100%" }}
                    >
                      <option value="open">Open - Accepting Orders</option>
                      <option value="closed">Closed - Not Accepting Orders</option>
                    </select>
                  ) : (
                    <p style={{ 
                      padding: "var(--spacing-3)", 
                      background: vendor?.availability === 'open' ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      color: vendor?.availability === 'open' ? "#22c55e" : "#ef4444",
                      borderRadius: "var(--radius)",
                      fontWeight: "500"
                    }}>
                      {vendor?.availability === 'open' ? '🟢 Open - Accepting Orders' : '🔴 Closed - Not Accepting Orders'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics */}
            {!editing && (
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "var(--spacing-4)" }}>
                  Business Statistics
                </h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--spacing-4)" }}>
                  <div style={{ 
                    padding: "var(--spacing-4)", 
                    background: "var(--card)", 
                    border: "1px solid var(--border)", 
                    borderRadius: "var(--radius)",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--primary)" }}>
                      {totalOrders}
                    </div>
                    <div style={{ color: "var(--muted-foreground)" }}>Total Orders</div>
                  </div>
                  
                  <div style={{ 
                    padding: "var(--spacing-4)", 
                    background: "var(--card)", 
                    border: "1px solid var(--border)", 
                    borderRadius: "var(--radius)",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--primary)" }}>
                      {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                    </div>
                    <div style={{ color: "var(--muted-foreground)" }}>Average Rating</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfilePage;