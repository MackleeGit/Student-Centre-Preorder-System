import { useState } from "react";
import "./login.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "./utils/authUtils.js";
import { showSuccessToast, showErrorToast, showConfirmToast } from "./components/Toast/toastUtils.jsx";

const roles = ["student", "vendor"];

const Register = () => {
    const [activeRole, setActiveRole] = useState("student");
    const [email, setEmail] = useState("");
    const [studentId, setStudentId] = useState(""); // Student-specific
    const [fname, setFName] = useState("");
    const [lname, setLName] = useState("");
    const [vendorName, setVendorName] = useState(""); // Vendor-specific
    const [vendorDescription, setVendorDescription] = useState(""); // Vendor description
    const [banner, setBanner] = useState(null); // Vendor banner file
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (role) => {
        if (password !== confirmPassword) {
            showErrorToast("Passwords do not match!", "Registration Error");
            return;
        }

        // Check if banner is provided for vendors
        if (role === "vendor" && !banner) {
            showErrorToast("Banner image is required for vendor registration!", "Registration Error");
            return;
        }

        const extraFields = {
            studentId,
            fname,
            lname,
            vendorName,
            banner,
            description
        };

        try {
            await registerUser({ role, email, password, extraFields });

            const shouldLogin = await showConfirmToast(
                `Registration successful as ${role}! Click OK to login.`,
                "Registration Complete"
            );
            
            if (shouldLogin) {
                await loginUser({ unameemail:email, password, role, navigate });
            }
            
        } catch (error) {
            showErrorToast(error.message, "Registration Failed");
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h2>STC Preorder System</h2>
                    <p>Create your account</p>
                </div>

                <div className="tabs">
                    <div className="tab-buttons">
                        {roles.map((role) => (
                            <button
                                key={role}
                                className={`tab-button ${activeRole === role ? "active" : ""}`}
                                onClick={() => {
                                    setActiveRole(role);

                                    // Reset fields on tab switch
                                    setEmail("");
                                    setStudentId("");
                                    setVendorName("");
                                    setBanner(null);
                                    setPassword("");
                                    setConfirmPassword("");
                                    setFName("");
                                    setLName("");
                                }}
                            >
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </button>
                        ))}
                    </div>

                    {activeRole === "student" && (
                        <div className="tab-content" key="student">
                            <div className="form-group">
                                <label htmlFor="studentId">Student ID</label>
                                <input
                                    id="studentId"
                                    type="text"
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    placeholder="Enter your student ID"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="fname">First Name</label>
                                <input
                                    id="fname"
                                    type="text"
                                    value={fname}
                                    onChange={(e) => setFName(e.target.value)}
                                    placeholder="Enter your first name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lname">Last Name</label>
                                <input
                                    id="lname"
                                    type="text"
                                    value={lname}
                                    onChange={(e) => setLName(e.target.value)}
                                    placeholder="Enter your last name"
                                />
                            </div>
                        </div>
                    )}

                     {activeRole === "vendor" && (
                        <div className="tab-content" key="vendor">
                            <div className="form-group">
                                <label htmlFor="vendorName">Vendor Name</label>
                                <input
                                    id="vendorName"
                                    type="text"
                                    value={vendorName}
                                    onChange={(e) => setVendorName(e.target.value)}
                                    placeholder="Enter your vendor name"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="vendorDescription">Description</label>
                                <textarea
                                    id="vendorDescription"
                                    value={vendorDescription}
                                    onChange={(e) => setVendorDescription(e.target.value)}
                                    placeholder="Describe your business and what you offer"
                                    rows="3"
                                    className="form-textarea"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="banner">Banner Image *</label>
                                <input
                                    id="banner"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setBanner(e.target.files[0])}
                                    required
                                />
                            </div>
                        </div>
                    )}
                    {/* Common Fields */}
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                        />
                    </div>

                    <button
                        className="primary-button"
                        onClick={() => handleRegister(activeRole)}
                    >
                        Register as {activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}
                    </button>

                    <div className="register-text">
                        Already have an account? <Link to="/login">Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
