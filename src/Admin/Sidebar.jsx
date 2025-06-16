import React from "react";
import {
  BarChart3,
  UtensilsCrossed,
  Users,
  FileText,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
          <li
            className={active === "dashboard" ? "active" : ""}
            onClick={() => setActiveView("dashboard")}
            tabIndex={0}
            role="button"
            aria-pressed={active === "dashboard"}
          >
            <BarChart3 className="sidebar-icon" />
            Dashboard
          </li>
          <li
            className={active === "vendors" ? "active" : ""}
            onClick={() => setActiveView("vendors")}
            tabIndex={0}
            role="button"
            aria-pressed={active === "vendors"}
          >
            <UtensilsCrossed className="sidebar-icon" />
            Vendor Management
          </li>
          <li
            className={active === "students" ? "active" : ""}
            onClick={() => setActiveView("students")}
            tabIndex={0}
            role="button"
            aria-pressed={active === "students"}
          >
            <Users className="sidebar-icon" />
            Student Management
          </li>
          <li
            className={active === "reports" ? "active" : ""}
            onClick={() => setActiveView("reports")}
            tabIndex={0}
            role="button"
            aria-pressed={active === "reports"}
          >
            <FileText className="sidebar-icon" />
            Reports & Analytics
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
