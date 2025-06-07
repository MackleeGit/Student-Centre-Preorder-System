import { BrowserRouter as Router, Routes, Route, BrowserRouter } from "react-router-dom";
import Login from "./Login"; 
import Index from "./Index";
import Register from "./Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/student" element={<div>Student Dashboard</div>} />
        <Route path="/dashboard/vendor" element={<div>Vendor Dashboard</div>} />
        <Route path="/admin" element={<Index />} />
        <Route path="/register" element={<Register/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
