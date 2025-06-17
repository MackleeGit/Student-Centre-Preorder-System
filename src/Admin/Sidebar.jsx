import React from "react";
import {
  BarChart3,
  UtensilsCrossed,
  Users,
  FileText,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import "../css/sidebar.css";

const Sidebar = ({ active, setActiveView }) => {
  const navigate = useNavigate();

  // Handle logout click
  const handleLogout = () => {
    // You can extend this to call logout functions and cleanup
    navigate("/admin/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>STC Preorder System</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setActiveView("dashboard")}
            >
              <BarChart3 className="sidebar-icon" />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/vendors"
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setActiveView("vendors")}
            >
              <UtensilsCrossed className="sidebar-icon" />
              Vendor Management
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/students"
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setActiveView("students")}
            >
              <Users className="sidebar-icon" />
              Student Management
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/reports"
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setActiveView("reports")}
            >
              <FileText className="sidebar-icon" />
              Reports & Analytics
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button
          className="logout-button"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <LogOut className="sidebar-icon" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
