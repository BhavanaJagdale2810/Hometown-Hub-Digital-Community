import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter Email and Password");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/login",
        {
          email: email.trim(),
          password: password,
        }
      );

      console.log("Login Response:", response.data);

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );

        alert("Login Successful");
        navigate("/dashboard");
      } else {
        alert(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login Error:", error);
      console.error("Response:", error.response);

      alert(
        error.response?.data?.message ||
          "Server Error"
      );
    }
  };

  return (
    <div
      style={{
        width: "350px",
        margin: "80px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        textAlign: "center",
      }}
    >
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Enter Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "90%",
          padding: "10px",
          marginBottom: "15px",
        }}
      />

      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "90%",
          padding: "10px",
          marginBottom: "10px",
        }}
      />

      <div
        style={{
          textAlign: "right",
          marginBottom: "20px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          style={{
            background: "none",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Forgot Password?
        </button>
      </div>

      <button
        onClick={handleLogin}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Login
      </button>
    </div>
  );
}

export default Login;