
import React from "react";
import "../css/dashboard.css"; 

const Dashboard = () => {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f9fafb", // optional soft background
    }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>Admin Dashboard</h1>
    </div>
  );
};

export default Dashboard;
