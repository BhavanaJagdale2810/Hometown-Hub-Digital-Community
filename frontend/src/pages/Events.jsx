import axios from "axios";
import { useEffect, useState } from "react";

function Events() {
  // ==============================
  // API URL
  // ==============================
  const API_URL = "http://localhost:5000/api";

  // ==============================
  // Get Logged-in User
  // ==============================
  const storedUser =
    JSON.parse(localStorage.getItem("user")) || {};

  const currentUserName = storedUser.name || "Unknown User";

  // ==============================
  // Get JWT Token
  // ==============================
  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("authToken")
    );
  };

  // ==============================
  // Axios Config
  // ==============================
  const getAuthConfig = () => {
    const token = getToken();

    return {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // ==============================
  // States
  // ==============================
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [search, setSearch] = useState("");
  const [showPastEvents, setShowPastEvents] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });

  // ==============================
  // Get All Events
  // ==============================
  const fetchEvents = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/events`
      );

      if (response.data.success) {
        setEvents(response.data.events || []);
      }
    } catch (error) {
      console.log("Fetch Events Error:", error);
    }
  };

  // ==============================
  // Get Notifications
  // ==============================
  const fetchNotifications = async () => {
    try {
      if (
        !currentUserName ||
        currentUserName === "Unknown User"
      ) {
        return;
      }

      const response = await axios.get(
        `${API_URL}/notifications/${encodeURIComponent(
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
        error
      );
    }
  };

  // ==============================
  // Load Data
  // ==============================
  useEffect(() => {
    fetchEvents();
    fetchNotifications();
  }, []);

  // ==============================
  // Handle Input Change
  // ==============================
  const handleChange = (e) => {
    setFormData((previousData) => ({
      ...previousData,
      [e.target.name]: e.target.value,
    }));
  };

  // ==============================
  // Create / Update Event
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = getToken();

    // Token check
    if (!token) {
      alert(
        "Your login session is missing. Please logout and login again."
      );
      return;
    }

    // Basic validation
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.date ||
      !formData.location.trim()
    ) {
      alert("Please fill all event details.");
      return;
    }

    try {
      setLoading(true);

      const config = getAuthConfig();

      // ==============================
      // UPDATE EVENT
      // ==============================
      if (editingId) {
        const response = await axios.put(
          `${API_URL}/events/${editingId}`,
          {
            title: formData.title.trim(),
            description: formData.description.trim(),
            date: formData.date,
            location: formData.location.trim(),
          },
          config
        );

        if (response.data.success) {
          alert("Event Updated Successfully ✏️");

          setEditingId(null);

          setFormData({
            title: "",
            description: "",
            date: "",
            location: "",
          });

          await fetchEvents();
          await fetchNotifications();
        }
      }

      // ==============================
      // CREATE EVENT
      // ==============================
      else {
        const response = await axios.post(
          `${API_URL}/events`,
          {
            title: formData.title.trim(),
            description: formData.description.trim(),
            date: formData.date,
            location: formData.location.trim(),
          },
          config
        );

        if (response.data.success) {
          alert("Event Created Successfully 🎉");

          setFormData({
            title: "",
            description: "",
            date: "",
            location: "",
          });

          await fetchEvents();
          await fetchNotifications();
        }
      }
    } catch (error) {
      console.log("Save Event Error:", error);

      console.log(
        "Backend Error:",
        error.response?.data
      );

      if (error.response?.status === 401) {
        alert(
          "Session expired. Please logout and login again."
        );
      } else {
        alert(
          error.response?.data?.message ||
            "Failed to save event"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Edit Event
  // ==============================
  const handleEdit = (event) => {
    setEditingId(event._id);

    setFormData({
      title: event.title || "",
      description: event.description || "",
      date: event.date
        ? new Date(event.date)
            .toISOString()
            .slice(0, 16)
        : "",
      location: event.location || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==============================
  // Cancel Edit
  // ==============================
  const cancelEdit = () => {
    setEditingId(null);

    setFormData({
      title: "",
      description: "",
      date: "",
      location: "",
    });
  };

  // ==============================
  // Delete Event
  // ==============================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (!confirmDelete) {
      return;
    }

    const token = getToken();

    if (!token) {
      alert(
        "Your login session is missing. Please login again."
      );
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/events/${id}`,
        getAuthConfig()
      );

      if (response.data.success) {
        alert("Event Deleted Successfully 🗑️");

        await fetchEvents();
        await fetchNotifications();
      }
    } catch (error) {
      console.log(
        "Delete Event Error:",
        error
      );

      if (error.response?.status === 401) {
        alert(
          "Session expired. Please login again."
        );
      } else {
        alert(
          error.response?.data?.message ||
            "Failed to delete event"
        );
      }
    }
  };

  // ==============================
  // Join / Leave Event
  // ==============================
  const handleJoinEvent = async (id) => {
    const token = getToken();

    if (!token) {
      alert(
        "Your login session is missing. Please login again."
      );
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/events/${id}/join`,
        {},
        getAuthConfig()
      );

      if (response.data.success) {
        alert(
          response.data.message ||
            "Event status updated successfully."
        );

        await fetchEvents();
        await fetchNotifications();
      }
    } catch (error) {
      console.log(
        "Join Event Error:",
        error
      );

      if (error.response?.status === 401) {
        alert(
          "Session expired. Please login again."
        );
      } else {
        alert(
          error.response?.data?.message ||
            "Failed to join event"
        );
      }
    }
  };

  // ==============================
  // Mark Notification Read
  // ==============================
  const markNotificationRead = async (id) => {
    try {
      const token = getToken();

      if (!token) {
        alert(
          "Please login again."
        );
        return;
      }

      await axios.put(
        `${API_URL}/notifications/${id}/read`,
        {},
        getAuthConfig()
      );

      await fetchNotifications();
    } catch (error) {
      console.log(
        "Notification Read Error:",
        error
      );
    }
  };

  // ==============================
  // Search Events
  // ==============================
  const filteredEvents = events.filter(
    (event) => {
      const searchText =
        search.toLowerCase();

      return (
        (event.title || "")
          .toLowerCase()
          .includes(searchText) ||
        (event.location || "")
          .toLowerCase()
          .includes(searchText) ||
        (event.description || "")
          .toLowerCase()
          .includes(searchText)
      );
    }
  );

  // ==============================
  // Date-wise Events
  // ==============================
  const today = new Date();

  const upcomingEvents =
    filteredEvents.filter(
      (event) =>
        new Date(event.date) >= today
    );

  const pastEvents =
    filteredEvents.filter(
      (event) =>
        new Date(event.date) < today
    );

  const displayedEvents = showPastEvents
    ? pastEvents
    : upcomingEvents;

  // ==============================
  // Check Joined
  // ==============================
  const isJoined = (event) => {
    return (
      Array.isArray(event.joinedUsers) &&
      event.joinedUsers.includes(
        currentUserName
      )
    );
  };

  // ==============================
  // UI
  // ==============================
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      {/* =========================
          PAGE TITLE
      ========================= */}
      <h1>📅 Community Events</h1>

      {/* =========================
          NOTIFICATIONS
      ========================= */}
      <div
        style={{
          background: "#fff7ed",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "25px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2>
          🔔 Notifications{" "}
          {notifications.filter(
            (n) => !n.isRead
          ).length > 0 &&
            `(${
              notifications.filter(
                (n) => !n.isRead
              ).length
            })`}
        </h2>

        {notifications.length === 0 ? (
          <p>No notifications.</p>
        ) : (
          notifications
            .slice(0, 5)
            .map((notification) => (
              <div
                key={notification._id}
                style={{
                  padding: "10px",
                  marginBottom: "8px",
                  background:
                    notification.isRead
                      ? "#f5f5f5"
                      : "#ffffff",
                  borderRadius: "8px",
                  border:
                    "1px solid #eee",
                }}
              >
                <p
                  style={{
                    margin:
                      "0 0 6px 0",
                  }}
                >
                  {notification.message}
                </p>

                {!notification.isRead && (
                  <button
                    onClick={() =>
                      markNotificationRead(
                        notification._id
                      )
                    }
                    style={{
                      border: "none",
                      background:
                        "#2563eb",
                      color: "white",
                      padding:
                        "6px 10px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))
        )}
      </div>

      {/* =========================
          CREATE / EDIT EVENT
      ========================= */}
      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          boxShadow:
            "0 4px 15px rgba(0,0,0,0.1)",
          marginBottom: "30px",
        }}
      >
        <h2>
          {editingId
            ? "✏️ Edit Event"
            : "➕ Create New Event"}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* TITLE */}
          <input
            type="text"
            name="title"
            placeholder="Event Title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              boxSizing: "border-box",
            }}
          />

          {/* DESCRIPTION */}
          <textarea
            name="description"
            placeholder="Event Description"
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

          {/* DATE */}
          <input
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              boxSizing: "border-box",
            }}
          />

          {/* LOCATION */}
          <input
            type="text"
            name="location"
            placeholder="Event Location"
            value={formData.location}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              boxSizing: "border-box",
            }}
          />

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading
                ? "#9ca3af"
                : "#2563eb",
              color: "white",
              border: "none",
              padding: "12px 25px",
              borderRadius: "6px",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              marginRight: "10px",
            }}
          >
            {loading
              ? "Saving..."
              : editingId
              ? "✏️ Update Event"
              : "➕ Create Event"}
          </button>

          {/* CANCEL */}
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

      {/* =========================
          SEARCH
      ========================= */}
      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <input
          type="text"
          placeholder="🔍 Search events by title, location..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
            fontSize: "16px",
          }}
        />
      </div>

      {/* =========================
          EVENT TYPE BUTTONS
      ========================= */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() =>
            setShowPastEvents(false)
          }
          style={{
            background:
              !showPastEvents
                ? "#2563eb"
                : "#e5e7eb",
            color:
              !showPastEvents
                ? "white"
                : "black",
            border: "none",
            padding: "10px 18px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          📅 Upcoming Events
        </button>

        <button
          onClick={() =>
            setShowPastEvents(true)
          }
          style={{
            background:
              showPastEvents
                ? "#2563eb"
                : "#e5e7eb",
            color:
              showPastEvents
                ? "white"
                : "black",
            border: "none",
            padding: "10px 18px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🕘 Past Events
        </button>
      </div>

      {/* =========================
          EVENTS LIST
      ========================= */}
      <h2>
        {showPastEvents
          ? "🕘 Past Events"
          : "📅 Upcoming Events"}
      </h2>

      {displayedEvents.length === 0 ? (
        <p>No events available.</p>
      ) : (
        displayedEvents.map((event) => (
          <div
            key={event._id}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.1)",
              marginBottom: "15px",
            }}
          >
            {/* EVENT TITLE */}
            <h3>
              🎉 {event.title}
            </h3>

            {/* DESCRIPTION */}
            <p>
              {event.description}
            </p>

            {/* DATE */}
            <p>
              <strong>
                📅 Date:
              </strong>{" "}
              {new Date(
                event.date
              ).toLocaleString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </p>

            {/* LOCATION */}
            <p>
              <strong>
                📍 Location:
              </strong>{" "}
              {event.location}
            </p>

            {/* CREATED BY */}
            <p>
              <strong>
                👤 Created by:
              </strong>{" "}
              {event.userName}
            </p>

            {/* JOINED COUNT */}
            <p>
              👥{" "}
              <strong>
                {event.joinedUsers?.length ||
                  0}
              </strong>{" "}
              people joined
            </p>

            {/* =====================
                ACTION BUTTONS
            ===================== */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "15px",
              }}
            >
              {/* JOIN / LEAVE */}
              <button
                onClick={() =>
                  handleJoinEvent(
                    event._id
                  )
                }
                style={{
                  background: isJoined(
                    event
                  )
                    ? "#16a34a"
                    : "#2563eb",
                  color: "white",
                  border: "none",
                  padding:
                    "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {isJoined(event)
                  ? "✅ Joined"
                  : "👥 Join Event"}
              </button>

              {/* EDIT */}
              <button
                onClick={() =>
                  handleEdit(event)
                }
                style={{
                  background: "#f59e0b",
                  color: "white",
                  border: "none",
                  padding:
                    "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                ✏️ Edit
              </button>

              {/* DELETE */}
              <button
                onClick={() =>
                  handleDelete(
                    event._id
                  )
                }
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  padding:
                    "10px 16px",
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

export default Events;