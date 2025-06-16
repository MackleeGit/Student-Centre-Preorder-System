import { useState } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { loginUser } from "./utils/authUtils.js";
import { Link } from "react-router-dom";
import { showSuccessToast, showErrorToast, showConfirmToast } from "./components/Toast/toastUtils.jsx";

const roles = ["student", "vendor"];

const Login = () => {
  const [unameemail, setUnameEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeRole, setActiveRole] = useState("student");
  const navigate = useNavigate(); // SPA-safe navigation



  const handleLogin = async (role) => {

    if (unameemail === "launch-admin" && password === "now") {
      navigate("/admin/login");
      return;
    } else {
      
      try {
        await loginUser({ unameemail, password, role, navigate });
      } catch (error) {
        showErrorToast(error.message, "Login Failed");
      }

    }

  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>STC Preorder System</h2>
          <p>Sign in to your account</p>
        </div>

        <div className="tabs">
          <div className="tab-buttons">
            {roles.map((role) => (
              <button
                key={role}
                className={`tab-button ${activeRole === role ? "active" : ""}`}
                onClick={() => setActiveRole(role)}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>

          {roles.map((role) =>
            activeRole === role ? (
              <div className="tab-content" key={role}>
                <div className="form-group">
                  <label htmlFor="email">
                    {role === "student"
                      ? "Student ID or Email"
                      : "Vendor Email"}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={unameemail}
                    onChange={(e) => setUnameEmail(e.target.value)}
                    placeholder={
                      role === "student"
                        ? "Enter student ID or email"
                        : "Enter vendor email"
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
                <button
                  className="primary-button"
                  onClick={() => handleLogin(role)}
                >
                  Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
                <div className="register-text">
                  Don’t have an account?{" "}
                  <Link to="/register">Register</Link>
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;