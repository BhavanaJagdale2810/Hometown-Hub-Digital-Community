import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="hero">
      <h1>Welcome to Hometown Hub</h1>

      <p>
        Stay connected with your village, city, and hometown.
        <br />
        Share updates, join events, and connect with your community.
      </p>

      <div>
        <Link to="/login">
          <button>Login</button>
        </Link>

        <Link to="/register">
          <button style={{ marginLeft: "10px" }}>Register</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;