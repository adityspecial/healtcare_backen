require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./src/routes/authRoutes");
const patientRoutes = require("./src/routes/patientRoutes");

const app = express();
const port = process.env.PORT || 3000;

// Simple endpoint access logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);

  next();
});

app.use(
  cors({
    origin: true, // Allow all origins for development
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-phone-number"],
  })
);
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);

app.get("/", (req, res) => {
  res.send("Healthcare Backend Running");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
  console.log(`Access from network: http://10.200.241.31:${port}`);
});
