import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { showSuccessToast, showErrorToast, showConfirmToast } from "../components/Toast/toastUtils";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit3, Save, X, User, Mail, Phone, MapPin, Clock, Upload, Camera } from "lucide-react";

const VendorProfilePage = () => {
  const [vendor, setVendor] = useState(null);
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    availability: "closed" 
  });
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
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

    // Set banner image if exists
    if (vendorData.banner_url) {
      setBannerImage(vendorData.banner_url);
    }

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

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast("Banner image must be less than 5MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        showErrorToast("Please select a valid image file");
        return;
      }

      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setBannerPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadBannerImage = async () => {
    if (!bannerFile) return bannerImage;

    try {
      const fileExt = bannerFile.name.split('.').pop();
      const fileName = `${vendor.vendorid}-banner-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('vendors')
        .upload(fileName, bannerFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vendors')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading banner:', error);
      showErrorToast("Failed to upload banner image");
      return bannerImage;
    }
  };

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

    try {
      // Upload banner if changed
      const finalBannerUrl = await uploadBannerImage();

      const { error } = await supabase
        .from("vendors")
        .update({
          name: form.name.trim(),
          phone: form.phone.trim(),
          availability: form.availability,
          banner_url: finalBannerUrl
        })
        .eq("vendorid", vendor.vendorid);

      if (error) {
        showErrorToast(error.message || "Could not update profile.");
      } else {
        showSuccessToast("Profile updated successfully");
        setEditing(false);
        setBannerFile(null);
        setBannerPreview(null);
        fetchVendor();
      }
    } catch (error) {
      showErrorToast("Error updating profile");
      console.error('Save error:', error);
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
    setBannerFile(null);
    setBannerPreview(null);
    setEditing(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "var(--spacing-8)" }}>
      <p>Loading profile...</p>
    </div>
  );

  const displayBanner = bannerPreview || bannerImage;

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
        position: 'relative',
        minHeight: '300px',
        backgroundImage: displayBanner 
          ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${displayBanner})`
          : `linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: "white",
        display: 'flex',
        alignItems: 'center',
        marginBottom: "var(--spacing-6)"
      }}>
        {/* Banner Upload Overlay for Edit Mode */}
        {editing && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10
          }}>
            <label 
              htmlFor="banner-upload"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: 'var(--spacing-2) var(--spacing-3)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                border: '2px solid rgba(255,255,255,0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0,0,0,0.9)';
                e.target.style.borderColor = 'rgba(255,255,255,0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(0,0,0,0.7)';
                e.target.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
            >
              <Camera size={16} />
              Change Banner
            </label>
            <input
              id="banner-upload"
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              style={{ display: 'none' }}
            />
          </div>
        )}

        <div className="container" style={{ zIndex: 5 }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ 
              fontSize: "3rem", 
              fontWeight: "700", 
              marginBottom: "var(--spacing-3)",
              textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
              lineHeight: '1.2' 
            }}>
              {vendor?.name}
            </h1>
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              gap: "var(--spacing-4)", 
              flexWrap: "wrap",
              marginBottom: "var(--spacing-2)"
            }}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "var(--spacing-1)",
                background: "rgba(0,0,0,0.3)",
                padding: "var(--spacing-2) var(--spacing-3)",
                borderRadius: "var(--radius)",
                backdropFilter: "blur(10px)"
              }}>
                <span style={{ fontSize: "1.3rem", fontWeight: "600" }}>
                  ⭐ {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings yet'}
                </span>
              </div>
              <span style={{ 
                background: "rgba(0,0,0,0.3)", 
                padding: "var(--spacing-2) var(--spacing-3)", 
                borderRadius: "var(--radius)",
                backdropFilter: "blur(10px)",
                fontWeight: "500"
              }}>
                {totalOrders} Total Orders
              </span>
              <span style={{ 
                background: vendor?.availability === 'open' 
                  ? "rgba(34, 197, 94, 0.8)" 
                  : "rgba(239, 68, 68, 0.8)", 
                color: "white",
                padding: "var(--spacing-2) var(--spacing-3)", 
                borderRadius: "var(--radius)",
                fontWeight: "600",
                backdropFilter: "blur(10px)"
              }}>
                {vendor?.availability === 'open' ? '🟢 Open' : '🔴 Closed'}
              </span>
            </div>
            {vendor?.datejoined && (
              <p style={{ 
                marginTop: "var(--spacing-2)", 
                opacity: 0.9,
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                fontSize: '1.1rem'
              }}>
                Member since {new Date(vendor.datejoined).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div className="card" style={{ padding: "var(--spacing-8)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
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
                  <label style={{ fontWeight: "500", marginBottom: "var(--spacing-2)", display: "flex", alignItems: "center", gap: "var(--spacing-1)" }}>
                    <Mail size={16} />
                    Email Address
                  </label>
                  <p style={{ padding: "var(--spacing-3)", background: "var(--muted)", borderRadius: "var(--radius)", color: "var(--muted-foreground)" }}>
                    {vendor?.email} (Cannot be changed)
                  </p>
                </div>

                <div>
                  <label style={{ fontWeight: "500", marginBottom: "var(--spacing-2)", display: "flex", alignItems: "center", gap: "var(--spacing-1)" }}>
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
                  <label style={{ fontWeight: "500", marginBottom: "var(--spacing-2)",  display: "flex", alignItems: "center", gap: "var(--spacing-1)" }}>
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
                    padding: "var(--spacing-6)", 
                    background: "var(--card)", 
                    border: "1px solid var(--border)", 
                    borderRadius: "var(--radius)",
                    textAlign: "center",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--primary)", marginBottom: "var(--spacing-1)" }}>
                      {totalOrders}
                    </div>
                    <div style={{ color: "var(--muted-foreground)", fontWeight: "500" }}>Total Orders</div>
                  </div>
                  
                  <div style={{ 
                    padding: "var(--spacing-6)", 
                    background: "var(--card)", 
                    border: "1px solid var(--border)", 
                    borderRadius: "var(--radius)",
                    textAlign: "center",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--primary)", marginBottom: "var(--spacing-1)" }}>
                      {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                    </div>
                    <div style={{ color: "var(--muted-foreground)", fontWeight: "500" }}>Average Rating</div>
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