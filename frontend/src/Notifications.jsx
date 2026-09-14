import React, { useEffect, useState } from "react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      if (!user?.name) {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/notifications/${encodeURIComponent(
          user.name
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/notifications/${id}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
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
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2>🔔 Notifications</h2>
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🔔 Notifications</h2>

      {notifications.length === 0 ? (
        <div style={styles.empty}>
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div>
          {notifications.map((notification) => (
            <div
              key={notification._id}
              style={{
                ...styles.notification,
                backgroundColor: notification.isRead ? "#ffffff" : "#eef6ff",
              }}
              onClick={() => {
                if (!notification.isRead) {
                  markAsRead(notification._id);
                }
              }}
            >
              <div style={styles.icon}>🔔</div>

              <div style={styles.content}>
                <p style={styles.message}>{notification.message}</p>

                <small style={styles.date}>
                  {new Date(notification.createdAt).toLocaleString()}
                </small>
              </div>

              {!notification.isRead && <span style={styles.dot}></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "800px",
    margin: "30px auto",
    padding: "20px",
  },

  heading: {
    marginBottom: "20px",
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
  },

  icon: {
    fontSize: "24px",
  },

  content: {
    flex: 1,
  },

  message: {
    margin: "0 0 6px 0",
    fontSize: "16px",
  },

  date: {
    color: "#777",
  },

  dot: {
    width: "10px",
    height: "10px",
    backgroundColor: "#007bff",
    borderRadius: "50%",
  },

  empty: {
    padding: "30px",
    textAlign: "center",
    border: "1px solid #ddd",
    borderRadius: "10px",
  },
};

export default Notifications;