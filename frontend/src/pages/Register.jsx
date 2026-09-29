import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/",
        {
          id: Date.now(),
          name: name,
          email: email,
          password: password,
        }
      );

      alert(response.data.message || "Registration successful!");

      setName("");
      setEmail("");
      setPassword("");

      navigate("/login");
    } catch (error) {
      console.error("Registration Error:", error);

      alert(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="register-page">
      <div className="register-box">
        <h1>Create Account</h1>

        <p>Join Hometown Hub</p>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Enter Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">
            Register
          </button>
        </form>

        <p>
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
