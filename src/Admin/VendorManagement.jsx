import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../utils/supabaseClient.js";
import { Search, MoreVertical, Edit, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { showConfirmToast, showErrorToast, showSuccessToast } from '../components/Toast/toastUtils.jsx';
import "../css/dashboard.css";

// --- Helper Components ---
const StatusBadge = ({ status }) => {
    switch (status) {
        case 'approved':
            return <span className="badge badge-success"><CheckCircle2 size={14} /> Approved</span>;
        case 'pending':
            return <span className="badge badge-warning"><Clock size={14} /> Pending</span>;
        case 'rejected':
            return <span className="badge badge-danger"><XCircle size={14} /> Rejected</span>;
        default:
            return <span className="badge-neutral">{status || 'N/A'}</span>;
    }
};

const AvailabilityBadge = ({ isAvailable }) => {
    return isAvailable === 'open' ? 
        <span className="badge badge-success">Open</span> : 
        <span className="badge badge-danger">Closed</span>;
};


// --- Main Component ---
const VendorManagement = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    const [openMenuId, setOpenMenuId] = useState(null);
    const [editingVendor, setEditingVendor] = useState(null);
    const menuRef = useRef(null);

    // --- Main Data Fetching Function ---
    const fetchVendors = async () => {
        // CHANGE 1: Removed 'image_url' from the select query
        const { data, error } = await supabase
            .from("vendors")
<<<<<<< Updated upstream
            .select("vendorid, name, approval_status, email, availability, phone, total_sales, cancellation_rate")
            
=======
            .select("vendorid, name, approval_status, email, availability, phone")
            .order('name', { ascending: true });
>>>>>>> Stashed changes

        if (error) {
            console.error("Error fetching vendors:", error);
            setError("Could not load vendor data. Please check RLS policies.");
        } else {
<<<<<<< Updated upstream
            setVendors(data);
=======
            setVendors(data || []);
>>>>>>> Stashed changes
        }
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        fetchVendors();
    }, []);

    // --- Close dropdown menu if clicking outside ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- CRUD Functions ---
    const handleDeleteVendor = async (vendorId, vendorName) => {
        setOpenMenuId(null);
        const confirmed = await showConfirmToast(`Delete vendor: ${vendorName}? This is permanent.`);
        
        if (confirmed) {
            const { error } = await supabase.from('vendors').delete().eq('vendorid', vendorId);
            if (error) {
                showErrorToast("Failed to delete vendor.");
            } else {
                showSuccessToast("Vendor successfully deleted.");
                fetchVendors();
            }
        }
    };

    const handleUpdateVendor = async () => {
        const { vendorid, ...updateData } = editingVendor;
<<<<<<< Updated upstream
=======
        
        // CHANGE 2: Removed image_url from the update object
>>>>>>> Stashed changes
        const { error } = await supabase
            .from('vendors')
            .update({
                name: updateData.name,
<<<<<<< Updated upstream
                email: updateData.email,
                phone: updateData.phone,
                approval_status: updateData.approval_status,
                availability: updateData.availability,
                // CHANGE 2: Removed image_url from the update object
=======
                phone: updateData.phone,
                approval_status: updateData.approval_status,
                availability: updateData.availability
                // email is not updated here to protect login credentials
>>>>>>> Stashed changes
            })
            .eq('vendorid', vendorid);

        if (error) {
            showErrorToast("Failed to update vendor.");
        } else {
            showSuccessToast("Vendor updated successfully.");
            setEditingVendor(null);
            fetchVendors();
        }
    };

    const handleApproveVendor = async (vendorId) => {
        const { error } = await supabase.from('vendors').update({ approval_status: 'approved' }).eq('vendorid', vendorId);
        if (error) {
            showErrorToast("Failed to approve vendor.");
        } else {
            showSuccessToast("Vendor approved successfully.");
            fetchVendors();
        }
    };

    // --- Event Handlers ---
    const startEditing = (vendor) => {
        setOpenMenuId(null);
        setEditingVendor({ ...vendor });
    };

    const cancelEditing = () => setEditingVendor(null);

    const onEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? (checked ? 'open' : 'closed') : value;
        setEditingVendor({ ...editingVendor, [name]: newValue });
    };

<<<<<<< Updated upstream
    // --- Filtering and Rendering ---
    const filteredVendors = vendors.filter(vendor =>
        Object.values(vendor).some(val => 
=======
    // --- Filtering Logic ---
    const filteredVendors = vendors.filter(vendor =>
        Object.values(vendor || {}).some(val => 
>>>>>>> Stashed changes
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

<<<<<<< Updated upstream
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';

=======
>>>>>>> Stashed changes
    if (loading) return <div className="loading-spinner">Loading vendor data...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
<<<<<<< Updated upstream
        <div className="card">
=======
        <>
>>>>>>> Stashed changes
            <div className="card-header">
                <h3 className="card-title">Vendor Management</h3>
                <div className="input-with-icon" style={{ maxWidth: "300px" }}>
                    <Search className="input-icon" size={16} />
                    <input type="text" placeholder="Search vendors..." className="input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
            <div className="card-content">
                <table className="data-table">
                    <thead>
                        <tr>
                            {/* CHANGE 3: Removed 'Profile Photo' from the header */}
                            <th>Name</th>
                            <th>Approval Status</th>
                            <th>Availability</th>
                            <th>Email</th>
<<<<<<< Updated upstream
                            <th>Date Joined</th>
=======
>>>>>>> Stashed changes
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVendors.map((vendor) => (
                            <tr key={vendor.vendorid}>
                                {editingVendor?.vendorid === vendor.vendorid ? (
                                    <>
                                        {/* Inline Editing Mode */}
                                        <td><input type="text" name="name" value={editingVendor.name || ''} onChange={onEditChange} className="input-edit" /></td>
                                        <td>
                                            <select name="approval_status" value={editingVendor.approval_status || 'pending'} onChange={onEditChange} className="input-edit">
                                                <option value="approved">Approved</option>
                                                <option value="pending">Pending</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </td>
                                        <td>
                                            <label className="switch">
                                                <input type="checkbox" name="availability" checked={editingVendor.availability === 'open'} onChange={onEditChange} />
                                                <span className="slider"></span>
                                            </label>
                                        </td>
<<<<<<< Updated upstream
                                        <td><input type="email" name="email" value={editingVendor.email || ''} onChange={onEditChange} className="input-edit" /></td>
                                        <td>{formatDate(vendor.created_at)}</td>
=======
                                        <td><input type="email" name="email" value={editingVendor.email || ''} className="input-edit" readOnly title="Login email cannot be changed."/></td>
>>>>>>> Stashed changes
                                        <td style={{ textAlign: 'center' }}>
                                            <button onClick={handleUpdateVendor} className="btn btn-sm btn-success">Save</button>
                                            <button onClick={cancelEditing} className="btn btn-sm btn-secondary">Cancel</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        {/* Normal Display Mode */}
                                        <td>{vendor.name}</td>
                                        <td><StatusBadge status={vendor.approval_status} /></td>
                                        <td><AvailabilityBadge isAvailable={vendor.availability} /></td>
                                        <td>{vendor.email}</td>
<<<<<<< Updated upstream
                                        <td>{formatDate(vendor.created_at)}</td>
=======
>>>>>>> Stashed changes
                                        <td style={{ textAlign: 'center' }} className="actions-cell">
                                            <button className="btn btn-sm btn-outline btn-icon" title="Manage Vendor" onClick={() => setOpenMenuId(vendor.vendorid === openMenuId ? null : vendor.vendorid)}>
                                                <MoreVertical size={16} />
                                            </button>
                                            {openMenuId === vendor.vendorid && (
                                                <div className="actions-dropdown" ref={menuRef}>
                                                    <button onClick={() => startEditing(vendor)}><Edit size={14} /> Edit Details</button>
                                                    {vendor.approval_status !== 'approved' && (
                                                        <button onClick={() => handleApproveVendor(vendor.vendorid)} className="approve"><CheckCircle2 size={14} /> Approve</button>
                                                    )}
                                                    <button onClick={() => handleDeleteVendor(vendor.vendorid, vendor.name)} className="delete"><Trash2 size={14} /> Delete</button>
                                                </div>
                                            )}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
<<<<<<< Updated upstream
        </div>
=======
        </>
>>>>>>> Stashed changes
    );
};

export default VendorManagement;
