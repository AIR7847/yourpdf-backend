const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

/* ======================
   Middlewares
====================== */
app.use(cors());
app.use(express.json());
app.use(express.text({ type: "*/*" })); // sendBeacon support

/* ======================
   MongoDB Connection
====================== */
const MONGO_URI = process.env.MONGO_URI;
let dbReady = false;

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 20000,
  })
  .then(() => {
    dbReady = true;
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

/* ======================
   Schema
====================== */
const SessionSchema = new mongoose.Schema({
  duration: Number,
  device: String,
  network: String,
  screen: String,
  reason: String,
  state: String,
  isOwner: { type: Boolean, default: false },
  time: { type: Date, default: Date.now },
});

const Session = mongoose.model("Session", SessionSchema);

/* ======================
   SAVE SESSION
====================== */
app.post("/session", async (req, res) => {
  if (!dbReady) return res.sendStatus(503);

  let data = req.body;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return res.sendStatus(400);
    }
  }

  // 🔐 Ignore owner / test sessions
  if (data.isOwner === true) {
    return res.sendStatus(200);
  }

  // 🌍 Get user IP
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  let state = "Unknown";

  try {
    // ✅ Node 18+/22 built-in fetch (NO node-fetch)
    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
    const geo = await geoRes.json();
    state = geo.region || "Unknown";
  } catch {
    console.log("🌍 Geo lookup failed");
  }

  try {
    await Session.create({
      duration: Number(data.duration) || 0,
      device: data.userAgent || "unknown",
      network: data.network || "unknown",
      screen: data.screen || "unknown",
      reason: data.reason || "unknown",
      state,
      isOwner: false,
    });

    console.log("📥 Session saved | State:", state);
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
  if (!dbReady) {
    return res.json({
      status: "connecting",
      message: "Database is warming up, try again in few seconds",
    });
  }

  try {
    const sessions = await Session.find({ isOwner: false });
    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return res.json({
        totalSessions: 0,
        avgTime: 0,
        mobile: 0,
        desktop: 0,
        networks: {},
        states: {},
      });
    }

    let totalTime = 0;
    let mobile = 0;
    let desktop = 0;
    let networks = {};
    let states = {};

    sessions.forEach((s) => {
      totalTime += s.duration || 0;

      if ((s.device || "").toLowerCase().includes("mobile")) {
        mobile++;
      } else {
        desktop++;
      }

      networks[s.network] = (networks[s.network] || 0) + 1;
      states[s.state || "Unknown"] =
        (states[s.state || "Unknown"] || 0) + 1;
    });

    res.json({
      totalSessions,
      avgTime: Math.round(totalTime / totalSessions),
      mobile,
      desktop,
      networks,
      states,
    });
  } catch (e) {
    console.error("❌ Stats error:", e);
    res.sendStatus(500);
  }
});

/* ======================
   ROOT (SAFE FOR RENDER)
====================== */
app.get("/", (req, res) => {
  res.send("YOURPDF backend is running (MongoDB + State tracking)");
});

/* ======================
   START SERVER
====================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Backend running on port", PORT);
});
