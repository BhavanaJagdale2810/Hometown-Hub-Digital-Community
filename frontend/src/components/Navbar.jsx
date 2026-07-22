import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "15px 30px",
        background: "#2563eb",
      }}
    >
      <h2 style={{ color: "white", margin: 0 }}>Hometown Hub</h2>

      <div style={{ display: "flex", gap: "20px" }}>
        <Link
          to="/"
          style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}
        >
          Home
        </Link>

        <Link
          to="/login"
          style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}
        >
          Login
        </Link>

        <Link
          to="/register"
          style={{ color: "white", textDecoration: "none", fontWeight: "bold" }}
        >
          Register
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;