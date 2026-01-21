const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

/* Middlewares */
app.use(cors());
app.use(express.json());
app.use(express.text({ type: "*/*" })); // sendBeacon support

/* ======================
   MongoDB Connection
====================== */
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

/* ======================
   Session Schema
====================== */
const SessionSchema = new mongoose.Schema({
  duration: Number,
  device: String,
  network: String,
  screen: String,
  reason: String,
  time: { type: Date, default: Date.now }
});

const Session = mongoose.model("Session", SessionSchema);

/* ======================
   SAVE SESSION
====================== */
app.post("/session", async (req, res) => {
  let data = req.body;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return res.sendStatus(400);
    }
  }

  try {
    await Session.create({
      duration: Number(data.duration) || 0,
      device: data.userAgent || "unknown",
      network: data.network || "unknown",
      screen: data.screen || "unknown",
      reason: data.reason || "unknown"
    });

    console.log("📥 Session saved to MongoDB");
    res.sendStatus(200);
  } catch (e) {
    console.error("❌ Save error:", e);
    res.sendStatus(500);
  }
});

/* ======================
   STATS ENDPOINT
====================== */
app.get("/stats", async (req, res) => {
  const totalSessions = await Session.countDocuments();

  if (totalSessions === 0) {
    return res.json({
      totalSessions: 0,
      avgTime: 0,
      mobile: 0,
      desktop: 0,
      networks: {}
    });
  }

  const sessions = await Session.find();

  let totalTime = 0;
  let mobile = 0;
  let desktop = 0;
  let networks = {};

  sessions.forEach(s => {
    totalTime += s.duration;

    if ((s.device || "").toLowerCase().includes("mobile")) {
      mobile++;
    } else {
      desktop++;
    }

    networks[s.network] = (networks[s.network] || 0) + 1;
  });

  res.json({
    totalSessions,
    avgTime: Math.round(totalTime / totalSessions),
    mobile,
    desktop,
    networks
  });
});

/* ======================
   ROOT CHECK
====================== */
app.get("/", (req, res) => {
  res.send("YOURPDF backend is running (MongoDB)");
});

/* ======================
   START SERVER
====================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Backend running on port", PORT);
});
