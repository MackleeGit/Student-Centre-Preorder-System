import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom";
import Login from "./Login";
import Index from "./Index";
import Register from "./Register";
import StudentDashboard from "./Student/Dashboard";
import VendorDashboard from "./Vendor/Dashboard";
import './css/global.css';

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
