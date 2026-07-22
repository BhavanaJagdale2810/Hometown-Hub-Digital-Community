const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/hometownhub")
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);



app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});
app.post("/api/users", async (req, res) => {
  console.log(req.body);

  const newUser = new User({
  name: req.body.name,
  email: req.body.email,
  password: req.body.password
});

await newUser.save();

res.json({
  success: true,
  message: "User added successfully"
});
});


// 👇 इथे हा Login API पेस्ट कर

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (user) {
      res.json({
        success: true,
        message: "Login Successful",
        user
      });
    } else {
      res.json({
        success: false,
        message: "Invalid Email or Password"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});