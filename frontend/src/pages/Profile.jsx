import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  // ======================
  // Handle Input Change
  // ======================
  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  // ======================
  // Select Photo
  // ======================
  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedPhoto(e.target.files[0]);
    }
  };

  // ======================
  // Upload Profile Photo
  // ======================
  const handlePhotoUpload = async () => {
    try {
      if (!selectedPhoto) {
        alert("Please select a photo first");
        return;
      }

      const formData = new FormData();

      formData.append("profilePhoto", selectedPhoto);

      const response = await axios.post(
        `http://localhost:5000/api/users/${user._id}/profile-photo`,
        formData
      );

      if (response.data.success) {
        const updatedUser = response.data.user;

        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );

        setUser(updatedUser);

        setSelectedPhoto(null);

        alert("Profile Photo Uploaded Successfully");
      }
    } catch (error) {
      console.log(error);
      alert("Failed to upload profile photo");
    }
  };

  // ======================
  // Save Profile
  // ======================
  const handleSave = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${user._id}`,
        {
          name: user.name,
          mobile: user.mobile,
          address: user.address,
        }
      );

      if (response.data.success) {
        const updatedUser = response.data.user;

        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );

        setUser(updatedUser);

        alert("Profile Updated Successfully");
        setIsEditing(false);
      }
    } catch (error) {
      console.log(error);
      alert("Failed to update profile");
    }
  };

  // ======================
  // Cancel Editing
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
      profilePhoto: currentUser.profilePhoto || "",
    });

    setIsEditing(false);
  };

  // ======================
  // Logout
  // ======================
  const handleLogout = () => {
    localStorage.removeItem("user");
    alert("Logged Out Successfully");
    navigate("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "50px",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "420px",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          background: "#fff",
          textAlign: "center",
        }}
      >
        {/* Profile Photo */}
        <img
          src={
            user.profilePhoto
              ? `http://localhost:5000${user.profilePhoto}`
              : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
          }
          alt="Profile"
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: "15px",
          }}
        />

        {/* Upload Photo */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />

          <br />

          <button
            onClick={handlePhotoUpload}
            style={{
              marginTop: "10px",
              background: "#7c3aed",
              color: "white",
              border: "none",
              padding: "8px 15px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            📷 Upload Photo
          </button>
        </div>

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
              }}
            />

            <p>
              <strong>Email:</strong> {user.email}
            </p>

            <button
              onClick={handleSave}
              style={{
                background: "green",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              Save
            </button>

            <button
              onClick={handleCancel}
              style={{
                background: "gray",
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
            <h2>{user.name || "User Name"}</h2>

            <hr />

            <p>
              <strong>📧 Email:</strong> {user.email}
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

            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                marginRight: "10px",
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