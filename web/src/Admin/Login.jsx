import { useState } from "react";
import "../login.css";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../utils/authUtils.js";
import { Link } from "react-router-dom";
import { showSuccessToast, showErrorToast } from "../components/Toast/toastUtils.jsx";

const AdminLogin = () => {
  const [unameemail, setUnameEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleAdminLogin = async () => {
    try {
      await loginUser({ unameemail, password, role: "admin", navigate });
    } catch (error) {
      showErrorToast(error.message, "Admin Login Failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>STC Admin Portal</h2>
          <p>Administrator Access</p>
        </div>

        <div className="tab-content">
          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <input
              id="email"
              type="email"
              value={unameemail}
              onChange={(e) => setUnameEmail(e.target.value)}
              placeholder="Enter admin email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
            />
          </div>
          <button
            className="primary-button"
            onClick={handleAdminLogin}
          >
            Sign In as Administrator
          </button>
          <div className="register-text">
            <Link to="/login">Back to Main Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;