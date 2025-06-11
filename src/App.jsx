import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Index from "./Index";
import Register from "./Register";
import StudentDashboard from "./Student/Dashboard";
import VendorDashboard from "./Vendor/Dashboard";
import AdminDashboard from "./Admin/Dashboard";
import AdminLogin from './Admin/Login';
import './css/global.css';
import { Toaster } from 'react-hot-toast';
import ViewVendor from "./Student/ViewVendor";

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
        <Route path="/admin/dashboard" element={<AdminDashboard/>} />

        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/admin" element={<Index />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
