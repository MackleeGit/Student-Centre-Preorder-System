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

const Sidebar = ({ active, setActiveView, isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/admin/login");
  };

  const handleItemClick = (view) => {
    setActiveView(view);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>STC Preorder System</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li
            className={active === "dashboard" ? "active" : ""}
            onClick={() => handleItemClick("dashboard")}
            tabIndex={0}
            role="button"
            aria-pressed={active === "dashboard"}
          >
            <BarChart3 className="sidebar-icon" />
            Dashboard
          </li>
          <li
            className={active === "vendors" ? "active" : ""}
            onClick={() => handleItemClick("vendors")}
            tabIndex={0}
            role="button"
            aria-pressed={active === "vendors"}
          >
            <UtensilsCrossed className="sidebar-icon" />
            Vendor Management
          </li>
          <li
            className={active === "students" ? "active" : ""}
            onClick={() => handleItemClick("students")}
            tabIndex={0}
            role="button"
            aria-pressed={active === "students"}
          >
            <Users className="sidebar-icon" />
            Student Management
          </li>
          <li
            className={active === "reports" ? "active" : ""}
            onClick={() => handleItemClick("reports")}
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
