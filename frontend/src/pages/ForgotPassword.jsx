import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // STEP 1 - Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter your registered email");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API}/users/forgot-password`,
        {
          email: email.trim(),
        }
      );

      if (response.data.success) {
        alert("OTP sent successfully to your email");
        setStep(2);
      } else {
        alert(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP Error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 - Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      alert("Please enter OTP");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API}/users/verify-reset-otp`,
        {
          email: email.trim(),
          otp: otp.trim(),
        }
      );

      if (response.data.success) {
        alert("OTP verified successfully");
        setStep(3);
      } else {
        alert(response.data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Verify OTP Error:", error);

      alert(
        error.response?.data?.message ||
          "Invalid or expired OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 - Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      alert("Please enter both passwords");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
       `${API}/users/reset-password`,
        {
          email: email.trim(),
          otp: otp.trim(),
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }
      );

      if (response.data.success) {
        alert(
          "Password reset successfully! Please login with your new password."
        );

        navigate("/login");
      } else {
        alert(
          response.data.message ||
            "Password reset failed"
        );
      }
    } catch (error) {
      console.error("Reset Password Error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "380px",
        maxWidth: "90%",
        margin: "70px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        boxShadow: "0 0 15px rgba(0,0,0,0.12)",
        textAlign: "center",
        backgroundColor: "#fff",
      }}
    >
      <h2 style={{ marginBottom: "10px" }}>
        Forgot Password
      </h2>

      {/* STEP 1 */}
      {step === 1 && (
        <>
          <p
            style={{
              color: "#666",
              fontSize: "14px",
              marginBottom: "25px",
            }}
          >
            Enter your registered email address.
            We will send you an OTP.
          </p>

          <form onSubmit={handleSendOTP}>
            <input
              type="email"
              placeholder="Enter Registered Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "90%",
                padding: "11px",
                marginBottom: "18px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        </>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <>
          <p
            style={{
              color: "#666",
              fontSize: "14px",
              marginBottom: "10px",
            }}
          >
            OTP has been sent to:
          </p>

          <p
            style={{
              fontWeight: "bold",
              marginBottom: "20px",
            }}
          >
            {email}
          </p>

          <form onSubmit={handleVerifyOTP}>
            <input
              type="text"
              placeholder="Enter 6 Digit OTP"
              value={otp}
              maxLength={6}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, ""))
              }
              style={{
                width: "90%",
                padding: "11px",
                marginBottom: "18px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "18px",
                textAlign: "center",
                letterSpacing: "5px",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setStep(1)}
            style={{
              marginTop: "15px",
              background: "none",
              border: "none",
              color: "#007bff",
              cursor: "pointer",
            }}
          >
            Change Email
          </button>
        </>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <>
          <p
            style={{
              color: "#666",
              fontSize: "14px",
              marginBottom: "20px",
            }}
          >
            Enter your new password.
          </p>

          <form onSubmit={handleResetPassword}>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              style={{
                width: "90%",
                padding: "11px",
                marginBottom: "15px",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              style={{
                width: "90%",
                padding: "11px",
                marginBottom: "18px",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px",
                backgroundColor: "#6f42c1",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              {loading
                ? "Resetting..."
                : "Reset Password"}
            </button>
          </form>
        </>
      )}

      {/* Back to Login */}
      <button
        type="button"
        onClick={() => navigate("/login")}
        style={{
          marginTop: "20px",
          background: "none",
          border: "none",
          color: "#007bff",
          cursor: "pointer",
        }}
      >
        Back to Login
      </button>
    </div>
  );
}

export default ForgotPassword;