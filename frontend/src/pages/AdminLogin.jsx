import { useState } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import API from "../api";

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "admin@hometownhub.com",
    password: "admin123",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await axios.post(
        `${API}/admin/login`,
        formData
      );

      if (response.data.success) {
        // Save admin details
        localStorage.setItem(
          "admin",
          JSON.stringify(response.data.admin)
        );

        // IMPORTANT: Save JWT token
        localStorage.setItem(
          "adminToken",
          response.data.token
        );

        setMessage("Admin Login Successful ✅");

        setTimeout(() => {
          navigate("/admin-dashboard");
        }, 500);
      } else {
        setMessage(
          response.data.message || "Admin login failed"
        );
      }
    } catch (error) {
      console.log("Admin Login Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to connect to server"
      );
    }
  };

  return (
    <div
      style={{
        maxWidth: "450px",
        margin: "60px auto",
        padding: "30px",
        background: "white",
        borderRadius: "15px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
      }}
    >
      <h1 style={{ textAlign: "center" }}>
        👑 Admin Login
      </h1>

      <p
        style={{
          textAlign: "center",
          color: "#666",
        }}
      >
        Login to Hometown Hub Admin Panel
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Admin Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            boxSizing: "border-box",
          }}
        />

        <input
          type="password"
          name="password"
          placeholder="Admin Password"
          value={formData.password}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "13px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          👑 Login as Admin
        </button>
      </form>

      {message && (
        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default AdminLogin;