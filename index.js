require("dotenv").config();
require("./config/passport");

const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/outhRoutes")
const searchRoutes=require("./routes/searchRoutes")
const serviceroutes=require("./routes/serviceRoutes")
const bookingRoutes=require("./routes/bookingRoutes")

const app = express();

// Middleware
app.use(cors({
  origin:"*";
    // ['http://localhost:5173', 'https://rushi-locafy.netlify.app']
}));
app.use(express.json()); // For parsing application/json

app.use(session({
  secret: "some secret",
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());
// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/providers", searchRoutes);
app.use("/api/services",serviceroutes);
app.use("/api/booking",bookingRoutes)

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome' });
});
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
