import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminSetup from "./pages/AdminSetup";
import Events from "./pages/Events";
import Communities from "./pages/Communities";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";

import Home from "./pages/Home";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/register" element={<Register />} />

        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/events" element={<Events />} />

        {/* Community Route */}
        <Route
          path="/communities"
          element={<Communities />}
        />

        {/* Admin Setup Route */}
        <Route
          path="/admin-setup"
          element={<AdminSetup />}
        />
        <Route
  path="/admin-login"
  element={<AdminLogin />}
/>
<Route
  path="/admin-dashboard"
  element={<AdminDashboard />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

