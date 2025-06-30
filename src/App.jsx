import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Index from "./Index";
import Register from "./Register";
import StudentDashboard from "./Student/Dashboard";
import ViewVendor from "./Student/ViewVendor";
import ViewOrders from "./Student/ViewOrders";


import VendorDashboard from "./Vendor/Dashboard";
import ViewMenu from "./Vendor/ViewMenu";
import AdminDashboard from "./Admin/Dashboard";
import AdminLogin from './Admin/Login';
import './css/global.css';
import { Toaster } from 'react-hot-toast';
import ViewAnalytics from "./Vendor/ViewAnalytics";
import VendorProfile from "./Vendor/VendorProfile";
import AdminStudentManagement from "./Admin/StudentManagement";
<<<<<<< Updated upstream
import AdminVendorManagement from './Admin/VendorManagement.jsx';
import AdminReportsAnalytics from './Admin/ReportsAnalytics.jsx';
=======
import AdminVendorManagement from "./Admin/VendorManagement";
import AdminReportsAnalytics from "./Admin/ReportsAnalytics";
>>>>>>> Stashed changes


function App() {
  return (
    <BrowserRouter>
      {/* Toast container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/viewvendor/:vendorid" element={<ViewVendor />} />
        <Route path="/student/vieworders" element={<ViewOrders />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/vendor/viewmenu" element={<ViewMenu />} />

        <Route path="/admin/studentmanagement" element={<AdminStudentManagement />} />
        <Route path="/admin/vendormanagement" element={<AdminVendorManagement />} />
        <Route path="/admin/reportsanalytics" element={<AdminReportsAnalytics />} />
        <Route path="/vendor/viewanalytics" element={<ViewAnalytics />} />
        <Route path="/vendor/vendorprofile" element={<VendorProfile />} />
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/admin" element={<Index />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;