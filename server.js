const express = require("express");
const cors = require("cors");

const app = express();

/* 🔥 Middlewares */
app.use(cors());
app.use(express.json());
app.use(express.text({ type: "*/*" })); // sendBeacon support

/* 🔥 TEMP IN-MEMORY STORAGE */
let sessions = [];

/* ======================
   SAVE SESSION
====================== */
app.post("/session", (req, res) => {
  let data = req.body;

  // sendBeacon string ko JSON me badlo
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error("❌ Invalid JSON");
      return res.sendStatus(400);
    }
  }

  const session = {
    duration: Number(data.duration) || 0,
    device: data.userAgent || "unknown",
    network: data.network || "unknown",
    screen: data.screen || "unknown",
    reason: data.reason || "unknown",
    time: Date.now()
  };

  sessions.push(session);

  console.log("📥 New session saved");
  console.log("⏱️ Time spent (sec):", session.duration);
  console.log("📱 Device:", session.device);
  console.log("🖥️ Screen:", session.screen);
  console.log("📡 Network:", session.network);
  console.log("📌 Reason:", session.reason);
  console.log("📊 Total sessions:", sessions.length);

  res.sendStatus(200);
});

/* ======================
   STATS ENDPOINT
====================== */
app.get("/stats", (req, res) => {
  const total = sessions.length;

  if (total === 0) {
    return res.json({
      totalSessions: 0,
      avgTime: 0,
      mobile: 0,
      desktop: 0,
      networks: {}
    });
  }

  let totalTime = 0;
  let mobile = 0;
  let desktop = 0;
  let networks = {};

  sessions.forEach(s => {
    totalTime += s.duration;

    if (s.device.toLowerCase().includes("mobile")) {
      mobile++;
    } else {
      desktop++;
    }

    networks[s.network] = (networks[s.network] || 0) + 1;
  });

  res.json({
    totalSessions: total,
    avgTime: Math.round(totalTime / total),
    mobile,
    desktop,
    networks
  });
});

/* ======================
   ROOT CHECK
====================== */
app.get("/", (req, res) => {
  res.send("YOURPDF backend is running");
});

/* ======================
   START SERVER
====================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Backend running on port", PORT);
});
