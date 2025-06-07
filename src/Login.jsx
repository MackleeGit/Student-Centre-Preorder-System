import { useState } from "react";
import "./login.css";
import { Link } from "react-router-dom";

const roles = ["student", "vendor"];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeRole, setActiveRole] = useState("student");

  const handleLogin = (role) => {
    console.log(`Login attempt as ${role}:`, { email, password });
    if (role === "student") {
      window.location.href = "/dashboard/student";
    } else if (role === "vendor") {
      window.location.href = "/dashboard/vendor";
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>Order & Go Campus</h2>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
