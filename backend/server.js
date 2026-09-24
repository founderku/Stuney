require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const transactionRoutes = require("./routes/transactions");
const goalRoutes = require("./routes/goals");
const budgetRoutes = require("./routes/budget");
const meRoutes = require("./routes/me");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowAll = allowedOrigins.length === 0 || allowedOrigins.includes("*");
app.use(
  cors({
    origin: allowAll ? true : allowedOrigins,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "stuney-tracker-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/me", meRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Terjadi kesalahan internal server." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Stuney Tracker backend jalan di port ${PORT}`);
});
