import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom";
import Login from "./Login";
import Index from "./Index";
import Register from "./Register";
import StudentDashboard from "./Student/Dashboard";
import VendorDashboard from "./Vendor/Dashboard";
import AdminLogin from './Admin/Login.jsx';
import AdminDashboard from './Admin/Dashboard.jsx';
import AdminStudentManagement from "./Admin/StudentManagement";
import './css/global.css';
import { Toaster } from 'react-hot-toast';
import ViewAnalytics from "./Vendor/ViewAnalytics";
import VendorProfile from "./Vendor/VendorProfile";
import AdminStudentManagement from "./Admin/StudentManagement";


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
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/viewvendor/:vendorid" element={<ViewVendor />} />
        <Route path="/student/vieworders" element={<ViewOrders />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/vendor/viewmenu" element={<ViewMenu />} />

        <Route path="/admin/studentmanagement" element={<AdminStudentManagement />} />
        <Route path="/vendor/viewanalytics" element={<ViewAnalytics />} />
        <Route path="/vendor/vendorprofile" element={<VendorProfile />} />
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/admin" element={<Index />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
         <Route path="/admin/StudentManagement" element={<AdminStudentManagement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
