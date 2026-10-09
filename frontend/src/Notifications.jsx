import React, { useEffect, useState } from "react";

import API from "./api";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login again.");
        return;
      }

      const response = await fetch(`${API}/notifications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch notifications");
      }

      if (data.success) {
        setNotifications(
          Array.isArray(data.notifications)
            ? data.notifications
            : []
        );
      } else {
        setError(data.message || "Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Notification Error:", err);
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API}/notifications/${id}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === id
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.heading}>🔔 Notifications</h2>
          <p style={styles.centerText}>
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.heading}>
              🔔 Notifications
            </h2>

            <p style={styles.subHeading}>
              Stay updated with your Hometown Hub activities.
            </p>
          </div>

          <button
            style={styles.refreshButton}
            onClick={fetchNotifications}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {/* No Notifications */}
        {notifications.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>🔔</div>

            <h3 style={styles.emptyTitle}>
              No notifications yet
            </h3>

            <p style={styles.emptyText}>
              Notifications for events, communities and
              other activities will appear here.
            </p>
          </div>
        ) : (

          /* Notification List */
          <div>
            {notifications.map((notification) => (
              <div
                key={notification._id}
                style={{
                  ...styles.notification,
                  backgroundColor: notification.isRead
                    ? "#ffffff"
                    : "#eef6ff",
                }}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification._id);
                  }
                }}
              >
                <div style={styles.icon}>
                  🔔
                </div>

                <div style={styles.content}>
                  <p style={styles.message}>
                    {notification.message}
                  </p>

                  <small style={styles.date}>
                    {formatDate(notification.createdAt)}
                  </small>
                </div>

                {!notification.isRead && (
                  <span style={styles.dot}></span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "900px",
    margin: "30px auto",
    padding: "20px",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "25px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px",
  },

  heading: {
    margin: 0,
    fontSize: "26px",
  },

  subHeading: {
    margin: "6px 0 0",
    color: "#777",
    fontSize: "14px",
  },

  refreshButton: {
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
    backgroundColor: "#f1f3f5",
    fontSize: "14px",
  },

  centerText: {
    textAlign: "center",
    color: "#777",
    padding: "30px",
  },

  error: {
    backgroundColor: "#fff3f3",
    border: "1px solid #ffcaca",
    color: "#c62828",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px",
  },

  notification: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "16px",
    marginBottom: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    cursor: "pointer",
    position: "relative",
    transition: "0.2s",
  },

  icon: {
    fontSize: "25px",
    minWidth: "30px",
  },

  content: {
    flex: 1,
  },

  message: {
    margin: "0 0 6px 0",
    fontSize: "16px",
    fontWeight: "500",
  },

  date: {
    color: "#777",
    fontSize: "13px",
  },

  dot: {
    width: "10px",
    height: "10px",
    backgroundColor: "#007bff",
    borderRadius: "50%",
    flexShrink: 0,
  },

  empty: {
    padding: "50px 25px",
    textAlign: "center",
    border: "1px dashed #ccc",
    borderRadius: "12px",
    backgroundColor: "#fafafa",
  },

  emptyIcon: {
    fontSize: "45px",
    marginBottom: "10px",
  },

  emptyTitle: {
    margin: "5px 0",
    fontSize: "20px",
  },

  emptyText: {
    color: "#777",
    margin: "8px auto 0",
    maxWidth: "500px",
    lineHeight: "1.5",
  },
};

export default Notifications;