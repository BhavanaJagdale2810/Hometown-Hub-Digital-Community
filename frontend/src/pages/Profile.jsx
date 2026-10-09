import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
const SERVER = API.replace("/api", "");

function Profile() {
  const navigate = useNavigate();

  const storedUser =
    JSON.parse(localStorage.getItem("user")) || {};

  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState({
    ...storedUser,
    name: storedUser.name || "",
    email: storedUser.email || "",
    mobile: storedUser.mobile || "",
    address: storedUser.address || "",
    profilePhoto: storedUser.profilePhoto || "",
  });

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // ======================
  // CHANGE PASSWORD STATE
  // ======================
  const [showChangePassword, setShowChangePassword] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  // ======================
  // AUTH CONFIG
  // ======================
  const getAuthConfig = () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("userToken");

    return token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {};
  };

  // ======================
  // HANDLE INPUT CHANGE
  // ======================
  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  // ======================
  // SELECT PHOTO
  // ======================
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5 MB.");
      return;
    }

    setSelectedPhoto(file);
  };

  // ======================
  // UPLOAD PROFILE PHOTO
  // ======================
  const handlePhotoUpload = async () => {
    try {
      if (!selectedPhoto) {
        alert("Please select a photo first.");
        return;
      }

      if (!user._id && !user.id) {
        alert(
          "User information not found. Please login again."
        );
        return;
      }

      setUploadingPhoto(true);

      const userId = user._id || user.id;

      const formData = new FormData();

      formData.append(
        "profilePhoto",
        selectedPhoto
      );

      const config = getAuthConfig();

      const response = await axios.post(
        `${API}/users/${userId}/profile-photo`,
        formData,
        config
      );

      console.log(
        "Profile Photo Upload Response:",
        response.data
      );

      if (response.data.success) {
        const updatedUser = {
          ...user,
          ...(response.data.user || {}),
        };

        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );

        setUser(updatedUser);
        setSelectedPhoto(null);

        alert(
          "Profile Photo Uploaded Successfully!"
        );
      } else {
        alert(
          response.data.message ||
            "Failed to upload profile photo."
        );
      }
    } catch (error) {
      console.log(
        "Profile Photo Upload Error:",
        error?.response?.data || error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to upload profile photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ======================
  // SAVE PROFILE
  // ======================
  const handleSave = async () => {
    try {
      if (!user._id && !user.id) {
        alert(
          "User information not found. Please login again."
        );
        return;
      }

      setSavingProfile(true);

      const userId = user._id || user.id;

      const response = await axios.put(
        `${API}/users/${userId}`,
        {
          name: user.name,
          mobile: user.mobile,
          address: user.address,
        },
        getAuthConfig()
      );

      console.log(
        "Profile Update Response:",
        response.data
      );

      if (response.data.success) {
        const updatedUser = {
          ...user,
          ...(response.data.user || {}),
        };

        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );

        setUser(updatedUser);

        alert("Profile Updated Successfully!");
        setIsEditing(false);
      } else {
        alert(
          response.data.message ||
            "Failed to update profile."
        );
      }
    } catch (error) {
      console.log(
        "Profile Update Error:",
        error?.response?.data || error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // ======================
  // CHANGE PASSWORD
  // ======================
  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordMessage("");

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordMessage(
        "Please fill all password fields."
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage(
        "New password and confirm password do not match."
      );
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await axios.put(
        `${API}/users/change-password`,
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        getAuthConfig()
      );

      if (response.data.success) {
        setPasswordMessage(
          "Password changed successfully!"
        );

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          setShowChangePassword(false);
          setPasswordMessage("");
        }, 1500);
      } else {
        setPasswordMessage(
          response.data.message ||
            "Failed to change password."
        );
      }
    } catch (error) {
      console.log(
        "Change Password Error:",
        error?.response?.data || error
      );

      setPasswordMessage(
        error?.response?.data?.message ||
          "Failed to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // ======================
  // CANCEL EDITING
  // ======================
  const handleCancel = () => {
    const currentUser =
      JSON.parse(localStorage.getItem("user")) || {};

    setUser({
      ...currentUser,
      name: currentUser.name || "",
      email: currentUser.email || "",
      mobile: currentUser.mobile || "",
      address: currentUser.address || "",
      profilePhoto:
        currentUser.profilePhoto || "",
    });

    setIsEditing(false);
  };

  // ======================
  // LOGOUT
  // ======================
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userToken");

    alert("Logged Out Successfully");

    navigate("/login");
  };

  // ======================
  // PROFILE PHOTO URL
  // ======================
  const getProfilePhotoUrl = () => {
    if (!user.profilePhoto) {
      return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    }

    if (
      user.profilePhoto.startsWith("http://") ||
      user.profilePhoto.startsWith("https://")
    ) {
      return user.profilePhoto;
    }

    return `${SERVER}${user.profilePhoto}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        display: "flex",
        justifyContent: "center",
        padding: "50px 20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "420px",
          maxWidth: "100%",
          padding: "30px",
          borderRadius: "15px",
          boxShadow:
            "0 4px 20px rgba(0,0,0,0.15)",
          background: "#fff",
          textAlign: "center",
          boxSizing: "border-box",
        }}
      >
        {/* PROFILE PHOTO */}
        <img
          src={getProfilePhotoUrl()}
          alt="Profile"
          onError={(e) => {
            e.currentTarget.src =
              "https://cdn-icons-png.flaticon.com/512/149/149071.png";
          }}
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: "15px",
            border: "3px solid #e5e7eb",
          }}
        />

        {/* UPLOAD PHOTO */}
        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handlePhotoChange}
          />

          {selectedPhoto && (
            <p
              style={{
                fontSize: "13px",
                color: "#555",
                marginTop: "8px",
              }}
            >
              Selected: {selectedPhoto.name}
            </p>
          )}

          <br />

          <button
            onClick={handlePhotoUpload}
            disabled={uploadingPhoto}
            style={{
              marginTop: "10px",
              background: "#7c3aed",
              color: "white",
              border: "none",
              padding: "9px 16px",
              borderRadius: "6px",
              cursor: uploadingPhoto
                ? "not-allowed"
                : "pointer",
              opacity: uploadingPhoto ? 0.7 : 1,
            }}
          >
            {uploadingPhoto
              ? "Uploading..."
              : "📷 Upload Photo"}
          </button>
        </div>

        {/* EDIT MODE */}
        {isEditing ? (
          <>
            <h2>Edit Profile</h2>

            <input
              type="text"
              name="name"
              value={user.name}
              onChange={handleChange}
              placeholder="Name"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                boxSizing: "border-box",
                border:
                  "1px solid #d1d5db",
                borderRadius: "6px",
              }}
            />

            <input
              type="text"
              name="mobile"
              value={user.mobile}
              onChange={handleChange}
              placeholder="Mobile Number"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                boxSizing: "border-box",
                border:
                  "1px solid #d1d5db",
                borderRadius: "6px",
              }}
            />

            <textarea
              name="address"
              value={user.address}
              onChange={handleChange}
              placeholder="Address"
              rows="4"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                boxSizing: "border-box",
                border:
                  "1px solid #d1d5db",
                borderRadius: "6px",
                resize: "vertical",
              }}
            />

            <p>
              <strong>📧 Email:</strong>{" "}
              {user.email}
            </p>

            <button
              onClick={handleSave}
              disabled={savingProfile}
              style={{
                background: "#16a34a",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: savingProfile
                  ? "not-allowed"
                  : "pointer",
                marginRight: "10px",
                opacity: savingProfile
                  ? 0.7
                  : 1,
              }}
            >
              {savingProfile
                ? "Saving..."
                : "Save"}
            </button>

            <button
              onClick={handleCancel}
              style={{
                background: "#6b7280",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <h2>
              {user.name || "User Name"}
            </h2>

            <hr />

            <p>
              <strong>📧 Email:</strong>{" "}
              {user.email}
            </p>

            <p>
              <strong>📱 Mobile:</strong>{" "}
              {user.mobile || "Not Added"}
            </p>

            <p>
              <strong>📍 Address:</strong>{" "}
              {user.address || "Not Added"}
            </p>

            <br />

            {/* CHANGE PASSWORD */}
            {!showChangePassword ? (
              <button
                onClick={() => {
                  setShowChangePassword(true);
                  setPasswordMessage("");
                }}
                style={{
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginRight: "10px",
                  marginBottom: "10px",
                }}
              >
                🔐 Change Password
              </button>
            ) : (
              <form
                onSubmit={handleChangePassword}
                style={{
                  marginTop: "15px",
                  marginBottom: "20px",
                  padding: "20px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  background: "#f9fafb",
                  textAlign: "left",
                }}
              >
                <h3
                  style={{
                    textAlign: "center",
                    marginTop: "0",
                  }}
                >
                  🔐 Change Password
                </h3>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(
                      e.target.value
                    )
                  }
                  placeholder="Current Password"
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "10px",
                    boxSizing: "border-box",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "6px",
                  }}
                />

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  placeholder="New Password (minimum 6 characters)"
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "10px",
                    boxSizing: "border-box",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "6px",
                  }}
                />

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm New Password"
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "10px",
                    boxSizing: "border-box",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "6px",
                  }}
                />

                {passwordMessage && (
                  <p
                    style={{
                      fontSize: "14px",
                      textAlign: "center",
                      color:
                        passwordMessage.includes(
                          "successfully"
                        )
                          ? "#16a34a"
                          : "#dc2626",
                      fontWeight: "600",
                    }}
                  >
                    {passwordMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={{
                    width: "100%",
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "6px",
                    cursor: passwordLoading
                      ? "not-allowed"
                      : "pointer",
                    marginBottom: "8px",
                    opacity: passwordLoading
                      ? 0.7
                      : 1,
                  }}
                >
                  {passwordLoading
                    ? "Changing..."
                    : "Change Password"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordMessage("");
                  }}
                  style={{
                    width: "100%",
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    padding: "10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </form>
            )}

            <button
              onClick={() =>
                setIsEditing(true)
              }
              style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                marginRight: "10px",
                marginBottom: "10px",
              }}
            >
              ✏️ Edit Profile
            </button>

            <button
              onClick={handleLogout}
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                marginBottom: "10px",
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;