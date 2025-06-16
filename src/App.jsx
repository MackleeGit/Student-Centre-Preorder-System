import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom";
import Login from "./Login";
import Index from "./Index";
import Register from "./Register";
import StudentDashboard from "./Student/Dashboard";
import VendorDashboard from "./Vendor/Dashboard";
import AdminLogin from './Admin/Login.jsx';
import AdminDashboard from './Admin/Dashboard.jsx';
import './css/global.css';
import { Toaster } from 'react-hot-toast';

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
        <Route path="/vendor/dashboard" element= {<VendorDashboard />} />
        <Route path="/admin" element={<Index />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
