import { useState } from "react";
import axios from "axios";
function Register() {
  const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const handleRegister = async () => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/users/",
      {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
      }
    );

    alert(response.data.message);
  } catch (error) {
  console.log(error.response);
  console.log(error.message);
  console.log(error);
  alert("Registration Failed");
}
};
  return (
    <div className="hero">
      <h1>Register</h1>

      <input
  type="text"
  placeholder="Enter Full Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>
      <br /><br />

      <input
  type="email"
  placeholder="Enter Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
      <br /><br />

      <input
  type="password"
  placeholder="Create Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
      <br /><br />
      <button onClick={handleRegister}>
  Register
</button>

    </div>
  );
}

export default Register;