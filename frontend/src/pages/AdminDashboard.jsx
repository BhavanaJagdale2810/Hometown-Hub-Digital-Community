import AdminNavbar from "../AdminNavbar";
import API from "../api";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCommunities: 0,
    totalEvents: 0,
    totalPosts: 0,
  });

  const [users, setUsers] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // ======================
  // Admin Authentication Config
  // ======================
  const getAdminConfig = () => {
    const adminToken = localStorage.getItem("adminToken");

    if (!adminToken) {
      return null;
    }

    return {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    };
  };

  // ======================
  // Check Admin Login
  // ======================
  useEffect(() => {
    const admin = localStorage.getItem("admin");
    const adminToken = localStorage.getItem("adminToken");

    if (!admin || !adminToken) {
      localStorage.removeItem("admin");
      localStorage.removeItem("adminToken");
      navigate("/admin-login");
      return;
    }

    fetchAllData();
  }, []);

  // ======================
  // Fetch All Data
  // ======================
  const fetchAllData = async () => {
    try {
      const config = getAdminConfig();

      if (!config) {
        localStorage.removeItem("admin");
        localStorage.removeItem("adminToken");
        navigate("/admin-login");
        return;
      }

      const [
        statsResponse,
        usersResponse,
        communitiesResponse,
        eventsResponse,
        postsResponse,
      ] = await Promise.all([
        axios.get(
          `${API}/admin/stats`,
          config
        ),
        axios.get(
          `${API}/admin/users`,
          config
        ),
        axios.get(
         `${API}/admin/communities`,
          config
        ),
        axios.get(
         `${API}/admin/events`,
          config
        ),
        axios.get(
          `${API}/admin/posts`,
          config
        ),
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      if (usersResponse.data.success) {
        setUsers(usersResponse.data.users);
      }

      if (communitiesResponse.data.success) {
        setCommunities(
          communitiesResponse.data.communities
        );
      }

      if (eventsResponse.data.success) {
        setEvents(eventsResponse.data.events);
      }

      if (postsResponse.data.success) {
        setPosts(postsResponse.data.posts);
      }
    } catch (error) {
      console.log("Admin Data Error:", error);

      // If token is invalid/expired
      if (error.response?.status === 401) {
        localStorage.removeItem("admin");
        localStorage.removeItem("adminToken");

        alert(
          "Admin session expired. Please login again."
        );

        navigate("/admin-login");
      }
    }
  };

  // ======================
  // Recent Activity
  // ======================
  const recentActivities = [
    ...users.map((user) => ({
      type: "user",
      message: `👤 ${user.name} joined Hometown Hub`,
      date: user.createdAt,
    })),

    ...communities.map((community) => ({
      type: "community",
      message: `👥 Community "${community.name}" was created`,
      date: community.createdAt,
    })),

    ...events.map((event) => ({
      type: "event",
      message: `📅 Event "${event.title}" was created`,
      date: event.createdAt,
    })),

    ...posts.map((post) => ({
      type: "post",
      message: `📝 ${post.userName} created a post`,
      date: post.createdAt,
    })),
  ]
    .filter((activity) => activity.date)
    .sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    )
    .slice(0, 8);

  // ======================
  // View User Details
  // ======================
  const viewUser = async (id) => {
    try {
      const config = getAdminConfig();

      if (!config) {
        navigate("/admin-login");
        return;
      }

      const response = await axios.get(
       `${API}/admin/users/${id}`,
        config
      );

      if (response.data.success) {
        setSelectedUser(response.data.user);
      }
    } catch (error) {
      console.log("View User Error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("admin");
        localStorage.removeItem("adminToken");
        navigate("/admin-login");
        return;
      }

      alert("Failed to load user details");
    }
  };

  // ======================
  // Block / Unblock User
  // ======================
  const toggleBlockUser = async (id) => {
    try {
      const config = getAdminConfig();

      if (!config) {
        navigate("/admin-login");
        return;
      }

      const response = await axios.put(
        `${API}/admin/users/${id}/block`,
        {},
        config
      );

      if (response.data.success) {
        alert(response.data.message);
        fetchAllData();
      }
    } catch (error) {
      console.log("Block User Error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("admin");
        localStorage.removeItem("adminToken");
        navigate("/admin-login");
        return;
      }

      alert("Failed to update user status");
    }
  };

  // ======================
  // Delete User
  // ======================
  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) {
      return;
    }

    try {
      const config = getAdminConfig();

      if (!config) {
        navigate("/admin-login");
        return;
      }

      const response = await axios.delete(
        `${API}/admin/users/${id}`,
        config
      );

      if (response.data.success) {
        alert(response.data.message);
        setSelectedUser(null);
        fetchAllData();
      }
    } catch (error) {
      console.log("Delete User Error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("admin");
        localStorage.removeItem("adminToken");
        navigate("/admin-login");
        return;
      }

      alert("Failed to delete user");
    }
  };

  // ======================
  // Delete Community
  // ======================
  const deleteCommunity = async (id) => {
    if (!window.confirm("Delete this community?")) {
      return;
    }

    try {
      const config = getAdminConfig();

      if (!config) {
        navigate("/admin-login");
        return;
      }

      const response = await axios.delete(
       `${API}/admin/communities/${id}`,
        config
      );

      if (response.data.success) {
        alert(response.data.message);
        fetchAllData();
      }
    } catch (error) {
      console.log("Delete Community Error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("admin");
        localStorage.removeItem("adminToken");
        navigate("/admin-login");
        return;
      }

      alert("Failed to delete community");
    }
  };

  // ======================
  // Delete Event
  // ======================
  const deleteEvent = async (id) => {
    if (!window.confirm("Delete this event?")) {
      return;
    }

    try {
      const config = getAdminConfig();

      if (!config) {
        navigate("/admin-login");
        return;
      }

      const response = await axios.delete(
        `${API}/admin/events/${id}`,
        config
      );

      if (response.data.success) {
        alert(response.data.message);
        fetchAllData();
      }
    } catch (error) {
      console.log("Delete Event Error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("admin");
        localStorage.removeItem("adminToken");
        navigate("/admin-login");
        return;
      }

      alert("Failed to delete event");
    }
  };

  // ======================
  // Delete Post
  // ======================
  const deletePost = async (id) => {
    if (!window.confirm("Delete this post?")) {
      return;
    }

    try {
      const config = getAdminConfig();

      if (!config) {
        navigate("/admin-login");
        return;
      }

      const response = await axios.delete(
       `${API}/admin/posts/${id}`,
        config
      );

      if (response.data.success) {
        alert(response.data.message);
        fetchAllData();
      }
    } catch (error) {
      console.log("Delete Post Error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("admin");
        localStorage.removeItem("adminToken");
        navigate("/admin-login");
        return;
      }

      alert("Failed to delete post");
    }
  };

  // ======================
  // Search
  // ======================
  const searchText = search.toLowerCase();

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchText) ||
      user.email?.toLowerCase().includes(searchText)
  );

  const filteredCommunities = communities.filter(
    (community) =>
      community.name
        ?.toLowerCase()
        .includes(searchText) ||
      community.location
        ?.toLowerCase()
        .includes(searchText)
  );

  const filteredEvents = events.filter(
    (event) =>
      event.title
        ?.toLowerCase()
        .includes(searchText) ||
      event.location
        ?.toLowerCase()
        .includes(searchText)
  );

  const filteredPosts = posts.filter(
    (post) =>
      post.content
        ?.toLowerCase()
        .includes(searchText) ||
      post.userName
        ?.toLowerCase()
        .includes(searchText)
  );

  return (
    <>
      {/* ======================
          Admin Navbar
      ====================== */}
      <AdminNavbar />

      <div
        style={{
          maxWidth: "1200px",
          margin: "30px auto",
          padding: "20px",
        }}
      >
        {/* ======================
            Header
        ====================== */}
        <div
          style={{
            marginBottom: "25px",
          }}
        >
          <h1>👑 Admin Dashboard</h1>

          <p>
            Manage your Hometown Hub platform
          </p>
        </div>

        {/* ======================
            Statistics
        ====================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow:
                "0 3px 12px rgba(0,0,0,0.1)",
            }}
          >
            <h2>👤 {stats.totalUsers}</h2>
            <p>Total Users</p>
          </div>

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow:
                "0 3px 12px rgba(0,0,0,0.1)",
            }}
          >
            <h2>
              👥 {stats.totalCommunities}
            </h2>
            <p>Total Communities</p>
          </div>

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow:
                "0 3px 12px rgba(0,0,0,0.1)",
            }}
          >
            <h2>📅 {stats.totalEvents}</h2>
            <p>Total Events</p>
          </div>

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow:
                "0 3px 12px rgba(0,0,0,0.1)",
            }}
          >
            <h2>📝 {stats.totalPosts}</h2>
            <p>Total Posts</p>
          </div>
        </div>

        {/* ======================
            Analytics
        ====================== */}
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow:
              "0 3px 12px rgba(0,0,0,0.1)",
            marginBottom: "30px",
          }}
        >
          <h2>📊 Platform Analytics</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            {/* Users */}
            <div>
              <strong>👤 Users</strong>

              <div
                style={{
                  background: "#e5e7eb",
                  height: "14px",
                  borderRadius: "20px",
                  marginTop: "8px",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(
                      stats.totalUsers * 10,
                      100
                    )}%`,
                    height: "100%",
                    background: "#2563eb",
                    borderRadius: "20px",
                  }}
                />
              </div>

              <small>
                {stats.totalUsers} total users
              </small>
            </div>

            {/* Communities */}
            <div>
              <strong>👥 Communities</strong>

              <div
                style={{
                  background: "#e5e7eb",
                  height: "14px",
                  borderRadius: "20px",
                  marginTop: "8px",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(
                      stats.totalCommunities * 20,
                      100
                    )}%`,
                    height: "100%",
                    background: "#16a34a",
                    borderRadius: "20px",
                  }}
                />
              </div>

              <small>
                {stats.totalCommunities} total
                communities
              </small>
            </div>

            {/* Events */}
            <div>
              <strong>📅 Events</strong>

              <div
                style={{
                  background: "#e5e7eb",
                  height: "14px",
                  borderRadius: "20px",
                  marginTop: "8px",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(
                      stats.totalEvents * 20,
                      100
                    )}%`,
                    height: "100%",
                    background: "#f59e0b",
                    borderRadius: "20px",
                  }}
                />
              </div>

              <small>
                {stats.totalEvents} total events
              </small>
            </div>

            {/* Posts */}
            <div>
              <strong>📝 Posts</strong>

              <div
                style={{
                  background: "#e5e7eb",
                  height: "14px",
                  borderRadius: "20px",
                  marginTop: "8px",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(
                      stats.totalPosts * 4,
                      100
                    )}%`,
                    height: "100%",
                    background: "#9333ea",
                    borderRadius: "20px",
                  }}
                />
              </div>

              <small>
                {stats.totalPosts} total posts
              </small>
            </div>
          </div>
        </div>

        {/* ======================
            Search
        ====================== */}
        <input
          type="text"
          placeholder="🔍 Search users, communities, events, posts..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            width: "100%",
            padding: "13px",
            marginBottom: "30px",
            boxSizing: "border-box",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />

        {/* ======================
            Recent Activity
        ====================== */}
        <section
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "15px",
            boxShadow:
              "0 3px 12px rgba(0,0,0,0.1)",
            marginBottom: "35px",
          }}
        >
          <h2>🕒 Recent Activity</h2>

          {recentActivities.length === 0 ? (
            <p>
              No recent activity available.
            </p>
          ) : (
            recentActivities.map(
              (activity, index) => (
                <div
                  key={index}
                  style={{
                    padding: "12px",
                    borderBottom:
                      index !==
                      recentActivities.length - 1
                        ? "1px solid #eee"
                        : "none",
                  }}
                >
                  <strong>
                    {activity.message}
                  </strong>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#777",
                      marginTop: "4px",
                    }}
                  >
                    {new Date(
                      activity.date
                    ).toLocaleString("en-IN")}
                  </div>
                </div>
              )
            )
          )}
        </section>

        {/* ======================
            User Details
        ====================== */}
        {selectedUser && (
          <div
            style={{
              background: "#eff6ff",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "30px",
              border: "1px solid #bfdbfe",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >
              <h2>👤 User Details</h2>

              <button
                onClick={() =>
                  setSelectedUser(null)
                }
                style={{
                  border: "none",
                  background: "#6b7280",
                  color: "white",
                  padding: "7px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <p>
              <strong>Name:</strong>{" "}
              {selectedUser.name}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {selectedUser.email}
            </p>

            <p>
              <strong>Mobile:</strong>{" "}
              {selectedUser.mobile ||
                "Not added"}
            </p>

            <p>
              <strong>Address:</strong>{" "}
              {selectedUser.address ||
                "Not added"}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {selectedUser.isBlocked ? (
                <span>🚫 Blocked</span>
              ) : (
                <span>✅ Active</span>
              )}
            </p>
          </div>
        )}

        {/* ======================
            Manage Users
        ====================== */}
        <section>
          <h2>👤 Manage Users</h2>

          {filteredUsers.length === 0 ? (
            <p>No users found.</p>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user._id}
                style={{
                  background: user.isBlocked
                    ? "#fee2e2"
                    : "white",
                  padding: "15px",
                  marginBottom: "10px",
                  borderRadius: "10px",
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>
                      {user.isBlocked
                        ? "🚫 "
                        : "👤 "}
                      {user.name}
                    </strong>

                    <p
                      style={{
                        margin: "5px 0",
                      }}
                    >
                      {user.email}
                    </p>

                    <small>
                      {user.isBlocked
                        ? "Blocked User"
                        : "Active User"}
                    </small>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() =>
                        viewUser(user._id)
                      }
                      style={{
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        padding:
                          "8px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      👁️ View
                    </button>

                    <button
                      onClick={() =>
                        toggleBlockUser(
                          user._id
                        )
                      }
                      style={{
                        background:
                          user.isBlocked
                            ? "#16a34a"
                            : "#f59e0b",
                        color: "white",
                        border: "none",
                        padding:
                          "8px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      {user.isBlocked
                        ? "✅ Unblock"
                        : "🚫 Block"}
                    </button>

                    <button
                      onClick={() =>
                        deleteUser(
                          user._id
                        )
                      }
                      style={{
                        background: "#dc2626",
                        color: "white",
                        border: "none",
                        padding:
                          "8px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* ======================
            Manage Communities
        ====================== */}
        <section
          style={{ marginTop: "35px" }}
        >
          <h2>👥 Manage Communities</h2>

          {filteredCommunities.length ===
          0 ? (
            <p>No communities found.</p>
          ) : (
            filteredCommunities.map(
              (community) => (
                <div
                  key={community._id}
                  style={{
                    background: "white",
                    padding: "15px",
                    marginBottom: "10px",
                    borderRadius: "10px",
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.08)",
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: "15px",
                  }}
                >
                  <div>
                    <strong>
                      👥 {community.name}
                    </strong>

                    <p
                      style={{
                        margin: "5px 0",
                      }}
                    >
                      {community.description}
                    </p>

                    <small>
                      📍 {community.location}
                    </small>
                  </div>

                  <button
                    onClick={() =>
                      deleteCommunity(
                        community._id
                      )
                    }
                    style={{
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )
            )
          )}
        </section>

        {/* ======================
            Manage Events
        ====================== */}
        <section
          style={{ marginTop: "35px" }}
        >
          <h2>📅 Manage Events</h2>

          {filteredEvents.length === 0 ? (
            <p>No events found.</p>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event._id}
                style={{
                  background: "white",
                  padding: "15px",
                  marginBottom: "10px",
                  borderRadius: "10px",
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.08)",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <div>
                  <strong>
                    🎉 {event.title}
                  </strong>

                  <p
                    style={{
                      margin: "5px 0",
                    }}
                  >
                    {event.description}
                  </p>

                  <small>
                    📅{" "}
                    {new Date(
                      event.date
                    ).toLocaleString()}
                    {" | "}
                    📍 {event.location}
                  </small>
                </div>

                <button
                  onClick={() =>
                    deleteEvent(event._id)
                  }
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            ))
          )}
        </section>

        {/* ======================
            Manage Posts
        ====================== */}
        <section
          style={{ marginTop: "35px" }}
        >
          <h2>📝 Manage Posts</h2>

          {filteredPosts.length === 0 ? (
            <p>No posts found.</p>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post._id}
                style={{
                  background: "white",
                  padding: "15px",
                  marginBottom: "10px",
                  borderRadius: "10px",
                  boxShadow:
                    "0 2px 8px rgba(0,0,0,0.08)",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <div>
                  <strong>
                    👤 {post.userName}
                  </strong>

                  <p>{post.content}</p>
                </div>

                <button
                  onClick={() =>
                    deletePost(post._id)
                  }
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            ))
          )}
        </section>
      </div>
    </>
  );
}

export default AdminDashboard;