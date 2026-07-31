require("dotenv").config();
require("./config/passport");

const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");

const {
  bookingRoutes,
  authRoutes,
  reviewRoutes,
  serviceRoutes,
  searchRoutes,
  userRoutes,
  contactRoutes,
} = require("./routes");

const { connectDb,authSession } = require("./config");
const {errorHandler}=require('./middleware')

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use(authSession)
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/reviews/", reviewRoutes);
app.use("/api/contact",contactRoutes)

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome" });
});

// Connect to MongoDB
connectDb();

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use(errorHandler)