import axios from "axios";
import { useEffect, useState } from "react";

function Communities() {
  const storedUser =
    JSON.parse(localStorage.getItem("user")) || {};

  const currentUserName =
    storedUser.name || "Unknown User";

  const [communities, setCommunities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
  });

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

  const fetchCommunities = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/communities"
      );

      if (response.data.success) {
        setCommunities(response.data.communities || []);
      }
    } catch (error) {
      console.log(
        "Fetch Communities Error:",
        error?.response?.data || error
      );
    }
  };

  const fetchNotifications = async () => {
    try {
      if (
        !currentUserName ||
        currentUserName === "Unknown User"
      ) {
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/notifications/${encodeURIComponent(
          currentUserName
        )}`
      );

      if (response.data.success) {
        setNotifications(
          response.data.notifications || []
        );
      }
    } catch (error) {
      console.log(
        "Fetch Notifications Error:",
        error?.response?.data || error
      );
    }
  };

  useEffect(() => {
    fetchCommunities();
    fetchNotifications();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const config = getAuthConfig();

      if (editingId) {
        const response = await axios.put(
          `http://localhost:5000/api/communities/${editingId}`,
          formData,
          config
        );

        if (response.data.success) {
          alert("Community Updated Successfully ✏️");

          setEditingId(null);
          setFormData({
            name: "",
            description: "",
            location: "",
          });

          await fetchCommunities();
        }
      } else {
        const response = await axios.post(
          "http://localhost:5000/api/communities",
          {
            ...formData,
            createdBy: currentUserName,
          },
          config
        );

        if (response.data.success) {
          alert("Community Created Successfully 🎉");

          setFormData({
            name: "",
            description: "",
            location: "",
          });

          await fetchCommunities();
          await fetchNotifications();
        }
      }
    } catch (error) {
      console.log(
        "Save Community Error:",
        error?.response?.data || error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to save community"
      );
    }
  };

  const handleEdit = (community) => {
    setEditingId(community._id);

    setFormData({
      name: community.name || "",
      description: community.description || "",
      location: community.location || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);

    setFormData({
      name: "",
      description: "",
      location: "",
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this community?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/communities/${id}`,
        getAuthConfig()
      );

      if (response.data.success) {
        alert("Community Deleted Successfully 🗑️");
        await fetchCommunities();
      }
    } catch (error) {
      console.log(
        "Delete Community Error:",
        error?.response?.data || error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to delete community"
      );
    }
  };

  const handleJoin = async (id) => {
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("userToken");

      if (!token) {
        alert(
          "Authentication token not found. Please login again."
        );
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/communities/${id}/join`,
        {
          userName: currentUserName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert(
          response.data.message ||
            "Joined Community Successfully 🎉"
        );

        await fetchCommunities();
        await fetchNotifications();
      } else {
        alert(
          response.data.message ||
            "Failed to join community"
        );
      }
    } catch (error) {
      console.log(
        "Join Community Error:",
        error?.response?.data || error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to join community"
      );
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/notifications/${id}/read`,
        {},
        getAuthConfig()
      );

      await fetchNotifications();
    } catch (error) {
      console.log(
        "Notification Read Error:",
        error?.response?.data || error
      );
    }
  };

  const filteredCommunities = communities.filter(
    (community) => {
      const searchText = search.toLowerCase();

      return (
        (community.name || "")
          .toLowerCase()
          .includes(searchText) ||
        (community.description || "")
          .toLowerCase()
          .includes(searchText) ||
        (community.location || "")
          .toLowerCase()
          .includes(searchText)
      );
    }
  );

  const isMember = (community) => {
    return (
      Array.isArray(community.members) &&
      community.members.includes(currentUserName)
    );
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1>👥 Community Hub</h1>

      <p>
        Discover, create and join communities around you.
      </p>

      <div
        style={{
          background: "#fff7ed",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "25px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2>
          🔔 Notifications{" "}
          {notifications.filter(
            (n) => !n.isRead
          ).length > 0 &&
            `(${notifications.filter(
              (n) => !n.isRead
            ).length})`}
        </h2>

        {notifications.length === 0 ? (
          <p>No notifications.</p>
        ) : (
          notifications.slice(0, 5).map(
            (notification) => (
              <div
                key={notification._id}
                style={{
                  padding: "10px",
                  marginBottom: "8px",
                  background: notification.isRead
                    ? "#f5f5f5"
                    : "#ffffff",
                  borderRadius: "8px",
                  border: "1px solid #eee",
                }}
              >
                <p>{notification.message}</p>

                {!notification.isRead && (
                  <button
                    onClick={() =>
                      markNotificationRead(
                        notification._id
                      )
                    }
                    style={{
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            )
          )
        )}
      </div>

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          marginBottom: "30px",
        }}
      >
        <h2>
          {editingId
            ? "✏️ Edit Community"
            : "Create New Community"}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Community Name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              boxSizing: "border-box",
            }}
          />

          <textarea
            name="description"
            placeholder="Community Description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              boxSizing: "border-box",
            }}
          />

          <input
            type="text"
            name="location"
            placeholder="Community Location"
            value={formData.location}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "12px 25px",
              borderRadius: "6px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            {editingId
              ? "✏️ Update Community"
              : "➕ Create Community"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              style={{
                background: "#6b7280",
                color: "white",
                border: "none",
                padding: "12px 25px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <input
        type="text"
        placeholder="🔍 Search communities..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          boxSizing: "border-box",
          fontSize: "16px",
          marginBottom: "25px",
        }}
      />

      <h2>👥 All Communities</h2>

      {filteredCommunities.length === 0 ? (
        <p>No communities found.</p>
      ) : (
        filteredCommunities.map((community) => (
          <div
            key={community._id}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              marginBottom: "15px",
            }}
          >
            <h3>👥 {community.name}</h3>

            <p>{community.description}</p>

            {community.location && (
              <p>
                📍 <strong>Location:</strong>{" "}
                {community.location}
              </p>
            )}

            <p>
              👤 <strong>Created by:</strong>{" "}
              {community.createdBy}
            </p>

            <p>
              👥 <strong>
                {community.members?.length || 0}
              </strong>{" "}
              members
            </p>

            <p>
              📅 <strong>Created:</strong>{" "}
              {community.createdAt
                ? new Date(
                    community.createdAt
                  ).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "N/A"}
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "15px",
              }}
            >
              <button
                onClick={() =>
                  handleJoin(community._id)
                }
                style={{
                  background: isMember(community)
                    ? "#16a34a"
                    : "#2563eb",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {isMember(community)
                  ? "✅ Joined"
                  : "👥 Join Community"}
              </button>

              <button
                onClick={() =>
                  handleEdit(community)
                }
                style={{
                  background: "#f59e0b",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                ✏️ Edit
              </button>

              <button
                onClick={() =>
                  handleDelete(community._id)
                }
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Communities;