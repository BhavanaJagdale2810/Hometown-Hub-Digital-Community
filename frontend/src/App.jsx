import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminSetup from "./pages/AdminSetup";
import Events from "./pages/Events";
import Communities from "./pages/Communities";
import Notifications from "./Notifications";
import ForgotPassword from "./pages/ForgotPassword";

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
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* User Authentication */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* User Pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />

        {/* Events */}
        <Route path="/events" element={<Events />} />

        {/* Communities */}
        <Route path="/communities" element={<Communities />} />

        {/* Notifications */}
        <Route path="/notifications" element={<Notifications />} />

        {/* Admin Setup */}
        <Route path="/admin-setup" element={<AdminSetup />} />

        {/* Admin Login */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Admin Dashboard */}
        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;