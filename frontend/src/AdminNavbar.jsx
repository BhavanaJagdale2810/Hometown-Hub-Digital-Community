import { useNavigate } from "react-router-dom";

function AdminNavbar() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("admin"));

  const handleLogout = () => {
    localStorage.removeItem("admin");
    navigate("/admin-login");
  };

  return (
    <nav
      style={{
        background: "#111827",
        padding: "15px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h2
        style={{
          color: "white",
          margin: 0,
        }}
      >
        👑 Hometown Hub Admin
      </h2>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        {admin && (
          <span style={{ color: "white" }}>
            Welcome, {admin.name}
          </span>
        )}

        <button
          onClick={() => navigate("/admin-dashboard")}
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "8px 14px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Dashboard
        </button>

        <button
          onClick={handleLogout}
          style={{
            background: "#dc2626",
            color: "white",
            border: "none",
            padding: "8px 14px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default AdminNavbar;