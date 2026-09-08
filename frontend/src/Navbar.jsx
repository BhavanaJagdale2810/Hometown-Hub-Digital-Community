import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    fontWeight: "bold",
    marginRight: "15px",
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav
      style={{
        background: "#2563eb",
        padding: "15px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h2 style={{ color: "white", margin: 0 }}>
        Hometown Hub
      </h2>

      <div>
        <Link to="/" style={linkStyle}>
          Home
        </Link>

        <Link to="/dashboard" style={linkStyle}>
          Dashboard
        </Link>

        {/* Communities Link */}
        <Link to="/communities" style={linkStyle}>
          👥 Communities
        </Link>

        {/* Events Link */}
        <Link to="/events" style={linkStyle}>
          📅 Events
        </Link>

        {!user ? (
          <>
            <Link to="/register" style={linkStyle}>
              Register
            </Link>

            <Link to="/login" style={linkStyle}>
              Login
            </Link>
          </>
        ) : (
          <>
            <Link to="/profile" style={linkStyle}>
              Profile
            </Link>

            <button
              onClick={handleLogout}
              style={{
                background: "red",
                color: "white",
                border: "none",
                padding: "8px 15px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;